import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import {
  requireAdmin,
  isUnauthorized,
  parseBody,
  isParseError,
  apiSuccess,
  apiError,
} from "@/lib/api";
import { updateTaskSchema } from "@/lib/validations/task";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const auth = await requireAdmin();
  if (isUnauthorized(auth)) return auth;

  const { taskId } = await params;

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      client: { select: { id: true, name: true, stage: true } },
      project: { select: { id: true, name: true } },
    },
  });

  if (!task) return apiError("Aufgabe nicht gefunden", 404);
  return apiSuccess({ task });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const auth = await requireAdmin();
  if (isUnauthorized(auth)) return auth;

  const { taskId } = await params;

  const body = await parseBody(req, updateTaskSchema);
  if (isParseError(body)) return body;

  const existing = await prisma.task.findUnique({ where: { id: taskId } });
  if (!existing) return apiError("Aufgabe nicht gefunden", 404);

  const data: Record<string, unknown> = {};
  if (body.title !== undefined) data.title = body.title;
  if (body.description !== undefined) data.description = body.description;
  if (body.assigneeId !== undefined) data.assigneeId = body.assigneeId;
  if (body.clientId !== undefined) data.clientId = body.clientId;
  if (body.projectId !== undefined) data.projectId = body.projectId;
  if (body.priority !== undefined) data.priority = body.priority;
  if (body.dueDate !== undefined) {
    data.dueDate = body.dueDate ? new Date(body.dueDate) : null;
  }
  if (body.completedAt !== undefined) {
    data.completedAt = body.completedAt ? new Date(body.completedAt) : null;
  }
  if (body.sortOrder !== undefined) data.sortOrder = body.sortOrder;

  const task = await prisma.task.update({
    where: { id: taskId },
    data,
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      client: { select: { id: true, name: true, stage: true } },
      project: { select: { id: true, name: true } },
    },
  });

  logActivity({
    userId: auth.id,
    action: "UPDATE",
    entityType: "Task",
    entityId: task.id,
    clientId: task.clientId ?? undefined,
    meta: { changed: Object.keys(data) },
  });

  return apiSuccess({ task });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const auth = await requireAdmin();
  if (isUnauthorized(auth)) return auth;

  const { taskId } = await params;

  const existing = await prisma.task.findUnique({ where: { id: taskId } });
  if (!existing) return apiError("Aufgabe nicht gefunden", 404);

  await prisma.task.delete({ where: { id: taskId } });

  logActivity({
    userId: auth.id,
    action: "DELETE",
    entityType: "Task",
    entityId: taskId,
    clientId: existing.clientId ?? undefined,
    meta: { title: existing.title },
  });

  return apiSuccess({ ok: true });
}
