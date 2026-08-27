import Link from "next/link";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/domain/money";
import { launchConfig } from "@/config/launch";

export default async function OwnerHomePage() {
  const user = await requireUser(["OWNER", "ADMIN"]);
  const profile = user.ownerProfile;
  const vehicles = profile
    ? await prisma.vehicle.findMany({
        where: { ownerId: profile.id },
        orderBy: { updatedAt: "desc" },
        take: 8,
      })
    : [];
  const pendingShare = profile
    ? await prisma.ledgerEntry.aggregate({
        where: { ownerId: profile.id, type: "OWNER_SHARE", payoutId: null },
        _sum: { amountCents: true },
      })
    : { _sum: { amountCents: 0 } };

  return (
    <div>
      <PageHeader
        title={
          user.accountKind === "COMPANY" && user.companyName
            ? user.companyName
            : `Hello${user.name ? `, ${user.name.split(" ")[0]}` : ""}`
        }
        subtitle={
          user.accountKind === "COMPANY"
            ? "Company fleet dashboard. Clients are handled by platform ops."
            : "Track supply status and earnings. Clients are handled by platform ops."
        }
        action={
          <Link href="/owner/vehicles/new" className="btn btn-primary">
            Add vehicle
          </Link>
        }
      />
      {!profile?.onboardingDone ? (
        <div className="alert alert-error mb-6">
          Finish{" "}
          <Link href="/owner/onboarding" className="font-semibold underline">
            onboarding
          </Link>{" "}
          before listing cars.
        </div>
      ) : null}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Vehicles" value={String(vehicles.length)} />
        <Stat
          label="Pending payout"
          value={formatMoney(pendingShare._sum.amountCents ?? 0, launchConfig.currency)}
        />
        <Stat
          label="Owner share"
          value={`${(profile?.ownerShareBps ?? launchConfig.ownerShareBps) / 100}%`}
        />
      </div>
      <h2 className="font-display mb-3 text-2xl">Recent vehicles</h2>
      {vehicles.length === 0 ? (
        <EmptyState>
          No vehicles yet.{" "}
          <Link href="/owner/vehicles/new" className="font-semibold text-[var(--accent)]">
            Add your first car
          </Link>
        </EmptyState>
      ) : (
        <div className="panel divide-y divide-[var(--line)] overflow-hidden">
          {vehicles.map((v) => (
            <Link
              key={v.id}
              href={`/owner/vehicles/${v.id}`}
              className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-white/60"
            >
              <div>
                <div className="font-semibold">
                  {v.year} {v.make} {v.model}
                </div>
                <div className="text-sm text-[var(--ink-soft)]">{v.plate}</div>
              </div>
              <StatusBadge
                status={v.status}
                tone={
                  v.status === "REJECTED"
                    ? "danger"
                    : v.status === "PENDING_REVIEW"
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel p-4">
      <div className="text-sm text-[var(--ink-soft)]">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}
