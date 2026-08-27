import Link from "next/link";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/domain/money";
import { launchConfig } from "@/config/launch";

export default async function RenterBookingsPage() {
  const user = await requireUser(["RENTER", "ADMIN"]);
  const bookings = await prisma.booking.findMany({
    where: { renterId: user.id },
    include: { vehicle: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title={user.accountKind === "COMPANY" ? "Company bookings" : "My bookings"}
        subtitle={
          user.accountKind === "COMPANY"
            ? "Trips booked under your company account. Ops-mediated — no direct owner chat."
            : "Ops-mediated trips — no direct owner chat."
        }
        action={
          <Link href="/search" className="btn btn-primary">
            Find a car
          </Link>
        }
      />
      {bookings.length === 0 ? (
        <EmptyState>No bookings yet.</EmptyState>
      ) : (
        <div className="panel divide-y divide-[var(--line)]">
          {bookings.map((b) => (
            <Link
              key={b.id}
              href={`/renter/bookings/${b.id}`}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 hover:bg-white/50"
            >
              <div>
                <div className="font-semibold">
                  {b.vehicle.make} {b.vehicle.model} · {b.code}
                </div>
                <div className="text-sm text-[var(--ink-soft)]">
                  {b.startAt.toISOString().slice(0, 10)} → {b.endAt.toISOString().slice(0, 10)} ·{" "}
                  {formatMoney(b.totalCents, launchConfig.currency)}
                </div>
              </div>
              <StatusBadge
                status={b.status}
                tone={
                  b.status === "CANCELLED" || b.status === "DECLINED"
                    ? "danger"
                    : b.status === "PENDING_CONFIRMATION"
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
