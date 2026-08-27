import { ActionForm } from "@/components/action-form";
import { Button, Field, PageHeader, TextInput } from "@/components/ui";
import { saveFeeConfigAction } from "@/lib/actions";
import { prisma } from "@/lib/db";
import { launchConfig } from "@/config/launch";

export default async function AdminSettingsPage() {
  const fee =
    (await prisma.feeConfig.findUnique({ where: { city: launchConfig.city } })) ??
    null;

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Launch settings"
        subtitle="Commission, deposit, and policy defaults for new bookings."
      />
      <div className="panel p-6">
        <ActionForm action={saveFeeConfigAction} className="grid-form cols-2">
          <Field label="City">
            <TextInput name="city" defaultValue={fee?.city ?? launchConfig.city} required />
          </Field>
          <Field label="Currency">
            <TextInput name="currency" defaultValue={fee?.currency ?? launchConfig.currency} required />
          </Field>
          <Field label="Owner share %">
            <TextInput
              name="ownerSharePercent"
              type="number"
              min={0}
              max={100}
              step="1"
              required
              defaultValue={String((fee?.ownerShareBps ?? launchConfig.ownerShareBps) / 100)}
            />
          </Field>
          <Field label="Default deposit">
            <TextInput
              name="deposit"
              type="number"
              step="0.01"
              required
              defaultValue={((fee?.defaultDepositCents ?? launchConfig.defaultDepositCents) / 100).toFixed(2)}
            />
          </Field>
          <Field label="Min renter age">
            <TextInput
              name="minRenterAge"
              type="number"
              defaultValue={fee?.minRenterAge ?? launchConfig.minRenterAge}
            />
          </Field>
          <Field label="Soft hold hours">
            <TextInput
              name="softHoldHours"
              type="number"
              defaultValue={fee?.softHoldHours ?? launchConfig.softHoldHours}
            />
          </Field>
          <Field label="Full refund window (hours)">
            <TextInput
              name="cancelFullRefundHours"
              type="number"
              defaultValue={
                fee?.cancelFullRefundHours ?? launchConfig.cancelFullRefundHours
              }
            />
          </Field>
          <Field label="Payout hold hours">
            <TextInput
              name="payoutHoldHours"
              type="number"
              defaultValue={fee?.payoutHoldHours ?? launchConfig.payoutHoldHours}
            />
          </Field>
          <div className="md:col-span-2">
            <Button type="submit">Save settings</Button>
          </div>
        </ActionForm>
      </div>
    </div>
  );
}
