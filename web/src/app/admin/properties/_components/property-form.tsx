"use client";

import {
  AMENITY_OPTIONS,
  AMENITY_LABELS,
  OWNERSHIP_OPTIONS,
  OWNERSHIP_LABELS,
  VENUE_TYPE_OPTIONS,
  VENUE_TYPE_LABELS,
} from "@/lib/venue-meta";
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

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field
          label="City"
          name="city"
          placeholder="Mumbai"
          error={state?.fieldErrors?.city?.[0]}
        />
        <SelectField
          label="Venue type"
          name="venueType"
          options={VENUE_TYPE_OPTIONS.map((v) => ({
            value: v,
            label: VENUE_TYPE_LABELS[v],
          }))}
          error={state?.fieldErrors?.venueType?.[0]}
        />
      </div>

      <Field
        label="Full address (optional)"
        name="address"
        placeholder="Bandstand, Bandra West, Mumbai 400050"
        error={state?.fieldErrors?.address?.[0]}
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field
          label="Capacity"
          name="capacity"
          type="number"
          min={1}
          placeholder="500"
          error={state?.fieldErrors?.capacity?.[0]}
        />
        <SelectField
          label="Ownership"
          name="ownership"
          options={OWNERSHIP_OPTIONS.map((v) => ({
            value: v,
            label: OWNERSHIP_LABELS[v],
          }))}
          error={state?.fieldErrors?.ownership?.[0]}
        />
      </div>

      <fieldset>
        <legend className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Amenities
        </legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {AMENITY_OPTIONS.map((a) => (
            <label
              key={a}
              className="flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 has-[:checked]:border-indigo-400 has-[:checked]:bg-indigo-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:has-[:checked]:border-indigo-600 dark:has-[:checked]:bg-indigo-950/40"
            >
              <input
                type="checkbox"
                name="amenities"
                value={a}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              {AMENITY_LABELS[a]}
            </label>
          ))}
        </div>
      </fieldset>

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
    "block w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:bg-slate-900 dark:text-slate-100";
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

function SelectField({
  label,
  name,
  options,
  error,
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  error?: string;
}) {
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
      <select
        id={name}
        name={name}
        defaultValue=""
        className={`block w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:bg-slate-900 dark:text-slate-100 ${borderClasses}`}
      >
        <option value="" disabled>
          Select…
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error ? (
        <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{error}</p>
      ) : null}
    </div>
  );
}
