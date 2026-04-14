import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  const project = await prisma.project.findFirst({
    where: { id: projectId, workspaceId: user.workspaceId, deletedAt: null },
    select: { id: true },
  });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const milestones = await prisma.milestone.findMany({
    where: { projectId },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json({ milestones });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  let body: { title?: string; description?: string; dueDate?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { title, description, dueDate } = body;
  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  // Verify project exists in same workspace
  const project = await prisma.project.findFirst({
    where: { id: projectId, workspaceId: user.workspaceId, deletedAt: null },
  });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const lastMilestone = await prisma.milestone.findFirst({
    where: { projectId },
    orderBy: { sortOrder: "desc" },
  });

  const milestone = await prisma.milestone.create({
    data: {
      projectId,
      title: title.trim(),
      description: description?.trim() || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      sortOrder: (lastMilestone?.sortOrder ?? -1) + 1,
    },
  });

  return NextResponse.json({ milestone }, { status: 201 });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;
  const { searchParams } = new URL(req.url);
  const milestoneId = searchParams.get("milestoneId");

  if (!milestoneId) {
    return NextResponse.json(
      { error: "milestoneId query param required" },
      { status: 400 }
    );
  }

  let body: { completedAt?: string | null; title?: string; description?: string; dueDate?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const milestone = await prisma.milestone.findFirst({
    where: {
      id: milestoneId,
      projectId,
      project: { workspaceId: user.workspaceId, deletedAt: null },
    },
  });

  if (!milestone) {
    return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
  }

  const updated = await prisma.milestone.update({
    where: { id: milestoneId },
    data: {
      ...(body.title ? { title: body.title.trim() } : {}),
      ...(body.description !== undefined
        ? { description: body.description?.trim() || null }
        : {}),
      ...(body.dueDate !== undefined
        ? { dueDate: body.dueDate ? new Date(body.dueDate) : null }
        : {}),
      ...(body.completedAt !== undefined
        ? { completedAt: body.completedAt ? new Date(body.completedAt) : null }
        : {}),
    },
  });

  return NextResponse.json({ milestone: updated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;
  const { searchParams } = new URL(req.url);
  const milestoneId = searchParams.get("milestoneId");

  if (!milestoneId) {
    return NextResponse.json(
      { error: "milestoneId query param required" },
      { status: 400 }
    );
  }

  const milestone = await prisma.milestone.findFirst({
    where: {
      id: milestoneId,
      projectId,
      project: { workspaceId: user.workspaceId, deletedAt: null },
    },
  });

  if (!milestone) {
    return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
  }

  await prisma.milestone.delete({ where: { id: milestoneId } });

  return NextResponse.json({ success: true });
}
