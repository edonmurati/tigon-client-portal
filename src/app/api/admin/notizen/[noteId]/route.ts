import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { apiSuccess, isParseError, parseBody } from "@/lib/api";
import { updateEntrySchema } from "@/lib/validations/knowledge";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { noteId } = await params;

  const entry = await prisma.knowledgeEntry.findUnique({
    where: { id: noteId },
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

  const existing = await prisma.knowledgeEntry.findUnique({ where: { id: noteId } });
  if (!existing) {
    return NextResponse.json({ error: "Eintrag nicht gefunden" }, { status: 404 });
  }

  const entry = await prisma.knowledgeEntry.update({
    where: { id: noteId },
    data: {
      ...(parsed.category !== undefined ? { category: parsed.category } : {}),
      ...(parsed.title !== undefined ? { title: parsed.title } : {}),
      ...(parsed.content !== undefined ? { content: parsed.content } : {}),
      ...(parsed.tags !== undefined ? { tags: parsed.tags } : {}),
      ...(parsed.pinned !== undefined ? { pinned: parsed.pinned } : {}),
      ...(parsed.clientId !== undefined ? { clientId: parsed.clientId } : {}),
      ...(parsed.projectId !== undefined ? { projectId: parsed.projectId } : {}),
    },
    include: {
      author: {
        select: { id: true, name: true },
      },
    },
  });

  logActivity({
    userId: user.id,
    action: "UPDATE",
    entityType: "KnowledgeEntry",
    entityId: entry.id,
    clientId: entry.clientId ?? undefined,
    meta: { title: entry.title },
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

  const existing = await prisma.knowledgeEntry.findUnique({ where: { id: noteId } });
  if (!existing) {
    return NextResponse.json({ error: "Eintrag nicht gefunden" }, { status: 404 });
  }

  await prisma.knowledgeEntry.delete({ where: { id: noteId } });

  logActivity({
    userId: user.id,
    action: "DELETE",
    entityType: "KnowledgeEntry",
    entityId: noteId,
    clientId: existing.clientId ?? undefined,
    meta: { title: existing.title },
  });

  return NextResponse.json({ success: true });
}
