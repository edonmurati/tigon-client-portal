import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string; contactId: string }> }
) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { clientId, contactId } = await params;

  let body: {
    name?: string;
    role?: string;
    email?: string;
    phone?: string;
    isPrimary?: boolean;
    notes?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const existing = await prisma.contactPerson.findFirst({
    where: {
      id: contactId,
      clientId,
      client: { workspaceId: user.workspaceId },
    },
  });
  if (!existing) {
    return NextResponse.json({ error: "Kontakt nicht gefunden" }, { status: 404 });
  }

  // If setting as primary, unset all others first
  if (body.isPrimary === true) {
    await prisma.contactPerson.updateMany({
      where: { clientId, isPrimary: true, id: { not: contactId } },
      data: { isPrimary: false },
    });
  }

  const contact = await prisma.contactPerson.update({
    where: { id: contactId },
    data: {
      ...(body.name !== undefined ? { name: body.name.trim() } : {}),
      ...(body.role !== undefined ? { role: body.role.trim() || null } : {}),
      ...(body.email !== undefined ? { email: body.email.trim() || null } : {}),
      ...(body.phone !== undefined ? { phone: body.phone.trim() || null } : {}),
      ...(body.isPrimary !== undefined ? { isPrimary: body.isPrimary } : {}),
      ...(body.notes !== undefined ? { notes: body.notes.trim() || null } : {}),
    },
  });

  logActivity({
    workspaceId: user.workspaceId,
    actorId: user.id,
    actorName: user.name,
    kind: "UPDATED",
    clientId,
    contactId: contact.id,
    subject: `Kontakt aktualisiert: ${contact.name}`,
    tags: ["contact"],
  });

  return NextResponse.json({ contact });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string; contactId: string }> }
) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { clientId, contactId } = await params;

  const existing = await prisma.contactPerson.findFirst({
    where: {
      id: contactId,
      clientId,
      client: { workspaceId: user.workspaceId },
    },
  });
  if (!existing) {
    return NextResponse.json({ error: "Kontakt nicht gefunden" }, { status: 404 });
  }

  await prisma.contactPerson.delete({ where: { id: contactId } });

  logActivity({
    workspaceId: user.workspaceId,
    actorId: user.id,
    actorName: user.name,
    kind: "DELETED",
    clientId,
    contactId: contactId,
    subject: `Kontakt geloescht: ${existing.name}`,
    tags: ["contact"],
  });

  return NextResponse.json({ success: true });
}
