import { launchConfig } from "@/config/launch";

type AuditInput = {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  meta?: Record<string, unknown>;
};

/**
 * Audit helper — persists when Prisma client is wired; always logs in dev.
 * Call around status and money mutations (PRD §5.3 A4, Slice 0.3).
 */
export async function writeAuditLog(input: AuditInput): Promise<void> {
  const payload = {
    ...input,
    meta: input.meta ?? {},
    at: new Date().toISOString(),
    brand: launchConfig.brandName,
  };

  if (process.env.NODE_ENV !== "production") {
    console.info("[audit]", JSON.stringify(payload));
  }

  // Persistence is added when DB client + migrations are active:
  // await prisma.auditLog.create({ data: { ... } })
}
