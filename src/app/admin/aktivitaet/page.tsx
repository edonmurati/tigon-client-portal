import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ActivityFeed } from "@/components/admin/activity-feed";
import { ActivityFilters } from "@/components/admin/activity-filters";
import type { ActivityKind } from "@/generated/prisma";

interface PageProps {
  searchParams: Promise<{
    clientId?: string;
    kind?: string;
    userId?: string;
  }>;
}

const LIMIT = 50;

export default async function AktivitaetPage({ searchParams }: PageProps) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const sp = await searchParams;
  const filterClientId = sp.clientId;
  const filterKind = sp.kind as ActivityKind | undefined;
  const filterUserId = sp.userId;

  const [rawActivities, clients, adminUsers] = await Promise.all([
    prisma.activity.findMany({
      where: {
        workspaceId: user.workspaceId,
        ...(filterClientId ? { clientId: filterClientId } : {}),
        ...(filterKind ? { kind: filterKind } : {}),
        ...(filterUserId ? { actorId: filterUserId } : {}),
      },
      include: {
        actor: { select: { id: true, name: true } },
        client: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: { occurredAt: "desc" },
      take: LIMIT + 1,
    }),
    prisma.client.findMany({
      where: { workspaceId: user.workspaceId, deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { workspaceId: user.workspaceId, role: "ADMIN", deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const hasMore = rawActivities.length > LIMIT;
  const activities = hasMore ? rawActivities.slice(0, LIMIT) : rawActivities;
  const nextCursor = hasMore ? activities[activities.length - 1].id : null;

  const serialized = activities.map((a) => ({
    ...a,
    occurredAt: a.occurredAt.toISOString(),
  }));

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-serif text-3xl text-surface tracking-tightest">
          Aktivitaet
        </h1>
        <p className="text-ink-muted text-sm mt-1">
          Audit-Log aller CRM-Aktionen
        </p>
      </div>

      <ActivityFilters clients={clients} users={adminUsers} />

      <div className="mt-4">
        <ActivityFeed
          initialActivities={serialized}
          initialNextCursor={nextCursor}
          filters={{
            clientId: filterClientId,
            kind: filterKind,
            userId: filterUserId,
          }}
        />
      </div>
    </div>
  );
}
