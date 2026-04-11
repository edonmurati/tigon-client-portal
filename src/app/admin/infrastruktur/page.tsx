import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { InfrastrukturBoard } from "@/components/admin/infrastruktur-board";

export default async function InfrastrukturPage() {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const [servers, clients, projects] = await Promise.all([
    prisma.serverEntry.findMany({
      select: {
        id: true,
        name: true,
        provider: true,
        url: true,
        ip: true,
        status: true,
        statusNote: true,
        lastChecked: true,
        clientId: true,
        projectId: true,
        createdAt: true,
        updatedAt: true,
        client: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: [
        { client: { name: "asc" } },
        { name: "asc" },
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
  ]);

  return (
    <div className="p-6 lg:p-8">
      <InfrastrukturBoard
        initialServers={servers}
        clients={clients}
        projects={projects}
      />
    </div>
  );
}
