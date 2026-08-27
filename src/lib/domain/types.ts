export type RentalUnit = "hourly" | "daily" | "monthly";

export type LaunchConfig = {
  city: string;
  currency: string;
  locale: string;
  timezone: string;
  brandName: string;
  /** Owner share of base rental in basis points (7000 = 70%). */
  ownerShareBps: number;
  platformFeeBps: number;
  defaultDepositCents: number;
  minRenterAge: number;
  softHoldHours: number;
  cancelFullRefundHours: number;
  payoutHoldHours: number;
  rentalUnit: RentalUnit;
};

export type MoneyBreakdown = {
  dailyRateCents: number;
  days: number;
  baseCents: number;
  feesCents: number;
  taxCents: number;
  totalCents: number;
  depositCents: number;
  ownerShareCents: number;
  platformFeeCents: number;
};

export const VEHICLE_STATUS_PIPELINE = [
  "DRAFT",
  "PENDING_REVIEW",
  "REJECTED",
  "LIVE",
  "PAUSED",
  "BOOKED",
  "MAINTENANCE",
  "CLAIM",
  "WITHDRAWN",
] as const;

export const BOOKING_STATUS_FLOW = [
  "PENDING_CONFIRMATION",
  "DECLINED",
  "EXPIRED",
  "CONFIRMED",
  "ACTIVE",
  "RETURNED",
  "COMPLETED",
  "CANCELLED",
  "CLAIM",
] as const;
