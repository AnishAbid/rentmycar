import { notFound } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { Button, Field, PageHeader, TextInput, TextArea } from "@/components/ui";
import { submitChecklistAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

const PHOTO_FIELDS = [
  ["EXTERIOR_FRONT", "Exterior front photo URL"],
  ["EXTERIOR_BACK", "Exterior back photo URL"],
  ["INTERIOR", "Interior photo URL"],
  ["ODOMETER", "Odometer photo URL"],
  ["FUEL", "Fuel gauge photo URL"],
] as const;

export default async function PickupChecklistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser(["RENTER", "ADMIN"]);
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking || booking.renterId !== user.id) notFound();

  const action = submitChecklistAction.bind(null, id, "PICKUP");

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Pickup checklist"
        subtitle="Mandatory photos start the trip and protect both sides."
      />
      <div className="panel p-6">
        <ActionForm action={action} className="grid gap-4">
          <div className="grid-form cols-2">
            <Field label="Odometer (km)">
              <TextInput name="odometerKm" type="number" required />
            </Field>
            <Field label="Fuel level (0–100)">
              <TextInput name="fuelLevel" type="number" min={0} max={100} required />
            </Field>
          </div>
          {PHOTO_FIELDS.map(([kind, label]) => (
            <Field key={kind} label={label}>
              <TextInput
                name={`photo_${kind}`}
                required
                defaultValue={`https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=600&q=60&sig=${kind}`}
              />
            </Field>
          ))}
          <Field label="Notes">
            <TextArea name="notes" placeholder="Existing scratches, fuel note…" />
          </Field>
          <Button type="submit">Submit pickup</Button>
        </ActionForm>
      </div>
    </div>
  );
}
