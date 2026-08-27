import { ActionForm } from "@/components/action-form";
import { Button, Field, PageHeader, Select, TextArea, TextInput, EmptyState, StatusBadge } from "@/components/ui";
import { createSupportTicketAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function RenterSupportPage() {
  const user = await requireUser(["RENTER", "OWNER", "ADMIN"]);
  const tickets = await prisma.supportTicket.findMany({
    where: { requesterId: user.id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
    orderBy: { updatedAt: "desc" },
  });
  const bookings = await prisma.booking.findMany({
    where: { renterId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div>
        <PageHeader
          title="Support"
          subtitle="Message platform ops — owners are not in this thread."
        />
        <div className="panel p-6">
          <ActionForm action={createSupportTicketAction} className="grid gap-4">
            <Field label="Subject">
              <TextInput name="subject" required placeholder="Pickup timing question" />
            </Field>
            <Field label="Related booking">
              <Select name="bookingId" defaultValue="">
                <option value="">None</option>
                {bookings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.code}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Priority">
              <Select name="priority" defaultValue="NORMAL">
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </Select>
            </Field>
            <Field label="Message">
              <TextArea name="body" required />
            </Field>
            <Button type="submit">Open ticket</Button>
          </ActionForm>
        </div>
      </div>
      <div>
        <h2 className="font-display mb-3 text-2xl">Your tickets</h2>
        {tickets.length === 0 ? (
          <EmptyState>No tickets yet.</EmptyState>
        ) : (
          <div className="space-y-4">
            {tickets.map((t) => (
              <div key={t.id} className="panel p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="font-semibold">{t.subject}</div>
                  <StatusBadge status={t.status} tone="muted" />
                </div>
                <div className="space-y-2 text-sm text-[var(--ink-soft)]">
                  {t.messages.map((m) => (
                    <p key={m.id}>
                      <span className="font-medium text-[var(--ink)]">
                        {m.authorId === user.id ? "You" : "Ops"}:
                      </span>{" "}
                      {m.body}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
