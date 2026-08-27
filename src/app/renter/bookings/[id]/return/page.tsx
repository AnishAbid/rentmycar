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

export default async function ReturnChecklistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser(["RENTER", "ADMIN"]);
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking || booking.renterId !== user.id) notFound();

  const action = submitChecklistAction.bind(null, id, "RETURN");

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Return checklist"
        subtitle="Submit return photos so ops can inspect and release your deposit."
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
                defaultValue={`https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=60&sig=${kind}`}
              />
            </Field>
          ))}
          <Field label="Notes">
            <TextArea name="notes" placeholder="Any new damage or issues…" />
          </Field>
          <Button type="submit">Submit return</Button>
        </ActionForm>
      </div>
    </div>
  );
}
