"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import Chart from "chart.js/auto";
import { signInAnonymously, signOut } from "firebase/auth";
import { addDoc, collection, getDocs, query, where, Timestamp } from "firebase/firestore";
import { db, auth } from "../../src/lib/firebase";
import { type StudentAccount } from "../../src/lib/accounts";
import { MIN_ATTENDANCE_THRESHOLD_RATE } from "../../src/lib/constants";
import { Button, Card, Notice, TextInput } from "../components/ui";

type FontScale = 90 | 100 | 110 | 120;

type Lang = "en" | "zh";

type TimelinePoint = {
  label: string;
  rate: number;
  attended: number;
  total: number;
};

type SessionData = {
  createdAt?: Timestamp;
};

type AttendanceData = {
  sessionId?: string;
};

const fontScaleOptions: FontScale[] = [90, 100, 110, 120];

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? `Error: ${error.message}` : fallback;

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
    portalLabel: "Student Portal",
    title: "Student Check-in",
    subtitle: "Enter your session code to check in.",
    back: "Back to Login",
    textSize: "Text size",
    accountTitle: "Account",
    notSigned: "Not signed in",
    notSignedDesc: "Please sign in on the login page with a student account.",
    goLogin: "Back to Login",
    signOut: "Sign out",
    checkinTitle: "Check-in",
    codeLabel: "Session code",
    codePlaceholder: "e.g. 15A3B3",
    checking: "Submitting...",
    checkin: "Check in now",
    msgSignedOut: "Signed out.",
    msgChecking: "Validating session code...",
    msgNeedLogin: "Please sign in as a student first.",
    msgNeedCode: "Please enter a session code.",
    msgInvalidCode: "Invalid or closed session code.",
    msgDup: "You have already checked in for this session.",
    msgSuccess: "Attendance recorded successfully.",
    msgLogoutError: "Logout error.",
    msgCheckinError: "Check-in error.",
    attendanceTitle: "Attendance rate",
    attendanceSummary: "Sessions",
    attendanceLow: "Your attendance is running low. Try not to miss the next sessions.",
    attendanceOk: "Your attendance is in good standing.",
    attendanceTrendTitle: "Attendance trend",
    attendanceTrendEmpty: "No sessions yet.",
    attendanceTrendLabel: "Attendance rate (%)",
    attendanceSplitTitle: "Attendance split",
    attendanceSplitEmpty: "No sessions yet.",
    attendanceSplitAttended: "Attended",
    attendanceSplitMissed: "Missed",
    footer:
      "Independent University Project · Student Attendance Tracking and Analytics System. For academic demonstration only. All data shown is anonymized or sample data.",
  },
  zh: {
    portalLabel: "学生入口",
    title: "学生签到",
    subtitle: "输入签到码并完成签到。",
    back: "返回登录",
    textSize: "文字大小",
    accountTitle: "账号",
    notSigned: "尚未登录",
    notSignedDesc: "请先在登录页使用学生账号登录。",
    goLogin: "返回登录",
    signOut: "退出登录",
    checkinTitle: "签到",
    codeLabel: "签到码",
    codePlaceholder: "例如 15A3B3",
    checking: "提交中...",
    checkin: "立即签到",
    msgSignedOut: "已退出登录。",
    msgChecking: "正在验证签到码...",
    msgNeedLogin: "请先登录学生账号。",
    msgNeedCode: "请输入签到码。",
    msgInvalidCode: "签到码无效或已关闭。",
    msgDup: "你已完成本次课程签到。",
    msgSuccess: "签到成功，出勤已记录。",
    msgLogoutError: "退出登录失败。",
    msgCheckinError: "签到失败。",
    attendanceTitle: "出勤率",
    attendanceSummary: "课程",
    attendanceLow: "你的出勤率偏低，记得按时参加后续课程。",
    attendanceOk: "你的出勤情况良好。",
    attendanceTrendTitle: "出勤趋势",
    attendanceTrendEmpty: "暂无课程。",
    attendanceTrendLabel: "出勤率（%）",
    attendanceSplitTitle: "出勤占比",
    attendanceSplitEmpty: "暂无课程。",
    attendanceSplitAttended: "已签到",
    attendanceSplitMissed: "未签到",
    footer:
      "大学独立项目 · 学生出勤管理系统。仅用于学术展示与学习，页面数据为匿名或示例数据。",
  },
};

