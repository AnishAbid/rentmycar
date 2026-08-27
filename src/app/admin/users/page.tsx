import { ActionForm } from "@/components/action-form";
import { Button, PageHeader, Select, StatusBadge } from "@/components/ui";
import { updateUserStatusAction } from "@/lib/actions";
import { accountKindLabel } from "@/lib/account";
import { prisma } from "@/lib/db";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader title="Users" subtitle="Flag or ban owners and renters." />
      <div className="panel divide-y divide-[var(--line)]">
        {users.map((u) => {
          const update = updateUserStatusAction.bind(null, u.id);
          return (
            <div
              key={u.id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            >
              <div>
                <div className="font-semibold">
                  {u.name ?? "—"} · {u.email}
                </div>
                <div className="text-sm text-[var(--ink-soft)]">
                  {accountKindLabel(u.accountKind)}
                  {u.accountKind === "COMPANY" && u.companyName ? ` · ${u.companyName}` : ""} ·{" "}
                  {u.role}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge
                  status={u.status}
                  tone={
                    u.status === "BANNED"
                      ? "danger"
                      : u.status === "FLAGGED"
                        ? "warn"
                        : "muted"
                  }
                />
                <ActionForm action={update} className="flex items-center gap-2">
                  <Select name="status" defaultValue={u.status}>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="FLAGGED">FLAGGED</option>
                    <option value="BANNED">BANNED</option>
                  </Select>
                  <Button type="submit" variant="secondary" className="!py-2 text-xs">
                    Update
                  </Button>
                </ActionForm>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
