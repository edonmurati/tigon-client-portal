import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import type { NoteType } from "@/generated/prisma";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");
  const projectId = searchParams.get("projectId");

  const notes = await prisma.note.findMany({
    where: {
      ...(clientId ? { clientId } : {}),
      ...(projectId ? { projectId } : {}),
    },
    include: {
      author: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ notes });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    clientId?: string;
    projectId?: string;
    type?: NoteType;
    title?: string;
    content?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { clientId, projectId, type, title, content } = body;

  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return NextResponse.json({ error: "Titel ist erforderlich" }, { status: 400 });
  }
  if (!content || typeof content !== "string" || content.trim().length === 0) {
    return NextResponse.json({ error: "Inhalt ist erforderlich" }, { status: 400 });
  }
  if (!type) {
    return NextResponse.json({ error: "Typ ist erforderlich" }, { status: 400 });
  }
  if (!clientId && !projectId) {
    return NextResponse.json(
      { error: "clientId oder projectId ist erforderlich" },
      { status: 400 }
    );
  }

  const note = await prisma.note.create({
    data: {
      clientId: clientId ?? null,
      projectId: projectId ?? null,
      authorId: user.id,
      type,
      title: title.trim(),
      content: content.trim(),
    },
    include: {
      author: {
        select: { id: true, name: true },
      },
    },
  });

  logActivity({
    userId: user.id,
    action: "CREATE",
    entityType: "Note",
    entityId: note.id,
    clientId: clientId ?? undefined,
    meta: { title: note.title, type: note.type },
  });

  return NextResponse.json({ note }, { status: 201 });
}
