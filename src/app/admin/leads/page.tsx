import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Inbox } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import type { LeadStatus } from "@/generated/prisma";

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

const leadStatusLabels: Record<LeadStatus, string> = {
  NEW: "Neu",
  CONTACTED: "Kontaktiert",
  QUALIFIED: "Qualifiziert",
  WON: "Gewonnen",
  LOST: "Verloren",
  SPAM: "Spam",
};

const leadStatusColors: Record<LeadStatus, string> = {
  NEW: "bg-accent/20 text-accent",
  CONTACTED: "bg-blue-500/20 text-blue-400",
  QUALIFIED: "bg-purple-500/20 text-purple-400",
  WON: "bg-green-500/20 text-green-400",
  LOST: "bg-red-500/20 text-red-400",
  SPAM: "bg-zinc-500/20 text-zinc-400",
};

const ALL_STATUSES: LeadStatus[] = ["NEW", "CONTACTED", "QUALIFIED", "WON", "LOST", "SPAM"];

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function LeadsPage({ searchParams }: PageProps) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const sp = await searchParams;
  const filterStatus =
    sp.status && ALL_STATUSES.includes(sp.status as LeadStatus)
      ? (sp.status as LeadStatus)
      : null;

  const [leads, newCount] = await Promise.all([
    prisma.lead.findMany({
      where: filterStatus ? { status: filterStatus } : undefined,
      orderBy: { createdAt: "desc" },
    }),
    prisma.lead.count({ where: { status: "NEW" } }),
  ]);

  const tabs: { label: string; value: string | null; count?: number }[] = [
    { label: "Alle", value: null },
    ...ALL_STATUSES.map((s) => ({ label: leadStatusLabels[s], value: s })),
  ];

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl text-surface tracking-tightest">
            Leads
          </h1>
          <p className="text-ink-muted text-sm mt-1">
            {leads.length} {leads.length === 1 ? "Lead" : "Leads"}
            {filterStatus ? ` (${leadStatusLabels[filterStatus]})` : ""}{" "}
            {newCount > 0 && !filterStatus && (
              <span className="text-accent font-medium">· {newCount} neu</span>
            )}
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-5 flex-wrap">
        {tabs.map((tab) => {
          const isActive = filterStatus === tab.value;
          const href = tab.value ? `/admin/leads?status=${tab.value}` : "/admin/leads";
          return (
            <Link
              key={tab.value ?? "all"}
              href={href}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-accent/10 text-accent"
                  : "text-ink-muted hover:text-surface hover:bg-dark-300"
              }`}
            >
              {tab.label}
              {tab.value === "NEW" && newCount > 0 && (
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-accent text-ink text-[10px] font-bold">
                  {newCount > 99 ? "99+" : newCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Table */}
      {leads.length === 0 ? (
        <div className="bg-dark-100 border border-border rounded-xl">
          <EmptyState
            icon={Inbox}
            title="Keine Leads gefunden"
            description={
              filterStatus
                ? "Keine Leads mit diesem Status."
                : "Noch keine Leads eingegangen. Website-Formular leitet direkt hierher."
            }
          />
        </div>
      ) : (
        <div className="bg-dark-100 border border-border rounded-xl overflow-hidden">
          {/* Column headers */}
          <div className="hidden md:grid grid-cols-[auto_1fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-border">
            <span className="text-[10px] font-medium text-ink-muted uppercase tracking-widest w-20">
              Status
            </span>
            <span className="text-[10px] font-medium text-ink-muted uppercase tracking-widest">
              Name
            </span>
            <span className="text-[10px] font-medium text-ink-muted uppercase tracking-widest">
              Unternehmen
            </span>
            <span className="text-[10px] font-medium text-ink-muted uppercase tracking-widest">
              E-Mail
            </span>
            <span className="text-[10px] font-medium text-ink-muted uppercase tracking-widest">
              Servicebedarf
            </span>
            <span className="text-[10px] font-medium text-ink-muted uppercase tracking-widest text-right min-w-[90px]">
              Budget / Datum
            </span>
          </div>

          <div className="divide-y divide-border">
            {leads.map((lead) => (
              <Link
                key={lead.id}
                href={`/admin/leads/${lead.id}`}
                className={`flex flex-col md:grid md:grid-cols-[auto_1fr_1fr_1fr_1fr_auto] gap-2 md:gap-4 items-start md:items-center px-5 py-4 hover:bg-dark-200 transition-colors group ${
                  lead.status === "NEW" ? "bg-accent/5" : ""
                }`}
              >
                {/* Status badge */}
                <div className="md:w-20">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${leadStatusColors[lead.status]}`}
                  >
                    {leadStatusLabels[lead.status]}
                  </span>
                </div>

                {/* Name */}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-surface group-hover:text-accent transition-colors truncate">
                    {lead.name}
                  </p>
                  {lead.telefon && (
                    <p className="text-xs text-ink-muted truncate">{lead.telefon}</p>
                  )}
                </div>

                {/* Unternehmen */}
                <div className="min-w-0">
                  <p className="text-sm text-surface truncate">{lead.unternehmen}</p>
                  {lead.branche && (
                    <p className="text-xs text-ink-muted truncate">{lead.branche}</p>
                  )}
                </div>

                {/* Email */}
                <div className="min-w-0">
                  <p className="text-sm text-ink-muted truncate">{lead.email}</p>
                </div>

                {/* Servicebedarf */}
                <div className="min-w-0">
                  <p className="text-sm text-ink-muted truncate">
                    {lead.servicebedarf ?? "—"}
                  </p>
                </div>

                {/* Budget + Date */}
                <div className="text-right shrink-0 min-w-[90px]">
                  {lead.budget && (
                    <p className="text-xs font-medium text-surface">{lead.budget}</p>
                  )}
                  <p className="text-xs text-ink-muted whitespace-nowrap">
                    {timeAgo(new Date(lead.createdAt))}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
