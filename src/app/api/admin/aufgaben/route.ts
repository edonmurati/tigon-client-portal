import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import {
  requireAdmin,
  isUnauthorized,
  parseBody,
  isParseError,
  apiSuccess,
} from "@/lib/api";
import { createTaskSchema } from "@/lib/validations/task";

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
      ...(assigneeId ? { assigneeId } : {}),
      ...(clientId ? { clientId } : {}),
      ...(projectId ? { projectId } : {}),
      ...(scope === "done"
        ? { completedAt: { not: null } }
        : scope === "all"
          ? {}
          : { completedAt: null }),
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
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

  return apiSuccess({ tasks });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (isUnauthorized(auth)) return auth;

  const body = await parseBody(req, createTaskSchema);
  if (isParseError(body)) return body;

  const task = await prisma.task.create({
    data: {
      title: body.title,
      description: body.description ?? null,
      assigneeId: body.assigneeId ?? null,
      clientId: body.clientId ?? null,
      projectId: body.projectId ?? null,
      priority: body.priority ?? "NORMAL",
      dueDate: body.dueDate && body.dueDate !== "" ? new Date(body.dueDate) : null,
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      client: { select: { id: true, name: true, stage: true } },
      project: { select: { id: true, name: true } },
    },
  });

  logActivity({
    userId: auth.id,
    action: "CREATE",
    entityType: "Task",
    entityId: task.id,
    clientId: body.clientId,
    meta: { title: task.title, priority: task.priority },
  });

  return apiSuccess({ task }, 201);
}
