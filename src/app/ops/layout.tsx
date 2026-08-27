import Link from "next/link";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { requireUser } from "@/lib/auth";

export default async function OpsLayout({ children }: { children: ReactNode }) {
  await requireUser(["OPS", "ADMIN"]);
  return (
    <div className="min-h-screen">
      <SiteHeader active="ops" />
      <div className="shell py-8">
        <div className="mb-6 flex flex-wrap gap-3 text-sm">
          <Link href="/ops" className="font-semibold text-[var(--accent)]">
            Desk
          </Link>
          <Link href="/ops/vehicles">Approvals</Link>
          <Link href="/ops/fleet">Fleet</Link>
          <Link href="/ops/bookings">Bookings</Link>
          <Link href="/ops/tickets">Tickets</Link>
          <Link href="/ops/payouts">Payouts</Link>
        </div>
        {children}
      </div>
    </div>
  );
}
