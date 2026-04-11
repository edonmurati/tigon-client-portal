import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CredentialForm } from "@/components/admin/credential-form";

interface PageProps {
  searchParams: Promise<{ clientId?: string; projectId?: string }>;
}

export default async function NeueZugangsdatenPage({ searchParams }: PageProps) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const { clientId, projectId } = await searchParams;

  const [clients, projects] = await Promise.all([
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
      <Link
        href="/admin/zugangsdaten"
        className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-surface transition-colors mb-6"
      >
        <ArrowLeft size={14} />
        Zurück zu Zugangsdaten
      </Link>

      <div className="mb-8">
        <h1 className="font-serif text-3xl text-surface tracking-tightest">
          Zugangsdaten anlegen
        </h1>
        <p className="text-ink-muted text-sm mt-1">
          Alle Werte werden verschlüsselt gespeichert.
        </p>
      </div>

      <CredentialForm
        clients={clients}
        projects={projects}
        clientId={clientId}
        projectId={projectId}
      />
    </div>
  );
}
