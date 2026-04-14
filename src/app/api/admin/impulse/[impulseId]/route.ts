import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ImpulseStatus } from "@/generated/prisma";

const validStatuses: ImpulseStatus[] = ["NEW", "SEEN", "IN_PROGRESS", "DONE"];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ impulseId: string }> }
) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { impulseId } = await params;

  const impulse = await prisma.impulse.findFirst({
    where: {
      id: impulseId,
      deletedAt: null,
      project: { workspaceId: user.workspaceId, deletedAt: null },
    },
    include: {
      project: {
        include: {
          client: true,
        },
      },
      author: {
        select: { id: true, name: true, email: true },
      },
      comments: {
        where: { deletedAt: null },
        include: {
          author: {
            select: { id: true, name: true, role: true },
          },
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ impulseId: string }> }
) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { impulseId } = await params;

  let body: { status?: ImpulseStatus };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { status } = body;
  if (!status || !validStatuses.includes(status)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
      { status: 400 }
    );
  }

  const existing = await prisma.impulse.findFirst({
    where: {
      id: impulseId,
      deletedAt: null,
      project: { workspaceId: user.workspaceId, deletedAt: null },
    },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const impulse = await prisma.impulse.update({
    where: { id: impulseId },
    data: { status },
  });

  return NextResponse.json({ impulse });
}
