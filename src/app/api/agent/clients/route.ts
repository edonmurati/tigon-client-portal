import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { requireAgent, isAgentUnauthorized, apiSuccess } from "@/lib/api";
import { logActivity } from "@/lib/activity";

function generatePassword(length = 16): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function GET(req: NextRequest) {
  const auth = await requireAgent(req);
  if (isAgentUnauthorized(auth)) return auth;

  const { searchParams } = new URL(req.url);
  const stage = searchParams.get("stage");
  const slug = searchParams.get("slug");

  const clients = await prisma.client.findMany({
    where: {
      workspaceId: auth.workspaceId,
      deletedAt: null,
      ...(stage ? { stage: stage as never } : {}),
      ...(slug ? { slug } : {}),
    },
    include: {
      _count: { select: { projects: true, users: true } },
    },
    orderBy: { name: "asc" },
  });

  return apiSuccess({ clients });
}

export async function POST(req: NextRequest) {
  const auth = await requireAgent(req);
  if (isAgentUnauthorized(auth)) return auth;

  let body: {
    name?: string;
    slug?: string;
    stage?: string;
    partnershipScope?: string;
    firstUser?: { name?: string; email?: string };
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = body.name?.trim();
  const slug = body.slug?.trim().toLowerCase();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });
  if (!slug) return NextResponse.json({ error: "Slug required" }, { status: 400 });

  const clash = await prisma.client.findUnique({
    where: { workspaceId_slug: { workspaceId: auth.workspaceId, slug } },
  });
  if (clash) return NextResponse.json({ error: "Slug already exists" }, { status: 409 });

  const firstUserData = body.firstUser;
  let firstUserCreate: object | undefined;
  let generatedPassword: string | undefined;
  if (firstUserData?.name && firstUserData?.email) {
    const email = firstUserData.email.trim().toLowerCase();
    const existingUser = await prisma.user.findFirst({
      where: { workspaceId: auth.workspaceId, email },
    });
    if (existingUser) {
      return NextResponse.json({ error: "User email already exists" }, { status: 409 });
    }
    generatedPassword = generatePassword();
    firstUserCreate = {
      create: {
        workspaceId: auth.workspaceId,
        name: firstUserData.name.trim(),
        email,
        passwordHash: await hashPassword(generatedPassword),
        role: "CLIENT",
      },
    };
  }

  const client = await prisma.client.create({
    data: {
      workspaceId: auth.workspaceId,
      name,
      slug,
      stage: (body.stage as never) ?? "COLD",
      partnershipScope: body.partnershipScope?.trim() || null,
      ...(firstUserCreate ? { users: firstUserCreate } : {}),
    },
  });

  logActivity({
    workspaceId: auth.workspaceId,
    actorName: auth.actorName,
    kind: "CREATED",
    clientId: client.id,
    subject: `Kunde angelegt: ${client.name}`,
    summary: client.stage,
    tags: ["client", "agent"],
  });

  return apiSuccess({ client, generatedPassword: generatedPassword ?? null }, 201);
}
