import Link from "next/link";
import { launchConfig } from "@/config/launch";
import { getSessionUser } from "@/lib/auth";
import { logoutAction } from "@/lib/actions";
import { accountDisplayName } from "@/lib/account";
import { Button } from "@/components/ui";

export async function SiteHeader({
  active,
}: {
  active?: "home" | "search" | "owner" | "renter" | "ops" | "admin";
}) {
  const user = await getSessionUser();

  return (
    <header className="border-b border-[var(--line)]/80 bg-[color-mix(in_srgb,var(--surface)_80%,transparent)] backdrop-blur-md">
      <div className="shell flex items-center justify-between gap-4 py-4">
        <Link href="/" className="font-display text-xl font-semibold tracking-tight">
          {launchConfig.brandName}
        </Link>
        <nav className="flex flex-wrap items-center gap-3 text-sm text-[var(--ink-soft)]">
          <NavLink href="/search" current={active === "search"}>
            Search
          </NavLink>
          <NavLink href="/owner" current={active === "owner"}>
            Owner
          </NavLink>
          <NavLink href="/renter/bookings" current={active === "renter"}>
            Renter
          </NavLink>
          <NavLink href="/ops" current={active === "ops"}>
            Ops
          </NavLink>
          <NavLink href="/admin/settings" current={active === "admin"}>
            Admin
          </NavLink>
          {user ? (
            <form action={logoutAction} className="flex items-center gap-2">
              <span className="hidden text-xs sm:inline">{accountDisplayName(user)}</span>
              <Button type="submit" variant="secondary" className="!px-3 !py-1.5 text-xs">
                Log out
              </Button>
            </form>
          ) : (
            <>
              <Link href="/login" className="btn btn-secondary !px-3 !py-1.5 text-xs">
                Log in
              </Link>
              <Link href="/signup" className="btn btn-primary !px-3 !py-1.5 text-xs">
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

function NavLink({
  href,
  current,
  children,
}: {
  href: string;
  current?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={current ? "font-semibold text-[var(--ink)]" : "hover:text-[var(--ink)]"}
    >
      {children}
    </Link>
  );
}
