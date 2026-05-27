"use client";

import { formatINR } from "@/lib/format";
import { useActionState } from "react";
import { releasePayout, type ReleasePayoutState } from "../actions";

export function ReleasePayoutForm({
  payoutId,
  netRupees,
}: {
  payoutId: string;
  netRupees: number;
}) {
  const boundAction = releasePayout.bind(null, payoutId);
  const [state, formAction, isPending] = useActionState<
    ReleasePayoutState,
    FormData
  >(boundAction, null);

  return (
    <form action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div>
        <label
          htmlFor={`utr-${payoutId}`}
          className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300"
        >
          Bank UTR / reference *
        </label>
        <input
          id={`utr-${payoutId}`}
          name="utr"
          type="text"
          required
          placeholder="e.g. HDFCN24052612345"
          className={`block w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:bg-slate-950 dark:text-slate-100 ${
            state?.fieldErrors?.utr
              ? "border-rose-400 focus:ring-rose-500"
              : "border-slate-300 dark:border-slate-700"
          }`}
        />
        {state?.fieldErrors?.utr ? (
          <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
            {state.fieldErrors.utr[0]}
          </p>
        ) : null}
      </div>
      <div>
        <label
          htmlFor={`note-${payoutId}`}
          className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300"
        >
          Note (optional)
        </label>
        <input
          id={`note-${payoutId}`}
          name="note"
          type="text"
          placeholder="Internal note"
          className={`block w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:bg-slate-950 dark:text-slate-100 ${
            state?.fieldErrors?.note
              ? "border-rose-400 focus:ring-rose-500"
              : "border-slate-300 dark:border-slate-700"
          }`}
        />
        {state?.fieldErrors?.note ? (
          <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
            {state.fieldErrors.note[0]}
          </p>
        ) : null}
      </div>
      {state?.formError ? (
        <p className="text-sm text-rose-700 sm:col-span-2 dark:text-rose-400">
          {state.formError}
        </p>
      ) : null}
      <div className="flex items-center justify-end gap-3 sm:col-span-2">
        <p className="text-xs text-slate-500">
          Confirms {formatINR(netRupees)} transferred to the venue.
        </p>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Releasing..." : "Mark released"}
        </button>
      </div>
    </form>
  );
}
