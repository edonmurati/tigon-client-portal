import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ impulseId: string }> }
) {
  const user = await getAuthUser();

  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { impulseId } = await params;

  const impulse = await prisma.impulse.findUnique({
    where: { id: impulseId },
    select: { id: true },
  });

  if (!impulse) {
    return NextResponse.json({ error: "Impulse not found" }, { status: 404 });
  }

  const attachments = await prisma.impulseAttachment.findMany({
    where: { impulseId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ attachments });
}
