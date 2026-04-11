import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/vault";
import { logActivity } from "@/lib/activity";
import type { CredentialType } from "@/generated/prisma";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");
  const projectId = searchParams.get("projectId");

  const credentials = await prisma.credential.findMany({
    where: {
      ...(clientId ? { clientId } : {}),
      ...(projectId ? { projectId } : {}),
    },
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
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ credentials });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    clientId?: string;
    projectId?: string;
    label?: string;
    type?: CredentialType;
    url?: string;
    username?: string;
    value?: string;
    notes?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { clientId, projectId, label, type, url, username, value, notes } = body;

  if (!label || typeof label !== "string" || label.trim().length === 0) {
    return NextResponse.json({ error: "Label is required" }, { status: 400 });
  }
  if (!type) {
    return NextResponse.json({ error: "Type is required" }, { status: 400 });
  }
  if (!value || typeof value !== "string" || value.trim().length === 0) {
    return NextResponse.json({ error: "Value is required" }, { status: 400 });
  }

  const { encValue, encIv, encTag } = encrypt(value);

  const credential = await prisma.credential.create({
    data: {
      label: label.trim(),
      type,
      url: url?.trim() || null,
      username: username?.trim() || null,
      encValue,
      encIv,
      encTag,
      notes: notes?.trim() || null,
      clientId: clientId || null,
      projectId: projectId || null,
      createdById: user.id,
    },
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
      client: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
    },
  });

  logActivity({
    userId: user.id,
    action: "credential.create",
    entityType: "Credential",
    entityId: credential.id,
    clientId: credential.clientId ?? undefined,
    meta: { label: credential.label, type: credential.type },
  });

  return NextResponse.json({ credential }, { status: 201 });
}
