import Image from "next/image";
import Link from "next/link";

/**
 * Marketing footer. Every link here points at a route that actually exists —
 * add Terms/Privacy/About pages before launch and wire them into COLUMNS.
 */
const COLUMNS: Array<{
  heading: string;
  links: Array<{ href: string; label: string; external?: boolean }>;
}> = [
  {
    heading: "For planners",
    links: [
      { href: "/venues", label: "Browse venues" },
      { href: "/venues?type=convention_centre", label: "Convention centres" },
      { href: "/venues?type=hotel_ballroom", label: "Hotel ballrooms" },
      { href: "/#how-it-works", label: "How it works" },
    ],
  },
  {
    heading: "For venues",
    links: [
      { href: "/sign-up", label: "List your venue" },
      { href: "/#for-venues", label: "Why MICEHub" },
      { href: "/#pricing", label: "Commission" },
      { href: "/sign-in", label: "Venue sign in" },
    ],
  },
  {
    heading: "Support",
    links: [
      { href: "/support", label: "Help & support" },
      { href: "/#faq", label: "FAQ" },
      {
        href: "mailto:support@micehub.in",
        label: "support@micehub.in",
        external: true,
      },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:gap-12">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5">
              {/* Home-page footer. See site-nav.tsx for why mix-blend-multiply. */}
              <Image
                src="/images.png"
                alt="MICEHub"
                width={232}
                height={217}
                className="h-10 w-auto mix-blend-multiply"
              />
              <span className="font-display text-lg font-bold tracking-tight text-slate-900">
                MICEHub
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-slate-600 dark:text-slate-400">
              India&apos;s booking platform for meetings, incentives,
              conferences and exhibitions. One RFP, every venue, one confirmed
              booking.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <h3 className="text-xs font-semibold tracking-wider text-slate-900 uppercase dark:text-slate-100">
                {col.heading}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    {link.external ? (
                      <a
                        href={link.href}
                        className="text-sm text-slate-600 transition hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-slate-600 transition hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-slate-200 pt-8 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} MICEHub. All rights reserved.
          </p>
          <p className="text-xs text-slate-500">
            Payments processed by Razorpay · GST-compliant invoicing · Made in
            India
          </p>
        </div>
      </div>
    </footer>
  );
}
