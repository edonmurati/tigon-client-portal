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

export async function GET(_req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clients = await prisma.client.findMany({
    include: {
      _count: {
        select: { projects: true, users: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ clients });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    name?: string;
    slug?: string;
    partnershipScope?: string;
    user?: { name?: string; email?: string };
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, slug, partnershipScope, user: firstUser } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (!slug || typeof slug !== "string" || slug.trim().length === 0) {
    return NextResponse.json({ error: "Slug is required" }, { status: 400 });
  }
  if (!firstUser?.name || !firstUser?.email) {
    return NextResponse.json(
      { error: "First user name and email are required" },
      { status: 400 }
    );
  }

  // Check slug uniqueness
  const existing = await prisma.client.findUnique({
    where: { slug: slug.trim() },
  });
  if (existing) {
    return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
  }

  // Check email uniqueness
  const existingUser = await prisma.user.findUnique({
    where: { email: firstUser.email.trim() },
  });
  if (existingUser) {
    return NextResponse.json(
      { error: "User with this email already exists" },
      { status: 409 }
    );
  }

  const plainPassword = generatePassword();
  const passwordHash = await hashPassword(plainPassword);

  const client = await prisma.client.create({
    data: {
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      partnershipScope: partnershipScope?.trim() || null,
      users: {
        create: {
          name: firstUser.name.trim(),
          email: firstUser.email.trim().toLowerCase(),
          passwordHash,
          role: "CLIENT",
        },
      },
    },
    include: {
      users: {
        select: { id: true, name: true, email: true },
      },
      _count: {
        select: { projects: true, users: true },
      },
    },
  });

  return NextResponse.json(
    { client, generatedPassword: plainPassword },
    { status: 201 }
  );
}
