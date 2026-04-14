import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ImpulseStatus, ImpulseType } from "@/generated/prisma";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");
  const status = searchParams.get("status") as ImpulseStatus | null;
  const type = searchParams.get("type") as ImpulseType | null;

  const validStatuses: ImpulseStatus[] = ["NEW", "SEEN", "IN_PROGRESS", "DONE"];
  const validTypes: ImpulseType[] = ["FEEDBACK", "CHANGE_REQUEST", "QUESTION", "IDEA"];

  const impulses = await prisma.impulse.findMany({
    where: {
      project: {
        workspaceId: user.workspaceId,
        ...(clientId ? { clientId } : {}),
      },
      ...(status && validStatuses.includes(status) ? { status } : {}),
      ...(type && validTypes.includes(type) ? { type } : {}),
    },
    include: {
      project: {
        include: {
          client: {
            select: { id: true, name: true },
          },
        },
      },
      author: {
        select: { id: true, name: true, email: true },
      },
      _count: {
        select: { comments: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ impulses });
}
