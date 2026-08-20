import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist_Mono, Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

/**
 * Type system — the pairing modern international SaaS converged on:
 * - Inter             — all UI and body copy. The de-facto product typeface:
 *                       huge glyph coverage, engineered for small screen sizes.
 * - Plus Jakarta Sans — headings (`font-display`). A geometric grotesk with
 *                       tighter apertures than Inter, so headlines read
 *                       distinct and confident without changing voice.
 * - Geist Mono        — tabular/technical strings only.
 */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MiceLog — India's MICE Booking Platform",
  description:
    "Book conference halls, banquet venues, and event spaces across India. Send RFPs, compare quotes, and confirm bookings — all in one place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${inter.variable} ${jakarta.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="flex min-h-full flex-col bg-white text-slate-900">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
