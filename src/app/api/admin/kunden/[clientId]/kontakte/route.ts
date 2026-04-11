import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { clientId } = await params;

  const contacts = await prisma.contactPerson.findMany({
    where: { clientId },
    orderBy: [{ isPrimary: "desc" }, { name: "asc" }],
  });

  return NextResponse.json({ contacts });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { clientId } = await params;

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

  const { name, role, email, phone, isPrimary, notes } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Name ist erforderlich" }, { status: 400 });
  }

  // Verify client exists
  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) {
    return NextResponse.json({ error: "Kunde nicht gefunden" }, { status: 404 });
  }

  // If setting as primary, unset all others first
  if (isPrimary) {
    await prisma.contactPerson.updateMany({
      where: { clientId, isPrimary: true },
      data: { isPrimary: false },
    });
  }

  const contact = await prisma.contactPerson.create({
    data: {
      clientId,
      name: name.trim(),
      role: role?.trim() || null,
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      isPrimary: isPrimary ?? false,
      notes: notes?.trim() || null,
    },
  });

  logActivity({
    userId: user.id,
    action: "CREATE",
    entityType: "ContactPerson",
    entityId: contact.id,
    clientId,
    meta: { name: contact.name, isPrimary: contact.isPrimary },
  });

  return NextResponse.json({ contact }, { status: 201 });
}
