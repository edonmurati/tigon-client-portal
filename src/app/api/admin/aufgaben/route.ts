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
import { createTaskSchema } from "@/lib/validations/task";
import { ensureInternalProject } from "@/lib/internal-project";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (isUnauthorized(auth)) return auth;

  const { searchParams } = new URL(req.url);
  const assigneeId = searchParams.get("assigneeId");
  const clientId = searchParams.get("clientId");
  const projectId = searchParams.get("projectId");
  const scope = searchParams.get("scope"); // "open" | "done" | "all"

  const tasks = await prisma.task.findMany({
    where: {
      deletedAt: null,
      project: { workspaceId: auth.workspaceId, deletedAt: null },
      ...(assigneeId ? { assignees: { some: { userId: assigneeId } } } : {}),
      ...(clientId ? { clientId } : {}),
      ...(projectId ? { projectId } : {}),
      ...(scope === "done"
        ? { completedAt: { not: null } }
        : scope === "all"
          ? {}
          : { completedAt: null }),
    },
    include: {
      assignees: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      client: { select: { id: true, name: true, stage: true } },
      project: { select: { id: true, name: true } },
    },
    orderBy: [
      { completedAt: "asc" },
      { dueDate: "asc" },
      { sortOrder: "asc" },
      { createdAt: "desc" },
    ],
  });

  return apiSuccess({
    tasks: tasks.map((t) => ({ ...t, assignees: t.assignees.map((a) => a.user) })),
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (isUnauthorized(auth)) return auth;

  const body = await parseBody(req, createTaskSchema);
  if (isParseError(body)) return body;

  const projectId = body.projectId
    ? body.projectId
    : await ensureInternalProject(auth.workspaceId);

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      workspaceId: auth.workspaceId,
      deletedAt: null,
    },
    select: { id: true },
  });
  if (!project) return apiError("Projekt nicht gefunden", 404);

  const assigneeIds =
    body.assigneeIds && body.assigneeIds.length > 0
      ? body.assigneeIds
      : body.assigneeId
        ? [body.assigneeId]
        : [];

  const task = await prisma.task.create({
    data: {
      title: body.title,
      description: body.description ?? null,
      clientId: body.clientId ?? null,
      projectId,
      priority: body.priority ?? "NORMAL",
      dueDate: body.dueDate && body.dueDate !== "" ? new Date(body.dueDate) : null,
      ...(assigneeIds.length > 0
        ? { assignees: { create: assigneeIds.map((userId) => ({ userId })) } }
        : {}),
    },
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
    kind: "CREATED",
    clientId: body.clientId ?? undefined,
    projectId: task.projectId ?? undefined,
    taskId: task.id,
    subject: `Aufgabe erstellt: ${task.title}`,
    summary: task.priority,
    tags: ["task"],
  });

  return apiSuccess(
    { task: { ...task, assignees: task.assignees.map((a) => a.user) } },
    201
  );
}
