import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Inbox } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { leadStatusLabels, leadStatusColors } from "@/lib/constants";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

export default async function AnfragenPage() {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const leads = await prisma.lead.findMany({
    where: {
      workspaceId: user.workspaceId,
      source: "INBOUND",
      deletedAt: null,
    },
    include: {
      contacts: {
        where: { deletedAt: null },
        orderBy: { isPrimary: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const newCount = leads.filter((l) => l.status === "NEW").length;

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl text-surface tracking-tightest">
            Anfragen
          </h1>
          <p className="text-ink-muted text-sm mt-1">
            {leads.length} {leads.length === 1 ? "Anfrage" : "Anfragen"} insgesamt
            {newCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-accent/20 text-accent text-xs font-bold">
                {newCount} neu
              </span>
            )}
          </p>
        </div>
      </div>

      {leads.length === 0 ? (
        <div className="bg-dark-100 border border-border rounded-xl">
          <EmptyState
            icon={Inbox}
            title="Noch keine Inbound-Anfragen"
            description="Anfragen vom tigonautomation.de Kontaktformular erscheinen hier."
          />
        </div>
      ) : (
        <div className="bg-dark-100 border border-border rounded-xl overflow-hidden">
          <div className="grid grid-cols-[1fr_160px_140px_120px] gap-4 px-5 py-3 border-b border-border">
            <span className="text-[10px] font-medium text-ink-muted uppercase tracking-widest">
              Unternehmen / Kontakt
            </span>
            <span className="text-[10px] font-medium text-ink-muted uppercase tracking-widest">
              Branche
            </span>
            <span className="text-[10px] font-medium text-ink-muted uppercase tracking-widest">
              Eingang
            </span>
            <span className="text-[10px] font-medium text-ink-muted uppercase tracking-widest">
              Status
            </span>
          </div>

          <div className="divide-y divide-border">
            {leads.map((lead) => {
              const contact = lead.contacts[0];
              const isNew = lead.status === "NEW";
              return (
                <Link
                  key={lead.id}
                  href={`/admin/anfragen/${lead.id}`}
                  className="grid grid-cols-[1fr_160px_140px_120px] gap-4 items-center px-5 py-4 hover:bg-dark-200 transition-colors duration-150 group"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {isNew && (
                        <span className="inline-block w-2 h-2 rounded-full bg-accent shrink-0" />
                      )}
                      <p className="text-sm font-medium text-surface group-hover:text-accent transition-colors truncate">
                        {lead.companyName}
                      </p>
                    </div>
                    {contact && (
                      <p className="text-xs text-ink-muted mt-0.5 truncate">
                        {contact.name}
                        {contact.email && ` · ${contact.email}`}
                      </p>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-ink-muted truncate">
                      {lead.branche ?? lead.industry ?? "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-muted">
                      {formatDistanceToNow(new Date(lead.createdAt), {
                        addSuffix: true,
                        locale: de,
                      })}
                    </p>
                  </div>
                  <div>
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${leadStatusColors[lead.status] ?? "text-ink-muted bg-dark-300"}`}
                    >
                      {leadStatusLabels[lead.status] ?? lead.status}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
