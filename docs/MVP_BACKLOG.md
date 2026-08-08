# MVP backlog — first buildable slice

Ordered for a vertical slice: auth → supply → search/book → ops desk → trip checklists → money stubs.

## Slice 0 — Foundations

| # | Item | Screens / APIs | Notes |
|---|------|----------------|-------|
| 0.1 | App shell, auth, roles | `/login`, `/signup`, role-gated layouts | OWNER, RENTER, OPS, ADMIN |
| 0.2 | Launch + fee config | Admin `/admin/settings` | City, currency, commission, deposit, min age |
| 0.3 | Audit log helper | Internal | Wrap status/money mutations |

## Slice 1 — Owner supply

| # | Item | Screens |
|---|------|---------|
| 1.1 | Owner onboarding | `/owner/onboarding` (profile + payout details) |
| 1.2 | Add vehicle | `/owner/vehicles/new` |
| 1.3 | Vehicle detail + docs/photos | `/owner/vehicles/[id]` |
| 1.4 | Blocked dates / pause | Same detail + calendar |
| 1.5 | Owner dashboard | `/owner` (status list + earnings summary stub) |

**Ops companion:** `/ops/vehicles` approval queue (approve/reject).

## Slice 2 — Renter discovery & booking request

| # | Item | Screens |
|---|------|---------|
| 2.1 | Renter verification | `/renter/verify` (license + DOB) |
| 2.2 | Search | `/` or `/search` |
| 2.3 | Vehicle public detail | `/cars/[id]` |
| 2.4 | Booking request | Checkout step → `PENDING_CONFIRMATION` |
| 2.5 | My bookings | `/renter/bookings`, `/renter/bookings/[id]` |

## Slice 3 — Ops booking desk

| # | Item | Screens |
|---|------|---------|
| 3.1 | Booking inbox | `/ops/bookings` |
| 3.2 | Confirm / decline / assign | `/ops/bookings/[id]` |
| 3.3 | Pickup instructions | Editable notes on booking |
| 3.4 | Force cancel + refund stub | Same detail |
| 3.5 | Fleet board | `/ops/fleet` status pipeline |

## Slice 4 — Trip handoff

| # | Item | Screens |
|---|------|---------|
| 4.1 | Pickup checklist + photos | `/renter/bookings/[id]/pickup` |
| 4.2 | Return checklist + photos | `/renter/bookings/[id]/return` |
| 4.3 | Ops inspection | `/ops/bookings/[id]/inspect` |
| 4.4 | Claim stub | Create claim from inspection |

## Slice 5 — Money

| # | Item | Screens / APIs |
|---|------|----------------|
| 5.1 | Payment + deposit auth stub | Provider interface (mock in dev) |
| 5.2 | Ledger entries on confirm/complete | Domain service |
| 5.3 | Deposit release / capture | Ops inspection actions |
| 5.4 | Owner earnings + payout stub | `/owner/earnings`, `/ops/payouts` |
| 5.5 | Support tickets | `/renter/support`, `/ops/tickets` |

## Screen map (MVP)

```
Public:     /  /search  /cars/[id]  /login  /signup
Owner:      /owner  /owner/onboarding  /owner/vehicles  /owner/vehicles/new  /owner/vehicles/[id]  /owner/earnings
Renter:     /renter/verify  /renter/bookings  /renter/bookings/[id]  .../pickup  .../return  /renter/support
Ops:        /ops  /ops/vehicles  /ops/fleet  /ops/bookings  /ops/bookings/[id]  .../inspect  /ops/tickets  /ops/payouts
Admin:      /admin/settings  /admin/users
```

## Build order (do not skip)

1. Domain models + enums + config  
2. Auth + role layouts  
3. Owner vehicle CRUD + ops approval  
4. Search + booking request  
5. Ops confirm/assign + payment stub  
6. Checklists + inspection  
7. Ledger + deposit + earnings UI  
8. Support tickets + audit polish  

## Definition of done (MVP)

- [ ] Owner can get a car to `LIVE`
- [ ] Renter can request and (after ops confirm) pay for a booking
- [ ] Pickup/return photo checklists work
- [ ] Ops can inspect, release deposit, and open a claim stub
- [ ] Owner sees earnings; ops can mark a payout batch as paid (stub OK)
- [ ] No owner↔renter direct chat
