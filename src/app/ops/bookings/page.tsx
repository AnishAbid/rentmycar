import Link from "next/link";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/domain/money";
import { launchConfig } from "@/config/launch";

export default async function OpsBookingsPage() {
  const bookings = await prisma.booking.findMany({
    include: { vehicle: true, renter: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div>
      <PageHeader title="Booking inbox" subtitle="Confirm, decline, and manage trip exceptions." />
      {bookings.length === 0 ? (
        <EmptyState>No bookings yet.</EmptyState>
      ) : (
        <div className="panel divide-y divide-[var(--line)]">
          {bookings.map((b) => (
            <Link
              key={b.id}
              href={
                b.status === "RETURNED" || b.status === "CLAIM"
                  ? `/ops/bookings/${b.id}/inspect`
                  : `/ops/bookings/${b.id}`
              }
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 hover:bg-white/50"
            >
              <div>
                <div className="font-semibold">
                  {b.code} · {b.vehicle.make} {b.vehicle.model}
                </div>
                <div className="text-sm text-[var(--ink-soft)]">
                  {b.renter.accountKind === "COMPANY" && b.renter.companyName
                    ? `${b.renter.companyName} · `
                    : ""}
                  {b.renter.email} · {formatMoney(b.totalCents, launchConfig.currency)} ·{" "}
                  {b.startAt.toISOString().slice(0, 10)}
                </div>
              </div>
              <StatusBadge
                status={b.status}
                tone={
                  b.status === "PENDING_CONFIRMATION"
                    ? "warn"
                    : b.status === "RETURNED"
                      ? "warn"
                      : "default"
                }
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
