import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAgent, isAgentUnauthorized, apiSuccess } from "@/lib/api";
import { logActivity } from "@/lib/activity";
import type { ClientStage } from "@/generated/prisma";

const validStages: ClientStage[] = ["COLD", "WARM", "ACTIVE", "PAUSED", "ENDED"];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const auth = await requireAgent(req);
  if (isAgentUnauthorized(auth)) return auth;

  const { clientId } = await params;

  const client = await prisma.client.findFirst({
    where: { id: clientId, workspaceId: auth.workspaceId, deletedAt: null },
    include: {
      projects: {
        where: { deletedAt: null },
        select: { id: true, name: true, status: true },
      },
      users: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  return apiSuccess({ client });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const auth = await requireAgent(req);
  if (isAgentUnauthorized(auth)) return auth;

  const { clientId } = await params;

  let body: {
    name?: string;
    slug?: string;
    stage?: ClientStage;
    partnershipScope?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.stage && !validStages.includes(body.stage)) {
    return NextResponse.json({ error: "Invalid stage" }, { status: 400 });
  }

  const existing = await prisma.client.findFirst({
    where: { id: clientId, workspaceId: auth.workspaceId, deletedAt: null },
    select: { id: true, name: true, slug: true, stage: true, partnershipScope: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  if (body.slug) {
    const clash = await prisma.client.findFirst({
      where: {
        workspaceId: auth.workspaceId,
        slug: body.slug.trim().toLowerCase(),
        NOT: { id: clientId },
      },
    });
    if (clash) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }
  }

  const updates: Record<string, unknown> = {};
  if (body.name) updates.name = body.name.trim();
  if (body.slug) updates.slug = body.slug.trim().toLowerCase();
  if (body.stage) updates.stage = body.stage;
  if (body.partnershipScope !== undefined) {
    updates.partnershipScope = body.partnershipScope?.trim() || null;
  }

  const changes: Record<string, { before: unknown; after: unknown }> = {};
  for (const key of Object.keys(updates)) {
    const before = existing[key as keyof typeof existing];
    const after = updates[key];
    if (before !== after) changes[key] = { before, after };
  }

  const client = await prisma.client.update({
    where: { id: clientId },
    data: updates,
  });

  if (Object.keys(changes).length > 0) {
    logActivity({
      workspaceId: auth.workspaceId,
      actorName: auth.actorName,
      kind: "UPDATED",
      clientId: client.id,
      subject: `Kunde aktualisiert: ${client.name}`,
      summary: Object.keys(changes).join(", "),
      changes,
      tags: ["client", "agent"],
    });
  }

  return apiSuccess({ client });
}
