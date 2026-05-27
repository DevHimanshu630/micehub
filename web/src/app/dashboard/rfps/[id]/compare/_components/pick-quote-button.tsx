"use client";

import { useActionState } from "react";
import { createBooking, type CreateBookingState } from "@/app/booking/actions";

export function PickQuoteButton({ quoteId }: { quoteId: string }) {
  const [state, formAction, isPending] = useActionState<
    CreateBookingState,
    FormData
  >(async () => createBooking(quoteId), null);

  return (
    <form action={formAction}>
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Holding slot..." : "Pick this quote"}
      </button>
      {state?.formError ? (
        <p className="mt-2 text-xs text-rose-600 dark:text-rose-400">
          {state.formError}
        </p>
      ) : null}
    </form>
  );
}
