"use client";

import { UserButton } from "@clerk/nextjs";
import {
  ArrowRight,
  BadgeIndianRupee,
  Building2,
  CalendarDays,
  ChevronDown,
  Inbox,
  Layers,
  LifeBuoy,
  ListChecks,
  Menu,
  Receipt,
  Search,
  Send,
  ShieldCheck,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type MenuLink = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

type MenuColumn = {
  heading: string;
  links: MenuLink[];
};

type MegaMenu = {
  id: string;
  label: string;
  columns: MenuColumn[];
  feature: {
    eyebrow: string;
    title: string;
    body: string;
    href: string;
    cta: string;
  };
};

const MENUS: MegaMenu[] = [
  {
    id: "planners",
    label: "For planners",
    columns: [
      {
        heading: "Plan an event",
        links: [
          {
            href: "/venues",
            label: "Browse venues",
            description: "Filter by city, capacity, type and amenities",
            icon: Search,
          },
          {
            href: "/#how-it-works",
            label: "Send an RFP",
            description: "One brief, up to 20 venues at once",
            icon: Send,
          },
          {
            href: "/#how-it-works",
            label: "Compare quotes",
            description: "Line-item pricing, ranked side by side",
            icon: ListChecks,
          },
        ],
      },
      {
        heading: "Book & settle",
        links: [
          {
            href: "/#features",
            label: "Hold your dates",
            description: "15-minute lock while you check out",
            icon: CalendarDays,
          },
          {
            href: "/#features",
            label: "Pay securely",
            description: "20% advance by UPI, card or netbanking",
            icon: BadgeIndianRupee,
          },
          {
            href: "/#features",
            label: "GST invoices",
            description: "Downloadable PDF on every booking",
            icon: Receipt,
          },
        ],
      },
    ],
    feature: {
      eyebrow: "Free for planners",
      title: "Quotes from every venue, in one place",
      body: "Stop chasing eight inboxes. Send one brief and let comparable quotes come back to you.",
      href: "/venues",
      cta: "Start browsing",
    },
  },
  {
    id: "venues",
    label: "For venues",
    columns: [
      {
        heading: "Grow bookings",
        links: [
          {
            href: "/sign-up",
            label: "List your venue",
            description: "Free to list, no monthly fee",
            icon: Building2,
          },
          {
            href: "/#for-venues",
            label: "RFP inbox",
            description: "Qualified briefs, not cold leads",
            icon: Inbox,
          },
          {
            href: "/#for-venues",
            label: "Add your spaces",
            description: "Every hall with its own capacity",
            icon: Layers,
          },
        ],
      },
      {
        heading: "Operate & get paid",
        links: [
          {
            href: "/#for-venues",
            label: "Availability calendar",
            description: "Holds and confirmed dates at a glance",
            icon: CalendarDays,
          },
          {
            href: "/#pricing",
            label: "Payouts & commission",
            description: "10% on completed bookings only",
            icon: Wallet,
          },
          {
            href: "/#trust",
            label: "How we protect you",
            description: "No double-bookings, ever",
            icon: ShieldCheck,
          },
        ],
      },
    ],
    feature: {
      eyebrow: "Pay only on results",
      title: "Fill your calendar without chasing enquiries",
      body: "You set the price on every quote. We take commission only when an event actually happens.",
      href: "/sign-up",
      cta: "List your venue",
    },
  },
];

const SPACE_TYPES = [
  { href: "/venues?type=convention_centre", label: "Convention centres" },
  { href: "/venues?type=auditorium", label: "Auditoriums" },
  { href: "/venues?type=exhibition_hall", label: "Exhibition halls" },
  { href: "/venues?type=hotel_ballroom", label: "Hotel ballrooms" },
  { href: "/venues?type=standalone_hall", label: "Standalone halls" },
  { href: "/venues", label: "See all venues" },
];

const SIMPLE_LINKS = [
  { href: "/#pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
];

export function SiteNav({ signedIn }: { signedIn: boolean }) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Escape closes whatever is open; clicking outside closes the mega menu.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpenMenu(null);
        setDrawerOpen(false);
      }
    }
    function onClick(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  // Small close delay so the pointer can travel from trigger to panel.
  function scheduleClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenMenu(null), 120);
  }
  function cancelClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-md">
      <div
        ref={navRef}
        className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8"
        onMouseLeave={scheduleClose}
      >
        <div className="flex h-16 items-center gap-2">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-base font-bold text-white">
              M
            </span>
            <span className="font-display text-lg font-bold tracking-tight text-slate-900">
              MICEHub
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="ml-6 hidden items-center gap-0.5 lg:flex">
            {MENUS.map((menu) => {
              const isOpen = openMenu === menu.id;
              return (
                <div key={menu.id} onMouseEnter={cancelClose}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-haspopup="true"
                    onClick={() => setOpenMenu(isOpen ? null : menu.id)}
                    onMouseEnter={() => {
                      cancelClose();
                      setOpenMenu(menu.id);
                    }}
                    className={`flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition ${
                      isOpen
                        ? "bg-slate-100 text-slate-900"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    {menu.label}
                    <ChevronDown
                      className={`h-4 w-4 transition ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                </div>
              );
            })}

            <VenuesTrigger
              open={openMenu === "spaces"}
              onOpen={() => {
                cancelClose();
                setOpenMenu("spaces");
              }}
              onToggle={() =>
                setOpenMenu(openMenu === "spaces" ? null : "spaces")
              }
            />

            {SIMPLE_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onMouseEnter={() => setOpenMenu(null)}
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {signedIn ? (
              <>
                <Link
                  href="/post-auth"
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
                >
                  Dashboard
                </Link>
                <UserButton />
              </>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="hidden rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 sm:inline-block"
                >
                  Sign in
                </Link>
                <Link
                  href="/sign-up"
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
                >
                  Get started
                </Link>
              </>
            )}

            <button
              type="button"
              onClick={() => setDrawerOpen((v) => !v)}
              aria-label={drawerOpen ? "Close menu" : "Open menu"}
              aria-expanded={drawerOpen}
              className="rounded-md p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden"
            >
              {drawerOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mega-menu panels */}
        {MENUS.map((menu) =>
          openMenu === menu.id ? (
            <MegaPanel
              key={menu.id}
              menu={menu}
              onNavigate={() => setOpenMenu(null)}
            />
          ) : null,
        )}
        {openMenu === "spaces" ? (
          <SpacesPanel onNavigate={() => setOpenMenu(null)} />
        ) : null}
      </div>

      {drawerOpen ? (
        <MobileDrawer onClose={() => setDrawerOpen(false)} />
      ) : null}
    </header>
  );
}

