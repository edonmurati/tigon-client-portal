import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { apiSuccess, isParseError, parseBody, assertClientInWorkspace, assertProjectInWorkspace } from "@/lib/api";
import { updateEntrySchema } from "@/lib/validations/knowledge";
import type { Prisma } from "@/generated/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { noteId } = await params;

  const entry = await prisma.knowledgeEntry.findFirst({
    where: { id: noteId, workspaceId: user.workspaceId },
    include: {
      author: {
        select: { id: true, name: true },
      },
    },
  });

  if (!entry) {
    return NextResponse.json({ error: "Eintrag nicht gefunden" }, { status: 404 });
  }

  return NextResponse.json({ entry });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { noteId } = await params;

  const parsed = await parseBody(req, updateEntrySchema);
  if (isParseError(parsed)) return parsed;

  const existing = await prisma.knowledgeEntry.findFirst({
    where: { id: noteId, workspaceId: user.workspaceId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Eintrag nicht gefunden" }, { status: 404 });
  }

  if (parsed.clientId !== undefined) {
    const check = await assertClientInWorkspace(parsed.clientId, user.workspaceId);
    if (check) return check;
  }
  if (parsed.projectId !== undefined) {
    const check = await assertProjectInWorkspace(parsed.projectId, user.workspaceId);
    if (check) return check;
  }

  const data: Prisma.KnowledgeEntryUncheckedUpdateInput = {};
  if (parsed.category !== undefined) data.category = parsed.category;
  if (parsed.title !== undefined) data.title = parsed.title;
  if (parsed.content !== undefined) data.content = parsed.content;
  if (parsed.tags !== undefined) data.tags = parsed.tags;
  if (parsed.pinned !== undefined) data.pinned = parsed.pinned;
  if (parsed.clientId !== undefined) data.clientId = parsed.clientId;
  if (parsed.projectId !== undefined) data.projectId = parsed.projectId;

  const entry = await prisma.knowledgeEntry.update({
    where: { id: noteId },
    data,
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
    kind: "UPDATED",
    clientId: entry.clientId ?? undefined,
    projectId: entry.projectId ?? undefined,
    subject: `Eintrag aktualisiert: ${entry.title}`,
    tags: ["knowledge-entry"],
  });

  return apiSuccess({ entry });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { noteId } = await params;

  const existing = await prisma.knowledgeEntry.findFirst({
    where: { id: noteId, workspaceId: user.workspaceId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Eintrag nicht gefunden" }, { status: 404 });
  }

  await prisma.knowledgeEntry.delete({ where: { id: noteId } });

  logActivity({
    workspaceId: user.workspaceId,
    actorId: user.id,
    actorName: user.name,
    kind: "DELETED",
    clientId: existing.clientId ?? undefined,
    projectId: existing.projectId ?? undefined,
    subject: `Eintrag geloescht: ${existing.title}`,
    tags: ["knowledge-entry"],
  });

  return NextResponse.json({ success: true });
}
