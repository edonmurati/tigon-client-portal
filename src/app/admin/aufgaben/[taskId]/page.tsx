import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TaskForm } from "@/components/admin/task-form";

interface PageProps {
  params: Promise<{ taskId: string }>;
}

export default async function TaskDetailPage({ params }: PageProps) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const { taskId } = await params;

  const [task, clients, projects, admins] = await Promise.all([
    prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        client: { select: { id: true, name: true, stage: true } },
        project: { select: { id: true, name: true } },
      },
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

  if (!task) notFound();

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <Link
        href="/admin/aufgaben"
        className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-surface transition-colors mb-6"
      >
        <ArrowLeft size={14} />
        Aufgaben
      </Link>

      <div className="mb-8">
        <h1 className="font-serif text-3xl text-surface tracking-tightest">
          Aufgabe bearbeiten
        </h1>
        <p className="text-ink-muted text-sm mt-1">{task.title}</p>
      </div>

      <TaskForm
        taskId={task.id}
        initialData={{
          title: task.title,
          description: task.description,
          priority: task.priority,
          assigneeId: task.assigneeId,
          clientId: task.clientId,
          projectId: task.projectId,
          dueDate: task.dueDate ? task.dueDate.toISOString() : null,
          completedAt: task.completedAt ? task.completedAt.toISOString() : null,
        }}
        clients={clients}
        projects={projects}
        admins={admins}
      />
    </div>
  );
}
