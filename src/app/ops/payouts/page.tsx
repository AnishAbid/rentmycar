import { ActionForm } from "@/components/action-form";
import { Button, EmptyState, PageHeader } from "@/components/ui";
import { createPayoutBatchAction } from "@/lib/actions";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/domain/money";
import { launchConfig } from "@/config/launch";

export default async function OpsPayoutsPage() {
  const pending = await prisma.ledgerEntry.findMany({
    where: { type: "OWNER_SHARE", payoutId: null },
    include: { booking: true },
  });
  const batches = await prisma.payoutBatch.findMany({
    include: { payouts: { include: { owner: { include: { user: true } } } } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const pendingTotal = pending.reduce((s, r) => s + r.amountCents, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Owner payouts"
        subtitle="Batch eligible owner-share ledger rows after trip settlement."
      />
      <div className="panel flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <div className="text-sm text-[var(--ink-soft)]">Pending owner share</div>
          <div className="text-2xl font-semibold">
            {formatMoney(pendingTotal, launchConfig.currency)} ({pending.length} rows)
          </div>
        </div>
        <ActionForm action={createPayoutBatchAction}>
          <Button type="submit">Create payout batch</Button>
        </ActionForm>
      </div>

      {batches.length === 0 ? (
        <EmptyState>No payout batches yet.</EmptyState>
      ) : (
        <div className="space-y-3">
          {batches.map((b) => (
            <div key={b.id} className="panel p-4">
              <div className="mb-2 font-semibold">
                Batch {b.id.slice(0, 8)} · {b.status} ·{" "}
                {b.paidAt?.toISOString().slice(0, 10) ?? "—"}
              </div>
              <ul className="text-sm text-[var(--ink-soft)]">
                {b.payouts.map((p) => (
                  <li key={p.id}>
                    {p.owner.user.email}: {formatMoney(p.amountCents, p.currency)}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
