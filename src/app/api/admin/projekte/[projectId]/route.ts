import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ProjectStatus } from "@/generated/prisma";

const validStatuses: ProjectStatus[] = ["ACTIVE", "COMPLETED", "PAUSED"];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      client: {
        select: { id: true, name: true, slug: true },
      },
      areas: {
        orderBy: { sortOrder: "asc" },
      },
      milestones: {
        orderBy: { sortOrder: "asc" },
      },
      impulses: {
        include: {
          author: {
            select: { id: true, name: true },
          },
          _count: {
            select: { comments: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({ project });
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

  let body: {
    name?: string;
    description?: string;
    status?: ProjectStatus;
    startDate?: string | null;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.status && !validStatuses.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const project = await prisma.project.update({
    where: { id: projectId },
    data: {
      ...(body.name ? { name: body.name.trim() } : {}),
      ...(body.description !== undefined
        ? { description: body.description?.trim() || null }
        : {}),
      ...(body.status ? { status: body.status } : {}),
      ...(body.startDate !== undefined
        ? { startDate: body.startDate ? new Date(body.startDate) : null }
        : {}),
    },
  });

  return NextResponse.json({ project });
}
