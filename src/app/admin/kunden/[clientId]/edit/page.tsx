import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ClientForm } from "@/components/admin/client-form";

interface PageProps {
  params: Promise<{ clientId: string }>;
}

export default async function EditKundePage({ params }: PageProps) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const { clientId } = await params;

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: {
      id: true,
      name: true,
      slug: true,
      partnershipScope: true,
      status: true,
    },
  });

  if (!client) notFound();

  return (
    <div className="p-6 lg:p-8">
      <Link
        href={`/admin/kunden/${clientId}`}
        className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-surface transition-colors mb-6"
      >
        <ArrowLeft size={14} />
        Zurück zum Kunden
      </Link>

      <div className="mb-8">
        <h1 className="font-serif text-3xl text-surface tracking-tightest">
          {client.name} bearbeiten
        </h1>
        <p className="text-ink-muted text-sm mt-1">
          Kundendaten und Status aktualisieren.
        </p>
      </div>

      <ClientForm
        mode="edit"
        clientId={clientId}
        initialData={{
          name: client.name,
          slug: client.slug,
          partnershipScope: client.partnershipScope ?? undefined,
          status: client.status,
        }}
      />
    </div>
  );
}
