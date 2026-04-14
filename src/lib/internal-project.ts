import { prisma } from "@/lib/prisma";

const INTERNAL_SLUG = "intern";
const INTERNAL_NAME = "Intern";

export async function ensureInternalProject(workspaceId: string): Promise<string> {
  const existing = await prisma.project.findFirst({
    where: { workspaceId, slug: INTERNAL_SLUG, deletedAt: null },
    select: { id: true },
  });
  if (existing) return existing.id;

  const created = await prisma.project.create({
    data: {
      workspaceId,
      name: INTERNAL_NAME,
      slug: INTERNAL_SLUG,
      type: "INTERNAL",
      description: "Aufgaben ohne Projektbezug.",
    },
    select: { id: true },
  });
  return created.id;
}
