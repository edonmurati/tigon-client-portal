import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, KeyRound } from "lucide-react";
import { CredentialCard } from "@/components/admin/credential-card";
import { EmptyState } from "@/components/ui/empty-state";
import type { CredentialType } from "@/generated/prisma";

interface PageProps {
  searchParams: Promise<{ type?: string }>;
}

export default async function ZugangsdatenPage({ searchParams }: PageProps) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const { type: typeFilter } = await searchParams;

  const credentials = await prisma.credential.findMany({
    where: typeFilter ? { type: typeFilter as CredentialType } : undefined,
    select: {
      id: true,
      label: true,
      type: true,
      url: true,
      username: true,
      notes: true,
      clientId: true,
      projectId: true,
      createdAt: true,
      client: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Group by client name (null → "Ohne Kunde")
  const grouped = new Map<string, typeof credentials>();

  for (const cred of credentials) {
    const key = cred.client?.name ?? "Ohne Kunde";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(cred);
  }

  // Sort: named clients first, "Ohne Kunde" last
  const sortedGroups = [...grouped.entries()].sort(([a], [b]) => {
    if (a === "Ohne Kunde") return 1;
    if (b === "Ohne Kunde") return -1;
    return a.localeCompare(b, "de");
  });

  const typeOptions: { value: string; label: string }[] = [
    { value: "", label: "Alle Typen" },
    { value: "LOGIN", label: "Login" },
    { value: "API_KEY", label: "API Key" },
    { value: "ENV_VARIABLE", label: "Env Variable" },
    { value: "SSH_KEY", label: "SSH Key" },
    { value: "DATABASE", label: "Datenbank" },
    { value: "OTHER", label: "Sonstige" },
  ];

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl text-surface tracking-tightest">
            Zugangsdaten
          </h1>
          <p className="text-ink-muted text-sm mt-1">
            {credentials.length}{" "}
            {credentials.length === 1 ? "Zugangsdatensatz" : "Zugangsdatensätze"} insgesamt
          </p>
        </div>
        <Link
          href="/admin/zugangsdaten/neu"
          className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-ink font-medium text-sm px-4 py-2.5 rounded-xl transition-colors duration-150"
        >
          <Plus size={16} />
          Neu anlegen
        </Link>
      </div>

      {/* Type filter */}
      <div className="mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          {typeOptions.map((opt) => {
            const active = (typeFilter ?? "") === opt.value;
            const href =
              opt.value
                ? `/admin/zugangsdaten?type=${opt.value}`
                : "/admin/zugangsdaten";
            return (
              <Link
                key={opt.value}
                href={href}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  active
                    ? "bg-accent text-ink"
                    : "bg-dark-200 border border-border text-ink-muted hover:text-surface"
                }`}
              >
                {opt.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {credentials.length === 0 ? (
        <div className="bg-dark-100 border border-border rounded-xl">
          <EmptyState
            icon={KeyRound}
            title="Noch keine Zugangsdaten"
            description="Legen Sie den ersten Zugangsdatensatz an."
            action={{ label: "Zugangsdaten anlegen", href: "/admin/zugangsdaten/neu" }}
          />
        </div>
      ) : (
        <div className="space-y-8">
          {sortedGroups.map(([groupName, creds]) => (
            <div key={groupName}>
              <h2 className="text-xs font-medium text-ink-muted uppercase tracking-widest mb-4">
                {groupName}
                <span className="ml-2 text-dark-300 font-normal">({creds.length})</span>
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {creds.map((cred) => (
                  <CredentialCard key={cred.id} credential={cred} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
