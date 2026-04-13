import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ClientStage } from "@/generated/prisma";

const validStages: ClientStage[] = [
  "COLD",
  "WARM",
  "ACTIVE",
  "PRO_BONO",
  "PAUSED",
  "ENDED",
];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { clientId } = await params;

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      projects: {
        include: {
          areas: true,
          _count: {
            select: { milestones: true, impulses: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      users: {
        select: { id: true, name: true, email: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  return NextResponse.json({ client });
}

export async function PATCH(
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
    slug?: string;
    partnershipScope?: string | null;
    stage?: ClientStage;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.stage && !validStages.includes(body.stage)) {
    return NextResponse.json({ error: "Invalid stage" }, { status: 400 });
  }

  // Check slug uniqueness if changing
  if (body.slug) {
    const existing = await prisma.client.findFirst({
      where: { slug: body.slug.trim(), NOT: { id: clientId } },
    });
    if (existing) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }
  }

  const client = await prisma.client.update({
    where: { id: clientId },
    data: {
      ...(body.name ? { name: body.name.trim() } : {}),
      ...(body.slug ? { slug: body.slug.trim().toLowerCase() } : {}),
      ...(body.partnershipScope !== undefined
        ? { partnershipScope: body.partnershipScope?.trim() || null }
        : {}),
      ...(body.stage ? { stage: body.stage } : {}),
    },
  });

  return NextResponse.json({ client });
}
