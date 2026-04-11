import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ImpulseStatusBadge, ImpulseTypeBadge } from "@/components/ui/badge";
import { ImpulseFilters } from "@/components/admin/impulse-filters";
import type { ImpulseStatus, ImpulseType } from "@/generated/prisma";

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "Gerade eben";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `vor ${minutes} Min.`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `vor ${hours} Std.`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `vor ${days} Tag${days === 1 ? "" : "en"}`;
  return date.toLocaleDateString("de-DE");
}

const validStatuses: ImpulseStatus[] = ["NEW", "SEEN", "IN_PROGRESS", "DONE"];
const validTypes: ImpulseType[] = ["FEEDBACK", "CHANGE_REQUEST", "QUESTION", "IDEA"];

interface PageProps {
  searchParams: Promise<{ clientId?: string; status?: string; type?: string }>;
}

export default async function ImpulseInboxPage({ searchParams }: PageProps) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const sp = await searchParams;
  const filterStatus = sp.status as ImpulseStatus | undefined;
  const filterType = sp.type as ImpulseType | undefined;
  const filterClientId = sp.clientId;

  const impulses = await prisma.impulse.findMany({
    where: {
      ...(filterStatus && validStatuses.includes(filterStatus)
        ? { status: filterStatus }
        : {}),
      ...(filterType && validTypes.includes(filterType)
        ? { type: filterType }
        : {}),
      ...(filterClientId
        ? { project: { clientId: filterClientId } }
        : {}),
    },
    include: {
      project: {
        include: {
          client: {
            select: { id: true, name: true },
          },
        },
      },
      author: {
        select: { id: true, name: true },
      },
      _count: {
        select: { comments: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const clients = await prisma.client.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl text-surface tracking-tightest">
            Impulse
          </h1>
          <p className="text-ink-muted text-sm mt-1">
            {impulses.length} {impulses.length === 1 ? "Eintrag" : "Einträge"}
          </p>
        </div>
      </div>

      {/* Filters */}
      <ImpulseFilters clients={clients} />

      {/* Table */}
      <div className="mt-4 bg-dark-100 border border-border rounded-xl overflow-hidden">
        {impulses.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-ink-muted text-sm">Keine Impulse gefunden.</p>
            <p className="text-ink-muted/60 text-xs mt-1">
              Passen Sie die Filter an oder warten Sie auf neue Einträge.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {impulses.map((impulse) => (
              <Link
                key={impulse.id}
                href={`/admin/impulse/${impulse.id}`}
                className={`flex items-center gap-4 px-5 py-4 hover:bg-dark-200 transition-colors group ${
                  impulse.status === "NEW" ? "bg-accent/5" : ""
                }`}
              >
                {/* Status dot */}
                <div
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    impulse.status === "NEW"
                      ? "bg-accent"
                      : impulse.status === "IN_PROGRESS"
                      ? "bg-yellow-400"
                      : impulse.status === "DONE"
                      ? "bg-green-400"
                      : "bg-blue-400"
                  }`}
                />

                {/* Main content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <ImpulseTypeBadge type={impulse.type} />
                    <ImpulseStatusBadge status={impulse.status} />
                  </div>
                  <p className="text-sm font-medium text-surface truncate group-hover:text-accent transition-colors">
                    {impulse.title}
                  </p>
                  <p className="text-xs text-ink-muted mt-0.5 truncate">
                    {impulse.project.client.name} &bull; {impulse.project.name} &bull;{" "}
                    {impulse.author.name}
                  </p>
                </div>

                {/* Meta */}
                <div className="flex items-center gap-3 shrink-0 text-right">
                  {impulse._count.comments > 0 && (
                    <span className="text-xs text-ink-muted">
                      {impulse._count.comments} Komm.
                    </span>
                  )}
                  <span className="text-xs text-ink-muted whitespace-nowrap">
                    {timeAgo(new Date(impulse.createdAt))}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
