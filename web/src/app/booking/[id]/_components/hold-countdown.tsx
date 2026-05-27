"use client";

import { useEffect, useState } from "react";

export function HoldCountdown({ expiresAtMs }: { expiresAtMs: number }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remainingMs = Math.max(expiresAtMs - now, 0);
  const minutes = Math.floor(remainingMs / 60000);
  const seconds = Math.floor((remainingMs % 60000) / 1000);

  if (remainingMs === 0) {
    return (
      <div className="rounded-md bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800 dark:bg-rose-950 dark:text-rose-300">
        Hold expired. Refresh this page to release the slot and start over.
      </div>
    );
  }

  const urgent = remainingMs < 60_000;

  return (
    <div
      className={`rounded-md px-4 py-3 text-sm font-medium tabular-nums ${
        urgent
          ? "bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
          : "bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
      }`}
    >
      Hold expires in{" "}
      <span className="font-semibold">
        {minutes}:{String(seconds).padStart(2, "0")}
      </span>{" "}
      — complete payment to confirm.
    </div>
  );
}
