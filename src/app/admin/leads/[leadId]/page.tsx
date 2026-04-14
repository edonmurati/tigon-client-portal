import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LeadDetailClient } from "./lead-detail-client";

interface PageProps {
  params: Promise<{ leadId: string }>;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function LeadDetailPage({ params }: PageProps) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const { leadId } = await params;

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) notFound();

  // Serialize for client component
  const serialized = {
    ...lead,
    createdAt: lead.createdAt.toISOString(),
    updatedAt: lead.updatedAt.toISOString(),
    createdAtFormatted: formatDate(lead.createdAt),
    updatedAtFormatted: formatDate(lead.updatedAt),
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      {/* Back link */}
      <Link
        href="/admin/leads"
        className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-surface transition-colors mb-6"
      >
        <ArrowLeft size={14} />
        Zurück zu Leads
      </Link>

      <LeadDetailClient lead={serialized} />
    </div>
  );
}
