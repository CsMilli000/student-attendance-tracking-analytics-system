"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import Chart from "chart.js/auto";
import { signInAnonymously } from "firebase/auth";
import {
  addDoc,
  collection,
  Timestamp,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db, auth } from "../../src/lib/firebase";
import {
  lecturerAccounts,
  studentAccounts,
  type LecturerAccount,
} from "../../src/lib/accounts";
import { MIN_ATTENDANCE_THRESHOLD_PERCENT } from "../../src/lib/constants";
import { Button, Card, Notice, TextInput } from "../components/ui";

type AttendanceRow = {
  id: string;
  studentUid?: string;
  studentName?: string;
  studentEmail?: string;
  checkedInAt?: Timestamp;
};

type AttendanceData = {
  studentUid?: string;
  studentName?: string;
  studentEmail?: string;
  sessionId?: string;
  sessionCode?: string;
  checkedInAt?: Timestamp;
};

type SessionData = {
  code?: string;
  createdAt?: Timestamp;
};

type StudentStat = {
  id: string;
  name: string;
  email: string;
  attended: number;
  total: number;
  rate: number;
};

type SessionSeriesPoint = {
  label: string;
  rate: number;
  createdAt: Date | null;
};

type FontScale = 90 | 100 | 110 | 120;

type Lang = "en" | "zh";

type WeekOption = {
  key: string;
  label: string;
};

const fontScaleOptions: FontScale[] = [90, 100, 110, 120];

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? `Error: ${error.message}` : fallback;

const getWeekStartKey = (date: Date) => {
  const weekStart = new Date(date);
  const day = weekStart.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  weekStart.setDate(weekStart.getDate() + diff);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart.toISOString().slice(0, 10);
};

const applyFontScale = (value: FontScale) => {
  document.documentElement.style.fontSize = `${value}%`;
  localStorage.setItem("attendance.ui.fontScale", String(value));
};

const applyLang = (value: Lang) => {
  document.documentElement.lang = value;
  localStorage.setItem("attendance.ui.lang", value);
};

