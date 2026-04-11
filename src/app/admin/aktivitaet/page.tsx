import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ActivityFeed } from "@/components/admin/activity-feed";
import { ActivityFilters } from "@/components/admin/activity-filters";

interface PageProps {
  searchParams: Promise<{
    clientId?: string;
    entityType?: string;
    userId?: string;
  }>;
}

const LIMIT = 50;

export default async function AktivitaetPage({ searchParams }: PageProps) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const sp = await searchParams;
  const filterClientId = sp.clientId;
  const filterEntityType = sp.entityType;
  const filterUserId = sp.userId;

  const [rawActivities, clients, adminUsers] = await Promise.all([
    prisma.activityLog.findMany({
      where: {
        ...(filterClientId ? { clientId: filterClientId } : {}),
        ...(filterEntityType ? { entityType: filterEntityType } : {}),
        ...(filterUserId ? { userId: filterUserId } : {}),
      },
      include: {
        user: { select: { id: true, name: true } },
        client: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: LIMIT + 1,
    }),
    prisma.client.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const hasMore = rawActivities.length > LIMIT;
  const activities = hasMore ? rawActivities.slice(0, LIMIT) : rawActivities;
  const nextCursor = hasMore ? activities[activities.length - 1].id : null;

  // Serialize dates for client component
  const serialized = activities.map((a) => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
  }));

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-serif text-3xl text-surface tracking-tightest">
          Aktivität
        </h1>
        <p className="text-ink-muted text-sm mt-1">
          Audit-Log aller CRM-Aktionen
        </p>
      </div>

      {/* Filters */}
      <ActivityFilters clients={clients} users={adminUsers} />

      {/* Feed */}
      <div className="mt-4">
        <ActivityFeed
          initialActivities={serialized}
          initialNextCursor={nextCursor}
          filters={{
            clientId: filterClientId,
            entityType: filterEntityType,
            userId: filterUserId,
          }}
        />
      </div>
    </div>
  );
}
