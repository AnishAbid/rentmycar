# RentMyCar — MVP Product Requirements Document

**Product:** Managed car rental platform  
**Version:** 0.1 (MVP)  
**Status:** Ready for build  
**Related:** [DECISIONS.md](./DECISIONS.md), [MVP_BACKLOG.md](./MVP_BACKLOG.md)

## 1. Vision

Car owners supply vehicles to the platform. The platform is the rental brand for clients: discovery, booking, pickup/return, support, deposits, and claims. Owners see earnings and vehicle status; they do not deal with renters day to day.

## 2. Goals (MVP)

1. Complete one managed rental loop: owner lists car → ops approves → renter books & pays → ops assigns & handoff → photo check-in/out → payout.
2. Keep money and liability auditable (deposit hold, commission, refunds, claims stub).
3. Give ops a desk to run the business without owner↔renter DMs.

## 3. Non-goals (MVP)

- Keyless/telematics
- Airport delivery zones & flight tracking
- Automated insurance API bind/unbind
- Corporate accounts / monthly subscriptions
- Native mobile apps
- Dynamic pricing
- Owner↔renter messaging

## 4. Personas

| Persona | Needs |
|---------|--------|
| **Owner** | List cars, track status, get paid fairly with clear statements |
| **Renter** | Find a car, book with clear all-in price, pick up/return smoothly, get help |
| **Ops** | Approve supply, assign cars, run pickups/returns, handle exceptions |
| **Admin** | Configure fees, ban users, refund, audit money movements |

## 5. User stories

### 5.1 Owner

| ID | Story | Acceptance |
|----|--------|------------|
| O1 | As an owner, I can sign up and complete a profile with payout bank details so I can receive earnings. | Profile saved; payout method required before first payout |
| O2 | As an owner, I can add a vehicle with specs, photos, and documents so ops can verify it. | Vehicle status `PENDING_REVIEW`; docs/photos required |
| O3 | As an owner, I can see verification status (pending / approved / rejected with reason). | Status visible; rejection reason shown |
| O4 | As an owner, I can set blocked dates and basic rules (max trip days, mileage cap). | Blocks remove availability; rules enforced at booking |
| O5 | As an owner, I can pause or request withdrawal of a vehicle. | Paused cars not bookable; active trips finish first |
| O6 | As an owner, I can view live vehicle status (available, booked, maintenance, under review). | Status matches fleet record |
| O7 | As an owner, I can view trip history summary without renter PII beyond needed settlement fields. | List of completed/upcoming trips with dates & earnings |
| O8 | As an owner, I can see earnings (gross, platform fee, net, pending hold) and payout history. | Numbers match ledger; export CSV |

### 5.2 Renter

| ID | Story | Acceptance |
|----|--------|------------|
| R1 | As a renter, I can sign up, upload license, and confirm age 21+ before booking. | Unverified renters cannot checkout |
| R2 | As a renter, I can search cars by city, dates, category, price, transmission, seats. | Results only show available approved cars |
| R3 | As a renter, I can open a vehicle page with photos, specs, policies, and all-in price. | Price includes fees/taxes shown in breakdown |
| R4 | As a renter, I can request a booking (ops-confirm in MVP) for selected dates. | Creates booking `PENDING_CONFIRMATION`; holds inventory soft-lock |
| R5 | As a renter, I can pay rental + authorize deposit at confirmation. | Payment captured/authorized; booking `CONFIRMED` |
| R6 | As a renter, I receive pickup instructions after confirmation. | Instructions visible in booking detail + email stub |
| R7 | As a renter, I can complete pickup checklist with mandatory photos (exterior, interior, odometer, fuel). | Trip becomes `ACTIVE` only after checklist submitted |
| R8 | As a renter, I can complete return checklist with photos. | Trip becomes `RETURNED` / enters inspection |
| R9 | As a renter, I can request a trip extension (ops must approve). | Extension creates review task; payment re-auth required if approved |
| R10 | As a renter, I can open a support ticket for a booking. | Ticket linked to booking; ops can reply |
| R11 | As a renter, I can cancel per policy and see refund amount before confirm. | Refund/ledger entry created per policy |

### 5.3 Ops / Admin

| ID | Story | Acceptance |
|----|--------|------------|
| A1 | As ops, I can approve or reject owner vehicle submissions with a note. | Status updates; owner notified |
| A2 | As ops, I can see a fleet inventory with status pipeline. | Filter by status/location |
| A3 | As ops, I can confirm or decline pending bookings. | On confirm, assign a specific vehicle (or keep listed vehicle) |
| A4 | As ops, I can reassign a car, force-cancel, refund, or issue goodwill credit. | Actions audited |
| A5 | As ops, I can set pickup/return window notes and mark handoff complete. | Booking timeline updated |
| A6 | As ops, I can run return inspection and open a damage/claim ticket with evidence. | Deposit hold/capture path available |
| A7 | As ops, I can release or partially capture deposit after inspection. | Ledger + payment state updated |
| A8 | As admin, I can configure city commission %, deposit default, min age, cancellation windows. | Config applied to new bookings |
| A9 | As admin, I can flag/ban renters or owners. | Banned users cannot book/list |
| A10 | As ops, I can manage support tickets and macros. | Reply/resolve; history kept |
| A11 | As finance/ops, I can trigger owner payouts for eligible settled trips. | Payout batch + statement rows |

## 6. Core flows

### 6.1 Supply onboarding

```
Owner signup → Add vehicle + docs/photos → PENDING_REVIEW
  → Ops approve → LIVE (available)
  → Ops reject → REJECTED (reason)
```

### 6.2 Booking (ops-confirm)

```
Renter search → Select car/dates → PENDING_CONFIRMATION (soft hold)
  → Ops confirm + assign → payment + deposit auth → CONFIRMED
  → Pickup checklist → ACTIVE
  → Return checklist → RETURNED → Inspection
  → Clean → COMPLETED → earnings eligible after hold
  → Issues → CLAIM / EXTRA_CHARGES → then settle
```

### 6.3 Money

```
Renter pays trip price → Platform escrow
Deposit pre-auth held separately
On settle: platform fee + owner share ledger entries
Deposit: release | partial capture | full capture
Owner payout weekly for eligible ledger rows
```

Default split: **70% owner / 30% platform** on base rental (see DECISIONS.md).

## 7. Domain entities (MVP)

- User (roles: OWNER, RENTER, OPS, ADMIN)
- OwnerProfile, RenterProfile
- Vehicle, VehicleDocument, VehiclePhoto, VehicleBlock
- Booking, BookingAddon, TripChecklist, TripPhoto
- Payment, Deposit, LedgerEntry, Payout
- Claim, SupportTicket
- LaunchConfig / FeeConfig
- AuditLog

## 8. Policies (MVP defaults)

| Policy | Default |
|--------|---------|
| Min renter age | 21 |
| Soft hold TTL | 2 hours pending ops confirm |
| Deposit | $500 flat (configurable) |
| Cancellation | Full refund if ≥48h before pickup; 50% if &lt;48h; no rental refund after pickup start |
| Payout hold | 48h after completed inspection |
| Owner share | 70% of base rental |
| Chat | Ops-mediated only |

## 9. Success metrics (MVP)

- Time to first approved vehicle
- Booking confirmation rate
- Utilization (rented days / available days)
- Claim rate per 100 trips
- Owner payout accuracy (ledger vs bank)

## 10. Open risks

- Insurance partnership must exist before real public rentals (MVP can stub claims workflow)
- Local rental licensing & tax — configure per launch city
- Traffic fines attribution — process via ops + evidence in Phase 2 automation
