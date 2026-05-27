"use client";

import { useActionState, useRef, useEffect } from "react";
import { postReply, type ReplyState } from "../actions";

export function ReplyForm({ ticketId }: { ticketId: string }) {
  const boundAction = postReply.bind(null, ticketId);
  const [state, formAction, isPending] = useActionState<ReplyState, FormData>(
    boundAction,
    null,
  );

  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  // Clear the textarea after a successful submit (state===null means ok).
  useEffect(() => {
    if (wasPending.current && !isPending && !state) {
      formRef.current?.reset();
    }
    wasPending.current = isPending;
  }, [isPending, state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
    >
      <label
        htmlFor="body"
        className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
      >
        Reply
      </label>
      <textarea
        id="body"
        name="body"
        rows={4}
        placeholder="Type your message..."
        className={`block w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:bg-slate-900 dark:text-slate-100 ${
          state?.fieldError
            ? "border-rose-400 focus:ring-rose-500"
            : "border-slate-300 dark:border-slate-700"
        }`}
      />
      {state?.fieldError ? (
        <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
          {state.fieldError}
        </p>
      ) : null}
      {state?.formError ? (
        <p className="mt-2 text-sm text-rose-700 dark:text-rose-400">
          {state.formError}
        </p>
      ) : null}
      <div className="mt-3 flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Sending..." : "Send reply"}
        </button>
      </div>
    </form>
  );
}
