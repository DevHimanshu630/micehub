import Link from "next/link";
import type { LucideIcon } from "lucide-react";

/**
 * Shared presentational primitives so venue/admin/planner pages share one
 * consistent look. Pure presentation — no data fetching, no client state.
 */

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function Card({
  title,
  action,
  children,
  className = "",
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}
    >
      {title ? (
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-5 py-3 dark:border-slate-800">
          <h2 className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            {title}
          </h2>
          {action}
        </div>
      ) : null}
      <div className="p-5">{children}</div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  href,
  tone = "indigo",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  href?: string;
  tone?: "indigo" | "emerald" | "amber" | "rose" | "slate";
}) {
  const toneClass = {
    indigo:
      "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400",
    emerald:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
    amber:
      "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
    rose: "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400",
    slate: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  }[tone];

  const inner = (
    <div className="flex h-full items-start gap-4 rounded-xl border border-slate-200 bg-white p-5 transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      {Icon ? (
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${toneClass}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      ) : null}
      <div className="min-w-0">
        <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
          {label}
        </p>
        <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
          {value}
        </p>
        {hint ? <p className="mt-0.5 text-xs text-slate-500">{hint}</p> : null}
      </div>
    </div>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}

const BADGE_TONES = {
  amber: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  emerald:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  rose: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
  slate: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  indigo:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
} as const;

export type BadgeTone = keyof typeof BADGE_TONES;

export function Badge({
  children,
  tone = "slate",
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${BADGE_TONES[tone]}`}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
        <Icon className="h-6 w-6" />
      </div>
      <p className="text-base font-medium text-slate-900 dark:text-slate-100">
        {title}
      </p>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function TableShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
        {children}
      </table>
    </div>
  );
}

export function Th({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`bg-slate-50 px-4 py-2.5 text-xs font-semibold tracking-wide text-slate-600 uppercase dark:bg-slate-950 dark:text-slate-400 ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <td
      className={`px-4 py-3 text-sm text-slate-700 dark:text-slate-300 ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </td>
  );
}
