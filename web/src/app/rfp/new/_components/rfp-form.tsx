"use client";

import { EVENT_TYPE_LABELS, EVENT_TYPE_OPTIONS } from "@/lib/schemas";
import Link from "next/link";
import { useActionState } from "react";
import { createRfp, type CreateRfpState } from "../../actions";

export function RfpForm({
  selectedVenues,
}: {
  selectedVenues: Array<{ id: string; name: string; city: string }>;
}) {
  const [state, formAction, isPending] = useActionState<
    CreateRfpState,
    FormData
  >(createRfp, null);

  const venueIdsCsv = selectedVenues.map((v) => v.id).join(",");
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="venueIds" value={venueIdsCsv} />

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
        <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
          Sending to {selectedVenues.length}{" "}
          {selectedVenues.length === 1 ? "venue" : "venues"}
        </p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {selectedVenues.map((v) => (
            <li
              key={v.id}
              className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              {v.name} <span className="text-slate-400">·</span> {v.city}
            </li>
          ))}
        </ul>
        {state?.fieldErrors?.venueIds?.[0] ? (
          <p className="mt-2 text-xs text-rose-600 dark:text-rose-400">
            {state.fieldErrors.venueIds[0]}
          </p>
        ) : null}
      </div>

      <Select
        label="Event type"
        name="eventType"
        options={EVENT_TYPE_OPTIONS.map((v) => ({
          value: v,
          label: EVENT_TYPE_LABELS[v],
        }))}
        error={state?.fieldErrors?.eventType?.[0]}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="Start date"
          name="startDate"
          type="date"
          min={today}
          error={state?.fieldErrors?.startDate?.[0]}
        />
        <Field
          label="End date"
          name="endDate"
          type="date"
          min={today}
          error={state?.fieldErrors?.endDate?.[0]}
        />
      </div>

      <Field
        label="Expected guest count"
        name="guestCount"
        type="number"
        min={1}
        placeholder="500"
        error={state?.fieldErrors?.guestCount?.[0]}
      />

      <Field
        label="F&B requirements (optional)"
        name="fbNotes"
        as="textarea"
        rows={2}
        placeholder="Two-course buffet lunch, vegetarian options, Jain meals available..."
        error={state?.fieldErrors?.fbNotes?.[0]}
      />

      <Field
        label="A/V requirements (optional)"
        name="avNotes"
        as="textarea"
        rows={2}
        placeholder="Stage with backdrop, 4 wireless mics, projector + 12ft screen..."
        error={state?.fieldErrors?.avNotes?.[0]}
      />

      <Field
        label="Other notes (optional)"
        name="otherNotes"
        as="textarea"
        rows={3}
        placeholder="200 attendees need overnight rooms, networking dinner on Day 1..."
        error={state?.fieldErrors?.otherNotes?.[0]}
      />

      {state?.formError ? (
        <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">
          {state.formError}
        </p>
      ) : null}

      <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
        <Link
          href="/venues"
          className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending
            ? "Sending..."
            : `Send RFP to ${selectedVenues.length} ${selectedVenues.length === 1 ? "venue" : "venues"}`}
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
  min?: number | string;
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

function Select({
  label,
  name,
  options,
  error,
}: {
  label: string;
  name: string;
  options: Array<{ value: string; label: string }>;
  error?: string;
}) {
  const baseClasses =
    "block w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:bg-slate-900 dark:text-slate-100";
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
        className={`${baseClasses} ${borderClasses}`}
      >
        <option value="" disabled>
          Select…
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error ? (
        <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{error}</p>
      ) : null}
    </div>
  );
}
