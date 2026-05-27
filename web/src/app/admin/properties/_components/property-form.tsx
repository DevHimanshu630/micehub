"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createProperty, type CreatePropertyState } from "../actions";

export function PropertyForm() {
  const [state, formAction, isPending] = useActionState<
    CreatePropertyState,
    FormData
  >(createProperty, null);

  return (
    <form action={formAction} className="space-y-5">
      <Field
        label="Property name"
        name="name"
        placeholder="Taj Lands End"
        error={state?.fieldErrors?.name?.[0]}
      />
      <Field
        label="City"
        name="city"
        placeholder="Mumbai"
        error={state?.fieldErrors?.city?.[0]}
      />
      <Field
        label="Capacity"
        name="capacity"
        type="number"
        min={1}
        placeholder="500"
        error={state?.fieldErrors?.capacity?.[0]}
      />
      <Field
        label="Description (optional)"
        name="description"
        as="textarea"
        rows={4}
        placeholder="Premium 5-star venue with banquet halls and conference rooms..."
        error={state?.fieldErrors?.description?.[0]}
      />

      {state?.formError ? (
        <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">
          {state.formError}
        </p>
      ) : null}

      <div className="flex items-center justify-end gap-3 pt-2">
        <Link
          href="/admin/properties"
          className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Saving..." : "Save property"}
        </button>
      </div>
    </form>
  );
}

type FieldProps = {
  label: string;
  name: string;
  error?: string;
  placeholder?: string;
  type?: string;
  min?: number;
  rows?: number;
  as?: "input" | "textarea";
};

function Field({
  label,
  name,
  error,
  placeholder,
  type = "text",
  min,
  rows,
  as = "input",
}: FieldProps) {
  const baseClasses =
    "block w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-900 dark:text-slate-100";
  const borderClasses = error
    ? "border-rose-400 focus:ring-rose-500"
    : "border-slate-300 dark:border-slate-700";

  return (
    <div>
      <label
        htmlFor={name}
        className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
      >
        {label}
      </label>
      {as === "textarea" ? (
        <textarea
          id={name}
          name={name}
          rows={rows}
          placeholder={placeholder}
          className={`${baseClasses} ${borderClasses}`}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          min={min}
          placeholder={placeholder}
          className={`${baseClasses} ${borderClasses}`}
        />
      )}
      {error ? (
        <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{error}</p>
      ) : null}
    </div>
  );
}
