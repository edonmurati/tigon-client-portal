import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || "projekt";
}

async function uniqueSlug(workspaceId: string, base: string): Promise<string> {
  let slug = base;
  let suffix = 2;
  while (
    await prisma.project.findFirst({
      where: { workspaceId, slug },
      select: { id: true },
    })
  ) {
    slug = `${base}-${suffix++}`;
  }
  return slug;
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    clientId?: string;
    name?: string;
    description?: string;
    startDate?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { clientId, name, description, startDate } = body;

  if (!clientId || !name) {
    return NextResponse.json(
      { error: "clientId and name are required" },
      { status: 400 }
    );
  }

  const client = await prisma.client.findFirst({
    where: { id: clientId, workspaceId: user.workspaceId },
  });
  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  // Retry on P2002 (slug race) up to 3 times with fresh suffix
  const base = toSlug(name);
  let project;
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    const slug = await uniqueSlug(user.workspaceId, base);
    try {
      project = await prisma.project.create({
        data: {
          workspaceId: user.workspaceId,
          clientId,
          name: name.trim(),
          slug,
          description: description?.trim() || null,
          startDate: startDate ? new Date(startDate) : null,
        },
      });
      break;
    } catch (error) {
      lastError = error;
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        continue;
      }
      throw error;
    }
  }

  if (!project) {
    console.error("Failed to create project after retries", lastError);
    return NextResponse.json(
      { error: "Could not allocate unique slug" },
      { status: 500 }
    );
  }

  return NextResponse.json({ project }, { status: 201 });
}
