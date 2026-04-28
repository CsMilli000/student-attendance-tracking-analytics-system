import type { ComponentProps, ReactNode } from "react";

type ButtonVariant = "primary" | "outline" | "danger" | "dangerOutline";

type ButtonSize = "sm" | "md";

const join = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

export function Button({
  variant = "primary",
  size = "md",
  full = false,
  className,
  ...props
}: ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  full?: boolean;
}) {
  const variantClasses: Record<ButtonVariant, string> = {
    primary:
      "bg-[#2f6fcb] text-white shadow-[0_14px_28px_rgba(47,111,203,0.25)]",
    outline: "border border-[#2f6fcb] text-[#245cae]",
    danger:
      "bg-[#4f46e5] text-white shadow-[0_12px_24px_rgba(79,70,229,0.24)]",
    dangerOutline: "border border-[#4f46e5] text-[#4f46e5]",
  };

  const sizeClasses: Record<ButtonSize, string> = {
    sm: "px-3 py-2 text-xs",
    md: "px-4 py-3 text-sm",
  };

  return (
    <button
      type="button"
      className={join(
        "rounded-2xl font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
        variantClasses[variant],
        sizeClasses[size],
        full && "w-full",
        className
      )}
      {...props}
    />
  );
}

type CardVariant = "glass" | "soft" | "solid";

export function Card({
  variant = "soft",
  className,
  children,
}: {
  variant?: CardVariant;
  className?: string;
  children: ReactNode;
}) {
  const variantClasses: Record<CardVariant, string> = {
    glass:
      "rounded-[32px] border border-white/70 bg-white/80 shadow-[0_24px_50px_rgba(32,34,56,0.15)] backdrop-blur",
    soft: "rounded-2xl border border-[#c9d9f4] bg-white/85 shadow-sm",
    solid: "rounded-2xl border border-[#bfd0ef] bg-white shadow-sm",
  };

  return <div className={join(variantClasses[variant], className)}>{children}</div>;
}

export function TextInput({
  id,
  label,
  className,
  inputClassName,
  labelClassName,
  ...props
}: ComponentProps<"input"> & {
  label: string;
  inputClassName?: string;
  labelClassName?: string;
}) {
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className={join(
          "text-xs font-semibold uppercase tracking-[0.18em] text-[#4d6b8f]",
          labelClassName
        )}
      >
        {label}
      </label>
      <input
        id={id}
        className={join(
          "mt-2 w-full rounded-2xl border border-[#bfd0ef] bg-white px-4 py-3 text-sm text-[#13253b] placeholder:text-[#6b85a8] shadow-sm focus:border-[#2f6fcb] focus:outline-none",
          inputClassName
        )}
        {...props}
      />
    </div>
  );
}

type NoticeTone = "info" | "success" | "warning" | "error";

export function Notice({
  tone = "info",
  children,
  onClose,
}: {
  tone?: NoticeTone;
  children: ReactNode;
  onClose?: () => void;
}) {
  const toneClasses: Record<NoticeTone, string> = {
    info: "border-[#bfd0ef] bg-[#f4f8ff] text-[#2b4a75]",
    success: "border-[#b8e4dd] bg-[#eaf9f6] text-[#1f5f56]",
    warning: "border-[#c9cbff] bg-[#f1f2ff] text-[#3b46a8]",
    error: "border-[#c4c8ff] bg-[#edefff] text-[#3642a2]",
  };

  const role = tone === "error" ? "alert" : "status";

  return (
    <div
      role={role}
      aria-live="polite"
      className={join(
        "mt-4 flex items-start justify-between gap-3 rounded-xl border px-4 py-2 text-sm",
        toneClasses[tone]
      )}
    >
      <span>{children}</span>
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss"
          className="rounded-full px-2 text-xs font-semibold text-[#245cae] hover:opacity-70"
        >
          x
        </button>
      ) : null}
    </div>
  );
}
