import { ActionForm } from "@/components/action-form";
import {
  Button,
  EmptyState,
  Field,
  PageHeader,
  StatusBadge,
  TextArea,
} from "@/components/ui";
import { replyTicketAction, resolveTicketAction } from "@/lib/actions";
import { prisma } from "@/lib/db";

export default async function OpsTicketsPage() {
  const tickets = await prisma.supportTicket.findMany({
    include: {
      requester: true,
      messages: { include: { author: true }, orderBy: { createdAt: "asc" } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <PageHeader title="Support tickets" subtitle="Ops-mediated client support." />
      {tickets.length === 0 ? (
        <EmptyState>No tickets.</EmptyState>
      ) : (
        <div className="space-y-4">
          {tickets.map((t) => {
            const reply = replyTicketAction.bind(null, t.id);
            return (
              <div key={t.id} className="panel p-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold">{t.subject}</div>
                    <div className="text-sm text-[var(--ink-soft)]">
                      {t.requester.email} · {t.priority}
                    </div>
                  </div>
                  <StatusBadge status={t.status} tone="muted" />
                </div>
                <div className="mb-4 space-y-2 rounded-xl bg-[var(--paper)] p-3 text-sm">
                  {t.messages.map((m) => (
                    <p key={m.id}>
                      <span className="font-semibold">
                        {m.author.role === "OPS" || m.author.role === "ADMIN"
                          ? "Ops"
                          : m.author.name ?? m.author.email}
                        :
                      </span>{" "}
                      {m.body}
                    </p>
                  ))}
                </div>
                {t.status !== "RESOLVED" && t.status !== "CLOSED" ? (
                  <div className="flex flex-wrap items-end gap-3">
                    <ActionForm action={reply} className="grid min-w-[280px] flex-1 gap-2">
                      <Field label="Reply">
                        <TextArea name="body" required />
                      </Field>
                      <Button type="submit">Send reply</Button>
                    </ActionForm>
                    <form action={resolveTicketAction.bind(null, t.id)}>
                      <Button type="submit" variant="secondary">
                        Resolve
                      </Button>
                    </form>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