const textMap = {
  en: {
    portalLabel: "Lecturer Portal",
    title: "Lecturer Dashboard",
    subtitle: "Manage sessions, review records, and track attendance.",
    back: "Back to Login",
    textSize: "Text size",
    accountTitle: "Account",
    notSigned: "Not signed in",
    notSignedDesc: "Please sign in with a lecturer account.",
    accountLabel: "Account",
    passwordLabel: "Password",
    accountPlaceholder: "e.g. lecturer01",
    passwordPlaceholder: "Enter password",
    signIn: "Sign in as Lecturer",
    signOut: "Sign out",
    msgSignedOut: "Signed out.",
    msgBadLogin: "Lecturer account or password is incorrect.",
    msgNeedLogin: "Please sign in as a lecturer first.",
    msgCreating: "Creating session...",
    msgCreated: "Session created.",
    msgLoading: "Loading attendance...",
    msgLoaded: "Loaded successfully",
    msgNeedCode: "Please enter a session code.",
    msgClose: "Closing session...",
    msgClosed: "Session closed.",
    msgNoSession: "Session not found or already closed.",
    msgAnalysis: "Analyzing attendance...",
    msgAnalysisDone: "Attendance analysis is ready.",
    msgCopy: "Reminder copied:",
    msgCopyFail: "Copy failed. Please copy manually.",
    msgWelcome: "Welcome",
    msgLoadedCount: "Loaded {count} record(s).",
    sessionTitle: "Session Management",
    createSession: "Create session",
    creating: "Creating...",
    newCode: "New code",
    sessionCode: "Session code",
    loadAttendance: "Load attendance",
    closeSession: "Close session",
    loading: "Loading...",
    closing: "Closing...",
    resetting: "Resetting...",
    resetSessions: "Reset sessions",
    clearSessions: "Clear sessions data",
    msgResetting: "Resetting records for the current session...",
    msgResetDone: "Current session records have been reset. The session remains open.",
    msgClearDone: "All session and attendance data cleared.",
    msgClearConfirm:
      "This will delete all sessions and attendance records. Continue?",
    attendanceRecords: "Attendance records",
    studentCol: "Student",
    timeCol: "Check-in time",
    analyticsTitle: "Attendance analytics",
    analyticsSubtitle: "Review attendance and contact students below the threshold.",
    runAnalysis: "Run analysis",
    analyzing: "Analyzing...",
    thresholdLabel: "Low attendance threshold (%)",
    chartTitle: "Attendance chart",
    chartDatasetLabel: "Session attendance (%)",
    chartModeLabel: "Chart view",
    chartModeSession: "By session",
    chartModeStudent: "By student",
    weekLabel: "Week",
    weekAll: "All weeks",
    footer:
      "Independent University Project · Student Attendance Tracking and Analytics System. For academic demonstration only. All data shown is anonymized or sample data.",
    chartEmpty: "No data yet. Click \"Run analysis\" to generate the chart.",
    lowList: "Low attendance list",
    lowEmpty: "No students below threshold.",
    lowAttendance: "Attendance",
    sendEmail: "Send email",
    copyReminder: "Copy reminder",
    emailHeader: "Email",
    attendanceAnalysisLabel: "Attendance Analysis",
    actionEmail: "Email",
    actionCopy: "Copy",
    statusCol: "Status",
    actionCol: "Action",
    statusLow: "Low",
    statusOk: "OK",
  },
  zh: {
    portalLabel: "老师入口",
    title: "老师管理面板",
    subtitle: "管理签到、查看记录并追踪出勤情况。",
    back: "返回登录",
    textSize: "文字大小",
    accountTitle: "账号",
    notSigned: "尚未登录",
    notSignedDesc: "请使用老师账号登录。",
    accountLabel: "账号",
    passwordLabel: "密码",
    accountPlaceholder: "例如 lecturer01",
    passwordPlaceholder: "请输入密码",
    signIn: "登录老师账号",
    signOut: "退出登录",
    msgSignedOut: "已退出登录。",
    msgBadLogin: "老师账号或密码错误。",
    msgNeedLogin: "请先登录老师账号。",
    msgCreating: "正在创建签到...",
    msgCreated: "签到已创建。",
    msgLoading: "正在加载签到记录...",
    msgLoaded: "加载完成",
    msgNeedCode: "请输入签到码。",
    msgClose: "正在关闭签到...",
    msgClosed: "签到已关闭。",
    msgNoSession: "未找到该签到或已关闭。",
    msgAnalysis: "正在分析出勤率...",
    msgAnalysisDone: "出勤分析已生成。",
    msgCopy: "已复制提醒：",
    msgCopyFail: "复制失败，请手动复制。",
    msgWelcome: "欢迎",
    msgLoadedCount: "已加载 {count} 条记录。",
    sessionTitle: "签到管理",
    createSession: "创建签到",
    creating: "创建中...",
    newCode: "新签到码",
    sessionCode: "签到码",
    loadAttendance: "加载签到",
    closeSession: "关闭签到",
    loading: "加载中...",
    closing: "关闭中...",
    resetting: "重置中...",
    resetSessions: "重置签到",
    clearSessions: "清空签到数据",
    msgResetting: "正在重置当前签到记录...",
    msgResetDone: "已重置当前签到记录，签到仍保持开启。",
    msgClearDone: "已清空所有签到与出勤记录。",
    msgClearConfirm: "将删除所有签到与出勤记录，是否继续？",
    attendanceRecords: "签到记录",
    studentCol: "学生",
    timeCol: "签到时间",
    analyticsTitle: "出勤率分析",
    analyticsSubtitle: "查看出勤数据并联系低于阈值的学生。",
    runAnalysis: "运行分析",
    analyzing: "分析中...",
    thresholdLabel: "低出勤阈值 (%)",
    chartTitle: "出勤率图表",
    chartDatasetLabel: "单次课程出勤率（%）",
    chartModeLabel: "图表视图",
    chartModeSession: "按课程",
    chartModeStudent: "按学生",
    weekLabel: "周",
    weekAll: "全部周次",
    footer:
      "大学独立项目 · 学生出勤管理系统。仅用于学术展示与学习，页面数据为匿名或示例数据。",
    chartEmpty: "暂无数据，点击“运行分析”生成图表。",
    lowList: "低出勤学生",
    lowEmpty: "当前没有低于阈值的学生。",
    lowAttendance: "出勤",
    sendEmail: "发送邮件",
    copyReminder: "复制提醒",
    emailHeader: "邮箱",
    attendanceAnalysisLabel: "出勤分析",
    actionEmail: "邮件",
    actionCopy: "复制",
    statusCol: "状态",
    actionCol: "操作",
    statusLow: "低",
    statusOk: "正常",
  },
};

