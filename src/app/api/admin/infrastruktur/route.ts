import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import type { ServerStatus } from "@/generated/prisma";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");

  const servers = await prisma.serverEntry.findMany({
    where: {
      ...(clientId ? { clientId } : {}),
    },
    select: {
      id: true,
      name: true,
      provider: true,
      url: true,
      ip: true,
      status: true,
      statusNote: true,
      lastChecked: true,
      clientId: true,
      projectId: true,
      createdAt: true,
      updatedAt: true,
      client: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
    },
    orderBy: [
      { client: { name: "asc" } },
      { name: "asc" },
    ],
  });

  return NextResponse.json({ servers });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    clientId?: string;
    projectId?: string;
    name?: string;
    provider?: string;
    url?: string;
    ip?: string;
    status?: ServerStatus;
    statusNote?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { clientId, projectId, name, provider, url, ip, status, statusNote } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const server = await prisma.serverEntry.create({
    data: {
      name: name.trim(),
      provider: provider?.trim() || null,
      url: url?.trim() || null,
      ip: ip?.trim() || null,
      status: status ?? "ONLINE",
      statusNote: statusNote?.trim() || null,
      clientId: clientId || null,
      projectId: projectId || null,
    },
    select: {
      id: true,
      name: true,
      provider: true,
      url: true,
      ip: true,
      status: true,
      statusNote: true,
      lastChecked: true,
      clientId: true,
      projectId: true,
      createdAt: true,
      updatedAt: true,
      client: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
    },
  });

  logActivity({
    userId: user.id,
    action: "server.create",
    entityType: "ServerEntry",
    entityId: server.id,
    clientId: server.clientId ?? undefined,
    meta: { name: server.name, status: server.status },
  });

  return NextResponse.json({ server }, { status: 201 });
}
