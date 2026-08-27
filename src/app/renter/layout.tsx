import Link from "next/link";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { requireUser } from "@/lib/auth";

export default async function RenterLayout({ children }: { children: ReactNode }) {
  await requireUser(["RENTER", "ADMIN"]);
  return (
    <div className="min-h-screen">
      <SiteHeader active="renter" />
      <div className="shell py-8">
        <div className="mb-6 flex flex-wrap gap-3 text-sm">
          <Link href="/search">Search</Link>
          <Link href="/renter/verify">Verify</Link>
          <Link href="/renter/bookings" className="font-semibold text-[var(--accent)]">
            Bookings
          </Link>
          <Link href="/renter/support">Support</Link>
        </div>
        {children}
      </div>
    </div>
  );
}
