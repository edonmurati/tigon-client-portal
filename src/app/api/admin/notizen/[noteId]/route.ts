import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import type { EntryCategory } from "@/generated/prisma";

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

  let body: { category?: EntryCategory; title?: string; content?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const existing = await prisma.knowledgeEntry.findUnique({ where: { id: noteId } });
  if (!existing) {
    return NextResponse.json({ error: "Eintrag nicht gefunden" }, { status: 404 });
  }

  const entry = await prisma.knowledgeEntry.update({
    where: { id: noteId },
    data: {
      ...(body.category !== undefined ? { category: body.category } : {}),
      ...(body.title !== undefined ? { title: body.title.trim() } : {}),
      ...(body.content !== undefined ? { content: body.content.trim() } : {}),
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

  return NextResponse.json({ entry });
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
