import type { AccountKind } from "@prisma/client";

export function accountDisplayName(user: {
  name: string | null;
  email: string;
  accountKind: AccountKind;
  companyName: string | null;
}) {
  if (user.accountKind === "COMPANY" && user.companyName) {
    return user.companyName;
  }
  return user.name ?? user.email;
}

export function accountKindLabel(kind: AccountKind) {
  return kind === "COMPANY" ? "Company" : "Single person";
}
