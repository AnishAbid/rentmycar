# RentMyCar

Managed car rental platform: owners supply vehicles; the platform handles client dealings, fleet operations, deposits, and payouts.

## Docs

- [Product decisions](docs/DECISIONS.md) — market defaults & revenue share
- [MVP PRD](docs/PRD.md) — personas, user stories, flows
- [MVP backlog](docs/MVP_BACKLOG.md) — build slices & screen map

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind
- Prisma + SQLite (swap `DATABASE_URL` to Postgres for production)
- Domain helpers in `src/lib/domain` (pricing, cancellation, audit stub)
- Mock payment provider in `src/lib/payments`

## Roles & routes

| Role | Entry |
|------|--------|
| Public | `/`, `/search`, `/cars/[id]` |
| Owner | `/owner` |
| Renter | `/renter/bookings` |
| Ops | `/ops` |
| Admin | `/admin/settings` |

## Setup

```bash
npm install
cp .env.example .env   # if needed; .env already has sqlite URL
npm run db:migrate
npm run db:seed
npm run dev
```

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run db:migrate` | Apply Prisma migrations |
| `npm run db:seed` | Seed fee config + demo users |
| `npm run db:studio` | Prisma Studio |
| `npm run test:domain` | Domain money helper checks |

## Try the forms

```bash
npm run db:seed
npm run dev
```

Demo logins (password: `password`):

| Email | Role |
|-------|------|
| owner@demo.local | Owner |
| renter@demo.local | Renter |
| ops@demo.local | Ops |
| admin@demo.local | Admin |

Flow: owner onboarding → add vehicle → ops approve → renter verify → search/book → ops confirm → pickup/return checklists → ops inspect → payouts.