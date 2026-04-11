import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId") || undefined;
  const entityType = searchParams.get("entityType") || undefined;
  const userId = searchParams.get("userId") || undefined;
  const cursor = searchParams.get("cursor") || undefined;
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Math.min(parseInt(limitParam, 10), 100) : 50;

  // Cursor-based pagination: cursor = id of last item on previous page
  // We fetch the createdAt of that item and use it as the boundary
  let cursorCreatedAt: Date | undefined;
  if (cursor) {
    const cursorItem = await prisma.activityLog.findUnique({
      where: { id: cursor },
      select: { createdAt: true },
    });
    if (cursorItem) {
      cursorCreatedAt = cursorItem.createdAt;
    }
  }

  const activities = await prisma.activityLog.findMany({
    where: {
      ...(clientId ? { clientId } : {}),
      ...(entityType ? { entityType } : {}),
      ...(userId ? { userId } : {}),
      ...(cursorCreatedAt ? { createdAt: { lt: cursorCreatedAt } } : {}),
    },
    include: {
      user: {
        select: { id: true, name: true },
      },
      client: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit + 1, // fetch one extra to know if there's a next page
  });

  const hasMore = activities.length > limit;
  const items = hasMore ? activities.slice(0, limit) : activities;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return NextResponse.json({ activities: items, nextCursor });
}
