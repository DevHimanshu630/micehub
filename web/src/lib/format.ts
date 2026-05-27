/**
 * Money helpers. Amounts in our DB are integer INR rupees (no paise).
 * We'll switch to integer paise in Step 9 when we add real payments.
 */

export function formatINR(rupees: number): string {
  return `₹${rupees.toLocaleString("en-IN")}`;
}

export function relativeTimeFromHours(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  if (hours < 24) return `${Math.round(hours)} hr`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"}`;
}
