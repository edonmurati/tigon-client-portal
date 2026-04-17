import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireAgent,
  isAgentUnauthorized,
  parseBody,
  isParseError,
  apiSuccess,
  apiError,
} from "@/lib/api";
import { logActivity } from "@/lib/activity";
import { createTaskSchema } from "@/lib/validations/task";
import { ensureInternalProject } from "@/lib/internal-project";

export async function GET(req: NextRequest) {
  const auth = await requireAgent(req);
  if (isAgentUnauthorized(auth)) return auth;

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");
  const clientSlug = searchParams.get("clientSlug");
  const projectId = searchParams.get("projectId");
  const scope = searchParams.get("scope"); // "open" | "done" | "all"

  let resolvedClientId = clientId;
  if (!resolvedClientId && clientSlug) {
    const c = await prisma.client.findUnique({
      where: { workspaceId_slug: { workspaceId: auth.workspaceId, slug: clientSlug } },
      select: { id: true },
    });
    if (!c) return apiError("Client not found", 404);
    resolvedClientId = c.id;
  }

  const tasks = await prisma.task.findMany({
    where: {
      deletedAt: null,
      project: { workspaceId: auth.workspaceId, deletedAt: null },
      ...(resolvedClientId ? { clientId: resolvedClientId } : {}),
      ...(projectId ? { projectId } : {}),
      ...(scope === "done"
        ? { completedAt: { not: null } }
        : scope === "all"
          ? {}
          : { completedAt: null }),
    },
    include: {
      client: { select: { id: true, name: true, slug: true, stage: true } },
      project: { select: { id: true, name: true } },
    },
    orderBy: [
      { completedAt: "asc" },
      { dueDate: "asc" },
      { sortOrder: "asc" },
      { createdAt: "desc" },
    ],
  });

  return apiSuccess({ tasks });
}

export async function POST(req: NextRequest) {
  const auth = await requireAgent(req);
  if (isAgentUnauthorized(auth)) return auth;

  const body = await parseBody(req, createTaskSchema);
  if (isParseError(body)) return body;

  const projectId = body.projectId
    ? body.projectId
    : await ensureInternalProject(auth.workspaceId);

  const project = await prisma.project.findFirst({
    where: { id: projectId, workspaceId: auth.workspaceId, deletedAt: null },
    select: { id: true },
  });
  if (!project) return apiError("Projekt nicht gefunden", 404);

  if (body.clientId) {
    const c = await prisma.client.findFirst({
      where: { id: body.clientId, workspaceId: auth.workspaceId, deletedAt: null },
      select: { id: true },
    });
    if (!c) return apiError("Kunde nicht gefunden", 404);
  }

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
      client: { select: { id: true, name: true, slug: true, stage: true } },
      project: { select: { id: true, name: true } },
    },
  });

  logActivity({
    workspaceId: auth.workspaceId,
    actorName: auth.actorName,
    kind: "CREATED",
    clientId: body.clientId ?? undefined,
    projectId: task.projectId ?? undefined,
    taskId: task.id,
    subject: `Aufgabe erstellt: ${task.title}`,
    summary: task.priority,
    tags: ["task", "agent"],
  });

  return apiSuccess({ task }, 201);
}
