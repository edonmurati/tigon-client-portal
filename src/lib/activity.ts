import { prisma } from "@/lib/prisma";

interface LogActivityParams {
  userId?: string;
  action: string;
  entityType: string;
  entityId: string;
  clientId?: string;
  meta?: Record<string, unknown>;
}

export function logActivity(params: LogActivityParams): void {
  prisma.activityLog
    .create({
      data: {
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        clientId: params.clientId,
        meta: params.meta ? JSON.stringify(params.meta) : undefined,
      },
    })
    .catch(() => {
      // Fire-and-forget — don't break the request if logging fails
    });
}
