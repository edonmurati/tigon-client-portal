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

  const areas = await prisma.projectArea.findMany({
    where: { projectId },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json({ areas });
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

  let body: { name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name } = body;
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  // Verify project exists
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Get max sortOrder
  const lastArea = await prisma.projectArea.findFirst({
    where: { projectId },
    orderBy: { sortOrder: "desc" },
  });

  const area = await prisma.projectArea.create({
    data: {
      projectId,
      name: name.trim(),
      sortOrder: (lastArea?.sortOrder ?? -1) + 1,
    },
  });

  return NextResponse.json({ area }, { status: 201 });
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
  const areaId = searchParams.get("areaId");

  if (!areaId) {
    return NextResponse.json({ error: "areaId query param required" }, { status: 400 });
  }

  const area = await prisma.projectArea.findFirst({
    where: { id: areaId, projectId },
  });

  if (!area) {
    return NextResponse.json({ error: "Area not found" }, { status: 404 });
  }

  await prisma.projectArea.delete({ where: { id: areaId } });

  return NextResponse.json({ success: true });
}
