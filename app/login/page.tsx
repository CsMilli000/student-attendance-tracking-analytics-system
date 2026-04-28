"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { lecturerAccounts, studentAccounts } from "../../src/lib/accounts";
import { Button, Card, Notice, TextInput } from "../components/ui";

type Role = "student" | "lecturer";

type FontScale = 90 | 100 | 110 | 120;

type Lang = "en" | "zh";

type LoginSettings = {
  rememberRole: boolean;
  showDemoHint: boolean;
  autoFillDemo: boolean;
  role: Role;
  fontScale: FontScale;
  lang: Lang;
};

const roleLabel: Record<Role, Record<Lang, string>> = {
  student: { en: "Student", zh: "学生" },
  lecturer: { en: "Lecturer", zh: "老师" },
};

const fontScaleOptions: FontScale[] = [90, 100, 110, 120];

const applyFontScale = (value: FontScale) => {
  document.documentElement.style.fontSize = `${value}%`;
};

const applyLang = (value: Lang) => {
  document.documentElement.lang = value;
  localStorage.setItem("attendance.ui.lang", value);
};

const getInitialSettings = (): LoginSettings => {
  const defaults: LoginSettings = {
    rememberRole: true,
    showDemoHint: true,
    autoFillDemo: false,
    role: "student",
    fontScale: 100,
    lang: "en",
  };

  if (typeof window === "undefined") return defaults;

  try {
    // Preferences are local-only in this demo.
    const raw = localStorage.getItem("attendance.login.settings");
    const parsed = raw ? JSON.parse(raw) : {};
    const storedLang = localStorage.getItem("attendance.ui.lang");

    const role =
      parsed.role === "student" || parsed.role === "lecturer"
        ? parsed.role
        : defaults.role;
    const fontScale =
      typeof parsed.fontScale === "number" &&
      [90, 100, 110, 120].includes(parsed.fontScale)
        ? (parsed.fontScale as FontScale)
        : defaults.fontScale;
    const lang =
      storedLang === "en" || storedLang === "zh" ? storedLang : defaults.lang;

    return {
      rememberRole:
        typeof parsed.rememberRole === "boolean"
          ? parsed.rememberRole
          : defaults.rememberRole,
      showDemoHint:
        typeof parsed.showDemoHint === "boolean"
          ? parsed.showDemoHint
          : defaults.showDemoHint,
      autoFillDemo:
        typeof parsed.autoFillDemo === "boolean"
          ? parsed.autoFillDemo
          : defaults.autoFillDemo,
      role,
      fontScale,
      lang,
    };
  } catch {
    return defaults;
  }
};

const textMap = {
  en: {
    title: "Attendance Portal",
    subtitle:
      "Choose your role and sign in to continue.",
    roleTitle: "Role",
    roleDescStudent:
      "Sign in with your student account to check in and view your attendance.",
    roleDescLecturer:
      "Sign in with your lecturer account to manage sessions and review attendance.",
    accountLabel: "Account",
    passwordLabel: "Password",
    accountPlaceholderStudent: "e.g. s001",
    accountPlaceholderLecturer: "e.g. lecturer01",
    passwordPlaceholder: "Enter password",
    signInAs: "Continue as",
    demoLabel: "Demo credentials",
    demoUsername: "Username",
    demoPassword: "Password",
    msgMissing: "Please enter account and password.",
    msgStudentInvalid: "Student account or password is incorrect.",
    msgLecturerInvalid: "Lecturer account or password is incorrect.",
    accessibility: "Preferences",
    rememberRole: "Remember last role",
    showDemoHint: "Show demo hint",
    autoFillDemo: "Auto-fill demo credentials",
    textSize: "Text size",
    language: "Language",
    portalLabel: "Student Attendance Tracking and Analytics System",
    tabStudent: "Student",
    tabLecturer: "Lecturer",
    footer:
      "Independent University Project · Student Attendance Tracking and Analytics System. For academic demonstration only. All data shown is anonymized or sample data.",
  },
  zh: {
    title: "出勤系统登录",
    subtitle: "请选择身份并登录。",
    roleTitle: "当前角色",
    roleDescStudent:
      "使用学生账号登录，完成签到并查看个人出勤数据。",
    roleDescLecturer:
      "使用老师账号登录，管理签到并查看出勤分析。",
    accountLabel: "账号",
    passwordLabel: "密码",
    accountPlaceholderStudent: "例如 s001",
    accountPlaceholderLecturer: "例如 lecturer01",
    passwordPlaceholder: "请输入密码",
    signInAs: "继续进入",
    demoLabel: "示例登录信息",
    demoUsername: "用户名",
    demoPassword: "密码",
    msgMissing: "请输入账号和密码。",
    msgStudentInvalid: "学生账号或密码错误。",
    msgLecturerInvalid: "老师账号或密码错误。",
    accessibility: "偏好设置",
    rememberRole: "记住上次选择的身份",
    showDemoHint: "显示示例账号提示",
    autoFillDemo: "自动填充示例凭据",
    textSize: "文字大小",
    language: "语言",
    portalLabel: "出勤登录入口",
    tabStudent: "学生登录",
    tabLecturer: "老师登录",
    footer:
      "大学独立项目 · 学生出勤管理系统。仅用于学术展示与学习，页面数据为匿名或示例数据。",
  },
};

