import Link from "next/link";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/domain/money";
import { launchConfig } from "@/config/launch";

export default async function OwnerVehiclesPage() {
  const user = await requireUser(["OWNER", "ADMIN"]);
  const vehicles = user.ownerProfile
    ? await prisma.vehicle.findMany({
        where: { ownerId: user.ownerProfile.id },
        include: { photos: { take: 1 } },
        orderBy: { updatedAt: "desc" },
      })
    : [];

  return (
    <div>
      <PageHeader
        title="Your vehicles"
        subtitle="Draft → pending review → live."
        action={
          <Link href="/owner/vehicles/new" className="btn btn-primary">
            Add vehicle
          </Link>
        }
      />
      {vehicles.length === 0 ? (
        <EmptyState>No vehicles yet.</EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {vehicles.map((v) => (
            <Link key={v.id} href={`/owner/vehicles/${v.id}`} className="panel overflow-hidden">
              <div
                className="h-40 bg-[var(--paper-deep)] bg-cover bg-center"
                style={{
                  backgroundImage: `url('${v.photos[0]?.url ?? "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80"}')`,
                }}
              />
              <div className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold">
                      {v.year} {v.make} {v.model}
                    </div>
                    <div className="text-sm text-[var(--ink-soft)]">{v.plate}</div>
                  </div>
                  <StatusBadge status={v.status} />
                </div>
                <div className="text-sm">
                  {formatMoney(v.dailyRateCents, launchConfig.currency)} / day
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
