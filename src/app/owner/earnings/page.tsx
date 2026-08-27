import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/domain/money";
import { launchConfig } from "@/config/launch";

export default async function OwnerEarningsPage() {
  const user = await requireUser(["OWNER", "ADMIN"]);
  const ownerId = user.ownerProfile?.id;
  const entries = ownerId
    ? await prisma.ledgerEntry.findMany({
        where: { OR: [{ ownerId }, { payout: { ownerId } }] },
        orderBy: { createdAt: "desc" },
        take: 40,
      })
    : [];

  const pending = entries
    .filter((e) => e.type === "OWNER_SHARE" && !e.payoutId)
    .reduce((s, e) => s + e.amountCents, 0);
  const paid = entries
    .filter((e) => e.type === "PAYOUT")
    .reduce((s, e) => s + e.amountCents, 0);
  const gross = entries
    .filter((e) => e.type === "OWNER_SHARE")
    .reduce((s, e) => s + e.amountCents, 0);

  return (
    <div>
      <PageHeader
        title="Earnings"
        subtitle={`Default split ${launchConfig.ownerShareBps / 100}% owner / ${launchConfig.platformFeeBps / 100}% platform on base rental.`}
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Gross owner share" value={formatMoney(gross, launchConfig.currency)} />
        <Stat label="Pending" value={formatMoney(pending, launchConfig.currency)} />
        <Stat label="Paid out" value={formatMoney(paid, launchConfig.currency)} />
      </div>
      <div className="panel overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--paper-deep)] text-[var(--ink-soft)]">
            <tr>
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-t border-[var(--line)]">
                <td className="px-4 py-3">{e.createdAt.toISOString().slice(0, 10)}</td>
                <td className="px-4 py-3">{e.type}</td>
                <td className="px-4 py-3">
                  {formatMoney(e.amountCents, e.currency)}
                </td>
              </tr>
            ))}
            {!entries.length ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-[var(--ink-soft)]">
                  No ledger entries yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
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
