import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import type { NoteType } from "@/generated/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { noteId } = await params;

  const note = await prisma.note.findUnique({
    where: { id: noteId },
    include: {
      author: {
        select: { id: true, name: true },
      },
    },
  });

  if (!note) {
    return NextResponse.json({ error: "Notiz nicht gefunden" }, { status: 404 });
  }

  return NextResponse.json({ note });
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

  let body: { type?: NoteType; title?: string; content?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const existing = await prisma.note.findUnique({ where: { id: noteId } });
  if (!existing) {
    return NextResponse.json({ error: "Notiz nicht gefunden" }, { status: 404 });
  }

  const note = await prisma.note.update({
    where: { id: noteId },
    data: {
      ...(body.type !== undefined ? { type: body.type } : {}),
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
    entityType: "Note",
    entityId: note.id,
    clientId: note.clientId ?? undefined,
    meta: { title: note.title },
  });

  return NextResponse.json({ note });
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

  const existing = await prisma.note.findUnique({ where: { id: noteId } });
  if (!existing) {
    return NextResponse.json({ error: "Notiz nicht gefunden" }, { status: 404 });
  }

  await prisma.note.delete({ where: { id: noteId } });

  logActivity({
    userId: user.id,
    action: "DELETE",
    entityType: "Note",
    entityId: noteId,
    clientId: existing.clientId ?? undefined,
    meta: { title: existing.title },
  });

  return NextResponse.json({ success: true });
}
