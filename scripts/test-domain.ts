/**
 * Lightweight domain checks. Run: npm run test:domain
 */
import assert from "node:assert/strict";
import {
  cancellationRefundCents,
  daysBetween,
  quoteTrip,
  splitRevenue,
} from "../src/lib/domain/money";
import { launchConfig } from "../src/config/launch";

const split = splitRevenue(10_000, 7000);
assert.equal(split.ownerShareCents, 7000);
assert.equal(split.platformFeeCents, 3000);

const start = new Date("2026-08-10T10:00:00Z");
const end = new Date("2026-08-13T10:00:00Z");
assert.equal(daysBetween(start, end), 3);

const quote = quoteTrip({
  dailyRateCents: 4500,
  startAt: start,
  endAt: end,
  config: launchConfig,
});
assert.equal(quote.days, 3);
assert.equal(quote.baseCents, 13_500);
assert.equal(quote.totalCents, 13_500);
assert.equal(quote.depositCents, launchConfig.defaultDepositCents);
assert.equal(quote.ownerShareCents, 9450);
assert.equal(quote.platformFeeCents, 4050);

const full = cancellationRefundCents({
  totalCents: 10_000,
  startAt: new Date(Date.now() + 72 * 3600_000),
  cancelFullRefundHours: 48,
  tripStarted: false,
});
assert.equal(full, 10_000);

const half = cancellationRefundCents({
  totalCents: 10_000,
  startAt: new Date(Date.now() + 24 * 3600_000),
  cancelFullRefundHours: 48,
  tripStarted: false,
});
assert.equal(half, 5000);

const none = cancellationRefundCents({
  totalCents: 10_000,
  startAt: new Date(Date.now() + 72 * 3600_000),
  cancelFullRefundHours: 48,
  tripStarted: true,
});
assert.equal(none, 0);

console.log("domain money checks passed");