export default function LoginPage() {
  const initial = getInitialSettings();
  const router = useRouter();
  const hydrated = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  );
  const [role, setRole] = useState<Role>(initial.role);
  const [accountId, setAccountId] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<{
    tone: "info" | "success" | "warning" | "error";
    text: string;
  } | null>(null);
  const [rememberRole, setRememberRole] = useState(initial.rememberRole);
  const [showDemoHint, setShowDemoHint] = useState(initial.showDemoHint);
  const [autoFillDemo, setAutoFillDemo] = useState(initial.autoFillDemo);
  const [fontScale, setFontScale] = useState<FontScale>(initial.fontScale);
  const [lang, setLang] = useState<Lang>(initial.lang);

  useEffect(() => {
    applyFontScale(fontScale);
    applyLang(lang);
  }, [fontScale, lang]);

  useEffect(() => {
    localStorage.setItem(
      "attendance.login.settings",
      JSON.stringify({
        rememberRole,
        showDemoHint,
        autoFillDemo,
        role: rememberRole ? role : "student",
        fontScale,
      })
    );
  }, [rememberRole, showDemoHint, autoFillDemo, role, fontScale]);

  const hint = useMemo(() => {
    return role === "student"
      ? { account: "s001", password: "student123" }
      : { account: "lecturer01", password: "teach123" };
  }, [role]);

  const roleDesc =
    role === "student"
      ? textMap[lang].roleDescStudent
      : textMap[lang].roleDescLecturer;

  const handleLogin = () => {
    const cleanId = accountId.trim();
    if (!cleanId || !password) {
      setMsg({ tone: "warning", text: textMap[lang].msgMissing });
      return;
    }

    if (role === "student") {
      const account = studentAccounts.find(
        (a) => a.id === cleanId && a.password === password
      );
      if (!account) {
        setMsg({ tone: "error", text: textMap[lang].msgStudentInvalid });
        return;
      }
      // Restored by the student page after refresh.
      sessionStorage.setItem(
        "attendance.login",
        JSON.stringify({
          role: "student",
          id: account.id,
          name: account.name,
          email: account.email,
        })
      );
      router.push("/student");
      return;
    }

    const account = lecturerAccounts.find(
      (a) => a.id === cleanId && a.password === password
    );
    if (!account) {
      setMsg({ tone: "error", text: textMap[lang].msgLecturerInvalid });
      return;
    }
    // Restored by the lecturer page after refresh.
    sessionStorage.setItem(
      "attendance.login",
      JSON.stringify({
        role: "lecturer",
        id: account.id,
        name: account.name,
      })
    );
    router.push("/lecturer");
  };

  const handleFontScale = (value: FontScale) => {
    if (msg) setMsg(null);
    setFontScale(value);
    applyFontScale(value);
  };

  const handleLang = (value: Lang) => {
    if (msg) setMsg(null);
    setLang(value);
    applyLang(value);
  };

  if (!hydrated) {
    return (
      <main
        suppressHydrationWarning
        className="relative min-h-screen overflow-hidden bg-[#e8f0ff] px-4 py-8 text-[#13253b] sm:px-6 sm:py-12"
      />
    );
  }

  const applyDemoCredentials = (nextRole: Role) => {
    if (nextRole === "student") {
      setAccountId("s001");
      setPassword("student123");
      return;
    }
    setAccountId("lecturer01");
    setPassword("teach123");
  };

  return (
    <main
      suppressHydrationWarning
      className="relative min-h-screen overflow-hidden bg-[#e8f0ff] px-4 py-8 text-[#13253b] sm:px-6 sm:py-12"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_15%,rgba(47,111,203,0.23),transparent_36%),radial-gradient(circle_at_80%_75%,rgba(85,209,193,0.24),transparent_35%)]" />

      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-10">
        <section className="relative rounded-[30px] border border-[#bdd0f3] bg-[#f7faff]/90 p-8 shadow-[0_24px_50px_rgba(20,45,83,0.14)] backdrop-blur md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#2f6fcb]">
            {textMap[lang].portalLabel}
          </p>
          <h1 className="mt-4 font-[var(--font-display)] text-4xl font-semibold leading-tight text-[#13253b] md:text-5xl md:leading-tight">
            {textMap[lang].title}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-[#3f5978]">
            {textMap[lang].subtitle}
          </p>

          <Card className="mt-8 border-[#bfd0ef] bg-white p-6">
            <div className="text-xs font-semibold uppercase tracking-[0.25em] text-[#4d6b8f]">
              {textMap[lang].roleTitle}
            </div>
            <div className="mt-2 text-2xl font-semibold text-[#13253b]">
              {roleLabel[role][lang]}
            </div>
            <p className="mt-3 text-sm leading-6 text-[#3f5978]">{roleDesc}</p>
            {showDemoHint && (
              <div className="mt-4 rounded-xl border border-[#d4e0f5] bg-[#f4f8ff] px-4 py-3 text-sm text-[#385778]">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5f7fa7]">
                  {textMap[lang].demoLabel}
                </div>
                <div className="mt-2 grid gap-1">
                  <div>
                    <span className="font-semibold text-[#2b4e78]">
                      {textMap[lang].demoUsername}:
                    </span>{" "}
                    {hint.account}
                  </div>
                  <div>
                    <span className="font-semibold text-[#2b4e78]">
                      {textMap[lang].demoPassword}:
                    </span>{" "}
                    {hint.password}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </section>

        <section className="rounded-[30px] border border-[#bfd0ef] bg-white p-6 text-[#13253b] shadow-[0_18px_40px_rgba(20,45,83,0.12)] backdrop-blur sm:p-8 md:p-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#2f6fcb]">
                {textMap[lang].roleTitle}
              </p>
              <p className="mt-2 text-2xl font-semibold text-[#13253b]">
                {roleLabel[role][lang]}
              </p>
            </div>
            <div
              role="group"
              aria-label="Role"
              className="flex w-full flex-wrap gap-2 rounded-full border border-[#bfd0ef] bg-white p-1 text-xs font-semibold text-[#3f5978] sm:w-auto"
            >
              <button
                type="button"
                aria-pressed={role === "student"}
                onClick={() => {
                  if (msg) setMsg(null);
                  setRole("student");
                  if (autoFillDemo) applyDemoCredentials("student");
                }}
                className={`rounded-full px-4 py-2 transition ${
                  role === "student"
                    ? "bg-[#2f6fcb] text-white shadow"
                    : "hover:text-[#13253b]"
                }`}
              >
                {textMap[lang].tabStudent}
              </button>
              <button
                type="button"
                aria-pressed={role === "lecturer"}
                onClick={() => {
                  if (msg) setMsg(null);
                  setRole("lecturer");
                  if (autoFillDemo) applyDemoCredentials("lecturer");
                }}
                className={`rounded-full px-4 py-2 transition ${
                  role === "lecturer"
                    ? "bg-[#2f6fcb] text-white shadow"
                    : "hover:text-[#13253b]"
                }`}
              >
                {textMap[lang].tabLecturer}
              </button>
            </div>
          </div>

          <div className="mt-8 grid gap-5">
            <TextInput
              id="login-account"
              label={textMap[lang].accountLabel}
              labelClassName="text-[#4d6b8f]"
              autoComplete="username"
              value={accountId}
              onChange={(e) => {
                if (msg) setMsg(null);
                setAccountId(e.target.value);
              }}
              placeholder={
                role === "student"
                  ? textMap[lang].accountPlaceholderStudent
                  : textMap[lang].accountPlaceholderLecturer
              }
              inputClassName="border-[#bfd0ef] bg-white text-[#13253b] placeholder:text-[#6b85a8] focus:border-[#2f6fcb]"
            />
            <TextInput
              id="login-password"
              label={textMap[lang].passwordLabel}
              labelClassName="text-[#4d6b8f]"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                if (msg) setMsg(null);
                setPassword(e.target.value);
              }}
              placeholder={textMap[lang].passwordPlaceholder}
              inputClassName="border-[#bfd0ef] bg-white text-[#13253b] placeholder:text-[#6b85a8] focus:border-[#2f6fcb]"
            />
          </div>

          {msg && (
            <Notice tone={msg.tone} onClose={() => setMsg(null)}>
              {msg.text}
            </Notice>
          )}

          <Button
            full
            onClick={handleLogin}
            className="mt-6 rounded-xl bg-[#2f6fcb] hover:translate-y-[-1px]"
          >
            {textMap[lang].signInAs} {roleLabel[role][lang]}
          </Button>

          <Card className="mt-6 border-[#bfd0ef] bg-white p-5">
            <div className="text-xs font-semibold uppercase tracking-[0.25em] text-[#4d6b8f]">
              {textMap[lang].accessibility}
            </div>
            <div className="mt-4 grid gap-3 text-sm text-[#3f5978]">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={rememberRole}
                  onChange={(e) => {
                    if (msg) setMsg(null);
                    setRememberRole(e.target.checked);
                  }}
                />
                {textMap[lang].rememberRole}
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showDemoHint}
                  onChange={(e) => {
                    if (msg) setMsg(null);
                    setShowDemoHint(e.target.checked);
                  }}
                />
                {textMap[lang].showDemoHint}
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={autoFillDemo}
                  onChange={(e) => {
                    if (msg) setMsg(null);
                    const checked = e.target.checked;
                    setAutoFillDemo(checked);
                    if (checked) applyDemoCredentials(role);
                  }}
                />
                {textMap[lang].autoFillDemo}
              </label>
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <span className="text-xs uppercase tracking-[0.2em] text-[#4d6b8f]">
                  {textMap[lang].textSize}
                </span>
                {fontScaleOptions.map((value) => (
                  <button
                    key={value}
                    onClick={() => handleFontScale(value)}
                    aria-pressed={fontScale === value}
                    aria-label={`${value}%`}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                      fontScale === value
                        ? "border-[#2f6fcb] bg-[#2f6fcb] text-white"
                        : "border-[#bfd0ef] text-[#3f5978]"
                    }`}
                  >
                    {value}%
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <span className="text-xs uppercase tracking-[0.2em] text-[#4d6b8f]">
                  {textMap[lang].language}
                </span>
                <button
                  onClick={() => handleLang("en")}
                  aria-pressed={lang === "en"}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    lang === "en"
                      ? "border-[#2f6fcb] bg-[#2f6fcb] text-white"
                      : "border-[#bfd0ef] text-[#3f5978]"
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => handleLang("zh")}
                  aria-pressed={lang === "zh"}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    lang === "zh"
                      ? "border-[#2f6fcb] bg-[#2f6fcb] text-white"
                      : "border-[#bfd0ef] text-[#3f5978]"
                  }`}
                >
                  中文
                </button>
              </div>
            </div>
          </Card>
        </section>
      </div>
      <p className="mt-8 text-center text-xs text-[#5b78a3]">
        {textMap[lang].footer}
      </p>
    </main>
  );
}



