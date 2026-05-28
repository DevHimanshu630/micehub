import { Badge, Card, EmptyState } from "@/app/_components/ui";
import { db } from "@/db";
import { properties, spaces } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import {
  amenityLabel,
  ownershipLabel,
  spaceOfferingLabel,
  venueTypeLabel,
} from "@/lib/venue-meta";
import { and, asc, eq } from "drizzle-orm";
import { DoorOpen, MapPin } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const STATUS_LABELS = {
  pending_approval: "Pending approval",
  approved: "Approved",
  rejected: "Rejected",
} as const;

const STATUS_TONES = {
  pending_approval: "amber",
  approved: "emerald",
  rejected: "rose",
} as const;

export default async function VenuePropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("venue");
  const { id } = await params;
  if (!UUID_REGEX.test(id)) notFound();

  const [property] = await db
    .select()
    .from(properties)
    .where(and(eq(properties.id, id), eq(properties.ownerId, user.id)))
    .limit(1);

  if (!property) notFound();

  const propertySpaces = await db
    .select()
    .from(spaces)
    .where(eq(spaces.propertyId, property.id))
    .orderBy(asc(spaces.createdAt));

  const amenities = property.amenities ?? [];

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4">
        <Link
          href="/venue/dashboard"
          className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          &larr; Back to my properties
        </Link>
      </div>

      <Card className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                {property.name}
              </h1>
              <Badge tone={STATUS_TONES[property.status]}>
                {STATUS_LABELS[property.status]}
              </Badge>
            </div>
            <p className="mt-1 flex items-center gap-1 text-slate-600 dark:text-slate-400">
              <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
              {property.address
                ? `${property.address}, ${property.city}`
                : property.city}
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {property.capacity.toLocaleString("en-IN")} pax headline capacity
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Badge tone="slate">{venueTypeLabel(property.venueType)}</Badge>
          <Badge tone="slate">{ownershipLabel(property.ownership)}</Badge>
        </div>

        {amenities.length > 0 ? (
          <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Amenities
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {amenities.map((a) => (
                <span
                  key={a}
                  className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"
                >
                  {amenityLabel(a)}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {property.description ? (
          <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
            <p className="text-sm whitespace-pre-line text-slate-700 dark:text-slate-300">
              {property.description}
            </p>
          </div>
        ) : null}

        {property.status === "pending_approval" ? (
          <div className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            This property is awaiting admin review. It won&apos;t appear on the
            public listing until approved.
          </div>
        ) : null}
        {property.status === "rejected" ? (
          <div className="mt-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:bg-rose-950 dark:text-rose-300">
            This property was rejected. Please contact support if you believe
            this was a mistake.
          </div>
        ) : null}
      </Card>

      <Card
        title="Spaces"
        action={
          <Link
            href={`/venue/properties/${property.id}/spaces/new`}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            + Add space
          </Link>
        }
      >
        {propertySpaces.length === 0 ? (
          <EmptyState
            icon={DoorOpen}
            title="No spaces yet"
            description="Add halls and rooms to make this venue bookable."
          />
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {propertySpaces.map((s) => {
              const offerings = s.offerings ?? [];
              return (
                <li
                  key={s.id}
                  className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {s.name}
                    </p>
                    {s.description ? (
                      <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
                        {s.description}
                      </p>
                    ) : null}
                    {offerings.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {offerings.map((o) => (
                          <span
                            key={o}
                            className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          >
                            {spaceOfferingLabel(o)}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <span className="shrink-0 self-start rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {s.capacity.toLocaleString("en-IN")} pax
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
