import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAgent, isAgentUnauthorized, apiSuccess, apiError } from "@/lib/api";
import { logActivity } from "@/lib/activity";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const auth = await requireAgent(req);
  if (isAgentUnauthorized(auth)) return auth;

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");
  const projectId = searchParams.get("projectId");
  const clientSlug = searchParams.get("clientSlug");
  const category = searchParams.get("category");
  const limit = Math.min(Number(searchParams.get("limit") ?? "50"), 200);

  let resolvedClientId = clientId;
  if (!resolvedClientId && clientSlug) {
    const c = await prisma.client.findUnique({
      where: { workspaceId_slug: { workspaceId: auth.workspaceId, slug: clientSlug } },
      select: { id: true },
    });
    if (!c) return apiError("Client not found", 404);
    resolvedClientId = c.id;
  }

  const entries = await prisma.knowledgeEntry.findMany({
    where: {
      workspaceId: auth.workspaceId,
      deletedAt: null,
      ...(resolvedClientId ? { clientId: resolvedClientId } : {}),
      ...(projectId ? { projectId } : {}),
      ...(category ? { category: category as never } : {}),
    },
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
    take: limit,
  });

  return apiSuccess({ entries });
}

const agentEntrySchema = z.object({
  title: z.string().min(1).transform((s) => s.trim()),
  content: z.string().min(1),
  category: z.enum(["SPEC", "PLAN", "MEETING_NOTE", "IDEA", "INSIGHT", "RESEARCH", "OTHER"]),
  clientId: z.string().cuid().optional(),
  clientSlug: z.string().optional(),
  projectId: z.string().cuid().optional(),
  tags: z.array(z.string()).optional(),
  pinned: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const auth = await requireAgent(req);
  if (isAgentUnauthorized(auth)) return auth;

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return apiError("Invalid JSON", 400);
  }
  const parseResult = agentEntrySchema.safeParse(raw);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parseResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const { clientId: rawClientId, clientSlug, projectId, category, title, content, tags, pinned } =
    parseResult.data;

  let clientId: string | null = rawClientId ?? null;
  if (!clientId && clientSlug) {
    const c = await prisma.client.findUnique({
      where: { workspaceId_slug: { workspaceId: auth.workspaceId, slug: clientSlug } },
      select: { id: true },
    });
    if (!c) return apiError("Client not found", 404);
    clientId = c.id;
  } else if (clientId) {
    const c = await prisma.client.findFirst({
      where: { id: clientId, workspaceId: auth.workspaceId, deletedAt: null },
      select: { id: true },
    });
    if (!c) return apiError("Client not found", 404);
  }

  if (projectId) {
    const p = await prisma.project.findFirst({
      where: { id: projectId, workspaceId: auth.workspaceId, deletedAt: null },
      select: { id: true },
    });
    if (!p) return apiError("Project not found", 404);
  }

  const entry = await prisma.knowledgeEntry.create({
    data: {
      workspaceId: auth.workspaceId,
      clientId,
      projectId: projectId ?? null,
      authorId: null,
      category,
      title,
      content,
      tags: tags ?? [],
      pinned: pinned ?? false,
    },
  });

  logActivity({
    workspaceId: auth.workspaceId,
    actorName: auth.actorName,
    kind: "CREATED",
    clientId: clientId ?? undefined,
    projectId: projectId ?? undefined,
    subject: `Eintrag erstellt: ${entry.title}`,
    summary: entry.category,
    tags: ["knowledge-entry", "agent"],
  });

  return apiSuccess({ entry }, 201);
}
