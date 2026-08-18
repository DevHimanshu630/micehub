import { db } from "@/db";
import { properties, spaces } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { count, eq, sql } from "drizzle-orm";
import {
  ArrowRight,
  BadgeIndianRupee,
  Building2,
  CalendarCheck,
  Check,
  ChevronDown,
  FileText,
  Inbox,
  Layers,
  ListChecks,
  Lock,
  Receipt,
  Search,
  Send,
  ShieldCheck,
  Timer,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  DELHI_VENUES,
  HERO_CAPTION,
  MARKETING_IMAGES,
  SPACE_TYPE_TILES,
} from "./_components/marketing/images";
import { SiteFooter } from "./_components/marketing/site-footer";
import { SiteNav } from "./_components/marketing/site-nav";

export const dynamic = "force-dynamic";

/**
 * Live marketplace counts for the stats band. The landing page is the most
 * public surface we have, so a DB hiccup must not 500 it — on failure we
 * return null and the band simply doesn't render.
 */
async function getMarketplaceStats() {
  try {
    const [[venueRow], [cityRow], [spaceRow]] = await Promise.all([
      db
        .select({ total: count() })
        .from(properties)
        .where(eq(properties.status, "approved")),
      db
        .select({ total: sql<string>`count(distinct ${properties.city})` })
        .from(properties)
        .where(eq(properties.status, "approved")),
      db
        .select({ total: count() })
        .from(spaces)
        .innerJoin(properties, eq(properties.id, spaces.propertyId))
        .where(eq(properties.status, "approved")),
    ]);

    return {
      venues: venueRow?.total ?? 0,
      cities: Number(cityRow?.total ?? 0),
      spaces: spaceRow?.total ?? 0,
    };
  } catch {
    return null;
  }
}

export default async function Home() {
  const [{ userId }, stats] = await Promise.all([
    auth(),
    getMarketplaceStats(),
  ]);
  const signedIn = Boolean(userId);

  return (
    <div className="flex flex-1 flex-col bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <SiteNav signedIn={signedIn} />
      <main className="flex-1">
        <Hero signedIn={signedIn} />
        {stats && stats.venues > 0 ? <StatsBand stats={stats} /> : null}
        <HowItWorks />
        <Lifecycle />
        <Roles />
        <Features />
        <LandmarkVenues />
        <SpaceTypes />
        <ForVenues />
        <TrustBand />
        <Pricing signedIn={signedIn} />
        <Faq />
        <FinalCta signedIn={signedIn} />
      </main>
      <SiteFooter />
    </div>
  );
}

/* ------------------------------------------------------------------ shared */

function Section({
  id,
  children,
  className = "",
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`scroll-mt-16 ${className}`}>
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        {children}
      </div>
    </section>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
}: {
  eyebrow: string;
  title: React.ReactNode;
  description?: string;
  align?: "center" | "left";
}) {
  const alignment =
    align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-2xl";
  return (
    <div className={alignment}>
      <p className="text-xs font-semibold tracking-[0.18em] text-indigo-600 uppercase dark:text-indigo-400">
        {eyebrow}
      </p>
      <h2 className="font-display mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-[2.75rem] lg:leading-[1.12]">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-base text-pretty text-slate-600 sm:text-lg dark:text-slate-400">
          {description}
        </p>
      ) : null}
    </div>
  );
}

const ACTOR_STYLES = {
  planner:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
  venue:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  platform: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
} as const;

