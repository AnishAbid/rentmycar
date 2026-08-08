# Product decisions (locked for MVP)

These defaults unblock PRD, backlog, and scaffolding. They can be changed later via config without redesigning the domain model.

## Launch market

| Decision | Choice |
|----------|--------|
| Scope | Single-city MVP, multi-city ready via config |
| Default city | `Demo City` (replace with real launch city in `config/launch.ts`) |
| Default currency | `USD` (ISO 4217; swap per market) |
| Default locale | `en` |
| Default timezone | `UTC` |
| Rental unit (MVP) | Daily (hourly/monthly later) |

Insurance partners, tax rules, and fine liability remain market-specific and are modeled as pluggable policy config, not hard-coded.

## Owner pay model

| Decision | Choice |
|----------|--------|
| Primary model | **Revenue share** |
| Default split | Owner **70%** of trip rental revenue; platform **30%** (configurable per city/category) |
| Deposit | Held by platform; not part of owner share |
| Add-ons / fees | Platform-configurable; default: platform keeps service fees; owner shares base rental only |
| Payout cadence | Weekly, after trip return + hold period (default 48h) |
| Phase 2 | Fixed monthly lease and hybrid contracts (schema already supports `contractType`) |

## Chat / client dealings

Owner and renter do **not** message each other directly. All client communication is ops-mediated (matches managed platform model).

## Verification (MVP)

- Manual admin approval for owner identity + vehicle documents
- Renter license upload + age check (21+)
- Automated KYC/driving-record providers in Phase 2