export default function LecturerPage() {
  const [loginId, setLoginId] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loggedInLecturer, setLoggedInLecturer] =
    useState<LecturerAccount | null>(null);
  const [newSessionCode, setNewSessionCode] = useState("");
  const [searchCode, setSearchCode] = useState("");
  const [records, setRecords] = useState<AttendanceRow[]>([]);
  const [msg, setMsg] = useState<{
    tone: "info" | "success" | "warning" | "error";
    text: string;
  } | null>(null);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingLoad, setLoadingLoad] = useState(false);
  const [loadingClose, setLoadingClose] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [threshold, setThreshold] = useState(MIN_ATTENDANCE_THRESHOLD_PERCENT);
  const [stats, setStats] = useState<StudentStat[]>([]);
  const [sessionSeries, setSessionSeries] = useState<SessionSeriesPoint[]>([]);
  const [chartMode, setChartMode] = useState<"session" | "student">("session");
  const [selectedWeek, setSelectedWeek] = useState("");
  const [fontScale, setFontScale] = useState<FontScale>(100);
  const [lang, setLang] = useState<Lang>("en");
  const [resetLoading, setResetLoading] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  useEffect(() => {
    setMsg(null);
  }, [loginId, loginPassword, searchCode, lang, threshold]);

  useEffect(() => {
    const stored = localStorage.getItem("attendance.ui.fontScale");
    if (!stored) return;
    const parsed = Number(stored) as FontScale;
    if (![90, 100, 110, 120].includes(parsed)) return;
    setFontScale(parsed);
    applyFontScale(parsed);
  }, []);

  useEffect(() => {
    const storedLang = localStorage.getItem("attendance.ui.lang");
    if (storedLang === "en" || storedLang === "zh") {
      setLang(storedLang);
      applyLang(storedLang);
    }
  }, []);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 640);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    if (loggedInLecturer) return;
    // Restore login state after refresh.
    const raw = sessionStorage.getItem("attendance.login");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.role !== "lecturer") return;
      setLoggedInLecturer({
        id: parsed.id,
        name: parsed.name,
        password: "",
      });
      setLoginId(parsed.id ?? "");
    } catch {
      return;
    }
  }, [loggedInLecturer]);

  // The threshold cannot go below the project minimum.
  const handleThresholdChange = (value: string) => {
    const parsed = Number(value);
    if (Number.isNaN(parsed)) {
      setThreshold(MIN_ATTENDANCE_THRESHOLD_PERCENT);
      return;
    }
    setThreshold(
      Math.min(100, Math.max(MIN_ATTENDANCE_THRESHOLD_PERCENT, Math.round(parsed)))
    );
  };

  const ensureAuth = async () => {
    if (!auth.currentUser) {
      await signInAnonymously(auth);
    }
  };

  const weekOptions = useMemo<WeekOption[]>(() => {
    const keys = new Set<string>();
    sessionSeries.forEach((point) => {
      if (!point.createdAt) return;
      keys.add(getWeekStartKey(point.createdAt));
    });
    return Array.from(keys)
      .sort((a, b) => (a > b ? -1 : 1))
      .map((key) => ({
        key,
        label: new Date(`${key}T00:00:00`).toLocaleDateString(),
      }));
  }, [sessionSeries]);

  useEffect(() => {
    if (weekOptions.length === 0) {
      setSelectedWeek("");
      return;
    }
    if (selectedWeek === "") {
      setSelectedWeek(weekOptions[0].key);
      return;
    }
    if (selectedWeek === "all") return;
    const exists = weekOptions.some((option) => option.key === selectedWeek);
    if (!exists) setSelectedWeek(weekOptions[0].key);
  }, [weekOptions, selectedWeek]);

  const filteredSessionSeries = useMemo(() => {
    if (selectedWeek === "all") return sessionSeries;
    return sessionSeries.filter(
      (point) => point.createdAt && getWeekStartKey(point.createdAt) === selectedWeek
    );
  }, [sessionSeries, selectedWeek]);

  const generateCode = () =>
    Math.random().toString(36).substring(2, 8).toUpperCase();

  const login = async () => {
    const cleanId = loginId.trim();
    const account = lecturerAccounts.find(
      (a) => a.id === cleanId && a.password === loginPassword
    );
    if (!account) {
      setMsg({ tone: "error", text: textMap[lang].msgBadLogin });
      return;
    }

    if (!auth.currentUser) {
      await signInAnonymously(auth);
    }

    // Keep lecturer state available after refresh.
    sessionStorage.setItem(
      "attendance.login",
      JSON.stringify({
        role: "lecturer",
        id: account.id,
        name: account.name,
      })
    );
    setLoggedInLecturer(account);
    setMsg({ tone: "success", text: `${textMap[lang].msgWelcome}, ${account.name}.` });
  };

  const logout = () => {
    setLoggedInLecturer(null);
    setLoginId("");
    setLoginPassword("");
    sessionStorage.removeItem("attendance.login");
    setMsg({ tone: "success", text: textMap[lang].msgSignedOut });
  };

  const createSession = async () => {
    try {
      setLoadingCreate(true);
      setMsg({ tone: "info", text: textMap[lang].msgCreating });

      if (!loggedInLecturer) {
        setMsg({ tone: "error", text: textMap[lang].msgNeedLogin });
        return;
      }

      await ensureAuth();

      const code = generateCode();

      await addDoc(collection(db, "sessions"), {
        code,
        createdAt: Timestamp.now(),
        isActive: true,
        lecturerUid: auth.currentUser?.uid ?? null,
      });

      setNewSessionCode(code);
      setSearchCode(code);
      setRecords([]);
      setMsg({ tone: "success", text: textMap[lang].msgCreated });
    } catch (e: unknown) {
      console.error(e);
      setMsg({
        tone: "error",
        text: getErrorMessage(e, "Error creating session."),
      });
    } finally {
      setLoadingCreate(false);
    }
  };

  const loadAttendance = async () => {
    try {
      setLoadingLoad(true);
      setMsg({ tone: "info", text: textMap[lang].msgLoading });

      if (!loggedInLecturer) {
        setMsg({ tone: "error", text: textMap[lang].msgNeedLogin });
        return;
      }
      await ensureAuth();

      const cleanCode = searchCode.trim().toUpperCase();
      if (!cleanCode) {
        setMsg({ tone: "warning", text: textMap[lang].msgNeedCode });
        return;
      }

      const q = query(
        collection(db, "attendance"),
        where("sessionCode", "==", cleanCode)
      );
      const snap = await getDocs(q);

      setRecords(
        snap.docs.map((d) => {
          const data = d.data() as AttendanceData;
          return {
            id: d.id,
            studentUid: data.studentUid,
            studentName: data.studentName,
            studentEmail: data.studentEmail,
            checkedInAt: data.checkedInAt,
          };
        })
      );
      setMsg({
        tone: "success",
        text: textMap[lang].msgLoadedCount.replace("{count}", String(snap.size)),
      });
    } catch (e: unknown) {
      console.error(e);
      setMsg({
        tone: "error",
        text: getErrorMessage(e, "Error loading attendance."),
      });
    } finally {
      setLoadingLoad(false);
    }
  };

  const closeSession = async () => {
    try {
      setLoadingClose(true);
      setMsg({ tone: "info", text: textMap[lang].msgClose });

      if (!loggedInLecturer) {
        setMsg({ tone: "error", text: textMap[lang].msgNeedLogin });
        return;
      }
      await ensureAuth();

      const cleanCode = searchCode.trim().toUpperCase();
      if (!cleanCode) {
        setMsg({ tone: "warning", text: textMap[lang].msgNeedCode });
        return;
      }

      const q = query(
        collection(db, "sessions"),
        where("code", "==", cleanCode),
        where("isActive", "==", true)
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        setMsg({ tone: "warning", text: textMap[lang].msgNoSession });
        return;
      }

      await updateDoc(doc(db, "sessions", snap.docs[0].id), {
        isActive: false,
      });

      setMsg({ tone: "success", text: textMap[lang].msgClosed });
    } catch (e: unknown) {
      console.error(e);
      setMsg({
        tone: "error",
        text: getErrorMessage(e, "Error closing session."),
      });
    } finally {
      setLoadingClose(false);
    }
  };

  const resetSessions = async () => {
    try {
      setResetLoading(true);
      setMsg({ tone: "info", text: textMap[lang].msgResetting });

      if (!loggedInLecturer) {
        setMsg({ tone: "error", text: textMap[lang].msgNeedLogin });
        return;
      }
      await ensureAuth();

      const cleanCode = searchCode.trim().toUpperCase();
      if (!cleanCode) {
        setMsg({ tone: "warning", text: textMap[lang].msgNeedCode });
        return;
      }

      const sessionSnap = await getDocs(
        query(
          collection(db, "sessions"),
          where("code", "==", cleanCode),
          where("isActive", "==", true)
        )
      );

      if (sessionSnap.empty) {
        setMsg({ tone: "warning", text: textMap[lang].msgNoSession });
        return;
      }

      const currentSessionId = sessionSnap.docs[0].id;
      const attendanceSnap = await getDocs(
        query(
          collection(db, "attendance"),
          where("sessionId", "==", currentSessionId)
        )
      );

      await Promise.all(
        attendanceSnap.docs.map((d) => deleteDoc(doc(db, "attendance", d.id)))
      );
      setRecords([]);
      setStats([]);
      setSessionSeries([]);
      setMsg({ tone: "success", text: textMap[lang].msgResetDone });
    } catch (e: unknown) {
      console.error(e);
      setMsg({
        tone: "error",
        text: getErrorMessage(e, "Error resetting sessions."),
      });
    } finally {
      setResetLoading(false);
    }
  };

  const clearSessions = async () => {
    if (!loggedInLecturer) {
      setMsg({ tone: "error", text: textMap[lang].msgNeedLogin });
      return;
    }
    if (!confirm(textMap[lang].msgClearConfirm)) return;
    try {
      setClearLoading(true);
      await ensureAuth();
      const sessionsSnap = await getDocs(collection(db, "sessions"));
      const attendanceSnap = await getDocs(collection(db, "attendance"));
      await Promise.all([
        ...sessionsSnap.docs.map((d) => deleteDoc(doc(db, "sessions", d.id))),
        ...attendanceSnap.docs.map((d) =>
          deleteDoc(doc(db, "attendance", d.id))
        ),
      ]);
      setMsg({ tone: "success", text: textMap[lang].msgClearDone });
      setRecords([]);
      setStats([]);
      setNewSessionCode("");
    } catch (e: unknown) {
      console.error(e);
      setMsg({
        tone: "error",
        text: getErrorMessage(e, "Error clearing sessions."),
      });
    } finally {
      setClearLoading(false);
    }
  };

  const loadAnalysis = async () => {
    try {
      setAnalysisLoading(true);
      setMsg({ tone: "info", text: textMap[lang].msgAnalysis });

      if (!loggedInLecturer) {
        setMsg({ tone: "error", text: textMap[lang].msgNeedLogin });
        return;
      }

      await ensureAuth();

      const sessionsSnap = await getDocs(collection(db, "sessions"));
      const attendanceSnap = await getDocs(collection(db, "attendance"));
      const totalSessions = sessionsSnap.size;
      const totalStudents = Math.max(1, studentAccounts.length);

      const countMap = new Map<string, number>();
      const sessionCountMap = new Map<string, number>();
      attendanceSnap.docs.forEach((docSnap) => {
        const data = docSnap.data() as AttendanceData;
        const key = data.studentUid;
        if (!key) return;
        countMap.set(key, (countMap.get(key) ?? 0) + 1);
        if (data.sessionId) {
          sessionCountMap.set(
            data.sessionId,
            (sessionCountMap.get(data.sessionId) ?? 0) + 1
          );
        }
      });

      const nextStats = studentAccounts.map((s) => {
        const attended = countMap.get(s.id) ?? 0;
        const total = totalSessions;
        const rate = total > 0 ? attended / total : 0;
        return {
          id: s.id,
          name: s.name,
          email: s.email,
          attended,
          total,
          rate,
        };
      });

      const sessionSeriesData = sessionsSnap.docs
        .map((docSnap, index) => {
          const data = docSnap.data() as SessionData;
          const createdAt = data?.createdAt?.toDate
            ? data.createdAt.toDate()
            : null;
          const code = data?.code ?? `Session ${index + 1}`;
          const label = createdAt
            ? `${code} (${createdAt.toLocaleDateString()})`
            : code;
          const attended = sessionCountMap.get(docSnap.id) ?? 0;
          const rate = totalStudents > 0 ? attended / totalStudents : 0;
          return { label, rate, createdAt };
        })
        .sort((a, b) => {
          const aTime = a.createdAt ? a.createdAt.getTime() : 0;
          const bTime = b.createdAt ? b.createdAt.getTime() : 0;
          return aTime - bTime;
        })
        .map(({ label, rate, createdAt }) => ({ label, rate, createdAt }));

      setStats(nextStats);
      setSessionSeries(sessionSeriesData);
      setMsg({ tone: "success", text: textMap[lang].msgAnalysisDone });
    } catch (e: unknown) {
      console.error(e);
      setMsg({
        tone: "error",
        text: getErrorMessage(e, "Error analyzing attendance."),
      });
    } finally {
      setAnalysisLoading(false);
    }
  };

  const sendReminder = (student: StudentStat) => {
    const ratePct = Math.round(student.rate * 100);
    // Mailto keeps reminder sending inside the browser for the demo.
    const subject = encodeURIComponent("Attendance Reminder");
    const body = encodeURIComponent(
      `Hi ${student.name},\n\nYour attendance rate is ${ratePct}%. ` +
        "Please remember to check in for each session.\n\nThanks."
    );
    window.location.href = `mailto:${student.email}?subject=${subject}&body=${body}`;
  };

  const copyReminder = async (student: StudentStat) => {
    const ratePct = Math.round(student.rate * 100);
    const text =
      `Hi ${student.name},\n\nYour attendance rate is ${ratePct}%. ` +
      "Please remember to check in for each session.\n\nThanks.";
    try {
      await navigator.clipboard.writeText(text);
      setMsg({ tone: "success", text: `${textMap[lang].msgCopy} ${student.name}.` });
    } catch (e) {
      console.error(e);
      setMsg({ tone: "error", text: textMap[lang].msgCopyFail });
    }
  };

  useEffect(() => {
    if (!chartRef.current) return;
    const isSession = chartMode === "session";
    const source = isSession ? filteredSessionSeries : stats;
    if (source.length === 0) {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
      return;
    }

    const fullLabels = isSession
      ? filteredSessionSeries.map((s) => s.label)
      : stats.map((s) => `${s.name} (${s.id})`);
    const labels = isSession
      ? filteredSessionSeries.map((s) =>
          isMobile ? s.label.split(" ")[0] ?? s.label : s.label
        )
      : stats.map((s) => (isMobile ? s.name : `${s.name} (${s.id})`));
    const dataPoints = isSession
      ? filteredSessionSeries.map((s) => Math.round(s.rate * 100))
      : stats.map((s) => Math.round(s.rate * 100));

    chartInstanceRef.current?.destroy();
    chartInstanceRef.current = new Chart(chartRef.current, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: isSession
              ? textMap[lang].chartDatasetLabel
              : textMap[lang].analyticsTitle,
            data: dataPoints,
            backgroundColor: "rgba(31, 44, 58, 0.8)",
            borderRadius: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: (value) => `${value}%`,
            },
            grid: {
              color: "rgba(31, 44, 58, 0.08)",
            },
          },
          x: {
            grid: {
              display: false,
            },
            ticks: {
              autoSkip: true,
              maxRotation: 0,
              minRotation: 0,
              font: {
                size: isMobile ? 10 : 12,
              },
            },
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              title: (items) => {
                const index = items[0]?.dataIndex ?? 0;
                return fullLabels[index] ?? items[0]?.label ?? "";
              },
              label: (context) => `${context.parsed.y}%`,
            },
          },
        },
      },
    });

    return () => {
      chartInstanceRef.current?.destroy();
      chartInstanceRef.current = null;
    };
  }, [filteredSessionSeries, stats, chartMode, lang, isMobile]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#e8f0ff] px-4 py-8 text-[#13253b] sm:px-6 sm:py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(71,124,255,0.24),transparent_34%),radial-gradient(circle_at_90%_10%,rgba(40,217,173,0.16),transparent_35%)]" />
      <div className="relative mx-auto w-full max-w-7xl">
        <section className="rounded-[28px] border border-[#bfd0ef] bg-white p-6 shadow-[0_20px_46px_rgba(20,45,83,0.12)] backdrop-blur sm:p-8 md:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#2f6fcb]">
                {textMap[lang].portalLabel}
              </p>
              <h1 className="mt-2 font-[var(--font-display)] text-3xl font-semibold text-[#13253b] md:text-4xl">
                {textMap[lang].title}
              </h1>
              <p className="mt-3 text-sm text-[#4d6b8f]">{textMap[lang].subtitle}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full border border-[#bfd0ef] px-5 py-2 text-sm font-semibold text-[#245cae]"
              >
                {textMap[lang].back}
              </Link>
              <div className="flex flex-wrap items-center gap-2 rounded-full border border-[#bfd0ef] bg-white px-3 py-2 text-xs text-[#4d6b8f]">
                <span className="uppercase tracking-[0.2em] text-[#4d6b8f]">
                  {textMap[lang].textSize}
                </span>
                {fontScaleOptions.map((value) => (
                  <button
                    key={value}
                    onClick={() => {
                      setFontScale(value);
                      applyFontScale(value);
                    }}
                    aria-pressed={fontScale === value}
                    aria-label={`${value}%`}
                    className={`rounded-full border px-2 py-0.5 font-semibold ${
                      fontScale === value
                        ? "border-[#2f6fcb] bg-[#2f6fcb] text-white"
                        : "border-[#bfd0ef] text-[#4d6b8f]"
                    }`}
                  >
                    {value}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <Card className="min-w-0 border-[#bfd0ef] bg-white p-6 text-[#13253b]">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#4d6b8f]">
                {textMap[lang].sessionTitle}
              </div>
              <Button
                full
                onClick={createSession}
                disabled={loadingCreate}
                aria-busy={loadingCreate}
                className="mt-4 rounded-xl bg-[#2f6fcb] shadow-[0_12px_24px_rgba(47,111,203,0.3)]"
              >
                {loadingCreate ? textMap[lang].creating : textMap[lang].createSession}
              </Button>
              {newSessionCode && (
                <div className="mt-4 rounded-xl border border-[#bfd0ef] bg-[#f4f8ff] px-4 py-3 text-sm text-[#13253b]">
                  {textMap[lang].newCode}:
                  <span className="ml-2 font-semibold tracking-[0.1em] text-[#2f6fcb]">
                    {newSessionCode}
                  </span>
                </div>
              )}
              <TextInput
                id="session-code"
                className="mt-5"
                label={textMap[lang].sessionCode}
                labelClassName="text-[#4d6b8f]"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                placeholder="e.g. 15A3B3"
                inputClassName="border-[#bfd0ef] bg-white text-[#13253b] placeholder:text-[#6b85a8] focus:border-[#2f6fcb]"
              />
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadAttendance}
                  disabled={loadingLoad}
                  aria-busy={loadingLoad}
                  className="border-[#bfd0ef] text-[#245cae]"
                >
                  {loadingLoad ? textMap[lang].loading : textMap[lang].loadAttendance}
                </Button>
                <Button size="sm" onClick={closeSession} disabled={loadingClose} aria-busy={loadingClose}>
                  {loadingClose ? textMap[lang].closing : textMap[lang].closeSession}
                </Button>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Button
                  variant="dangerOutline"
                  size="sm"
                  onClick={resetSessions}
                  disabled={resetLoading}
                  aria-busy={resetLoading}
                  className="border-[#4f46e5] text-[#4f46e5]"
                >
                  {resetLoading ? textMap[lang].resetting : textMap[lang].resetSessions}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={clearSessions}
                  disabled={clearLoading}
                  aria-busy={clearLoading}
                  className="bg-[#4f46e5] shadow-[0_12px_22px_rgba(79,70,229,0.3)]"
                >
                  {clearLoading ? textMap[lang].closing : textMap[lang].clearSessions}
                </Button>
              </div>
            </Card>

            <Card className="min-w-0 border-[#bfd0ef] bg-white p-6 text-[#13253b]">
              <div className="text-sm font-semibold text-[#4d6b8f]">{textMap[lang].accountTitle}</div>
              {loggedInLecturer ? (
                <>
                  <div className="mt-3 text-2xl font-semibold text-[#13253b]">
                    {loggedInLecturer.name}
                  </div>
                  <div className="mt-1 text-sm text-[#4d6b8f]">{loggedInLecturer.id}</div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-6 border-[#bfd0ef] text-[#245cae]"
                    onClick={logout}
                  >
                    {textMap[lang].signOut}
                  </Button>
                </>
              ) : (
                <>
                  <div className="mt-3 text-lg font-semibold text-[#13253b]">
                    {textMap[lang].notSigned}
                  </div>
                  <p className="mt-2 text-sm text-[#4d6b8f]">{textMap[lang].notSignedDesc}</p>
                  <div className="mt-5 grid gap-4">
                    <TextInput
                      id="lecturer-account"
                      label={textMap[lang].accountLabel}
                      labelClassName="text-[#4d6b8f]"
                      autoComplete="username"
                      value={loginId}
                      onChange={(e) => setLoginId(e.target.value)}
                      placeholder={textMap[lang].accountPlaceholder}
                      inputClassName="border-[#bfd0ef] bg-white text-[#13253b] placeholder:text-[#6b85a8] focus:border-[#2f6fcb]"
                    />
                    <TextInput
                      id="lecturer-password"
                      label={textMap[lang].passwordLabel}
                      labelClassName="text-[#4d6b8f]"
                      type="password"
                      autoComplete="current-password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder={textMap[lang].passwordPlaceholder}
                      inputClassName="border-[#bfd0ef] bg-white text-[#13253b] placeholder:text-[#6b85a8] focus:border-[#2f6fcb]"
                    />
                    <Button full className="rounded-xl bg-[#2f6fcb]" onClick={login}>
                      {textMap[lang].signIn}
                    </Button>
                  </div>
                </>
              )}
            </Card>
          </div>

          {msg && (
            <Notice tone={msg.tone} onClose={() => setMsg(null)}>
              {msg.text}
            </Notice>
          )}

          {records.length > 0 && (
            <Card className="mt-8 min-w-0 border-[#bfd0ef] bg-white p-6 text-[#13253b]">
              <div className="text-sm font-semibold text-[#4d6b8f]">{textMap[lang].attendanceRecords}</div>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-0 text-left text-sm sm:min-w-[420px]">
                  <thead className="text-xs uppercase text-[#4d6b8f]">
                    <tr>
                      <th className="px-3 py-2">{textMap[lang].studentCol}</th>
                      <th className="px-3 py-2">{textMap[lang].timeCol}</th>
                    </tr>
                  </thead>
                  <tbody className="text-[#13253b]">
                    {records.map((r) => (
                      <tr key={r.id} className="border-t border-[#d3e0f4]">
                        <td className="px-3 py-2">
                          {r.studentUid ?? ""}
                          {r.studentName ? ` (${r.studentName})` : ""}
                        </td>
                        <td className="px-3 py-2">
                          {r.checkedInAt?.toDate ? r.checkedInAt.toDate().toLocaleString() : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          <Card className="mt-10 border-[#bfd0ef] bg-white p-6 text-[#13253b] sm:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="mt-2 text-2xl font-semibold text-[#13253b]">{textMap[lang].analyticsTitle}</h2>
                <p className="mt-2 text-sm text-[#3f5978]">{textMap[lang].analyticsSubtitle}</p>
              </div>
              <Button
                onClick={loadAnalysis}
                disabled={analysisLoading}
                aria-busy={analysisLoading}
                className="rounded-xl bg-[#2f6fcb] px-6"
              >
                {analysisLoading ? textMap[lang].analyzing : textMap[lang].runAnalysis}
              </Button>
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_1fr]">
              <div className="min-w-0">
                <TextInput
                  id="attendance-threshold"
                  label={textMap[lang].thresholdLabel}
                  type="number"
                  min={MIN_ATTENDANCE_THRESHOLD_PERCENT}
                  max={100}
                  value={threshold}
                  onChange={(e) => handleThresholdChange(e.target.value)}
                  inputClassName="border-[#bfd0ef] bg-white focus:border-[#2f6fcb]"
                />
                <Card variant="solid" className="mt-5 border-[#bfd0ef] p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm font-semibold text-[#3f5978]">{textMap[lang].chartTitle}</div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#5578a7]">
                        {textMap[lang].chartModeLabel}
                        <select
                          value={chartMode}
                          onChange={(e) => setChartMode(e.target.value as "session" | "student")}
                          className="rounded-full border border-[#bfd0ef] bg-white px-3 py-1 text-xs font-semibold text-[#3f5978]"
                        >
                          <option value="session">{textMap[lang].chartModeSession}</option>
                          <option value="student">{textMap[lang].chartModeStudent}</option>
                        </select>
                      </label>
                      {chartMode === "session" && (
                        <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#5578a7]">
                          {textMap[lang].weekLabel}
                          <select
                            value={selectedWeek || "all"}
                            onChange={(e) => setSelectedWeek(e.target.value)}
                            className="rounded-full border border-[#bfd0ef] bg-white px-3 py-1 text-xs font-semibold text-[#3f5978]"
                          >
                            <option value="all">{textMap[lang].weekAll}</option>
                            {weekOptions.map((option) => (
                              <option key={option.key} value={option.key}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                      )}
                    </div>
                  </div>
                  {(chartMode === "session" ? filteredSessionSeries.length === 0 : stats.length === 0) ? (
                    <p className="mt-3 text-sm text-[#3f5978]">{textMap[lang].chartEmpty}</p>
                  ) : (
                    <div className="mt-4 overflow-hidden">
                      <div className="h-56 w-full min-w-0 sm:h-64">
                        <canvas ref={chartRef} />
                      </div>
                    </div>
                  )}
                </Card>
              </div>

              <Card variant="solid" className="min-w-0 border-[#bfd0ef] p-5">
                <div className="text-sm font-semibold text-[#3f5978]">{textMap[lang].lowList}</div>
                {stats.length === 0 ? (
                  <p className="mt-3 text-sm text-[#3f5978]">{textMap[lang].lowEmpty}</p>
                ) : (
                  <div className="mt-4 space-y-4">
                    {stats.map((s) => {
                      const ratePct = Math.round(s.rate * 100);
                      const low = ratePct < threshold;
                      if (!low) return null;
                      return (
                        <div key={s.id} className="rounded-xl border border-[#c9cbff] bg-[#f1f2ff] p-4">
                          <div className="text-sm font-semibold text-[#13253b]">
                            {s.name} ({s.id})
                          </div>
                          <div className="mt-1 break-words text-xs text-[#3f5978]">
                            {s.email} · {textMap[lang].lowAttendance} {s.attended}/{s.total} ({ratePct}%)
                          </div>
                          <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            <Button size="sm" onClick={() => sendReminder(s)} className="text-xs">
                              {textMap[lang].sendEmail}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyReminder(s)}
                              className="border-[#4f46e5] text-xs text-[#3f46b2]"
                            >
                              {textMap[lang].copyReminder}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>

            {stats.length > 0 && (
              <Card className="mt-6 border-[#bfd0ef] p-4">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-0 text-left text-sm sm:min-w-[520px]">
                    <thead className="text-xs uppercase text-[#5578a7]">
                      <tr>
                        <th className="px-3 py-2">{textMap[lang].studentCol}</th>
                        <th className="px-3 py-2">{textMap[lang].emailHeader}</th>
                        <th className="px-3 py-2">{textMap[lang].lowAttendance}</th>
                        <th className="px-3 py-2">{textMap[lang].statusCol}</th>
                        <th className="px-3 py-2">{textMap[lang].actionCol}</th>
                      </tr>
                    </thead>
                    <tbody className="text-[#13253b]">
                      {stats.map((s) => {
                        const ratePct = Math.round(s.rate * 100);
                        const low = ratePct < threshold;
                        return (
                          <tr key={s.id} className="border-t border-[#d3e0f4]">
                            <td className="px-3 py-2">
                              {s.name} ({s.id})
                            </td>
                            <td className="px-3 py-2">{s.email}</td>
                            <td className="px-3 py-2">
                              {s.attended} / {s.total} ({ratePct}%)
                            </td>
                            <td className="px-3 py-2">
                              {low ? textMap[lang].statusLow : textMap[lang].statusOk}
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => sendReminder(s)}
                                  disabled={!low}
                                  className="rounded-full px-3 py-1 text-xs"
                                >
                                  {textMap[lang].actionEmail}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => copyReminder(s)}
                                  disabled={!low}
                                  className="rounded-full border-[#4f46e5] px-3 py-1 text-xs text-[#3f46b2]"
                                >
                                  {textMap[lang].actionCopy}
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </Card>
        </section>
        <p className="mt-8 text-center text-xs text-[#4d6b8f]">{textMap[lang].footer}</p>
      </div>
    </main>
  );
}



