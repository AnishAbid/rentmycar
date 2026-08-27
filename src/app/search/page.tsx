import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Button, Field, PageHeader, Select, TextInput, EmptyState } from "@/components/ui";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/domain/money";
import { launchConfig } from "@/config/launch";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const category = sp.category;
  const transmission = sp.transmission;
  const seats = sp.seats ? Number(sp.seats) : undefined;
  const maxPrice = sp.maxPrice ? Math.round(Number(sp.maxPrice) * 100) : undefined;

  const vehicles = await prisma.vehicle.findMany({
    where: {
      status: "LIVE",
      ...(category ? { category } : {}),
      ...(transmission === "AUTOMATIC" || transmission === "MANUAL"
        ? { transmission }
        : {}),
      ...(seats ? { seats: { gte: seats } } : {}),
      ...(maxPrice ? { dailyRateCents: { lte: maxPrice } } : {}),
    },
    include: { photos: { take: 1 } },
    orderBy: { dailyRateCents: "asc" },
  });

  return (
    <div className="min-h-screen">
      <SiteHeader active="search" />
      <main className="shell py-10">
        <PageHeader
          title="Search cars"
          subtitle={`Available in ${launchConfig.city}. Ops confirms each booking.`}
        />
        <form className="panel mb-8 grid gap-3 p-4 sm:grid-cols-5">
          <Field label="Category">
            <Select name="category" defaultValue={category ?? ""}>
              <option value="">Any</option>
              <option value="economy">Economy</option>
              <option value="suv">SUV</option>
              <option value="luxury">Luxury</option>
              <option value="van">Van</option>
            </Select>
          </Field>
          <Field label="Transmission">
            <Select name="transmission" defaultValue={transmission ?? ""}>
              <option value="">Any</option>
              <option value="AUTOMATIC">Automatic</option>
              <option value="MANUAL">Manual</option>
            </Select>
          </Field>
          <Field label="Min seats">
            <TextInput name="seats" type="number" min={2} defaultValue={seats ?? ""} />
          </Field>
          <Field label="Max daily rate">
            <TextInput name="maxPrice" type="number" step="1" defaultValue={sp.maxPrice ?? ""} />
          </Field>
          <div className="flex items-end">
            <Button type="submit" className="w-full">
              Filter
            </Button>
          </div>
        </form>

        {vehicles.length === 0 ? (
          <EmptyState>No live vehicles match these filters.</EmptyState>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {vehicles.map((v) => (
              <Link key={v.id} href={`/cars/${v.id}`} className="panel overflow-hidden transition hover:-translate-y-0.5">
                <div
                  className="h-44 bg-cover bg-center"
                  style={{
                    backgroundImage: `url('${v.photos[0]?.url ?? "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80"}')`,
                  }}
                />
                <div className="space-y-1 p-4">
                  <div className="font-semibold">
                    {v.year} {v.make} {v.model}
                  </div>
                  <div className="text-sm text-[var(--ink-soft)]">
                    {v.category} · {v.seats} seats · {v.transmission.toLowerCase()}
                  </div>
                  <div className="pt-1 font-semibold text-[var(--accent)]">
                    {formatMoney(v.dailyRateCents, launchConfig.currency)} / day
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
