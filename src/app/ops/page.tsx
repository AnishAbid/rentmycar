import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { prisma } from "@/lib/db";

export default async function OpsHomePage() {
  const [pendingVehicles, pendingBookings, openTickets, returned] = await Promise.all([
    prisma.vehicle.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.booking.count({ where: { status: "PENDING_CONFIRMATION" } }),
    prisma.supportTicket.count({ where: { status: { in: ["OPEN", "PENDING_USER"] } } }),
    prisma.booking.count({ where: { status: "RETURNED" } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Ops desk"
        subtitle="Approve supply, confirm trips, inspect returns, settle money."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["/ops/vehicles", "Vehicle approvals", pendingVehicles],
          ["/ops/bookings", "Pending bookings", pendingBookings],
          ["/ops/bookings", "Awaiting inspection", returned],
          ["/ops/tickets", "Open tickets", openTickets],
        ].map(([href, title, count]) => (
          <Link key={title as string} href={href as string} className="panel p-5 hover:border-[var(--accent)]">
            <div className="text-sm text-[var(--ink-soft)]">{title as string}</div>
            <div className="mt-2 text-3xl font-semibold">{count as number}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
