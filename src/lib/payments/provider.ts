/**
 * Payment provider interface — mock in MVP, swap for Stripe/local rails later.
 */

export type ChargeInput = {
  amountCents: number;
  currency: string;
  kind: "TRIP" | "DEPOSIT" | "EXTRA_CHARGE";
  bookingId: string;
  metadata?: Record<string, string>;
};

export type ChargeResult = {
  provider: string;
  providerRef: string;
  status: "AUTHORIZED" | "CAPTURED" | "FAILED";
  failureReason?: string;
};

export interface PaymentProvider {
  authorize(input: ChargeInput): Promise<ChargeResult>;
  capture(providerRef: string, amountCents?: number): Promise<ChargeResult>;
  release(providerRef: string): Promise<ChargeResult>;
  refund(providerRef: string, amountCents: number): Promise<ChargeResult>;
}

export const mockPaymentProvider: PaymentProvider = {
  async authorize(input) {
    return {
      provider: "mock",
      providerRef: `mock_auth_${input.bookingId}_${input.kind}_${Date.now()}`,
      status: "AUTHORIZED",
    };
  },
  async capture(providerRef, amountCents) {
    return {
      provider: "mock",
      providerRef: amountCents
        ? `${providerRef}_cap_${amountCents}`
        : providerRef,
      status: "CAPTURED",
    };
  },
  async release(providerRef) {
    return {
      provider: "mock",
      providerRef,
      status: "CAPTURED",
    };
  },
  async refund(providerRef, amountCents) {
    return {
      provider: "mock",
      providerRef: `mock_refund_${providerRef}_${amountCents}`,
      status: "CAPTURED",
    };
  },
};
