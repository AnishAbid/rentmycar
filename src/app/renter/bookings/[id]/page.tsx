import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { Button, Field, PageHeader, StatusBadge, TextInput } from "@/components/ui";
import { cancelBookingAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/domain/money";
import { launchConfig } from "@/config/launch";

export default async function RenterBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser(["RENTER", "ADMIN"]);
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { vehicle: true, checklists: true },
  });
  if (!booking || (user.role === "RENTER" && booking.renterId !== user.id)) notFound();

  const cancel = cancelBookingAction.bind(null, id);

  return (
    <div className="space-y-6">
      <PageHeader
        title={booking.code}
        subtitle={`${booking.vehicle.year} ${booking.vehicle.make} ${booking.vehicle.model}`}
        action={<StatusBadge status={booking.status} />}
      />
      <div className="panel grid gap-3 p-5 text-sm sm:grid-cols-2">
        <div>
          <div className="text-[var(--ink-soft)]">Trip</div>
          <div>
            {booking.startAt.toLocaleString()} → {booking.endAt.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-[var(--ink-soft)]">Total / deposit</div>
          <div>
            {formatMoney(booking.totalCents, launchConfig.currency)} · deposit{" "}
            {formatMoney(booking.depositCents, launchConfig.currency)}
          </div>
        </div>
        <div className="sm:col-span-2">
          <div className="text-[var(--ink-soft)]">Pickup instructions</div>
          <div>{booking.pickupInstructions || "Waiting for ops confirmation."}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {booking.status === "CONFIRMED" ? (
          <Link href={`/renter/bookings/${id}/pickup`} className="btn btn-primary">
            Pickup checklist
          </Link>
        ) : null}
        {booking.status === "ACTIVE" ? (
          <Link href={`/renter/bookings/${id}/return`} className="btn btn-primary">
            Return checklist
          </Link>
        ) : null}
        {["PENDING_CONFIRMATION", "CONFIRMED"].includes(booking.status) ? (
          <ActionForm action={cancel} className="flex flex-wrap items-end gap-2">
            <Field label="Cancel reason">
              <TextInput name="cancelReason" placeholder="Plans changed" />
            </Field>
            <Button type="submit" variant="danger">
              Cancel booking
            </Button>
          </ActionForm>
        ) : null}
      </div>
    </div>
  );
}
