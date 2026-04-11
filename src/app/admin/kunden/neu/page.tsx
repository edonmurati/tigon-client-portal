import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ClientForm } from "@/components/admin/client-form";

export default async function NeuerKundePage() {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  return (
    <div className="p-6 lg:p-8">
      {/* Back link */}
      <Link
        href="/admin/kunden"
        className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-surface transition-colors mb-6"
      >
        <ArrowLeft size={14} />
        Zurück zu Kunden
      </Link>

      <div className="mb-8">
        <h1 className="font-serif text-3xl text-surface tracking-tightest">
          Neuer Kunde
        </h1>
        <p className="text-ink-muted text-sm mt-1">
          Legen Sie einen neuen Kunden mit erstem Benutzer an.
        </p>
      </div>

      <ClientForm mode="create" />
    </div>
  );
}
