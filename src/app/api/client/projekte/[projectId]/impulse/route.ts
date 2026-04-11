import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ImpulseType, ImpulseStatus } from "@/generated/prisma";

const VALID_TYPES: ImpulseType[] = ["FEEDBACK", "CHANGE_REQUEST", "QUESTION", "IDEA"];
const VALID_STATUSES: ImpulseStatus[] = ["NEW", "SEEN", "IN_PROGRESS", "DONE"];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const user = await getAuthUser();

  if (!user || user.role !== "CLIENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!user.clientId) {
    return NextResponse.json({ error: "No client associated" }, { status: 400 });
  }

  const { projectId } = await params;

  const project = await prisma.project.findFirst({
    where: { id: projectId, clientId: user.clientId },
    select: { id: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const typeParam = searchParams.get("type");
  const statusParam = searchParams.get("status");

  const where: {
    projectId: string;
    type?: ImpulseType;
    status?: ImpulseStatus;
  } = { projectId };

  if (typeParam && VALID_TYPES.includes(typeParam as ImpulseType)) {
    where.type = typeParam as ImpulseType;
  }
  if (statusParam && VALID_STATUSES.includes(statusParam as ImpulseStatus)) {
    where.status = statusParam as ImpulseStatus;
  }

  const impulses = await prisma.impulse.findMany({
    where,
    include: {
      area: { select: { id: true, name: true } },
      author: { select: { name: true } },
      _count: { select: { comments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ impulses });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const user = await getAuthUser();

  if (!user || user.role !== "CLIENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!user.clientId) {
    return NextResponse.json({ error: "No client associated" }, { status: 400 });
  }

  const { projectId } = await params;

  const project = await prisma.project.findFirst({
    where: { id: projectId, clientId: user.clientId },
    select: { id: true, name: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { type, title, content, projectAreaId } = body as {
    type?: string;
    title?: string;
    content?: string;
    projectAreaId?: string;
  };

  if (!type || !VALID_TYPES.includes(type as ImpulseType)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }
  if (!title || title.trim().length === 0) {
    return NextResponse.json({ error: "Title required" }, { status: 400 });
  }
  if (!content || content.trim().length === 0) {
    return NextResponse.json({ error: "Content required" }, { status: 400 });
  }

  // Validate area belongs to project if provided
  if (projectAreaId) {
    const area = await prisma.projectArea.findFirst({
      where: { id: projectAreaId, projectId: project.id },
      select: { id: true },
    });
    if (!area) {
      return NextResponse.json({ error: "Area not found" }, { status: 400 });
    }
  }

  const impulse = await prisma.impulse.create({
    data: {
      projectId: project.id,
      authorId: user.id,
      type: type as ImpulseType,
      title: title.trim(),
      content: content.trim(),
      projectAreaId: projectAreaId || null,
    },
  });

  // Fire-and-forget notification
  fetch(
    `${process.env.N8N_WEBHOOK_BASE}/portal-impulse-created`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        impulseId: impulse.id,
        impulseTitle: impulse.title,
        impulseType: impulse.type,
        clientName: user.clientName,
        projectName: project.name,
        authorName: user.name,
        portalUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://portal.tigonautomation.de"}/admin/impulse/${impulse.id}`,
      }),
    }
  ).catch(() => {});

  return NextResponse.json({ impulse }, { status: 201 });
}