export default function StudentPage() {
  const [loggedInStudent, setLoggedInStudent] =
    useState<StudentAccount | null>(null);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<{
    tone: "info" | "success" | "warning" | "error";
    text: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [fontScale, setFontScale] = useState<FontScale>(100);
  const [lang, setLang] = useState<Lang>("en");
  const [attendedCount, setAttendedCount] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [rate, setRate] = useState(0);
  const [timeline, setTimeline] = useState<TimelinePoint[]>([]);
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);
  const splitChartRef = useRef<HTMLCanvasElement | null>(null);
  const splitChartInstanceRef = useRef<Chart | null>(null);
  const [isMobile, setIsMobile] = useState(false);

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
    if (loggedInStudent) return;
    // Restore login state after refresh.
    const raw = sessionStorage.getItem("attendance.login");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.role !== "student") return;
      setLoggedInStudent({
        id: parsed.id,
        name: parsed.name,
        email: parsed.email,
        password: "",
      });
    } catch {
      return;
    }
  }, [loggedInStudent]);

  const ensureAuth = useCallback(async () => {
    if (!auth.currentUser) {
      await signInAnonymously(auth);
    }
  }, []);

  // Recalculate totals from Firestore so the dashboard reflects every session created.
  const refreshStats = useCallback(async (student: StudentAccount) => {
    try {
      await ensureAuth();
      const sessionsSnap = await getDocs(collection(db, "sessions"));
      const attendanceSnap = await getDocs(
        query(collection(db, "attendance"), where("studentUid", "==", student.id))
      );

      const sessions = sessionsSnap.docs
        .map((docSnap) => {
          const data = docSnap.data() as SessionData;
          const createdAt = data?.createdAt?.toDate
            ? data.createdAt.toDate()
            : null;
          return { id: docSnap.id, createdAt };
        })
        .sort((a, b) => {
          const aTime = a.createdAt ? a.createdAt.getTime() : 0;
          const bTime = b.createdAt ? b.createdAt.getTime() : 0;
          return aTime - bTime;
        });

      const attendedSessionIds = new Set<string>();
      // A set avoids double-counting if duplicate attendance documents ever exist.
      attendanceSnap.docs.forEach((docSnap) => {
        const data = docSnap.data() as AttendanceData;
        if (data?.sessionId) attendedSessionIds.add(data.sessionId);
      });

      let running = 0;
      // Cumulative points show progression across sessions.
      const timelinePoints = sessions.map((session, index) => {
        if (attendedSessionIds.has(session.id)) running += 1;
        const total = index + 1;
        const rate = total > 0 ? running / total : 0;
        const label = session.createdAt
          ? session.createdAt.toLocaleDateString()
          : `Session ${total}`;
        return {
          label,
          rate,
          attended: running,
          total,
        };
      });

      const total = sessions.length;
      const attended = sessions.filter((s) => attendedSessionIds.has(s.id)).length;
      setTotalSessions(total);
      setAttendedCount(attended);
      setRate(total > 0 ? attended / total : 0);
      setTimeline(timelinePoints);
    } catch (err) {
      console.error(err);
    }
  }, [ensureAuth]);

  useEffect(() => {
    if (!loggedInStudent) return;
    refreshStats(loggedInStudent);
  }, [loggedInStudent, refreshStats]);

  useEffect(() => {
    if (!chartRef.current) return;
    // Recreate the line chart when data, language, or mobile label sizing changes.
    if (timeline.length === 0) {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
      return;
    }

    const fullLabels = timeline.map((point) => point.label);
    const labels = timeline.map((point) => {
      if (!isMobile) return point.label;
      const parts = point.label.split("/");
      return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : point.label;
    });
    const dataPoints = timeline.map((point) => Math.round(point.rate * 100));

    chartInstanceRef.current?.destroy();
    chartInstanceRef.current = new Chart(chartRef.current, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: textMap[lang].attendanceTrendLabel,
            data: dataPoints,
            borderColor: "rgba(31, 44, 58, 0.9)",
            backgroundColor: "rgba(31, 44, 58, 0.15)",
            borderWidth: 2,
            fill: true,
            tension: 0.3,
            pointRadius: 3,
            pointBackgroundColor: "rgba(31, 44, 58, 0.9)",
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
  }, [timeline, lang, isMobile]);

  useEffect(() => {
    if (!splitChartRef.current) return;
    // The doughnut chart shows the latest attended/missed split for the signed-in student.
    if (totalSessions === 0) {
      if (splitChartInstanceRef.current) {
        splitChartInstanceRef.current.destroy();
        splitChartInstanceRef.current = null;
      }
      return;
    }

    const attended = attendedCount;
    const missed = Math.max(0, totalSessions - attendedCount);

    splitChartInstanceRef.current?.destroy();
    splitChartInstanceRef.current = new Chart(splitChartRef.current, {
      type: "doughnut",
      data: {
        labels: [
          textMap[lang].attendanceSplitAttended,
          textMap[lang].attendanceSplitMissed,
        ],
        datasets: [
          {
            data: [attended, missed],
            backgroundColor: ["rgba(31, 44, 58, 0.9)", "rgba(94, 196, 179, 0.5)"],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context) => `${context.label}: ${context.parsed}`,
            },
          },
        },
      },
    });

    return () => {
      splitChartInstanceRef.current?.destroy();
      splitChartInstanceRef.current = null;
    };
  }, [attendedCount, totalSessions, lang]);

  const logout = async () => {
    try {
      await signOut(auth);
      sessionStorage.removeItem("attendance.login");
      setLoggedInStudent(null);
      setTimeline([]);
      setTotalSessions(0);
      setAttendedCount(0);
      setRate(0);
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
      if (splitChartInstanceRef.current) {
        splitChartInstanceRef.current.destroy();
        splitChartInstanceRef.current = null;
      }
      setMsg({ tone: "success", text: textMap[lang].msgSignedOut });
    } catch (err: unknown) {
      console.error(err);
      setMsg({
        tone: "error",
        text: getErrorMessage(err, textMap[lang].msgLogoutError),
      });
    }
  };

  const checkIn = async () => {
    try {
      setLoading(true);
      setMsg({ tone: "info", text: textMap[lang].msgChecking });

      if (!loggedInStudent) {
        setMsg({ tone: "error", text: textMap[lang].msgNeedLogin });
        return;
      }

      await ensureAuth();

      const cleanCode = code.trim().toUpperCase();
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
        setMsg({ tone: "error", text: textMap[lang].msgInvalidCode });
        return;
      }

      const sessionDoc = snap.docs[0];

      // Check for an existing row before writing so one student can only check in once.
      const dupQ = query(
        collection(db, "attendance"),
        where("sessionId", "==", sessionDoc.id),
        where("studentUid", "==", loggedInStudent.id)
      );
      const dupSnap = await getDocs(dupQ);
      if (!dupSnap.empty) {
        setMsg({ tone: "warning", text: textMap[lang].msgDup });
        return;
      }

      // Attendance rows include display data so lecturer reports do not need extra joins.
      await addDoc(collection(db, "attendance"), {
        sessionId: sessionDoc.id,
        sessionCode: cleanCode,
        studentUid: loggedInStudent.id,
        studentName: loggedInStudent.name,
        studentEmail: loggedInStudent.email,
        checkedInAt: Timestamp.now(),
      });

      setCode("");
      setMsg({ tone: "success", text: textMap[lang].msgSuccess });
      await refreshStats(loggedInStudent);
    } catch (err: unknown) {
      console.error(err);
      setMsg({
        tone: "error",
        text: getErrorMessage(err, textMap[lang].msgCheckinError),
      });
    } finally {
      setLoading(false);
    }
  };

  const ratePct = Math.round(rate * 100);
  const isLow = totalSessions > 0 && rate < MIN_ATTENDANCE_THRESHOLD_RATE;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#edf4ff] px-4 py-8 text-[#13253b] sm:px-6 sm:py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(71,124,255,0.18),transparent_36%),radial-gradient(circle_at_88%_80%,rgba(24,166,180,0.2),transparent_38%)]" />
      <div className="relative mx-auto w-full max-w-6xl">
        <section className="rounded-[28px] border border-[#bfd0ef] bg-white/90 p-6 shadow-[0_24px_45px_rgba(24,43,75,0.12)] backdrop-blur sm:p-8 md:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#2f6fcb]">
                {textMap[lang].portalLabel}
              </p>
              <h1 className="mt-2 font-[var(--font-display)] text-3xl font-semibold text-[#13253b] md:text-4xl">
                {textMap[lang].title}
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-[#3f5978]">
                {textMap[lang].subtitle}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full border border-[#2f6fcb] px-5 py-2 text-sm font-semibold text-[#245cae]"
              >
                {textMap[lang].back}
              </Link>
              <div className="flex flex-wrap items-center gap-2 rounded-full border border-[#c9d9f4] bg-white px-3 py-2 text-xs text-[#3f5978] shadow-sm">
                <span className="uppercase tracking-[0.18em] text-[#4d6b8f]">
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
                        : "border-[#c9d9f4] text-[#3f5978]"
                    }`}
                  >
                    {value}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <Card className="min-w-0 border-[#b8cff4] bg-[#f4f8ff] p-6">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#5578a7]">
                {textMap[lang].checkinTitle}
              </div>
              <p className="mt-2 text-sm text-[#3f5978]">{textMap[lang].subtitle}</p>
              <TextInput
                id="checkin-code"
                className="mt-5"
                label={textMap[lang].codeLabel}
                value={code}
                onChange={(e) => {
                  if (msg) setMsg(null);
                  setCode(e.target.value);
                }}
                placeholder={textMap[lang].codePlaceholder}
                autoComplete="one-time-code"
                inputClassName="border-[#bfd0ef] bg-white focus:border-[#2f6fcb]"
              />
              <Button
                full
                onClick={checkIn}
                disabled={loading}
                aria-busy={loading}
                className="mt-5 rounded-xl bg-[#2f6fcb] shadow-[0_12px_24px_rgba(47,111,203,0.25)]"
              >
                {loading ? textMap[lang].checking : textMap[lang].checkin}
              </Button>
              {msg && (
                <Notice tone={msg.tone} onClose={() => setMsg(null)}>
                  {msg.text}
                </Notice>
              )}
            </Card>

            <Card className="min-w-0 border-[#bfd0ef] bg-white p-6 sm:p-7">
              <div className="text-sm font-semibold text-[#3f5978]">
                {textMap[lang].accountTitle}
              </div>
              {loggedInStudent ? (
                <>
                  <div className="mt-3 text-2xl font-semibold text-[#13253b]">
                    {loggedInStudent.name}
                  </div>
                  <div className="mt-1 text-sm text-[#3f5978]">{loggedInStudent.id}</div>
                  <div className="mt-1 break-words text-sm text-[#3f5978]">
                    {loggedInStudent.email}
                  </div>
                  <div className="mt-5 min-w-0 rounded-xl border border-[#c9d9f4] bg-[#f4f8ff] px-4 py-4 overflow-hidden">
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5578a7]">
                      {textMap[lang].attendanceTitle}
                    </div>
                    <div className="mt-2 flex items-baseline justify-between">
                      <div className="text-3xl font-semibold text-[#13253b]">
                        {totalSessions > 0 ? `${ratePct}%` : "--"}
                      </div>
                      <div className="text-xs text-[#4d6b8f]">
                        {attendedCount}/{totalSessions} {textMap[lang].attendanceSummary}
                      </div>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-[#dbe7fa]">
                      <div
                        className={`h-2 rounded-full ${
                          isLow ? "bg-[#4f46e5]" : "bg-[#2f6fcb]"
                        }`}
                        style={{ width: `${Math.min(100, Math.max(4, ratePct))}%` }}
                      />
                    </div>
                    <div
                      className={`mt-3 rounded-lg px-3 py-2 text-xs font-semibold ${
                        isLow ? "bg-[#eef0ff] text-[#3f46b2]" : "bg-[#e9f2ff] text-[#245cae]"
                      }`}
                    >
                      {isLow ? textMap[lang].attendanceLow : textMap[lang].attendanceOk}
                    </div>
                  </div>
                  <div className="mt-5 grid min-w-0 gap-4 sm:grid-cols-2">
                    <div className="min-w-0 overflow-hidden rounded-xl border border-[#c9d9f4] bg-[#f4f8ff] px-4 py-4">
                      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5578a7]">
                        {textMap[lang].attendanceTrendTitle}
                      </div>
                      {timeline.length === 0 ? (
                        <p className="mt-3 text-sm text-[#3f5978]">
                          {textMap[lang].attendanceTrendEmpty}
                        </p>
                      ) : (
                        <div className="mt-3 h-36 w-full min-w-0 overflow-hidden">
                          <canvas ref={chartRef} className="!h-full !w-full max-w-full" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 overflow-hidden rounded-xl border border-[#c9d9f4] bg-[#f4f8ff] px-4 py-4">
                      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5578a7]">
                        {textMap[lang].attendanceSplitTitle}
                      </div>
                      {totalSessions === 0 ? (
                        <p className="mt-3 text-sm text-[#3f5978]">
                          {textMap[lang].attendanceSplitEmpty}
                        </p>
                      ) : (
                        <div className="mt-3 h-36 w-full min-w-0 overflow-hidden">
                          <canvas ref={splitChartRef} className="!h-full !w-full max-w-full" />
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-6 border-[#2f6fcb] text-[#245cae]"
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
                  <p className="mt-2 text-sm text-[#3f5978]">
                    {textMap[lang].notSignedDesc}
                  </p>
                  <Link
                    href="/login"
                    className="mt-5 inline-flex rounded-xl bg-[#2f6fcb] px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(47,111,203,0.3)]"
                  >
                    {textMap[lang].goLogin}
                  </Link>
                </>
              )}
            </Card>
          </div>
        </section>
        <p className="mt-8 text-center text-xs text-[#6b85a8]">{textMap[lang].footer}</p>
      </div>
    </main>
  );
}
