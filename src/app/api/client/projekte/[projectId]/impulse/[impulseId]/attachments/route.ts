import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
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

  const project = await prisma.project.findFirst({
    where: { id: projectId, clientId: user.clientId },
    select: { id: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const impulse = await prisma.impulse.findFirst({
    where: { id: impulseId, projectId },
    select: { id: true },
  });

  if (!impulse) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const attachments = await prisma.impulseAttachment.findMany({
    where: { impulseId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ attachments });
}
