import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { FileDropzone } from "@/components/admin/file-dropzone";

export default async function HochladenPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string; projectId?: string }>;
}) {
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
        href="/admin/dokumente"
        className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-surface transition-colors mb-6"
      >
        <ChevronLeft size={14} />
        Zurück zu Dokumente
      </Link>

      <div className="mb-8">
        <h1 className="font-serif text-3xl text-surface tracking-tightest">
          Dokument hochladen
        </h1>
        <p className="text-ink-muted text-sm mt-1">
          Datei auswählen und einem Kunden oder Projekt zuordnen.
        </p>
      </div>

      <div className="max-w-2xl">
        <div className="bg-dark-100 border border-border rounded-xl p-6">
          <FileDropzone
            clientId={clientId}
            projectId={projectId}
            clients={clients}
            projects={projects}
          />
        </div>
      </div>
    </div>
  );
}
