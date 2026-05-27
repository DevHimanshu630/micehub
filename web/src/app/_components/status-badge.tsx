import type { Property } from "@/db/schema";

const LABELS: Record<Property["status"], string> = {
  pending_approval: "Pending approval",
  approved: "Approved",
  rejected: "Rejected",
};

const CLASSES: Record<Property["status"], string> = {
  pending_approval:
    "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  approved:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  rejected: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
};

export function StatusBadge({ status }: { status: Property["status"] }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${CLASSES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
