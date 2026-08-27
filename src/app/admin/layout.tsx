import Link from "next/link";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { requireUser } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireUser(["ADMIN"]);
  return (
    <div className="min-h-screen">
      <SiteHeader active="admin" />
      <div className="shell py-8">
        <div className="mb-6 flex flex-wrap gap-3 text-sm">
          <Link href="/admin/settings" className="font-semibold text-[var(--accent)]">
            Settings
          </Link>
          <Link href="/admin/users">Users</Link>
        </div>
        {children}
      </div>
    </div>
  );
}
