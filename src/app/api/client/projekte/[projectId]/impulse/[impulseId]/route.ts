import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string; impulseId: string }> }
) {
  const user = await getAuthUser();

  if (!user || user.role !== "CLIENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!user.clientId) {
    return NextResponse.json({ error: "No client associated" }, { status: 400 });
  }

  const { projectId, impulseId } = await params;

  // Verify project belongs to this client
  const project = await prisma.project.findFirst({
    where: { id: projectId, clientId: user.clientId, deletedAt: null },
    select: { id: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const impulse = await prisma.impulse.findFirst({
    where: { id: impulseId, projectId, deletedAt: null },
    include: {
      author: { select: { id: true, name: true, role: true } },
      project: { select: { id: true, name: true } },
      comments: {
        where: { deletedAt: null },
        include: {
          author: { select: { id: true, name: true, role: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!impulse) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ impulse });
}
