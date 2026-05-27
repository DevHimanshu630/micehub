import Link from "next/link";
import { TicketForm } from "./_components/ticket-form";

export default function NewTicketPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Link
          href="/support"
          className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          &larr; Back to tickets
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">
          Open a support ticket
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Tell us what&apos;s going on. We usually reply within one business
          day.
        </p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <TicketForm />
      </div>
    </div>
  );
}
