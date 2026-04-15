import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { leadId } = await params;

  const lead = await prisma.lead.findFirst({
    where: {
      id: leadId,
      workspaceId: user.workspaceId,
      source: "INBOUND",
      deletedAt: null,
    },
    include: {
      contacts: { where: { deletedAt: null } },
      activities: { orderBy: { occurredAt: "desc" }, take: 20 },
    },
  });

  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
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

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const existing = await prisma.lead.findFirst({
    where: { id: leadId, workspaceId: user.workspaceId, source: "INBOUND", deletedAt: null },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allowedStatuses = [
    "NEW", "QUALIFIED", "IN_CONVERSATION", "MEETING_BOOKED",
    "CONVERTED", "REJECTED", "PARKED",
  ];

  const updateData: Record<string, unknown> = {};
  if (body.status && typeof body.status === "string" && allowedStatuses.includes(body.status)) {
    updateData.status = body.status;
  }
  if (typeof body.notes === "string") updateData.notes = body.notes;
  if (typeof body.tier === "string") updateData.tier = body.tier;
  if (typeof body.sourceNote === "string") updateData.sourceNote = body.sourceNote;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const updated = await prisma.lead.update({
    where: { id: leadId },
    data: updateData,
  });

  return NextResponse.json({ lead: updated });
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

  const existing = await prisma.lead.findFirst({
    where: { id: leadId, workspaceId: user.workspaceId, source: "INBOUND", deletedAt: null },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.lead.update({
    where: { id: leadId },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
