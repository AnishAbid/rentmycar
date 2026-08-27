import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { Button, Field, PageHeader, StatusBadge, TextArea, TextInput } from "@/components/ui";
import { cancelBookingAction, opsBookingAction } from "@/lib/actions";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/domain/money";
import { launchConfig } from "@/config/launch";

export default async function OpsBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { vehicle: true, renter: { include: { renterProfile: true } } },
  });
  if (!booking) notFound();

  const act = opsBookingAction.bind(null, id);
  const cancel = cancelBookingAction.bind(null, id);

  return (
    <div className="space-y-6">
      <PageHeader
        title={booking.code}
        subtitle={`${booking.vehicle.year} ${booking.vehicle.make} ${booking.vehicle.model} · ${
          booking.renter.accountKind === "COMPANY" && booking.renter.companyName
            ? `${booking.renter.companyName} · `
            : ""
        }${booking.renter.email}`}
        action={<StatusBadge status={booking.status} />}
      />
      <div className="panel grid gap-3 p-5 text-sm sm:grid-cols-2">
        <div>
          Trip: {booking.startAt.toLocaleString()} → {booking.endAt.toLocaleString()}
        </div>
        <div>
          Total {formatMoney(booking.totalCents, launchConfig.currency)} · deposit{" "}
          {formatMoney(booking.depositCents, launchConfig.currency)}
        </div>
        <div>
          License: {booking.renter.renterProfile?.licenseNumber ?? "—"} (
          {booking.renter.renterProfile?.licenseCountry ?? "—"})
        </div>
        {booking.renter.accountKind === "COMPANY" ? (
          <div>
            Company account
            {booking.renter.companyRegistration
              ? ` · ${booking.renter.companyRegistration}`
              : ""}
          </div>
        ) : (
          <div>Single person renter</div>
        )}
        <div>
          Soft hold expires:{" "}
          {booking.softHoldExpiresAt?.toLocaleString() ?? "—"}
        </div>
      </div>

      {booking.status === "PENDING_CONFIRMATION" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="panel p-5">
            <h2 className="font-display mb-3 text-xl">Confirm booking</h2>
            <ActionForm action={act} className="grid gap-3">
              <input type="hidden" name="intent" value="confirm" />
              <Field label="Pickup instructions">
                <TextArea
                  name="pickupInstructions"
                  defaultValue={
                    booking.pickupInstructions ??
                    `Meet at ${launchConfig.city} depot. Bring license matching verification.`
                  }
                />
              </Field>
              <Field label="Return instructions">
                <TextArea
                  name="returnInstructions"
                  defaultValue={booking.returnInstructions ?? "Return with same fuel level."}
                />
              </Field>
              <Button type="submit">Confirm & capture payment</Button>
            </ActionForm>
          </div>
          <div className="panel p-5">
            <h2 className="font-display mb-3 text-xl">Decline</h2>
            <ActionForm action={act} className="grid gap-3">
              <input type="hidden" name="intent" value="decline" />
              <Field label="Note">
                <TextArea name="note" required placeholder="Car unavailable / risk" />
              </Field>
              <Button type="submit" variant="danger">
                Decline
              </Button>
            </ActionForm>
          </div>
        </div>
      ) : (
        <div className="panel p-5">
          <h2 className="font-display mb-3 text-xl">Update instructions</h2>
          <ActionForm action={act} className="grid gap-3">
            <input type="hidden" name="intent" value="instructions" />
            <Field label="Pickup instructions">
              <TextArea
                name="pickupInstructions"
                defaultValue={booking.pickupInstructions ?? ""}
              />
            </Field>
            <Field label="Return instructions">
              <TextArea
                name="returnInstructions"
                defaultValue={booking.returnInstructions ?? ""}
              />
            </Field>
            <Button type="submit" variant="secondary">
              Save instructions
            </Button>
          </ActionForm>
        </div>
      )}

      {["PENDING_CONFIRMATION", "CONFIRMED"].includes(booking.status) ? (
        <div className="panel p-5">
          <h2 className="font-display mb-3 text-xl">Force cancel</h2>
          <ActionForm action={cancel} className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <Field label="Reason">
              <TextInput name="cancelReason" required />
            </Field>
            <Button type="submit" variant="danger">
              Cancel
            </Button>
          </ActionForm>
        </div>
      ) : null}

      {(booking.status === "RETURNED" || booking.status === "CLAIM") && (
        <Link href={`/ops/bookings/${id}/inspect`} className="btn btn-primary inline-flex">
          Open inspection
        </Link>
      )}
    </div>
  );
}
