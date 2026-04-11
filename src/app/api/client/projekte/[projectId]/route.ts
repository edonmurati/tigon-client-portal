import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
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
    include: {
      areas: {
        include: {
          _count: { select: { impulses: true } },
        },
        orderBy: { sortOrder: "asc" },
      },
      milestones: {
        orderBy: { sortOrder: "asc" },
      },
      impulses: {
        select: {
          id: true,
          title: true,
          type: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ project });
}
