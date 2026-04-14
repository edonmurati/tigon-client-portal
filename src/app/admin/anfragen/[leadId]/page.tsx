import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, Mail, Phone, Globe, Calendar, Tag } from "lucide-react";
import { leadStatusLabels, leadStatusColors } from "@/lib/constants";
import { StatusForm } from "./status-form";

interface PageProps {
  params: Promise<{ leadId: string }>;
}

export default async function AnfrageDetailPage({ params }: PageProps) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const { leadId } = await params;

  const lead = await prisma.lead.findFirst({
    where: {
      id: leadId,
      workspaceId: user.workspaceId,
      source: "INBOUND",
      deletedAt: null,
    },
    include: {
      contacts: { where: { deletedAt: null } },
    },
  });

  if (!lead) notFound();

  const primaryContact = lead.contacts.find((c) => c.isPrimary) ?? lead.contacts[0];

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      {/* Back */}
      <Link
        href="/admin/anfragen"
        className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-surface transition-colors mb-6"
      >
        <ArrowLeft size={14} />
        Alle Anfragen
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-3xl text-surface tracking-tightest">
            {lead.companyName}
          </h1>
          <p className="text-ink-muted text-sm mt-1">
            Eingegangen am{" "}
            {new Date(lead.createdAt).toLocaleDateString("de-DE", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}{" "}
            um{" "}
            {new Date(lead.createdAt).toLocaleTimeString("de-DE", {
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            Uhr
          </p>
        </div>
        <span
          className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium shrink-0 ${leadStatusColors[lead.status] ?? "text-ink-muted bg-dark-300"}`}
        >
          {leadStatusLabels[lead.status] ?? lead.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact */}
          {primaryContact && (
            <section className="bg-dark-100 border border-border rounded-xl p-5">
              <h2 className="text-xs font-medium text-ink-muted uppercase tracking-widest mb-4">
                Ansprechpartner
              </h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Building2 size={14} className="text-ink-muted shrink-0" />
                  <span className="text-sm text-surface">{primaryContact.name}</span>
                </div>
                {primaryContact.email && (
                  <div className="flex items-center gap-3">
                    <Mail size={14} className="text-ink-muted shrink-0" />
                    <a
                      href={`mailto:${primaryContact.email}`}
                      className="text-sm text-accent hover:underline"
                    >
                      {primaryContact.email}
                    </a>
                  </div>
                )}
                {(primaryContact.phone ?? lead.telefon) && (
                  <div className="flex items-center gap-3">
                    <Phone size={14} className="text-ink-muted shrink-0" />
                    <a
                      href={`tel:${primaryContact.phone ?? lead.telefon}`}
                      className="text-sm text-surface hover:text-accent transition-colors"
                    >
                      {primaryContact.phone ?? lead.telefon}
                    </a>
                  </div>
                )}
                {lead.website && (
                  <div className="flex items-center gap-3">
                    <Globe size={14} className="text-ink-muted shrink-0" />
                    <a
                      href={lead.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-accent hover:underline truncate"
                    >
                      {lead.website}
                    </a>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Firma Details */}
          <section className="bg-dark-100 border border-border rounded-xl p-5">
            <h2 className="text-xs font-medium text-ink-muted uppercase tracking-widest mb-4">
              Unternehmen
            </h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
              {(lead.branche ?? lead.industry) && (
                <>
                  <dt className="text-xs text-ink-muted">Branche</dt>
                  <dd className="text-sm text-surface">{lead.branche ?? lead.industry}</dd>
                </>
              )}
              {lead.employeeCount && (
                <>
                  <dt className="text-xs text-ink-muted">Größe</dt>
                  <dd className="text-sm text-surface">{lead.employeeCount}</dd>
                </>
              )}
              {lead.location && (
                <>
                  <dt className="text-xs text-ink-muted">Standort</dt>
                  <dd className="text-sm text-surface">{lead.location}</dd>
                </>
              )}
              {lead.budget && (
                <>
                  <dt className="text-xs text-ink-muted">Budget</dt>
                  <dd className="text-sm text-surface">{lead.budget}</dd>
                </>
              )}
              {lead.zeitrahmen && (
                <>
                  <dt className="text-xs text-ink-muted">Zeitrahmen</dt>
                  <dd className="text-sm text-surface">{lead.zeitrahmen}</dd>
                </>
              )}
            </dl>
          </section>

          {/* Servicebedarf & Problem */}
          {(lead.servicebedarf ?? lead.problem) && (
            <section className="bg-dark-100 border border-border rounded-xl p-5">
              <h2 className="text-xs font-medium text-ink-muted uppercase tracking-widest mb-4">
                Anfrage
              </h2>
              {lead.servicebedarf && (
                <div className="mb-4">
                  <p className="text-xs text-ink-muted mb-1">Servicebedarf</p>
                  <p className="text-sm text-surface whitespace-pre-wrap">{lead.servicebedarf}</p>
                </div>
              )}
              {lead.problem && (
                <div>
                  <p className="text-xs text-ink-muted mb-1">Problem / Ziel</p>
                  <p className="text-sm text-surface whitespace-pre-wrap">{lead.problem}</p>
                </div>
              )}
            </section>
          )}

          {/* Projekttypen */}
          {lead.projekttypen && lead.projekttypen.length > 0 && (
            <section className="bg-dark-100 border border-border rounded-xl p-5">
              <h2 className="text-xs font-medium text-ink-muted uppercase tracking-widest mb-3">
                Interessierte Leistungen
              </h2>
              <div className="flex flex-wrap gap-2">
                {lead.projekttypen.map((typ) => (
                  <span
                    key={typ}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent border border-accent/20"
                  >
                    <Tag size={10} />
                    {typ}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Notes */}
          {lead.notes && (
            <section className="bg-dark-100 border border-border rounded-xl p-5">
              <h2 className="text-xs font-medium text-ink-muted uppercase tracking-widest mb-3">
                Notizen
              </h2>
              <p className="text-sm text-surface whitespace-pre-wrap">{lead.notes}</p>
            </section>
          )}
        </div>

        {/* Right: actions sidebar */}
        <div className="space-y-6">
          <section className="bg-dark-100 border border-border rounded-xl p-5">
            <StatusForm leadId={lead.id} currentStatus={lead.status} />
          </section>

          {/* Meta */}
          <section className="bg-dark-100 border border-border rounded-xl p-5 space-y-3">
            <h2 className="text-xs font-medium text-ink-muted uppercase tracking-widest">
              Meta
            </h2>
            <div className="flex items-center gap-2 text-xs text-ink-muted">
              <Calendar size={12} className="shrink-0" />
              <span>
                {new Date(lead.createdAt).toLocaleDateString("de-DE", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}{" "}
                {new Date(lead.createdAt).toLocaleTimeString("de-DE", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            {lead.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {lead.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded text-[10px] font-medium bg-dark-300 text-ink-muted border border-border"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
