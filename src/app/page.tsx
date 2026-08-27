import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { launchConfig } from "@/config/launch";
import { formatMoney } from "@/lib/domain/money";
import { prisma } from "@/lib/db";

export default async function HomePage() {
  const liveCount = await prisma.vehicle.count({ where: { status: "LIVE" } });

  return (
    <div className="min-h-screen">
      <SiteHeader active="home" />
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              "linear-gradient(120deg, rgba(15,107,76,0.18), transparent 42%), linear-gradient(180deg, transparent, rgba(20,32,28,0.55)), url('https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1800&q=80') center/cover",
          }}
        />
        <div className="shell flex min-h-[78vh] flex-col justify-end gap-5 pb-16 pt-28 text-white">
          <p className="font-display text-5xl font-semibold tracking-tight sm:text-7xl">
            {launchConfig.brandName}
          </p>
          <h1 className="max-w-xl text-2xl font-medium text-white/90 sm:text-3xl">
            Owners supply the cars. We run the rentals.
          </h1>
          <p className="max-w-lg text-white/75">
            {launchConfig.city} · {liveCount} live vehicle{liveCount === 1 ? "" : "s"} · deposits from{" "}
            {formatMoney(launchConfig.defaultDepositCents, launchConfig.currency)}.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/search"
              className="btn btn-primary bg-white !text-[var(--ink)] hover:bg-[var(--paper)]"
            >
              Find a car
            </Link>
            <Link
              href="/signup"
              className="btn btn-secondary !border-white/40 !text-white"
            >
              Sign up
            </Link>
            <Link
              href="/signup?role=OWNER"
              className="btn btn-secondary !border-white/40 !text-white"
            >
              Offer your car
            </Link>
          </div>
        </div>
      </section>
      <section className="shell grid gap-8 py-16 md:grid-cols-3">
        {[
          [
            "For owners",
            "Offer cars as a person or a company. We handle clients, handoffs, and payouts.",
            "/signup?role=OWNER",
          ],
          [
            "For renters",
            "Book as a person or a company. Search, pick up, and return with photo checklists.",
            "/signup",
          ],
          ["For ops", "Approve supply, confirm trips, settle deposits.", "/ops"],
        ].map(([title, copy, href]) => (
          <div key={title} className="space-y-3">
            <h2 className="font-display text-2xl">{title}</h2>
            <p className="text-[var(--ink-soft)]">{copy}</p>
            <Link href={href} className="inline-flex text-sm font-semibold text-[var(--accent)]">
              Open →
            </Link>
          </div>
        ))}
      </section>
    </div>
  );
}
