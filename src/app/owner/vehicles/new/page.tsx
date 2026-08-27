import { ActionForm } from "@/components/action-form";
import { Button, Field, PageHeader, Select, TextInput } from "@/components/ui";
import { createVehicleAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { launchConfig } from "@/config/launch";
import Link from "next/link";

export default async function NewVehiclePage() {
  const user = await requireUser(["OWNER", "ADMIN"]);
  if (!user.ownerProfile?.onboardingDone) {
    return (
      <div>
        <PageHeader title="Add vehicle" />
        <div className="alert alert-error">
          Complete{" "}
          <Link href="/owner/onboarding" className="underline">
            onboarding
          </Link>{" "}
          first.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Add vehicle"
        subtitle={`Listed in ${launchConfig.city}. Submit for ops review when ready.`}
      />
      <div className="panel p-6">
        <ActionForm action={createVehicleAction} className="grid-form cols-2">
          <Field label="Make">
            <TextInput name="make" required placeholder="Toyota" />
          </Field>
          <Field label="Model">
            <TextInput name="model" required placeholder="Corolla" />
          </Field>
          <Field label="Year">
            <TextInput name="year" type="number" required min={1990} max={2030} defaultValue={2022} />
          </Field>
          <Field label="Plate">
            <TextInput name="plate" required placeholder="ABC-123" />
          </Field>
          <Field label="VIN">
            <TextInput name="vin" placeholder="Optional" />
          </Field>
          <Field label="Category">
            <Select name="category" required defaultValue="economy">
              <option value="economy">Economy</option>
              <option value="suv">SUV</option>
              <option value="luxury">Luxury</option>
              <option value="van">Van</option>
            </Select>
          </Field>
          <Field label="Seats">
            <TextInput name="seats" type="number" min={2} max={15} defaultValue={5} />
          </Field>
          <Field label="Daily rate (USD)">
            <TextInput name="dailyRate" type="number" step="0.01" min={1} required placeholder="45" />
          </Field>
          <Field label="Transmission">
            <Select name="transmission" defaultValue="AUTOMATIC">
              <option value="AUTOMATIC">Automatic</option>
              <option value="MANUAL">Manual</option>
            </Select>
          </Field>
          <Field label="Fuel">
            <Select name="fuelType" defaultValue="PETROL">
              <option value="PETROL">Petrol</option>
              <option value="DIESEL">Diesel</option>
              <option value="HYBRID">Hybrid</option>
              <option value="ELECTRIC">Electric</option>
            </Select>
          </Field>
          <Field label="Handover location">
            <Select name="location" defaultValue="WITH_OWNER">
              <option value="WITH_OWNER">With owner</option>
              <option value="DEPOT">Platform depot</option>
            </Select>
          </Field>
          <Field label="Mileage cap (km/day)">
            <TextInput name="mileageCapKm" type="number" placeholder="200" />
          </Field>
          <Field label="Max trip days">
            <TextInput name="maxTripDays" type="number" placeholder="14" />
          </Field>
          <Field label="Features" hint="Comma-separated">
            <TextInput name="features" placeholder="Bluetooth, Backup camera" />
          </Field>
          <Field label="Cover photo URL">
            <TextInput name="photoUrl" placeholder="https://..." defaultValue="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80" />
          </Field>
          <div className="md:col-span-2">
            <Field label="Registration document URL">
              <TextInput name="registrationUrl" defaultValue="/docs/registration.pdf" />
            </Field>
          </div>
          <div className="md:col-span-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="submitForReview" defaultChecked />
              Submit for ops review now
            </label>
          </div>
          <div className="md:col-span-2">
            <Button type="submit">Save vehicle</Button>
          </div>
        </ActionForm>
      </div>
    </div>
  );
}
