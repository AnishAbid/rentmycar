import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/db";

export const SESSION_COOKIE = "rmc_session";

export async function getSessionUser() {
  const jar = await cookies();
  const userId = jar.get(SESSION_COOKIE)?.value;
  if (!userId) return null;
  return prisma.user.findUnique({
    where: { id: userId },
    include: { ownerProfile: true, renterProfile: true },
  });
}

export async function requireUser(roles?: Role[]) {
  const user = await getSessionUser();
  if (!user || user.status === "BANNED") {
    redirect("/login");
  }
  if (roles && !roles.includes(user.role)) {
    redirect("/");
  }
  return user;
}

export async function setSession(userId: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}
