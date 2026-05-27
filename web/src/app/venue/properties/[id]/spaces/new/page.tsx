import { db } from "@/db";
import { properties } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { and, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SpaceForm } from "./_components/space-form";

export const dynamic = "force-dynamic";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function NewSpacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("venue");
  const { id } = await params;
  if (!UUID_REGEX.test(id)) notFound();

  const [property] = await db
    .select({ id: properties.id, name: properties.name })
    .from(properties)
    .where(and(eq(properties.id, id), eq(properties.ownerId, user.id)))
    .limit(1);

  if (!property) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Link
          href={`/venue/properties/${property.id}`}
          className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          &larr; Back to {property.name}
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Add a space</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Add a hall or room that can be booked inside {property.name}.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <SpaceForm propertyId={property.id} />
      </div>
    </div>
  );
}
