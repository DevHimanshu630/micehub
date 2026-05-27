"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createTicket, type CreateTicketState } from "../../actions";

export function TicketForm() {
  const [state, formAction, isPending] = useActionState<
    CreateTicketState,
    FormData
  >(createTicket, null);

  const inputClasses =
    "block w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:bg-slate-900 dark:text-slate-100";

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label
          htmlFor="subject"
          className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Subject
        </label>
        <input
          id="subject"
          name="subject"
          type="text"
          placeholder="e.g. Payment deducted but booking pending"
          className={`${inputClasses} ${state?.fieldErrors?.subject ? "border-rose-400 focus:ring-rose-500" : "border-slate-300 dark:border-slate-700"}`}
        />
        {state?.fieldErrors?.subject?.[0] ? (
          <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
            {state.fieldErrors.subject[0]}
          </p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="body"
          className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Describe the issue
        </label>
        <textarea
          id="body"
          name="body"
          rows={6}
          placeholder="Include booking ID, payment ID, or any error message you saw."
          className={`${inputClasses} ${state?.fieldErrors?.body ? "border-rose-400 focus:ring-rose-500" : "border-slate-300 dark:border-slate-700"}`}
        />
        {state?.fieldErrors?.body?.[0] ? (
          <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
            {state.fieldErrors.body[0]}
          </p>
        ) : null}
      </div>

      {state?.formError ? (
        <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">
          {state.formError}
        </p>
      ) : null}

      <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
        <Link
          href="/support"
          className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Sending..." : "Open ticket"}
        </button>
      </div>
    </form>
  );
}
