import { ActionForm } from "@/components/action-form";
import {
  Button,
  EmptyState,
  Field,
  PageHeader,
  StatusBadge,
  TextArea,
} from "@/components/ui";
import { reviewVehicleAction } from "@/lib/actions";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/domain/money";
import { launchConfig } from "@/config/launch";

export default async function OpsVehiclesPage() {
  const vehicles = await prisma.vehicle.findMany({
    where: { status: "PENDING_REVIEW" },
    include: { owner: { include: { user: true } }, documents: true, photos: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Vehicle approvals"
        subtitle="Approve docs and listing quality before cars go live."
      />
      {vehicles.length === 0 ? (
        <EmptyState>No vehicles pending review.</EmptyState>
      ) : (
        <div className="space-y-5">
          {vehicles.map((v) => {
            const review = reviewVehicleAction.bind(null, v.id);
            return (
              <div key={v.id} className="panel grid gap-4 p-5 lg:grid-cols-[1fr_280px]">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-xl">
                      {v.year} {v.make} {v.model}
                    </h2>
                    <StatusBadge status={v.status} tone="warn" />
                  </div>
                  <p className="text-sm text-[var(--ink-soft)]">
                    {v.plate} · {formatMoney(v.dailyRateCents, launchConfig.currency)}/day · owner{" "}
                    {v.owner.user.email}
                  </p>
                  <ul className="mt-3 text-sm text-[var(--ink-soft)]">
                    {v.documents.map((d) => (
                      <li key={d.id}>
                        {d.type}: {d.url}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-3">
                  <ActionForm action={review} className="grid gap-2">
                    <input type="hidden" name="decision" value="approve" />
                    <Button type="submit">Approve</Button>
                  </ActionForm>
                  <ActionForm action={review} className="grid gap-2">
                    <input type="hidden" name="decision" value="reject" />
                    <Field label="Rejection note">
                      <TextArea name="note" required placeholder="Missing registration photo" />
                    </Field>
                    <Button type="submit" variant="danger">
                      Reject
                    </Button>
                  </ActionForm>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
