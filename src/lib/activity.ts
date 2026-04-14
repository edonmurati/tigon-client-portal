import { prisma } from "@/lib/prisma";
import {
  type ActivityKind,
  type ActivityChannel,
  type Direction,
} from "@/generated/prisma";

export interface LogActivityParams {
  workspaceId: string;
  actorId?: string;
  actorName?: string;
  kind: ActivityKind;
  channel?: ActivityChannel;
  direction?: Direction;
  clientId?: string;
  projectId?: string;
  contactId?: string;
  leadId?: string;
  impulseId?: string;
  taskId?: string;
  decisionId?: string;
  subject?: string;
  summary?: string;
  changes?: Record<string, unknown>;
  tags?: string[];
  occurredAt?: Date;
}

export function logActivity(params: LogActivityParams): void {
  prisma.activity
    .create({
      data: {
        workspaceId: params.workspaceId,
        actorId: params.actorId,
        actorName: params.actorName,
        kind: params.kind,
        channel: params.channel,
        direction: params.direction,
        clientId: params.clientId,
        projectId: params.projectId,
        contactId: params.contactId,
        leadId: params.leadId,
        impulseId: params.impulseId,
        taskId: params.taskId,
        decisionId: params.decisionId,
        subject: params.subject,
        summary: params.summary,
        changes: params.changes as never,
        tags: params.tags ?? [],
        occurredAt: params.occurredAt ?? new Date(),
      },
    })
    .catch(() => {
      // Fire-and-forget — don't break the request if logging fails
    });
}