function VenuesTrigger({
  open,
  onOpen,
  onToggle,
}: {
  open: boolean;
  onOpen: () => void;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-haspopup="true"
      onClick={onToggle}
      onMouseEnter={onOpen}
      className={`flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition ${
        open
          ? "bg-slate-100 text-slate-900"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      Venues
      <ChevronDown
        className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`}
      />
    </button>
  );
}

function MegaPanel({
  menu,
  onNavigate,
}: {
  menu: MegaMenu;
  onNavigate: () => void;
}) {
  return (
    <div className="absolute inset-x-0 top-16 hidden lg:block">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl ring-1 ring-slate-900/5">
          <div className="grid grid-cols-12">
            {menu.columns.map((col) => (
              <div key={col.heading} className="col-span-4 p-6">
                <p className="mb-4 text-[11px] font-semibold tracking-[0.14em] text-slate-500 uppercase">
                  {col.heading}
                </p>
                <ul className="space-y-1">
                  {col.links.map((link) => {
                    const Icon = link.icon;
                    return (
                      <li key={link.label}>
                        <Link
                          href={link.href}
                          onClick={onNavigate}
                          className="group flex gap-3 rounded-lg p-3 transition hover:bg-slate-50"
                        >
                          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-100">
                            <Icon className="h-4.5 w-4.5" />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold text-slate-900">
                              {link.label}
                            </span>
                            <span className="mt-0.5 block text-xs text-slate-500">
                              {link.description}
                            </span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}

            <div className="col-span-4 border-l border-slate-200 bg-slate-50 p-6">
              <p className="text-[11px] font-semibold tracking-[0.14em] text-indigo-600 uppercase">
                {menu.feature.eyebrow}
              </p>
              <p className="font-display mt-3 text-lg font-bold text-slate-900">
                {menu.feature.title}
              </p>
              <p className="mt-2 text-sm text-slate-600">{menu.feature.body}</p>
              <Link
                href={menu.feature.href}
                onClick={onNavigate}
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 transition hover:gap-2.5"
              >
                {menu.feature.cta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SpacesPanel({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="absolute inset-x-0 top-16 hidden lg:block">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-xl ring-1 ring-slate-900/5">
          <p className="mb-4 text-[11px] font-semibold tracking-[0.14em] text-slate-500 uppercase">
            Browse by space type
          </p>
          <ul className="grid grid-cols-3 gap-1">
            {SPACE_TYPES.map((t) => (
              <li key={t.href}>
                <Link
                  href={t.href}
                  onClick={onNavigate}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-indigo-600"
                >
                  {t.label}
                  <ArrowRight className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function MobileDrawer({ onClose }: { onClose: () => void }) {
  return (
    <div className="max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-slate-200 bg-white px-4 py-4 lg:hidden">
      {MENUS.map((menu) => (
        <details key={menu.id} className="group border-b border-slate-100 py-1">
          <summary className="flex cursor-pointer list-none items-center justify-between px-2 py-3 text-sm font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
            {menu.label}
            <ChevronDown className="h-4 w-4 text-slate-400 transition group-open:rotate-180" />
          </summary>
          <div className="pb-2">
            {menu.columns
              .flatMap((col) => col.links)
              .map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.label + link.href}
                    href={link.href}
                    onClick={onClose}
                    className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm text-slate-600 transition hover:bg-slate-50"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-indigo-600" />
                    {link.label}
                  </Link>
                );
              })}
          </div>
        </details>
      ))}

      <details className="group border-b border-slate-100 py-1">
        <summary className="flex cursor-pointer list-none items-center justify-between px-2 py-3 text-sm font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
          Venues
          <ChevronDown className="h-4 w-4 text-slate-400 transition group-open:rotate-180" />
        </summary>
        <div className="pb-2">
          {SPACE_TYPES.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              onClick={onClose}
              className="block rounded-lg px-2 py-2.5 text-sm text-slate-600 transition hover:bg-slate-50"
            >
              {t.label}
            </Link>
          ))}
        </div>
      </details>

      {[...SIMPLE_LINKS, { href: "/support", label: "Help & support" }].map(
        (l) => (
          <Link
            key={l.href}
            href={l.href}
            onClick={onClose}
            className="flex items-center gap-3 border-b border-slate-100 px-2 py-3.5 text-sm font-semibold text-slate-900"
          >
            {l.label === "Help & support" ? (
              <LifeBuoy className="h-4 w-4 text-indigo-600" />
            ) : null}
            {l.label}
          </Link>
        ),
      )}
    </div>
  );
}
