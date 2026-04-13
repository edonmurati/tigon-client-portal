import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { apiSuccess, isParseError, parseBody } from "@/lib/api";
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

  const entry = await prisma.knowledgeEntry.create({
    data: {
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
    userId: user.id,
    action: "CREATE",
    entityType: "KnowledgeEntry",
    entityId: entry.id,
    clientId: clientId ?? undefined,
    meta: { title: entry.title, category: entry.category },
  });

  return apiSuccess({ entry }, 201);
}
