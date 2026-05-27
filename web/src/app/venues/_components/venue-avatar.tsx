// Brand-aligned gradient palette — kept restrained (deep, navy-ish) so the
// venue cards look more "industry" and less rainbow.
const GRADIENTS = [
  "from-indigo-600 via-indigo-700 to-slate-900",
  "from-slate-700 via-slate-800 to-indigo-950",
  "from-teal-700 via-emerald-800 to-slate-900",
  "from-violet-700 via-purple-800 to-slate-900",
  "from-sky-700 via-blue-800 to-slate-900",
  "from-rose-700 via-rose-800 to-slate-900",
];

function hashIndex(seed: string, mod: number) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(h) % mod;
}

export function VenueAvatar({
  name,
  size = "md",
}: {
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const gradient = GRADIENTS[hashIndex(name, GRADIENTS.length)];
  const letter = name.trim().charAt(0).toUpperCase() || "?";
  const sizeClasses =
    size === "lg"
      ? "h-48 text-7xl"
      : size === "sm"
        ? "h-20 text-2xl"
        : "h-36 text-5xl";

  return (
    <div
      className={`relative flex w-full items-center justify-center overflow-hidden bg-gradient-to-br font-bold tracking-tight text-white ${gradient} ${sizeClasses}`}
      aria-hidden
    >
      {/* Subtle radial highlight for depth */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.15),transparent_60%)]" />
      <span className="relative drop-shadow-sm">{letter}</span>
    </div>
  );
}
