import { notFound } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import {
  Button,
  Field,
  PageHeader,
  Select,
  StatusBadge,
  TextInput,
} from "@/components/ui";
import { updateVehicleAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/domain/money";
import { launchConfig } from "@/config/launch";

export default async function OwnerVehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser(["OWNER", "ADMIN"]);
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: { documents: true, blocks: true, photos: true },
  });
  if (!vehicle || vehicle.ownerId !== user.ownerProfile?.id) notFound();

  const boundUpdate = updateVehicleAction.bind(null, id);

  return (
    <div className="space-y-8">
      <PageHeader
        title={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
        subtitle={`${vehicle.plate} · ${formatMoney(vehicle.dailyRateCents, launchConfig.currency)}/day`}
        action={<StatusBadge status={vehicle.status} />}
      />
      {vehicle.rejectionNote ? (
        <div className="alert alert-error">Rejected: {vehicle.rejectionNote}</div>
      ) : null}

      <div className="panel p-6">
        <h2 className="font-display mb-4 text-xl">Update details</h2>
        <ActionForm action={boundUpdate} className="grid-form cols-2">
          <input type="hidden" name="intent" value="update" />
          <Field label="Make">
            <TextInput name="make" defaultValue={vehicle.make} />
          </Field>
          <Field label="Model">
            <TextInput name="model" defaultValue={vehicle.model} />
          </Field>
          <Field label="Category">
            <TextInput name="category" defaultValue={vehicle.category} />
          </Field>
          <Field label="Seats">
            <TextInput name="seats" type="number" defaultValue={vehicle.seats} />
          </Field>
          <Field label="Daily rate">
            <TextInput
              name="dailyRate"
              type="number"
              step="0.01"
              defaultValue={(vehicle.dailyRateCents / 100).toFixed(2)}
            />
          </Field>
          <Field label="Location">
            <Select name="location" defaultValue={vehicle.location}>
              <option value="WITH_OWNER">With owner</option>
              <option value="DEPOT">Depot</option>
            </Select>
          </Field>
          <Field label="Mileage cap km">
            <TextInput
              name="mileageCapKm"
              type="number"
              defaultValue={vehicle.mileageCapKm ?? ""}
            />
          </Field>
          <Field label="Max trip days">
            <TextInput
              name="maxTripDays"
              type="number"
              defaultValue={vehicle.maxTripDays ?? ""}
            />
          </Field>
          <div className="md:col-span-2">
            <Button type="submit">Save changes</Button>
          </div>
        </ActionForm>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="panel p-6">
          <h2 className="font-display mb-4 text-xl">Status actions</h2>
          <div className="flex flex-wrap gap-3">
            {["DRAFT", "REJECTED"].includes(vehicle.status) ? (
              <ActionForm action={boundUpdate}>
                <input type="hidden" name="intent" value="submit" />
                <Button type="submit">Submit for review</Button>
              </ActionForm>
            ) : null}
            {vehicle.status === "LIVE" ? (
              <ActionForm action={boundUpdate} className="grid gap-3">
                <input type="hidden" name="intent" value="pause" />
                <Field label="Pause reason">
                  <TextInput name="pauseReason" placeholder="Personal use" />
                </Field>
                <Button type="submit" variant="secondary">
                  Pause vehicle
                </Button>
              </ActionForm>
            ) : null}
            {vehicle.status === "PAUSED" ? (
              <ActionForm action={boundUpdate}>
                <input type="hidden" name="intent" value="resume" />
                <Button type="submit">Resume (go live)</Button>
              </ActionForm>
            ) : null}
          </div>
        </div>

        <div className="panel p-6">
          <h2 className="font-display mb-4 text-xl">Block dates</h2>
          <ActionForm action={boundUpdate} className="grid gap-3">
            <input type="hidden" name="intent" value="block" />
            <Field label="Start">
              <TextInput name="startDate" type="date" required />
            </Field>
            <Field label="End">
              <TextInput name="endDate" type="date" required />
            </Field>
            <Field label="Reason">
              <TextInput name="reason" placeholder="Owner trip" />
            </Field>
            <Button type="submit" variant="secondary">
              Add block
            </Button>
          </ActionForm>
          {vehicle.blocks.length ? (
            <ul className="mt-4 space-y-2 text-sm text-[var(--ink-soft)]">
              {vehicle.blocks.map((b) => (
                <li key={b.id}>
                  {b.startDate.toISOString().slice(0, 10)} → {b.endDate.toISOString().slice(0, 10)}
                  {b.reason ? ` · ${b.reason}` : ""}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      <div className="panel p-6">
        <h2 className="font-display mb-3 text-xl">Documents</h2>
        <ul className="space-y-2 text-sm">
          {vehicle.documents.map((d) => (
            <li key={d.id} className="flex justify-between gap-3">
              <span>
                {d.type} · {d.url}
              </span>
              <StatusBadge status={d.status} tone="muted" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
