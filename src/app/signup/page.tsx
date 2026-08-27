import { AuthCard } from "@/components/auth-card";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role } = await searchParams;
  return <AuthCard mode="signup" defaultRole={role === "OWNER" ? "OWNER" : "RENTER"} />;
}
