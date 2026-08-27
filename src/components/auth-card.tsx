import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { PageHeader, Field, TextInput, Button } from "@/components/ui";
import { ActionForm } from "@/components/action-form";
import { SignupAccountFields } from "@/components/signup-account-fields";
import { loginAction, signupAction } from "@/lib/actions";
import { launchConfig } from "@/config/launch";

export function AuthCard({
  mode,
  defaultRole = "RENTER",
}: {
  mode: "login" | "signup";
  defaultRole?: "RENTER" | "OWNER";
}) {
  const isLogin = mode === "login";
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="shell flex justify-center py-14">
        <div className={`panel w-full p-7 ${isLogin ? "max-w-md" : "max-w-lg"}`}>
          <PageHeader
            title={isLogin ? "Welcome back" : "Create account"}
            subtitle={
              isLogin
                ? `Sign in to ${launchConfig.brandName}. Demo users use password.`
                : "First choose rent or offer cars, then whether this is a single person or a company. Ops accounts are provisioned internally."
            }
          />
          <ActionForm
            action={isLogin ? loginAction : signupAction}
            className="grid gap-4"
          >
            {!isLogin ? <SignupAccountFields defaultRole={defaultRole} /> : null}
            <Field label="Email">
              <TextInput
                name="email"
                type="email"
                required
                placeholder={isLogin ? "owner@demo.local" : "you@email.com"}
              />
            </Field>
            <Field
              label="Password"
              hint={isLogin ? "Demo seeded users: password" : "At least 6 characters"}
            >
              <TextInput name="password" type="password" required minLength={6} />
            </Field>
            <Button type="submit" className="w-full">
              {isLogin ? "Log in" : "Create account"}
            </Button>
          </ActionForm>
          <p className="mt-5 text-sm text-[var(--ink-soft)]">
            {isLogin ? (
              <>
                No account?{" "}
                <Link href="/signup" className="font-semibold text-[var(--accent)]">
                  Sign up
                </Link>
              </>
            ) : (
              <>
                Have an account?{" "}
                <Link href="/login" className="font-semibold text-[var(--accent)]">
                  Log in
                </Link>
              </>
            )}
          </p>
          {isLogin ? (
            <div className="mt-4 space-y-1 rounded-xl bg-[var(--paper-deep)] p-3 text-xs text-[var(--ink-soft)]">
              <div>Rent: renter@demo.local · company@demo.local</div>
              <div>Offer: owner@demo.local · fleet@demo.local</div>
              <div>Ops: ops@demo.local · admin@demo.local</div>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
