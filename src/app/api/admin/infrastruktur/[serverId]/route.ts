import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import type { ServerStatus } from "@/generated/prisma";

interface RouteParams {
  params: Promise<{ serverId: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { serverId } = await params;

  const server = await prisma.server.findFirst({
    where: { id: serverId, workspaceId: user.workspaceId, deletedAt: null },
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

  if (!server) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ server });
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { serverId } = await params;

  const existing = await prisma.server.findFirst({
    where: { id: serverId, workspaceId: user.workspaceId, deletedAt: null },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: {
    clientId?: string | null;
    projectId?: string | null;
    name?: string;
    provider?: string | null;
    url?: string | null;
    ip?: string | null;
    status?: ServerStatus;
    statusNote?: string | null;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};

  if (body.name !== undefined) updateData.name = body.name.trim();
  if (body.provider !== undefined) updateData.provider = body.provider?.trim() || null;
  if (body.url !== undefined) updateData.url = body.url?.trim() || null;
  if (body.ip !== undefined) updateData.ip = body.ip?.trim() || null;
  if (body.statusNote !== undefined) updateData.statusNote = body.statusNote?.trim() || null;
  if (body.clientId !== undefined) updateData.clientId = body.clientId || null;
  if (body.projectId !== undefined) updateData.projectId = body.projectId || null;

  if (body.status !== undefined) {
    updateData.status = body.status;
    // Auto-update lastChecked on status change
    if (body.status !== existing.status) {
      updateData.lastChecked = new Date();
    }
  }

  const server = await prisma.server.update({
    where: { id: serverId },
    data: updateData,
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
    workspaceId: user.workspaceId,
    actorId: user.id,
    actorName: user.name,
    kind: "UPDATED",
    clientId: server.clientId ?? undefined,
    projectId: server.projectId ?? undefined,
    subject: `Server aktualisiert: ${server.name}`,
    summary: server.status,
    tags: ["server"],
  });

  return NextResponse.json({ server });
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { serverId } = await params;

  const existing = await prisma.server.findFirst({
    where: { id: serverId, workspaceId: user.workspaceId, deletedAt: null },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.server.update({
    where: { id: serverId },
    data: { deletedAt: new Date() },
  });

  logActivity({
    workspaceId: user.workspaceId,
    actorId: user.id,
    actorName: user.name,
    kind: "DELETED",
    clientId: existing.clientId ?? undefined,
    projectId: existing.projectId ?? undefined,
    subject: `Server geloescht: ${existing.name}`,
    tags: ["server"],
  });

  return NextResponse.json({ success: true });
}
