import type { LaunchConfig } from "@/lib/domain/types";

/**
 * Single-city MVP launch defaults. Replace city/currency for a real market.
 * See docs/DECISIONS.md.
 */
export const launchConfig: LaunchConfig = {
  city: "Demo City",
  currency: "USD",
  locale: "en",
  timezone: "UTC",
  brandName: "RentMyCar",
  ownerShareBps: 7000,
  platformFeeBps: 3000,
  defaultDepositCents: 50_000,
  minRenterAge: 21,
  softHoldHours: 2,
  cancelFullRefundHours: 48,
  payoutHoldHours: 48,
  rentalUnit: "daily",
};
