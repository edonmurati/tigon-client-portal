import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { LeadStatus } from "@/generated/prisma";

const validStatuses: LeadStatus[] = ["NEW", "CONTACTED", "QUALIFIED", "WON", "LOST", "SPAM"];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { leadId } = await params;

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ lead });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { leadId } = await params;

  const existing = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: { status?: LeadStatus; notes?: string; convertedClientId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.status && !validStatuses.includes(body.status)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
      { status: 400 }
    );
  }

  const lead = await prisma.lead.update({
    where: { id: leadId },
    data: {
      ...(body.status ? { status: body.status } : {}),
      ...(body.notes !== undefined ? { notes: body.notes } : {}),
      ...(body.convertedClientId !== undefined
        ? { convertedClientId: body.convertedClientId }
        : {}),
    },
  });

  // Log status change
  if (body.status && body.status !== existing.status) {
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "LEAD_STATUS_CHANGED",
        entityType: "Lead",
        entityId: leadId,
        meta: JSON.stringify({
          from: existing.status,
          to: body.status,
          name: existing.name,
          unternehmen: existing.unternehmen,
        }),
      },
    });
  }

  return NextResponse.json({ lead });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { leadId } = await params;

  const existing = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.lead.delete({ where: { id: leadId } });

  return NextResponse.json({ ok: true });
}
