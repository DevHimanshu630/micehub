"use client";

import { UserButton } from "@clerk/nextjs";
import {
  Building2,
  CalendarDays,
  CheckSquare,
  FileText,
  Inbox,
  LayoutDashboard,
  LifeBuoy,
  Menu,
  Search,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type Role = "planner" | "venue" | "admin";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  planner: [
    { href: "/dashboard", label: "My RFPs", icon: FileText },
    { href: "/venues", label: "Browse venues", icon: Search },
    { href: "/support", label: "Help & support", icon: LifeBuoy },
  ],
  venue: [
    { href: "/venue/dashboard", label: "My properties", icon: Building2 },
    { href: "/venue/rfps", label: "RFP inbox", icon: Inbox },
    { href: "/venue/calendar", label: "Calendar", icon: CalendarDays },
    { href: "/venue/payouts", label: "Payouts", icon: Wallet },
    { href: "/support", label: "Help & support", icon: LifeBuoy },
  ],
  admin: [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/bookings", label: "Bookings", icon: CheckSquare },
    { href: "/admin/properties", label: "Properties", icon: Building2 },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/payouts", label: "Payouts", icon: Wallet },
    { href: "/admin/support", label: "Support", icon: LifeBuoy },
  ],
};

const ROLE_META: Record<
  Role,
  { label: string; badgeClass: string; dotClass: string }
> = {
  planner: {
    label: "Planner",
    badgeClass:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
    dotClass: "bg-indigo-500",
  },
  venue: {
    label: "Venue",
    badgeClass:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    dotClass: "bg-emerald-500",
  },
  admin: {
    label: "Admin",
    badgeClass: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
    dotClass: "bg-rose-500",
  },
};

export function AppShell({
  role,
  email,
  children,
}: {
  role: Role;
  email: string;
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  const items = NAV_BY_ROLE[role];
  const roleMeta = ROLE_META[role];

  function isActive(href: string) {
    if (pathname === href) return true;
    return pathname.startsWith(href + "/");
  }

  const activeItem = items.find((it) => isActive(it.href));

  return (
    <div className="flex min-h-screen flex-1 bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white md:flex dark:border-slate-800 dark:bg-slate-900">
        <SidebarContents
          role={role}
          email={email}
          items={items}
          isActive={isActive}
          roleMeta={roleMeta}
        />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
          />
          <aside className="relative z-10 flex h-full w-72 flex-col border-r border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="absolute top-3 right-3 rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContents
              role={role}
              email={email}
              items={items}
              isActive={isActive}
              roleMeta={roleMeta}
              onNavigate={() => setDrawerOpen(false)}
            />
          </aside>
        </div>
      ) : null}

      {/* Right column: topbar + main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/80 px-4 backdrop-blur md:px-6 dark:border-slate-800 dark:bg-slate-900/80">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="rounded-md p-2 text-slate-600 hover:bg-slate-100 md:hidden dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="md:hidden">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600 text-xs font-bold text-white">
                M
              </div>
              <span className="text-sm font-semibold">MICEHub</span>
            </Link>
          </div>
          <div className="hidden flex-1 items-center gap-2 md:flex">
            <span
              className={`inline-block h-2 w-2 rounded-full ${roleMeta.dotClass}`}
            />
            <h1 className="truncate text-sm font-medium text-slate-700 dark:text-slate-300">
              {activeItem?.label ?? "MICEHub"}
            </h1>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <UserButton />
          </div>
        </header>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

function SidebarContents({
  role,
  email,
  items,
  isActive,
  roleMeta,
  onNavigate,
}: {
  role: Role;
  email: string;
  items: NavItem[];
  isActive: (href: string) => boolean;
  roleMeta: (typeof ROLE_META)[Role];
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-4 dark:border-slate-800">
        <Link href="/" className="flex items-center gap-2" onClick={onNavigate}>
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-600 text-sm font-bold text-white">
            M
          </div>
          <span className="text-base font-semibold">MICEHub</span>
        </Link>
        <span
          className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${roleMeta.badgeClass}`}
        >
          {roleMeta.label}
        </span>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 ${active ? "" : "opacity-70"}`}
              />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 px-3 py-3 dark:border-slate-800">
        <div className="flex items-center gap-3 rounded-md px-2 py-2">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${roleMeta.dotClass}`}
          >
            {email[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-slate-700 dark:text-slate-200">
              {email}
            </p>
            <p className="text-[11px] text-slate-500 capitalize">
              {role} account
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
