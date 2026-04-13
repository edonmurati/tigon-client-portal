import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import type { EntryCategory } from "@/generated/prisma";

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

  return NextResponse.json({ entries });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    clientId?: string;
    projectId?: string;
    category?: EntryCategory;
    title?: string;
    content?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { clientId, projectId, category, title, content } = body;

  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return NextResponse.json({ error: "Titel ist erforderlich" }, { status: 400 });
  }
  if (!content || typeof content !== "string" || content.trim().length === 0) {
    return NextResponse.json({ error: "Inhalt ist erforderlich" }, { status: 400 });
  }
  if (!category) {
    return NextResponse.json({ error: "Kategorie ist erforderlich" }, { status: 400 });
  }

  const entry = await prisma.knowledgeEntry.create({
    data: {
      clientId: clientId ?? null,
      projectId: projectId ?? null,
      authorId: user.id,
      category,
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
    entityType: "KnowledgeEntry",
    entityId: entry.id,
    clientId: clientId ?? undefined,
    meta: { title: entry.title, category: entry.category },
  });

  return NextResponse.json({ entry }, { status: 201 });
}
