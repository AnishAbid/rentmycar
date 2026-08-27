import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { ActionForm } from "@/components/action-form";
import { Button, Field, PageHeader, TextInput } from "@/components/ui";
import { createBookingAction } from "@/lib/actions";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatMoney, quoteTrip } from "@/lib/domain/money";
import { launchConfig } from "@/config/launch";
import Link from "next/link";

export default async function CarDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: { photos: true },
  });
  if (!vehicle || vehicle.status !== "LIVE") notFound();

  const user = await getSessionUser();
  const fee = await prisma.feeConfig.findUnique({ where: { city: launchConfig.city } });
  const sampleStart = new Date();
  sampleStart.setDate(sampleStart.getDate() + 2);
  const sampleEnd = new Date(sampleStart);
  sampleEnd.setDate(sampleEnd.getDate() + 3);
  const quote = quoteTrip({
    dailyRateCents: vehicle.dailyRateCents,
    startAt: sampleStart,
    endAt: sampleEnd,
    config: {
      defaultDepositCents: fee?.defaultDepositCents ?? launchConfig.defaultDepositCents,
      ownerShareBps: fee?.ownerShareBps ?? launchConfig.ownerShareBps,
      platformFeeBps: fee?.platformFeeBps ?? launchConfig.platformFeeBps,
    },
  });

  const book = createBookingAction.bind(null, vehicle.id);
  const features = JSON.parse(vehicle.featuresJson || "[]") as string[];

  return (
    <div className="min-h-screen">
      <SiteHeader active="search" />
      <main className="shell grid gap-8 py-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <div
            className="mb-5 h-72 rounded-[var(--radius)] bg-cover bg-center sm:h-96"
            style={{
              backgroundImage: `url('${vehicle.photos[0]?.url ?? "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1200&q=80"}')`,
            }}
          />
          <PageHeader
            title={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
            subtitle={`${vehicle.category} · ${vehicle.seats} seats · ${vehicle.transmission.toLowerCase()} · ${vehicle.fuelType.toLowerCase()}`}
          />
          {features.length ? (
            <p className="text-[var(--ink-soft)]">Features: {features.join(", ")}</p>
          ) : null}
          <div className="mt-6 space-y-2 text-sm text-[var(--ink-soft)]">
            <p>All-in trip example (3 days): {formatMoney(quote.totalCents, launchConfig.currency)}</p>
            <p>Refundable deposit hold: {formatMoney(quote.depositCents, launchConfig.currency)}</p>
            <p>Cancellation: full refund ≥48h before pickup; 50% within 48h.</p>
          </div>
        </div>

        <div className="panel h-fit p-6">
          <h2 className="font-display mb-1 text-2xl">
            {formatMoney(vehicle.dailyRateCents, launchConfig.currency)}
            <span className="text-base font-normal text-[var(--ink-soft)]"> / day</span>
          </h2>
          <p className="mb-4 text-sm text-[var(--ink-soft)]">Ops-confirm booking (MVP)</p>

          {!user ? (
            <div className="space-y-3">
              <p className="text-sm">Log in as a verified renter to request this car.</p>
              <Link href="/login" className="btn btn-primary inline-flex">
                Log in
              </Link>
            </div>
          ) : user.role !== "RENTER" ? (
            <p className="text-sm text-[var(--ink-soft)]">Switch to a renter account to book.</p>
          ) : !user.renterProfile?.verifiedAt ? (
            <div className="space-y-3">
              <p className="text-sm">Verify your license before booking.</p>
              <Link href="/renter/verify" className="btn btn-primary inline-flex">
                Verify now
              </Link>
            </div>
          ) : (
            <ActionForm action={book} className="grid gap-4">
              <Field label="Start">
                <TextInput
                  name="startAt"
                  type="datetime-local"
                  required
                  defaultValue={toLocalInput(sampleStart)}
                />
              </Field>
              <Field label="End">
                <TextInput
                  name="endAt"
                  type="datetime-local"
                  required
                  defaultValue={toLocalInput(sampleEnd)}
                />
              </Field>
              <Button type="submit" className="w-full">
                Request booking
              </Button>
            </ActionForm>
          )}
        </div>
      </main>
    </div>
  );
}

function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
