"use client";

import { useState, useCallback } from "react";
import { Plus, Server } from "lucide-react";
import { ServerCard } from "@/components/admin/server-card";
import { ServerForm } from "@/components/admin/server-form";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ServerStatus } from "@/generated/prisma";

interface ServerEntry {
  id: string;
  name: string;
  provider: string | null;
  url: string | null;
  ip: string | null;
  status: ServerStatus;
  statusNote: string | null;
  lastChecked: Date | string | null;
  clientId: string | null;
  projectId: string | null;
  client?: { id: string; name: string } | null;
  project?: { id: string; name: string } | null;
}

interface InfrastrukturBoardProps {
  initialServers: ServerEntry[];
  clients: { id: string; name: string }[];
  projects: { id: string; name: string; clientId: string | null }[];
}

const statusColors: Record<ServerStatus, string> = {
  ONLINE: "text-green-400",
  DEGRADED: "text-yellow-400",
  OFFLINE: "text-red-400",
  MAINTENANCE: "text-blue-400",
};

export function InfrastrukturBoard({
  initialServers,
  clients,
  projects,
}: InfrastrukturBoardProps) {
  const [servers, setServers] = useState<ServerEntry[]>(initialServers);
  const [addOpen, setAddOpen] = useState(false);
  const [version, setVersion] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/infrastruktur", {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data.servers) {
        setServers(data.servers);
        setVersion((v) => v + 1);
      }
    } catch {
      // silent
    }
  }, []);

  // Group by client name
  const grouped = new Map<string, ServerEntry[]>();

  for (const server of servers) {
    const key = server.client?.name ?? "Allgemein";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(server);
  }

  // Sort: named clients first (alpha), "Allgemein" last
  const sortedGroups = [...grouped.entries()].sort(([a], [b]) => {
    if (a === "Allgemein") return 1;
    if (b === "Allgemein") return -1;
    return a.localeCompare(b, "de");
  });

  // Stats
  const total = servers.length;
  const online = servers.filter((s) => s.status === "ONLINE").length;
  const degraded = servers.filter((s) => s.status === "DEGRADED").length;
  const offline = servers.filter((s) => s.status === "OFFLINE").length;
  const maintenance = servers.filter((s) => s.status === "MAINTENANCE").length;

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl text-surface tracking-tightest">
            Infrastruktur
          </h1>
          <p className="text-ink-muted text-sm mt-1">
            {total} {total === 1 ? "Server" : "Server"} insgesamt
          </p>
        </div>
        <Button size="md" onClick={() => setAddOpen(true)}>
          <Plus size={16} />
          Server hinzufügen
        </Button>
      </div>

      {/* Stats row */}
      {total > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <div className="bg-dark-100 border border-border rounded-xl px-4 py-3">
            <p className="text-[10px] font-medium text-ink-muted uppercase tracking-widest mb-1">
              Online
            </p>
            <p className={`text-2xl font-semibold ${statusColors.ONLINE}`}>{online}</p>
          </div>
          <div className="bg-dark-100 border border-border rounded-xl px-4 py-3">
            <p className="text-[10px] font-medium text-ink-muted uppercase tracking-widest mb-1">
              Eingeschränkt
            </p>
            <p className={`text-2xl font-semibold ${statusColors.DEGRADED}`}>{degraded}</p>
          </div>
          <div className="bg-dark-100 border border-border rounded-xl px-4 py-3">
            <p className="text-[10px] font-medium text-ink-muted uppercase tracking-widest mb-1">
              Offline
            </p>
            <p className={`text-2xl font-semibold ${statusColors.OFFLINE}`}>{offline}</p>
          </div>
          <div className="bg-dark-100 border border-border rounded-xl px-4 py-3">
            <p className="text-[10px] font-medium text-ink-muted uppercase tracking-widest mb-1">
              Wartung
            </p>
            <p className={`text-2xl font-semibold ${statusColors.MAINTENANCE}`}>{maintenance}</p>
          </div>
        </div>
      )}

      {/* Content */}
      {total === 0 ? (
        <div className="bg-dark-100 border border-border rounded-xl">
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-dark-300 flex items-center justify-center mb-4">
              <Server className="w-6 h-6 text-ink-muted" />
            </div>
            <p className="text-sm font-medium text-surface mb-1">
              Noch keine Server erfasst
            </p>
            <p className="text-xs text-ink-muted max-w-xs mb-4">
              Tragen Sie den ersten Server ein, um den Infrastruktur-Status zu verfolgen.
            </p>
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus size={14} />
              Ersten Server hinzufügen
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedGroups.map(([groupName, groupServers]) => (
            <div key={groupName}>
              <h2 className="text-xs font-medium text-ink-muted uppercase tracking-widest mb-4">
                {groupName}
                <span className="ml-2 text-dark-300 font-normal">({groupServers.length})</span>
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" key={version}>
                {groupServers.map((server) => (
                  <ServerCard
                    key={server.id}
                    server={server}
                    clients={clients}
                    projects={projects}
                    onUpdate={refresh}
                    onDelete={refresh}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Server hinzufügen"
      >
        <ServerForm
          clients={clients}
          projects={projects}
          onSuccess={() => {
            setAddOpen(false);
            refresh();
          }}
          onCancel={() => setAddOpen(false)}
        />
      </Dialog>
    </>
  );
}
