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
  assertClientInWorkspace,
  assertProjectInWorkspace,
} from "@/lib/api";
import { updateTaskSchema } from "@/lib/validations/task";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const auth = await requireAdmin();
  if (isUnauthorized(auth)) return auth;

  const { taskId } = await params;

  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      project: { workspaceId: auth.workspaceId, deletedAt: null },
    },
    include: {
      assignees: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      client: { select: { id: true, name: true, stage: true } },
      project: { select: { id: true, name: true } },
    },
  });

  if (!task) return apiError("Aufgabe nicht gefunden", 404);
  return apiSuccess({
    task: {
      ...task,
      assignees: task.assignees.map((a) => a.user),
    },
  });
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

  const existing = await prisma.task.findFirst({
    where: {
      id: taskId,
      project: { workspaceId: auth.workspaceId, deletedAt: null },
    },
  });
  if (!existing) return apiError("Aufgabe nicht gefunden", 404);

  if (body.clientId !== undefined) {
    const check = await assertClientInWorkspace(body.clientId, auth.workspaceId);
    if (check) return check;
  }
  if (body.projectId !== undefined) {
    const check = await assertProjectInWorkspace(body.projectId, auth.workspaceId);
    if (check) return check;
  }

  const data: Record<string, unknown> = {};
  if (body.title !== undefined) data.title = body.title;
  if (body.description !== undefined) data.description = body.description;
  if (body.clientId !== undefined) data.clientId = body.clientId;
  if (body.projectId !== undefined) data.projectId = body.projectId;
  if (body.priority !== undefined) data.priority = body.priority;
  if (body.status !== undefined) {
    data.status = body.status;
    if (body.status === "DONE" && !existing.completedAt && body.completedAt === undefined) {
      data.completedAt = new Date();
    } else if (body.status !== "DONE" && existing.completedAt && body.completedAt === undefined) {
      data.completedAt = null;
    }
  }
  if (body.dueDate !== undefined) {
    data.dueDate = body.dueDate ? new Date(body.dueDate) : null;
  }
  if (body.completedAt !== undefined) {
    data.completedAt = body.completedAt ? new Date(body.completedAt) : null;
  }
  if (body.sortOrder !== undefined) data.sortOrder = body.sortOrder;

  if (body.assigneeIds !== undefined) {
    data.assignees = {
      deleteMany: {},
      ...(body.assigneeIds.length > 0
        ? { create: body.assigneeIds.map((userId) => ({ userId })) }
        : {}),
    };
  } else if (body.assigneeId !== undefined) {
    data.assignees = {
      deleteMany: {},
      ...(body.assigneeId ? { create: { userId: body.assigneeId } } : {}),
    };
  }

  const task = await prisma.task.update({
    where: { id: taskId },
    data,
    include: {
      assignees: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      client: { select: { id: true, name: true, stage: true } },
      project: { select: { id: true, name: true } },
    },
  });

  logActivity({
    workspaceId: auth.workspaceId,
    actorId: auth.id,
    actorName: auth.name,
    kind: "UPDATED",
    clientId: task.clientId ?? undefined,
    projectId: task.projectId ?? undefined,
    taskId: task.id,
    subject: `Aufgabe aktualisiert: ${task.title}`,
    changes: { fields: Object.keys(data) },
    tags: ["task"],
  });

  return apiSuccess({
    task: {
      ...task,
      assignees: task.assignees.map((a) => a.user),
    },
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const auth = await requireAdmin();
  if (isUnauthorized(auth)) return auth;

  const { taskId } = await params;

  const existing = await prisma.task.findFirst({
    where: {
      id: taskId,
      project: { workspaceId: auth.workspaceId, deletedAt: null },
    },
  });
  if (!existing) return apiError("Aufgabe nicht gefunden", 404);

  await prisma.task.delete({ where: { id: taskId } });

  logActivity({
    workspaceId: auth.workspaceId,
    actorId: auth.id,
    actorName: auth.name,
    kind: "DELETED",
    clientId: existing.clientId ?? undefined,
    projectId: existing.projectId ?? undefined,
    taskId: taskId,
    subject: `Aufgabe geloescht: ${existing.title}`,
    tags: ["task"],
  });

  return apiSuccess({ ok: true });
}
