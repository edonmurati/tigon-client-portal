import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getAuthUser();

  if (!user || user.role !== "CLIENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!user.clientId) {
    return NextResponse.json({ error: "No client associated" }, { status: 400 });
  }

  const [projects, recentImpulses] = await Promise.all([
    prisma.project.findMany({
      where: { clientId: user.clientId, deletedAt: null },
      include: {
        milestones: {
          where: { completedAt: null },
          select: { id: true, dueDate: true },
          orderBy: { dueDate: "asc" },
          take: 5,
        },
        _count: {
          select: {
            impulses: {
              where: { status: { not: "DONE" } },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.impulse.findMany({
      where: {
        project: { clientId: user.clientId, deletedAt: null },
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        type: true,
        status: true,
        createdAt: true,
        project: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const upcomingMilestones = projects.reduce((acc, p) => acc + p.milestones.length, 0);

  return NextResponse.json({
    projects,
    recentImpulses,
    stats: {
      activeProjects: projects.filter((p) => p.status === "ACTIVE").length,
      openImpulses: projects.reduce((acc, p) => acc + p._count.impulses, 0),
      upcomingMilestones,
    },
  });
}