function ActorBadge({
  actor,
  children,
}: {
  actor: keyof typeof ACTOR_STYLES;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${ACTOR_STYLES[actor]}`}
    >
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------- hero */

function Hero({ signedIn }: { signedIn: boolean }) {
  return (
    <section className="relative isolate overflow-hidden border-b border-slate-200 dark:border-slate-800">
      {/* Soft brand glow behind the hero. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60rem_40rem_at_75%_-10%,var(--color-indigo-100),transparent_65%)] dark:bg-[radial-gradient(60rem_40rem_at_75%_-10%,var(--color-indigo-950),transparent_65%)]"
      />
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-300">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
              India&apos;s MICE booking platform
            </span>

            <h1 className="font-display mt-6 text-[2.75rem] leading-[1.08] font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl">
              One RFP. Every venue.{" "}
              <span className="text-indigo-600 dark:text-indigo-400">
                One confirmed booking.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg text-pretty text-slate-600 dark:text-slate-400">
              MICEHub connects event planners with conference halls, banquet
              spaces and convention centres across India. Send a single request,
              compare real line-item quotes side by side, and lock your dates
              with a secure advance — all in one place.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/venues"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-indigo-500"
              >
                Browse venues
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={signedIn ? "/post-auth" : "/sign-up"}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-6 py-3 text-base font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {signedIn ? "Go to dashboard" : "List your venue"}
              </Link>
            </div>

            <ul className="mt-10 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              {[
                "Double-booking blocked by the database",
                "GST invoice on every booking",
                "UPI, card & netbanking via Razorpay",
                "Free for planners — always",
              ].map((point) => (
                <li
                  key={point}
                  className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <HeroVisual />
        </div>
      </div>
    </section>
  );
}

function HeroVisual() {
  return (
    <div className="relative">
      <div className="relative aspect-4/3 overflow-hidden rounded-2xl border border-slate-200 shadow-2xl">
        <Image
          src={MARKETING_IMAGES.hero.src}
          alt={MARKETING_IMAGES.hero.alt}
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-linear-to-t from-slate-950/65 via-slate-950/5 to-slate-950/20"
        />

        {/* Names the building so the photo reads as a real place, not stock. */}
        <div className="absolute top-4 left-4 rounded-lg bg-white/90 px-3 py-2 shadow-lg backdrop-blur">
          <p className="text-xs font-bold text-slate-900">
            {HERO_CAPTION.venue}
          </p>
          <p className="text-[11px] text-slate-600">{HERO_CAPTION.location}</p>
        </div>

        {/* Quote-comparison proof card. */}
        <div className="absolute bottom-4 left-4 w-60 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur sm:w-64">
          <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
            3 quotes received
          </p>
          <ul className="mt-2 space-y-1.5">
            {[
              {
                name: "Seaside Convention Centre",
                amount: "₹16,75,000",
                best: true,
              },
              { name: "Grand Ballroom, Andheri", amount: "₹18,40,000" },
              { name: "Riverside Exhibition Hall", amount: "₹19,10,000" },
            ].map((q) => (
              <li
                key={q.name}
                className={`flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-[11px] ${
                  q.best ? "bg-emerald-50" : "bg-slate-50"
                }`}
              >
                <span className="truncate text-slate-700">{q.name}</span>
                <span className="shrink-0 font-semibold text-slate-900 tabular-nums">
                  {q.amount}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Hold-countdown proof card. */}
        <div className="absolute top-4 right-4 hidden w-52 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur sm:block">
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-amber-600" />
            <p className="text-xs font-semibold text-slate-900">
              Hold expires in 14:52
            </p>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            5 spaces locked · 12–13 Jun
          </p>
          <div className="mt-2.5 rounded-md bg-indigo-600 px-2.5 py-1.5 text-center text-[11px] font-semibold text-white">
            Pay ₹3,35,000 advance
          </div>
        </div>
      </div>

      {/* Confirmed pill, anchored to the frame. */}
      <div className="absolute right-4 -bottom-4 flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1.5 shadow-lg">
        <CalendarCheck className="h-4 w-4 text-emerald-600" />
        <span className="text-xs font-semibold text-slate-900">
          Booking confirmed
        </span>
      </div>

      {/* CC BY-SA attribution for the hero photograph — licence requirement. */}
      <p className="mt-7 text-[11px] text-slate-400">
        {HERO_CAPTION.stat} · {HERO_CAPTION.credit}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------- stats band */

function StatsBand({
  stats,
}: {
  stats: { venues: number; cities: number; spaces: number };
}) {
  const items = [
    { value: stats.venues, label: "Venues live on the platform" },
    {
      value: stats.cities,
      label: stats.cities === 1 ? "City covered" : "Cities covered",
    },
    { value: stats.spaces, label: "Bookable halls & spaces" },
    { value: "20", label: "Venues per RFP, in one send", suffix: "" },
  ];

  return (
    <div className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 lg:grid-cols-4 lg:px-8">
        {items.map((item) => (
          <div key={item.label} className="text-center lg:text-left">
            <p className="text-3xl font-bold tracking-tight text-slate-900 tabular-nums sm:text-4xl dark:text-slate-100">
              {typeof item.value === "number"
                ? item.value.toLocaleString("en-IN")
                : item.value}
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {item.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ how it works */

const STEPS: Array<{
  icon: LucideIcon;
  actor: keyof typeof ACTOR_STYLES;
  actorLabel: string;
  title: string;
  body: string;
}> = [
  {
    icon: Search,
    actor: "planner",
    actorLabel: "Planner",
    title: "Shortlist venues",
    body: "Filter live listings by city, capacity, venue type and amenities. Tick every venue worth a quote — no phone calls, no spreadsheets.",
  },
  {
    icon: Send,
    actor: "planner",
    actorLabel: "Planner",
    title: "Send one RFP",
    body: "Fill in your dates, guest count, F&B and A/V needs once. That single brief goes out to up to 20 shortlisted venues at the same time.",
  },
  {
    icon: Inbox,
    actor: "venue",
    actorLabel: "Venue",
    title: "Quotes come back",
    body: "Each venue builds an itemised quote in their RFP inbox. You see every quote side by side, sorted by price, with how fast they replied.",
  },
  {
    icon: Lock,
    actor: "planner",
    actorLabel: "Planner",
    title: "Pick and hold",
    body: "Choosing a quote locks those spaces for 15 minutes while you check out. The database itself refuses any overlapping booking.",
  },
  {
    icon: BadgeIndianRupee,
    actor: "platform",
    actorLabel: "MICEHub",
    title: "Pay, confirm, settle",
    body: "Pay a 20% advance by UPI, card or netbanking. The booking confirms and your GST invoice is ready. After the event, we release the venue's payout.",
  },
];

function HowItWorks() {
  return (
    <Section id="how-it-works">
      <SectionHeading
        eyebrow="How it works"
        title="From “we need a venue” to a confirmed booking — in five steps"
        description="MICEHub replaces the email chains, phone tag and spreadsheets that MICE bookings usually run on. Here is the entire journey, end to end."
      />

      <div className="relative mt-14">
        {/* Connector line running behind the icons on wide screens. */}
        <div
          aria-hidden
          className="absolute top-7 right-[10%] left-[10%] hidden border-t-2 border-dashed border-slate-200 lg:block dark:border-slate-800"
        />

        <ol className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5 lg:gap-6">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <li key={step.title} className="relative">
                <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white text-indigo-600 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-indigo-400">
                  <Icon className="h-6 w-6" />
                  <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white">
                    {i + 1}
                  </span>
                </div>
                <div className="mt-5">
                  <ActorBadge actor={step.actor}>{step.actorLabel}</ActorBadge>
                  <h3 className="mt-2.5 text-base font-semibold text-slate-900 dark:text-slate-100">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm text-pretty text-slate-600 dark:text-slate-400">
                    {step.body}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </Section>
  );
}

/* --------------------------------------------------------------- lifecycle */

const LIFECYCLE = [
  { label: "RFP sent", tone: "bg-indigo-500" },
  { label: "Quote received", tone: "bg-indigo-500" },
  { label: "Slot held · 15 min", tone: "bg-amber-500" },
  { label: "20% advance paid", tone: "bg-amber-500" },
  { label: "Booking confirmed", tone: "bg-emerald-500" },
  { label: "Event delivered", tone: "bg-emerald-500" },
  { label: "Payout released", tone: "bg-emerald-500" },
];

function Lifecycle() {
  return (
    <div className="border-y border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            One booking, one shared status
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Planner, venue and MICEHub always see the same state — no &ldquo;did
            you get my email?&rdquo;
          </p>
        </div>

        <div className="-mx-4 mt-6 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
          <ol className="flex min-w-max items-center gap-2">
            {LIFECYCLE.map((stage, i) => (
              <li key={stage.label} className="flex items-center gap-2">
                <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                  <span className={`h-2 w-2 rounded-full ${stage.tone}`} />
                  <span className="text-xs font-medium whitespace-nowrap text-slate-700 dark:text-slate-300">
                    {stage.label}
                  </span>
                </div>
                {i < LIFECYCLE.length - 1 ? (
                  <ArrowRight
                    aria-hidden
                    className="h-4 w-4 shrink-0 text-slate-400"
                  />
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- roles */

const ROLE_CARDS: Array<{
  icon: LucideIcon;
  actor: keyof typeof ACTOR_STYLES;
  title: string;
  tagline: string;
  points: string[];
  cta?: { href: string; label: string };
}> = [
  {
    icon: Users,
    actor: "planner",
    title: "Event planners",
    tagline: "Corporates, agencies and anyone booking a venue.",
    points: [
      "Browse and shortlist approved venues across India",
      "Send one RFP to as many as 20 venues at once",
      "Compare itemised quotes side by side, cheapest flagged",
      "Hold your dates and pay the advance securely",
      "Download GST invoices and track everything on a calendar",
    ],
    cta: { href: "/sign-up", label: "Start planning — free" },
  },
  {
    icon: Building2,
    actor: "venue",
    title: "Venues & hotels",
    tagline: "Convention centres, ballrooms, auditoriums and halls.",
    points: [
      "List your property and every bookable space, free",
      "Receive matching RFPs straight into your inbox",
      "Build line-item quotes in minutes and send them back",
      "See held and confirmed dates on a live calendar",
      "Track payouts with gross, commission and net per booking",
    ],
    cta: { href: "/sign-up", label: "List your venue" },
  },
  {
    icon: ShieldCheck,
    actor: "platform",
    title: "MICEHub operations",
    tagline: "Our team, keeping the marketplace honest.",
    points: [
      "Reviews and approves every venue listing before it goes live",
      "Runs support for planners and venues in one ticket inbox",
      "Marks events complete and releases venue payouts",
      "Keeps a full trail from RFP through quote, payment and payout",
    ],
    cta: { href: "/support", label: "Contact support" },
  },
];

function Roles() {
  return (
    <Section id="roles">
      <SectionHeading
        eyebrow="Who it's for"
        title="Two sides of every event, on one platform"
        description="Planners and venues each get a dedicated workspace, and our operations team sits in the middle to keep listings verified and money moving."
      />

      <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {ROLE_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-slate-900 dark:text-slate-100">
                {card.title}
              </h3>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
                {card.tagline}
              </p>
              <ul className="mt-6 flex-1 space-y-3">
                {card.points.map((point) => (
                  <li
                    key={point}
                    className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-400"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    {point}
                  </li>
                ))}
              </ul>
              {card.cta ? (
                <Link
                  href={card.cta.href}
                  className="mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 transition hover:gap-2.5 dark:text-indigo-400"
                >
                  {card.cta.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : null}
            </div>
          );
        })}
      </div>
    </Section>
  );
}

/* ---------------------------------------------------------------- features */

const FEATURES: Array<{ icon: LucideIcon; title: string; body: string }> = [
  {
    icon: Send,
    title: "Multi-venue RFPs",
    body: "One event brief reaches up to 20 venues at once. Enter your requirements a single time and let the quotes come to you.",
  },
  {
    icon: ListChecks,
    title: "Side-by-side quote comparison",
    body: "Every quote breaks down into line items — hall rental, F&B per head, A/V — ranked by total price with the lowest flagged.",
  },
  {
    icon: ShieldCheck,
    title: "Double-booking is impossible",
    body: "Overlapping dates on the same space are rejected by a Postgres exclusion constraint. It is a database guarantee, not app logic you have to trust.",
  },
  {
    icon: Timer,
    title: "15-minute soft holds",
    body: "Picking a quote locks the spaces while you pay, then releases them automatically if you don't — so inventory never sits stale.",
  },
  {
    icon: Receipt,
    title: "GST invoices on demand",
    body: "Every booking produces an 18% GST invoice (CGST 9% + SGST 9%) as a downloadable PDF, available to planner, venue and finance alike.",
  },
  {
    icon: Wallet,
    title: "Transparent payouts",
    body: "Venues see gross, commission and net for every completed event, with a bank UTR reference recorded the moment a payout is released.",
  },
];

function Features() {
  return (
    <div className="border-y border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40">
      <Section>
        <SectionHeading
          eyebrow="Built for money and dates"
          title="The details that make MICE bookings actually work"
          description="Venue booking is a money-and-inventory problem. These are the guarantees we built the platform around."
        />

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-950"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm text-pretty text-slate-600 dark:text-slate-400">
                  {f.body}
                </p>
              </div>
            );
          })}
        </div>
      </Section>
    </div>
  );
}

/* -------------------------------------------------------- landmark venues */

/**
 * Editorial showcase of Delhi NCR landmark venues. These are deliberately NOT
 * presented as bookable listings — no RFP or booking CTA appears on a card, and
 * the section copy states plainly that they are shown for reference. The photos
 * are CC BY-SA, so the credit line beneath the grid is a licence requirement,
 * not decoration — don't remove it.
 */
function LandmarkVenues() {
  return (
    <Section>
      <SectionHeading
        eyebrow="India's MICE landscape"
        title="The venues that set the scale"
        description="Delhi NCR anchors India's meetings and exhibitions calendar. These landmarks show the scale the industry works at — they're shown for reference, not as MICEHub listings."
      />

      <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {DELHI_VENUES.map((venue) => (
          <article
            key={venue.slug}
            className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="relative aspect-16/10 overflow-hidden">
              <Image
                src={venue.src}
                alt={venue.alt}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-linear-to-t from-slate-950/60 via-transparent to-transparent"
              />
              <span className="absolute top-4 left-4 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-slate-800 backdrop-blur dark:bg-slate-900/90 dark:text-slate-100">
                {venue.category}
              </span>
            </div>

            <div className="flex flex-1 flex-col p-6">
              <h3 className="font-display text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                {venue.name}
              </h3>
              <p className="mt-1 text-xs text-slate-500">{venue.location}</p>
              <p className="mt-3 flex-1 text-sm text-pretty text-slate-600 dark:text-slate-400">
                {venue.blurb}
              </p>

              <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-200 pt-4 dark:border-slate-800">
                {venue.facts.map((fact) => (
                  <div key={fact.label}>
                    <dt className="text-[11px] font-medium tracking-wide text-slate-500 uppercase">
                      {fact.label}
                    </dt>
                    <dd className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {fact.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500">
          Photos:{" "}
          {DELHI_VENUES.map((v, i) => (
            <span key={v.slug}>
              {i > 0 ? " · " : ""}
              {v.name} © {v.credit.author} ({v.credit.license})
            </span>
          ))}
        </p>
        <Link
          href="/venues?city=Delhi"
          className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-indigo-600 transition hover:gap-2.5 dark:text-indigo-400"
        >
          See venues available on MICEHub
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------- space types */

function SpaceTypes() {
  return (
    <Section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeading
          align="left"
          eyebrow="Every kind of space"
          title="Find the room your event actually needs"
          description="From 2,000-seat convention floors to a single training room. Filter by what matters, then send the RFP."
        />
        <Link
          href="/venues"
          className="hidden shrink-0 items-center gap-1.5 text-sm font-semibold text-indigo-600 transition hover:gap-2.5 sm:inline-flex dark:text-indigo-400"
        >
          See all venues
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {SPACE_TYPE_TILES.map((tile) => (
          <Link
            key={tile.type}
            href={`/venues?type=${tile.type}`}
            className="group relative aspect-16/10 overflow-hidden rounded-2xl border border-slate-200 shadow-sm transition hover:shadow-lg dark:border-slate-800"
          >
            <Image
              src={tile.src}
              alt={tile.alt}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition duration-500 group-hover:scale-105"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-linear-to-t from-slate-950/85 via-slate-950/25 to-transparent"
            />
            <div className="absolute inset-x-0 bottom-0 p-5">
              <h3 className="text-lg font-semibold text-white">{tile.label}</h3>
              <p className="mt-0.5 text-sm text-slate-200">{tile.blurb}</p>
              <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-white/90">
                Browse
                <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------- for venues */

const VENUE_BENEFITS = [
  {
    icon: Inbox,
    title: "Qualified RFPs, not cold leads",
    body: "Planners tell you the dates, headcount and requirements up front. You quote only on events you can actually host.",
  },
  {
    icon: Layers,
    title: "List every space separately",
    body: "Your ballroom, breakout rooms and lawn each get their own capacity and offerings — and their own availability.",
  },
  {
    icon: CalendarCheck,
    title: "A calendar you can trust",
    body: "Holds show amber, confirmed bookings show green, and expired holds clear themselves. No manual reconciliation.",
  },
  {
    icon: Wallet,
    title: "Paid after every event",
    body: "Once the event is marked complete, your payout is queued at the quoted amount minus commission and released with a UTR reference.",
  },
];

function ForVenues() {
  return (
    <div
      id="for-venues"
      className="scroll-mt-16 border-y border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40"
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="relative order-last aspect-4/3 overflow-hidden rounded-2xl border border-slate-200 shadow-xl lg:order-first dark:border-slate-800">
            <Image
              src={MARKETING_IMAGES.venuePitch.src}
              alt={MARKETING_IMAGES.venuePitch.alt}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>

          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-emerald-600 uppercase dark:text-emerald-400">
              For venues
            </p>
            <h2 className="font-display mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-[2.75rem] lg:leading-[1.12]">
              Fill your calendar without chasing enquiries
            </h2>
            <p className="mt-4 text-base text-pretty text-slate-600 sm:text-lg dark:text-slate-400">
              Listing is free. You keep control of pricing on every quote, and
              you only pay commission on events that actually happen.
            </p>

            <div className="mt-10 space-y-7">
              {VENUE_BENEFITS.map((b) => {
                const Icon = b.icon;
                return (
                  <div key={b.title} className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                        {b.title}
                      </h3>
                      <p className="mt-1 text-sm text-pretty text-slate-600 dark:text-slate-400">
                        {b.body}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <Link
              href="/sign-up"
              className="mt-10 inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              List your venue free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- trust band */

const TRUST_POINTS = [
  {
    icon: Lock,
    title: "Signature-verified payments",
    body: "Every Razorpay payment is confirmed by re-computing its HMAC-SHA256 signature server-side before a booking is marked paid.",
  },
  {
    icon: ShieldCheck,
    title: "Strict role separation",
    body: "Planners, venues and admins each reach only their own data. Every action re-checks your role on the server, not just in the browser.",
  },
  {
    icon: CalendarCheck,
    title: "Inventory locked at the database",
    body: "A Postgres exclusion constraint physically prevents two overlapping bookings on the same space. No race condition can get past it.",
  },
  {
    icon: FileText,
    title: "A trail on every booking",
    body: "RFP, quote, hold, payment reference, event completion and payout — each with a timestamp, visible to our operations team.",
  },
];

function TrustBand() {
  return (
    <div
      id="trust"
      className="scroll-mt-16 border-y border-indigo-100 bg-indigo-50/60"
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold tracking-[0.18em] text-indigo-600 uppercase">
            Trust &amp; safety
          </p>
          <h2 className="font-display mt-3 text-3xl font-semibold tracking-tight text-balance text-slate-900 sm:text-4xl lg:text-[2.75rem] lg:leading-[1.12]">
            Money and dates deserve more than good intentions
          </h2>
          <p className="mt-4 text-base text-pretty text-slate-600 sm:text-lg">
            A venue booking is a contract. These are the mechanisms that hold it
            together.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST_POINTS.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.title}
                className="rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-slate-900">
                  {p.title}
                </h3>
                <p className="mt-2 text-sm text-pretty text-slate-600">
                  {p.body}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- pricing */

function Pricing({ signedIn }: { signedIn: boolean }) {
  return (
    <Section id="pricing">
      <SectionHeading
        eyebrow="Pricing"
        title="Free to plan. Commission only when an event happens."
        description="No listing fees, no subscriptions, no charge per lead. We earn only when a booking completes."
      />

      <div className="mx-auto mt-14 grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <ActorBadge actor="planner">For planners</ActorBadge>
          <p className="mt-5 text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            ₹0
          </p>
          <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
            Free, forever. You pay the venue&apos;s quoted amount — nothing on
            top.
          </p>
          <ul className="mt-7 space-y-3">
            {[
              "Unlimited venue browsing and RFPs",
              "Quote comparison and booking calendar",
              "20% advance to confirm, balance settled after the event",
              "GST invoices you can download any time",
            ].map((p) => (
              <li
                key={p}
                className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-400"
              >
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                {p}
              </li>
            ))}
          </ul>
          <Link
            href={signedIn ? "/venues" : "/sign-up"}
            className="mt-8 block rounded-lg bg-indigo-600 px-5 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            {signedIn ? "Browse venues" : "Create a free account"}
          </Link>
        </div>

        <div className="relative rounded-2xl border-2 border-emerald-500 bg-white p-8 shadow-lg dark:bg-slate-900">
          <span className="absolute -top-3 right-6 rounded-full bg-emerald-500 px-3 py-0.5 text-[11px] font-semibold text-white">
            Pay only on results
          </span>
          <ActorBadge actor="venue">For venues</ActorBadge>
          <p className="mt-5 text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            10%
          </p>
          <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
            Commission on completed bookings, deducted from your payout.
          </p>
          <ul className="mt-7 space-y-3">
            {[
              "Free to list your property and all its spaces",
              "No monthly fee and no charge per enquiry",
              "You set the price on every quote you send",
              "Payout shows gross, commission and net, with a UTR",
            ].map((p) => (
              <li
                key={p}
                className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-400"
              >
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                {p}
              </li>
            ))}
          </ul>
          <Link
            href="/sign-up"
            className="mt-8 block rounded-lg bg-slate-900 px-5 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            List your venue
          </Link>
        </div>
      </div>
    </Section>
  );
}

/* --------------------------------------------------------------------- faq */

const FAQS = [
  {
    q: "What does MICEHub cost?",
    a: "Nothing for planners — browsing, RFPs, quote comparison and booking are all free, and you pay the venue exactly what they quoted. Venues list for free and pay a 10% commission on completed bookings only, deducted from their payout.",
  },
  {
    q: "How many venues can one RFP go to?",
    a: "Up to 20 at a time. You fill in the event brief once and every shortlisted venue receives the same details, so quotes are genuinely comparable.",
  },
  {
    q: "What happens when I pick a quote?",
    a: "The venue's spaces are held for you for 15 minutes while you complete payment. If you don't pay in that window, the hold expires automatically and the dates go back on the market.",
  },
  {
    q: "Can two planners book the same hall for the same dates?",
    a: "No. Overlapping date ranges on the same space are rejected by the database itself through an exclusion constraint, so a double-booking cannot be created even if two people click at the same instant.",
  },
  {
    q: "How much do I pay up front?",
    a: "A 20% advance confirms the booking. Your invoice shows the balance, which is settled with the venue after the event.",
  },
  {
    q: "Which payment methods are supported?",
    a: "Payments run through Razorpay, so UPI, credit and debit cards, netbanking and wallets all work. Card details never touch our servers.",
  },
  {
    q: "Do I get a GST invoice?",
    a: "Yes. Every booking generates an 18% GST invoice — split as CGST 9% and SGST 9% for intra-state supply — as a PDF you can download at any time from the booking page.",
  },
  {
    q: "How do venues get paid?",
    a: "Once MICEHub marks the event complete, a payout is queued for the quoted amount less the 10% commission. When it's released, the bank reference (UTR) is recorded against the booking and visible in your payouts dashboard.",
  },
  {
    q: "How do I list my venue?",
    a: "Sign up and choose the venue role, add your property along with each bookable space and its capacity, then our team reviews it. Once approved, your venue appears in browse and starts receiving RFPs.",
  },
];

function Faq() {
  return (
    <div className="border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40">
      <Section id="faq">
        <SectionHeading
          eyebrow="FAQ"
          title="Questions planners and venues ask us"
        />

        <div className="mx-auto mt-12 max-w-3xl divide-y divide-slate-200 dark:divide-slate-800">
          {FAQS.map((item) => (
            <details key={item.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-left [&::-webkit-details-marker]:hidden">
                <span className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  {item.q}
                </span>
                <ChevronDown
                  aria-hidden
                  className="mt-0.5 h-5 w-5 shrink-0 text-slate-400 transition group-open:rotate-180"
                />
              </summary>
              <p className="mt-3 pr-9 text-sm text-pretty text-slate-600 dark:text-slate-400">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </Section>
    </div>
  );
}

/* --------------------------------------------------------------- final cta */

function FinalCta({ signedIn }: { signedIn: boolean }) {
  return (
    <Section>
      <div className="relative overflow-hidden rounded-3xl bg-indigo-600 px-6 py-16 text-center sm:px-12">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(40rem_20rem_at_50%_0%,rgba(255,255,255,0.18),transparent_70%)]"
        />
        <div className="relative mx-auto max-w-2xl">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-balance text-white sm:text-4xl lg:text-[2.75rem] lg:leading-[1.12]">
            Your next event is a few clicks from booked
          </h2>
          <p className="mt-4 text-base text-pretty text-indigo-100 sm:text-lg">
            Shortlist venues today, have quotes in hand tomorrow, and confirm
            with dates that are genuinely locked.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/venues"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 text-base font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50"
            >
              Browse venues
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={signedIn ? "/post-auth" : "/sign-up"}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/40 px-6 py-3 text-base font-semibold text-white transition hover:bg-white/10"
            >
              {signedIn ? "Go to dashboard" : "Create free account"}
            </Link>
          </div>
        </div>
      </div>
    </Section>
  );
}
