import Link from "next/link";
import { VenuePropertyForm } from "./_components/venue-property-form";

export default function NewVenuePropertyPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Link
          href="/venue/dashboard"
          className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          &larr; Back to my properties
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">
          List your property
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Your property will go through a quick admin review before appearing on
          the public listing. You can add halls and rooms next.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <VenuePropertyForm />
      </div>
    </div>
  );
}
