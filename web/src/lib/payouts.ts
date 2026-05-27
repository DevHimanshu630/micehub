/**
 * Platform commission lives here, not on each row, so we can change it later
 * without touching multiple call sites. The stored payout row keeps the
 * commissionBps that was active at the time of payout creation as an audit trail.
 */
export const DEFAULT_COMMISSION_BPS = 1000; // 10%

export type PayoutBreakdown = {
  grossRupees: number;
  commissionRupees: number;
  netRupees: number;
  commissionBps: number;
};

export function calculatePayout(
  grossRupees: number,
  commissionBps: number = DEFAULT_COMMISSION_BPS,
): PayoutBreakdown {
  const commissionRupees = Math.floor((grossRupees * commissionBps) / 10000);
  return {
    grossRupees,
    commissionRupees,
    netRupees: grossRupees - commissionRupees,
    commissionBps,
  };
}

export function formatCommissionPct(commissionBps: number): string {
  const pct = commissionBps / 100;
  return Number.isInteger(pct) ? `${pct}%` : `${pct.toFixed(2)}%`;
}
