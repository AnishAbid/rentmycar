import { differenceInCalendarDays, isBefore } from "date-fns";
import type { LaunchConfig, MoneyBreakdown } from "@/lib/domain/types";

export function daysBetween(startAt: Date, endAt: Date): number {
  const days = differenceInCalendarDays(endAt, startAt);
  return Math.max(1, days);
}

export function splitRevenue(
  baseCents: number,
  ownerShareBps: number,
): { ownerShareCents: number; platformFeeCents: number } {
  const ownerShareCents = Math.round((baseCents * ownerShareBps) / 10_000);
  const platformFeeCents = baseCents - ownerShareCents;
  return { ownerShareCents, platformFeeCents };
}

export function quoteTrip(params: {
  dailyRateCents: number;
  startAt: Date;
  endAt: Date;
  feesCents?: number;
  taxCents?: number;
  config: Pick<
    LaunchConfig,
    "defaultDepositCents" | "ownerShareBps" | "platformFeeBps"
  >;
}): MoneyBreakdown {
  if (!isBefore(params.startAt, params.endAt) && params.startAt.getTime() !== params.endAt.getTime()) {
    // end must be after start; same instant still yields 1 day via daysBetween
  }
  const days = daysBetween(params.startAt, params.endAt);
  const baseCents = params.dailyRateCents * days;
  const feesCents = params.feesCents ?? 0;
  const taxCents = params.taxCents ?? 0;
  const totalCents = baseCents + feesCents + taxCents;
  const { ownerShareCents, platformFeeCents } = splitRevenue(
    baseCents,
    params.config.ownerShareBps,
  );

  return {
    dailyRateCents: params.dailyRateCents,
    days,
    baseCents,
    feesCents,
    taxCents,
    totalCents,
    depositCents: params.config.defaultDepositCents,
    ownerShareCents,
    platformFeeCents,
  };
}

export function cancellationRefundCents(params: {
  totalCents: number;
  startAt: Date;
  now?: Date;
  cancelFullRefundHours: number;
  tripStarted: boolean;
}): number {
  if (params.tripStarted) return 0;
  const now = params.now ?? new Date();
  const hoursUntil =
    (params.startAt.getTime() - now.getTime()) / (1000 * 60 * 60);
  if (hoursUntil >= params.cancelFullRefundHours) return params.totalCents;
  if (hoursUntil > 0) return Math.round(params.totalCents * 0.5);
  return 0;
}

export function formatMoney(cents: number, currency: string, locale = "en"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(cents / 100);
}

export function generateBookingCode(prefix = "RMC"): string {
  const part = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${part}`;
}
