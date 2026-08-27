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

Vercel builds **do not** talk to MongoDB (build-time `db push` fails with TLS/`ReplicaSetNoPrimary` on serverless). Sync from your machine:

```bash
npm run db:deploy
```

Vercel only runs `prisma generate` + `next build`.

### Fix Atlas ↔ Vercel (runtime)

1. Atlas → **Network Access** → **Allow Access from Anywhere** (`0.0.0.0/0`) → wait until **Active**.
2. Vercel → **Settings** → **Environment Variables** → set `DATABASE_URL` for Production + Preview.
3. On Vercel, prefer a **non-SRV** URI (avoids serverless DNS/TLS issues with `mongodb+srv`):

```text
mongodb://USER:PASS@ac-9gydqqu-shard-00-00.1xc7u6v.mongodb.net:27017,ac-9gydqqu-shard-00-01.1xc7u6v.mongodb.net:27017,ac-9gydqqu-shard-00-02.1xc7u6v.mongodb.net:27017/rentmycar-prod?ssl=true&replicaSet=atlas-vctnk7-shard-0&authSource=admin&retryWrites=true&w=majority
```

4. Redeploy.

Local can keep using `mongodb+srv://...`.

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Next.js dev server |
| `npm run build` / `vercel-build` | `prisma generate` + Next build (no DB) |
| `npm run db:push` | Sync schema indexes to MongoDB |
| `npm run db:seed` | Seed fee config + demo users |
| `npm run db:deploy` | generate + push + seed (run locally) |
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
