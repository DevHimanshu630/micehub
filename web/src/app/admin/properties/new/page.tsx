import Link from "next/link";
import { PropertyForm } from "../_components/property-form";

export default function NewPropertyPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Link
          href="/admin/properties"
          className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          &larr; Back to properties
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">
          Add a new property
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Enter the venue details below. You can edit them later.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <PropertyForm />
      </div>
    </div>
  );
}
