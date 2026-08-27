import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
      {hint ? <p className="m-0 text-xs text-[var(--ink-soft)]">{hint}</p> : null}
    </div>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} />;
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
}) {
  const map = {
    primary: "btn btn-primary",
    secondary: "btn btn-secondary",
    danger: "btn btn-danger",
  } as const;
  return <button className={`${map[variant]} ${className}`} {...props} />;
}

export function FormMessage({
  error,
  success,
}: {
  error?: string | null;
  success?: string | null;
}) {
  if (error) return <div className="alert alert-error">{error}</div>;
  if (success) return <div className="alert alert-ok">{success}</div>;
  return null;
}

export function StatusBadge({
  status,
  tone = "default",
}: {
  status: string;
  tone?: "default" | "warn" | "danger" | "muted";
}) {
  const cls =
    tone === "warn"
      ? "badge badge-warn"
      : tone === "danger"
        ? "badge badge-danger"
        : tone === "muted"
          ? "badge badge-muted"
          : "badge";
  return <span className={cls}>{status.replaceAll("_", " ")}</span>;
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display m-0 text-3xl text-[var(--ink)] sm:text-4xl">{title}</h1>
        {subtitle ? <p className="mt-2 max-w-2xl text-[var(--ink-soft)]">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="panel border-dashed p-8 text-center text-sm text-[var(--ink-soft)]">
      {children}
    </div>
  );
}
