import { ActionForm } from "@/components/action-form";
import { Button, Field, PageHeader, TextInput } from "@/components/ui";
import { saveRenterVerification } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { launchConfig } from "@/config/launch";

export default async function RenterVerifyPage() {
  const user = await requireUser(["RENTER", "ADMIN"]);
  const p = user.renterProfile;

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Driver verification"
        subtitle={
          user.accountKind === "COMPANY"
            ? `License for the designated driver, plus company details. Minimum age ${launchConfig.minRenterAge}+.`
            : `License + date of birth. Minimum age ${launchConfig.minRenterAge}+.`
        }
      />
      {p?.verifiedAt ? (
        <div className="alert alert-ok mb-4">
          Verified on {p.verifiedAt.toISOString().slice(0, 10)}. You can update details below.
        </div>
      ) : null}
      <div className="panel p-6">
        <ActionForm action={saveRenterVerification} className="grid-form cols-2">
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
            <TextInput name="phone" defaultValue={p?.phone ?? ""} />
          </Field>
          <Field label="Date of birth">
            <TextInput
              name="dateOfBirth"
              type="date"
              required
              defaultValue={p?.dateOfBirth ? p.dateOfBirth.toISOString().slice(0, 10) : ""}
            />
          </Field>
          <Field label="License number">
            <TextInput name="licenseNumber" required defaultValue={p?.licenseNumber ?? ""} />
          </Field>
          <Field label="License country">
            <TextInput name="licenseCountry" required defaultValue={p?.licenseCountry ?? "US"} />
          </Field>
          <div className="md:col-span-2">
            <Field label="License image URL" hint="Upload integration later — paste a URL for MVP">
              <TextInput
                name="licenseImageUrl"
                defaultValue={p?.licenseImageUrl ?? "/docs/license.jpg"}
              />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Button type="submit">Save verification</Button>
          </div>
        </ActionForm>
      </div>
    </div>
  );
}
