import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import type { ActivityKind } from "@/generated/prisma";

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId") || undefined;
  const kind = (searchParams.get("kind") as ActivityKind | null) || undefined;
  const actorId = searchParams.get("userId") || undefined;
  const cursor = searchParams.get("cursor") || undefined;
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Math.min(parseInt(limitParam, 10), 100) : 50;

  let cursorOccurredAt: Date | undefined;
  if (cursor) {
    const cursorItem = await prisma.activity.findFirst({
      where: { id: cursor, workspaceId: user.workspaceId },
      select: { occurredAt: true },
    });
    if (cursorItem) {
      cursorOccurredAt = cursorItem.occurredAt;
    }
  }

  const activities = await prisma.activity.findMany({
    where: {
      workspaceId: user.workspaceId,
      ...(clientId ? { clientId } : {}),
      ...(kind ? { kind } : {}),
      ...(actorId ? { actorId } : {}),
      ...(cursorOccurredAt ? { occurredAt: { lt: cursorOccurredAt } } : {}),
    },
    include: {
      actor: { select: { id: true, name: true } },
      client: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
    },
    orderBy: { occurredAt: "desc" },
    take: limit + 1,
  });

  const hasMore = activities.length > limit;
  const items = hasMore ? activities.slice(0, limit) : activities;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return NextResponse.json({ activities: items, nextCursor });
}
