import { PageHeader, StatusBadge } from "@/components/ui";
import { VEHICLE_STATUS_PIPELINE } from "@/lib/domain/types";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/domain/money";
import { launchConfig } from "@/config/launch";

export default async function OpsFleetPage() {
  const vehicles = await prisma.vehicle.findMany({
    include: { owner: { include: { user: true } } },
    orderBy: { updatedAt: "desc" },
  });

  const counts = Object.fromEntries(
    VEHICLE_STATUS_PIPELINE.map((s) => [s, vehicles.filter((v) => v.status === s).length]),
  );

  return (
    <div>
      <PageHeader title="Fleet board" subtitle="Central inventory across all owner cars." />
      <div className="mb-6 flex flex-wrap gap-2">
        {VEHICLE_STATUS_PIPELINE.map((s) => (
          <span key={s} className="badge badge-muted">
            {s.replaceAll("_", " ")} {counts[s]}
          </span>
        ))}
      </div>
      <div className="panel divide-y divide-[var(--line)]">
        {vehicles.map((v) => (
          <div key={v.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div>
              <div className="font-semibold">
                {v.year} {v.make} {v.model} · {v.plate}
              </div>
              <div className="text-sm text-[var(--ink-soft)]">
                {v.owner.user.email} · {v.location} ·{" "}
                {formatMoney(v.dailyRateCents, launchConfig.currency)}/day
              </div>
            </div>
            <StatusBadge status={v.status} />
          </div>
        ))}
      </div>
    </div>
  );
}
