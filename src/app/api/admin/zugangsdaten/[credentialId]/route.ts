import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/vault";
import { logActivity } from "@/lib/activity";
import type { CredentialType } from "@/generated/prisma";

interface RouteParams {
  params: Promise<{ credentialId: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { credentialId } = await params;

  const credential = await prisma.credential.findFirst({
    where: { id: credentialId, workspaceId: user.workspaceId, deletedAt: null },
    select: {
      id: true,
      label: true,
      type: true,
      url: true,
      username: true,
      notes: true,
      clientId: true,
      projectId: true,
      createdById: true,
      createdAt: true,
      updatedAt: true,
      client: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
    },
  });

  if (!credential) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ credential });
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { credentialId } = await params;

  const existing = await prisma.credential.findFirst({
    where: { id: credentialId, workspaceId: user.workspaceId, deletedAt: null },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: {
    clientId?: string | null;
    projectId?: string | null;
    label?: string;
    type?: CredentialType;
    url?: string | null;
    username?: string | null;
    value?: string;
    notes?: string | null;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};

  if (body.label !== undefined) updateData.label = body.label.trim();
  if (body.type !== undefined) updateData.type = body.type;
  if (body.url !== undefined) updateData.url = body.url?.trim() || null;
  if (body.username !== undefined) updateData.username = body.username?.trim() || null;
  if (body.notes !== undefined) updateData.notes = body.notes?.trim() || null;
  if (body.clientId !== undefined) updateData.clientId = body.clientId || null;
  if (body.projectId !== undefined) updateData.projectId = body.projectId || null;

  if (body.value && body.value.trim().length > 0) {
    const { encValue, encIv, encTag } = encrypt(body.value);
    updateData.encValue = encValue;
    updateData.encIv = encIv;
    updateData.encTag = encTag;
  }

  const credential = await prisma.credential.update({
    where: { id: credentialId },
    data: updateData,
    select: {
      id: true,
      label: true,
      type: true,
      url: true,
      username: true,
      notes: true,
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
    clientId: credential.clientId ?? undefined,
    projectId: credential.projectId ?? undefined,
    subject: `Zugangsdaten aktualisiert: ${credential.label}`,
    tags: ["credential"],
  });

  return NextResponse.json({ credential });
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { credentialId } = await params;

  const existing = await prisma.credential.findFirst({
    where: { id: credentialId, workspaceId: user.workspaceId, deletedAt: null },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.credential.delete({ where: { id: credentialId } });

  logActivity({
    workspaceId: user.workspaceId,
    actorId: user.id,
    actorName: user.name,
    kind: "DELETED",
    clientId: existing.clientId ?? undefined,
    projectId: existing.projectId ?? undefined,
    subject: `Zugangsdaten geloescht: ${existing.label}`,
    tags: ["credential"],
  });

  return NextResponse.json({ success: true });
}
