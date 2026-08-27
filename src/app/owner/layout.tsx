import Link from "next/link";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { requireUser } from "@/lib/auth";

export default async function OwnerLayout({ children }: { children: ReactNode }) {
  await requireUser(["OWNER", "ADMIN"]);
  return (
    <div className="min-h-screen">
      <SiteHeader active="owner" />
      <div className="shell py-8">
        <div className="mb-6 flex flex-wrap gap-3 text-sm">
          <Link href="/owner" className="font-semibold text-[var(--accent)]">
            Dashboard
          </Link>
          <Link href="/owner/onboarding">Onboarding</Link>
          <Link href="/owner/vehicles">Vehicles</Link>
          <Link href="/owner/earnings">Earnings</Link>
        </div>
        {children}
      </div>
    </div>
  );
}
