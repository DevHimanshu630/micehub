const GRADIENTS = [
  "from-indigo-500 to-purple-600",
  "from-rose-500 to-orange-500",
  "from-emerald-500 to-teal-600",
  "from-sky-500 to-blue-600",
  "from-amber-500 to-rose-500",
  "from-fuchsia-500 to-pink-600",
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
      className={`flex w-full items-center justify-center bg-gradient-to-br font-bold tracking-tight text-white shadow-inner ${gradient} ${sizeClasses}`}
      aria-hidden
    >
      {letter}
    </div>
  );
}
