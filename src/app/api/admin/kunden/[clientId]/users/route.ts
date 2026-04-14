import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function generatePassword(length = 12): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
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

  let body: { name?: string; email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, email } = body;
  if (!name || !email) {
    return NextResponse.json(
      { error: "Name and email are required" },
      { status: 400 }
    );
  }

  // Verify client exists in same workspace
  const client = await prisma.client.findFirst({
    where: { id: clientId, workspaceId: user.workspaceId },
  });
  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      workspaceId: user.workspaceId,
      email: email.trim().toLowerCase(),
    },
  });
  if (existingUser) {
    return NextResponse.json(
      { error: "User with this email already exists" },
      { status: 409 }
    );
  }

  const plainPassword = generatePassword();
  const passwordHash = await hashPassword(plainPassword);

  const newUser = await prisma.user.create({
    data: {
      workspaceId: user.workspaceId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      role: "CLIENT",
      clientId,
    },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  return NextResponse.json(
    { user: newUser, generatedPassword: plainPassword },
    { status: 201 }
  );
}
