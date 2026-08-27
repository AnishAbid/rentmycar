# RentMyCar

Managed car rental platform: owners supply vehicles; the platform handles client dealings, fleet operations, deposits, and payouts.

## Docs

- [Product decisions](docs/DECISIONS.md) — market defaults & revenue share
- [MVP PRD](docs/PRD.md) — personas, user stories, flows
- [MVP backlog](docs/MVP_BACKLOG.md) — build slices & screen map

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind
- **Prisma ORM 6.x + MongoDB** (Prisma 7 has no MongoDB connector)
- Domain helpers in `src/lib/domain`
- Mock payment provider in `src/lib/payments`

## Setup

```bash
# 1) Start MongoDB replica set (needed for $transaction)
docker compose up -d

# 2) Install & sync schema
npm install
cp .env.example .env   # or edit DATABASE_URL for Atlas
npm run db:push
npm run db:seed
npm run dev
```

Atlas example:

```env
DATABASE_URL="mongodb+srv://USER:PASS@cluster.mongodb.net/rentmycar?retryWrites=true&w=majority"
```

## Vercel deploy

MongoDB has **no Prisma migrate** — on each Vercel build the app runs:

1. `prisma generate`
2. `prisma db push` (sync indexes/collections)
3. `npm run db:seed` (idempotent upserts)
4. `next build`

Set this env var in the Vercel project (Production + Preview):

| Name | Value |
|------|--------|
| `DATABASE_URL` | Your Atlas `mongodb+srv://...` connection string |

Seed uses upserts, so re-running on every deploy is safe for demo users/fee config.

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Next.js dev server |
| `npm run build` | Generate + db push + seed + Next build (used by Vercel) |
| `npm run db:push` | Sync Prisma schema indexes to MongoDB (no migrate) |
| `npm run db:seed` | Seed fee config + demo users |
| `npm run db:deploy` | generate + push + seed only |
| `npm run db:studio` | Prisma Studio |
| `npm run test:domain` | Domain money helper checks |

## Try the forms

Demo logins (password: `password`):

| Email | Role |
|-------|------|
| owner@demo.local | Owner |
| renter@demo.local | Renter |
| ops@demo.local | Ops |
| admin@demo.local | Admin |

Flow: owner onboarding → add vehicle → ops approve → renter verify → search/book → ops confirm → pickup/return checklists → ops inspect → payouts.

## Roles & routes

| Role | Entry |
|------|--------|
| Public | `/`, `/search`, `/cars/[id]` |
| Owner | `/owner` |
| Renter | `/renter/bookings` |
| Ops | `/ops` |
| Admin | `/admin/settings` |
