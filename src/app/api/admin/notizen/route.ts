import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { apiSuccess, isParseError, parseBody, assertClientInWorkspace, assertProjectInWorkspace } from "@/lib/api";
import { createEntrySchema } from "@/lib/validations/knowledge";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");
  const projectId = searchParams.get("projectId");

  const entries = await prisma.knowledgeEntry.findMany({
    where: {
      workspaceId: user.workspaceId,
      ...(clientId ? { clientId } : {}),
      ...(projectId ? { projectId } : {}),
    },
    include: {
      author: {
        select: { id: true, name: true },
      },
    },
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
  });

  return NextResponse.json({ entries });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = await parseBody(req, createEntrySchema);
  if (isParseError(parsed)) return parsed;

  const { clientId, projectId, category, title, content, tags, pinned } = parsed;

  const clientCheck = await assertClientInWorkspace(clientId, user.workspaceId);
  if (clientCheck) return clientCheck;
  const projectCheck = await assertProjectInWorkspace(projectId, user.workspaceId);
  if (projectCheck) return projectCheck;

  const entry = await prisma.knowledgeEntry.create({
    data: {
      workspaceId: user.workspaceId,
      clientId: clientId ?? null,
      projectId: projectId ?? null,
      authorId: user.id,
      category,
      title,
      content,
      tags: tags ?? [],
      pinned: pinned ?? false,
    },
    include: {
      author: {
        select: { id: true, name: true },
      },
    },
  });

  logActivity({
    workspaceId: user.workspaceId,
    actorId: user.id,
    actorName: user.name,
    kind: "CREATED",
    clientId: clientId ?? undefined,
    projectId: projectId ?? undefined,
    subject: `Eintrag erstellt: ${entry.title}`,
    summary: entry.category,
    tags: ["knowledge-entry"],
  });

  return apiSuccess({ entry }, 201);
}
