import { ActionForm } from "@/components/action-form";
import { Button, Field, PageHeader, Select, TextInput } from "@/components/ui";
import { saveOwnerOnboarding } from "@/lib/actions";
import { requireUser } from "@/lib/auth";

export default async function OwnerOnboardingPage() {
  const user = await requireUser(["OWNER", "ADMIN"]);
  const p = user.ownerProfile;

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Owner onboarding"
        subtitle={
          user.accountKind === "COMPANY"
            ? "Company and payout details are required before your first payout."
            : "Payout details are required before your first payout."
        }
      />
      <div className="panel p-6">
        <ActionForm action={saveOwnerOnboarding} className="grid-form cols-2">
          {user.accountKind === "COMPANY" ? (
            <>
              <Field label="Company name">
                <TextInput
                  name="companyName"
                  required
                  defaultValue={user.companyName ?? ""}
                  placeholder="Northwind Logistics"
                />
              </Field>
              <Field label="Company registration" hint="Optional">
                <TextInput
                  name="companyRegistration"
                  defaultValue={user.companyRegistration ?? ""}
                  placeholder="REG-10482"
                />
              </Field>
            </>
          ) : null}
          <Field label="Phone">
            <TextInput name="phone" required defaultValue={p?.phone ?? ""} placeholder="+1 555 0100" />
          </Field>
          <Field label="Payout method">
            <Select name="payoutMethodHint" defaultValue={p?.payoutMethodHint ?? "bank"} required>
              <option value="bank">Bank transfer</option>
              <option value="stripe">Stripe Connect</option>
              <option value="paypal">PayPal</option>
            </Select>
          </Field>
          <Field label="Bank account last 4" hint="Optional for MVP stub">
            <TextInput
              name="bankAccountLast4"
              defaultValue={p?.bankAccountLast4 ?? ""}
              pattern="\d{4}"
              placeholder="4242"
            />
          </Field>
          <Field label="Contract type">
            <Select name="contractType" defaultValue={p?.contractType ?? "REVENUE_SHARE"}>
              <option value="REVENUE_SHARE">Revenue share</option>
              <option value="FIXED_LEASE">Fixed lease</option>
              <option value="HYBRID">Hybrid</option>
            </Select>
          </Field>
          <div className="md:col-span-2">
            <Button type="submit">Save onboarding</Button>
          </div>
        </ActionForm>
      </div>
    </div>
  );
}
