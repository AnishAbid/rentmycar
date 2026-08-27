import { notFound } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { Button, Field, PageHeader, StatusBadge, TextArea, TextInput } from "@/components/ui";
import { inspectBookingAction } from "@/lib/actions";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/domain/money";
import { launchConfig } from "@/config/launch";

export default async function OpsInspectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      vehicle: true,
      checklists: { include: { photos: true } },
      claim: true,
      payments: true,
    },
  });
  if (!booking) notFound();

  const act = inspectBookingAction.bind(null, id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Return inspection"
        subtitle={`${booking.code} · deposit ${formatMoney(booking.depositCents, launchConfig.currency)}`}
        action={<StatusBadge status={booking.status} />}
      />

      <div className="grid gap-4 md:grid-cols-2">
        {booking.checklists.map((c) => (
          <div key={c.id} className="panel p-4">
            <h3 className="font-display text-lg">{c.type}</h3>
            <p className="text-sm text-[var(--ink-soft)]">
              Odo {c.odometerKm ?? "—"} km · fuel {c.fuelLevel ?? "—"}%
            </p>
            <ul className="mt-2 space-y-1 text-xs text-[var(--ink-soft)]">
              {c.photos.map((p) => (
                <li key={p.id}>
                  {p.kind}: {p.url.slice(0, 48)}…
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="panel p-5">
          <h2 className="font-display mb-3 text-xl">Clean return</h2>
          <ActionForm action={act}>
            <input type="hidden" name="intent" value="release" />
            <Button type="submit">Release deposit</Button>
          </ActionForm>
        </div>
        <div className="panel p-5">
          <h2 className="font-display mb-3 text-xl">Capture deposit</h2>
          <ActionForm action={act} className="grid gap-3">
            <input type="hidden" name="intent" value="capture" />
            <Field label="Amount">
              <TextInput
                name="captureAmount"
                type="number"
                step="0.01"
                required
                defaultValue={(booking.depositCents / 100).toFixed(2)}
              />
            </Field>
            <Field label="Note">
              <TextInput name="note" placeholder="Cleaning fee" />
            </Field>
            <Button type="submit" variant="secondary">
              Capture
            </Button>
          </ActionForm>
        </div>
        <div className="panel p-5">
          <h2 className="font-display mb-3 text-xl">Open claim</h2>
          <ActionForm action={act} className="grid gap-3">
            <input type="hidden" name="intent" value="claim" />
            <Field label="Summary">
              <TextArea name="summary" required />
            </Field>
            <Field label="Estimate">
              <TextInput name="estimate" type="number" step="0.01" />
            </Field>
            <Field label="Evidence URL">
              <TextInput name="evidenceUrl" />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="policeReport" /> Police report filed
            </label>
            <Button type="submit" variant="danger">
              Open claim
            </Button>
          </ActionForm>
          {booking.claim ? (
            <p className="mt-3 text-sm text-[var(--ink-soft)]">
              Existing claim: {booking.claim.status} — {booking.claim.summary}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
