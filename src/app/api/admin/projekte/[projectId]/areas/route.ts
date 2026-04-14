import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireAdmin,
  isUnauthorized,
  apiSuccess,
  apiError,
} from "@/lib/api";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const auth = await requireAdmin();
  if (isUnauthorized(auth)) return auth;

  const { projectId } = await params;

  const project = await prisma.project.findFirst({
    where: { id: projectId, workspaceId: auth.workspaceId, deletedAt: null },
    select: { areas: true },
  });
  if (!project) return apiError("Projekt nicht gefunden", 404);

  return apiSuccess({ areas: project.areas });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const auth = await requireAdmin();
  if (isUnauthorized(auth)) return auth;

  const { projectId } = await params;

  let body: { areas?: unknown };
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON", 400);
  }

  if (!Array.isArray(body.areas) || !body.areas.every((a) => typeof a === "string")) {
    return apiError("areas muss ein string[] sein", 400);
  }

  const cleaned = Array.from(
    new Set(
      (body.areas as string[])
        .map((a) => a.trim())
        .filter((a) => a.length > 0)
    )
  );

  const project = await prisma.project.findFirst({
    where: { id: projectId, workspaceId: auth.workspaceId, deletedAt: null },
  });
  if (!project) return apiError("Projekt nicht gefunden", 404);

  const updated = await prisma.project.update({
    where: { id: projectId },
    data: { areas: cleaned },
    select: { areas: true },
  });

  return apiSuccess({ areas: updated.areas });
}
