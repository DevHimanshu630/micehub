/**
 * Single source of truth for landing-page photography.
 *
 * These currently point at the Unsplash CDN (free licence, hotlinking allowed)
 * so the page looks finished before we have our own shoots. To swap in owned
 * assets: drop files into /public/marketing/ and change the `src` values here —
 * nothing else in the codebase references these URLs. If every src becomes a
 * local path, also drop `images.remotePatterns` from next.config.ts.
 *
 * `alt` text is meaningful (not decorative) because these images carry part of
 * the page's meaning for screen-reader and slow-connection users.
 */

export type MarketingImage = {
  src: string;
  alt: string;
};

const unsplash = (id: string) => `https://images.unsplash.com/${id}`;

export const MARKETING_IMAGES = {
  /**
   * Yashobhoomi (IICC Dwarka) — a real Delhi landmark, self-hosted and CC BY-SA,
   * so the hero renders the credit line in `heroCredit` below. Because the hero
   * features it, it is deliberately absent from DELHI_VENUES: showing the same
   * photograph twice on one page reads as a mistake.
   */
  hero: {
    src: "/marketing/yashobhoomi.jpg",
    alt: "The angular white façade of the Yashobhoomi convention centre in Dwarka, New Delhi",
  },
  planning: {
    src: unsplash("photo-1552664730-d307ca884978"),
    alt: "An events team planning a conference around a whiteboard",
  },
  venuePitch: {
    src: unsplash("photo-1523580494863-6f3031224c94"),
    alt: "A hotel conference room set up for a corporate session",
  },
} as const satisfies Record<string, MarketingImage>;

/** Caption + licence credit shown on the hero image. */
export const HERO_CAPTION = {
  venue: "Yashobhoomi (IICC)",
  location: "Dwarka, New Delhi",
  stat: "~11,000 delegate capacity",
  credit: "Photo © Ayush Raj, CC BY-SA 4.0",
} as const;

/**
 * Landmark Delhi NCR venues, shown editorially to illustrate the scale the
 * Indian MICE industry works at.
 *
 * IMPORTANT: these are NOT MICEHub listings and the UI must never imply they
 * are — no booking or RFP CTA belongs on these cards. They are public landmark
 * venues presented for reference, and the section copy says so explicitly.
 *
 * Every figure below is sourced from the venue's Wikipedia article; don't edit
 * a number here without a source. Photos are self-hosted in /public/marketing
 * under CC BY-SA, which requires the visible credit rendered beneath the grid.
 */
export const DELHI_VENUES = [
  {
    slug: "bharat-mandapam",
    name: "Bharat Mandapam",
    location: "Pragati Maidan, New Delhi",
    category: "Convention & exhibition",
    src: "/marketing/bharat-mandapam.jpg",
    alt: "The terracotta-clad drum of Bharat Mandapam rising above the Pragati Maidan forecourt",
    blurb:
      "India's flagship convention and exhibition complex, redeveloped by ITPO and inaugurated in July 2023. It hosted the G20 Leaders' Summit two months later.",
    facts: [
      { label: "Main hall", value: "7,000 seats" },
      { label: "Inaugurated", value: "July 2023" },
    ],
    credit: { author: "Kuldeepburjbhalaike", license: "CC BY-SA 4.0" },
  },
  {
    slug: "vigyan-bhawan",
    name: "Vigyan Bhawan",
    location: "Maulana Azad Road, New Delhi",
    category: "Government conference centre",
    src: "/marketing/vigyan-bhawan.jpg",
    alt: "The white colonnaded façade of Vigyan Bhawan lined with flagpoles",
    blurb:
      "The Government of India's premier conference venue since 1956 — the setting for CHOGM, NAM and SAARC summits and the National Film Awards.",
    facts: [
      { label: "Plenary hall", value: "1,200+ delegates" },
      { label: "In service since", value: "1956" },
    ],
    credit: { author: "Sumita Roy Dutta", license: "CC BY-SA 4.0" },
  },
  {
    slug: "jawaharlal-nehru-stadium",
    name: "Jawaharlal Nehru Stadium",
    location: "Lodhi Road, New Delhi",
    category: "Large-format & ceremonies",
    src: "/marketing/jawaharlal-nehru-stadium.jpg",
    alt: "Floodlights over the stands and track of Jawaharlal Nehru Stadium at night",
    blurb:
      "Built for the 1982 Asian Games and rebuilt for the 2010 Commonwealth Games. Beyond sport it carries opening ceremonies and stadium-scale concerts.",
    facts: [
      { label: "Seating", value: "60,254" },
      { label: "Operator", value: "Sports Authority of India" },
    ],
    credit: { author: "Subhajit Nag", license: "CC BY-SA 4.0" },
  },
] as const;

/**
 * Space-type tiles. `type` matches the `venue_type` pgEnum, so each tile links
 * straight into the real browse filter at /venues?type=<type>.
 */
export const SPACE_TYPE_TILES = [
  {
    type: "convention_centre",
    label: "Convention centres",
    blurb: "Large-format halls for 500+ delegates",
    src: unsplash("photo-1511578314322-379afb476865"),
    alt: "A convention hall laid out with round banquet tables and projection screens",
  },
  {
    type: "auditorium",
    label: "Auditoriums",
    blurb: "Tiered seating, stage and full A/V",
    src: unsplash("photo-1505373877841-8d25f7d46678"),
    alt: "An auditorium audience facing a large presentation screen",
  },
  {
    type: "exhibition_hall",
    label: "Exhibition halls",
    blurb: "Open floors for stalls and expos",
    src: unsplash("photo-1560439514-4e9645039924"),
    alt: "Visitors walking a busy exhibition floor between stalls",
  },
  {
    type: "hotel_ballroom",
    label: "Hotel ballrooms",
    blurb: "Banquets, galas and award nights",
    src: unsplash("photo-1519225421980-715cb0215aed"),
    alt: "A long banquet table dressed with flowers and glassware",
  },
  {
    type: "standalone_hall",
    label: "Standalone halls",
    blurb: "Flexible spaces for offsites and training",
    src: unsplash("photo-1497366216548-37526070297c"),
    alt: "A bright, empty modern hall with clean architectural lines",
  },
  {
    type: "other",
    label: "Everything else",
    blurb: "Lawns, rooftops and unusual venues",
    src: unsplash("photo-1540575467063-178a50c2df87"),
    alt: "An attentive audience seated at an evening event",
  },
] as const;
