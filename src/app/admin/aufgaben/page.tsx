import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AufgabenBoard } from "@/components/admin/aufgaben-board";

export default async function AufgabenPage() {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const [tasks, clients, projects, admins] = await Promise.all([
    prisma.task.findMany({
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        client: { select: { id: true, name: true, stage: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: [
        { completedAt: "asc" },
        { dueDate: "asc" },
        { sortOrder: "asc" },
        { createdAt: "desc" },
      ],
    }),
    prisma.client.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.project.findMany({
      select: { id: true, name: true, clientId: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const serializedTasks = tasks.map((t) => ({
    ...t,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    completedAt: t.completedAt ? t.completedAt.toISOString() : null,
  }));

  return (
    <AufgabenBoard
      initialTasks={serializedTasks}
      clients={clients}
      projects={projects}
      admins={admins}
      currentUserId={user.id}
    />
  );
}
