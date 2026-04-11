"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, Users, FolderOpen, FileText, KeyRound, Server, Activity, Menu, X, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { ProtectedRoute } from "@/components/auth/auth-provider";

const navSections = [
  {
    items: [
      { href: "/admin/impulse", label: "Impulse", icon: Bell, matchPrefix: "/admin/impulse" },
      { href: "/admin/kunden", label: "Kunden", icon: Users, matchPrefix: "/admin/kunden" },
      { href: "/admin/projekte", label: "Projekte", icon: FolderOpen, matchPrefix: "/admin/projekte" },
    ],
  },
  {
    label: "CRM",
    items: [
      { href: "/admin/zugangsdaten", label: "Zugangsdaten", icon: KeyRound, matchPrefix: "/admin/zugangsdaten" },
      { href: "/admin/dokumente", label: "Dokumente", icon: FileText, matchPrefix: "/admin/dokumente" },
      { href: "/admin/infrastruktur", label: "Infrastruktur", icon: Server, matchPrefix: "/admin/infrastruktur" },
      { href: "/admin/aktivitaet", label: "Aktivität", icon: Activity, matchPrefix: "/admin/aktivitaet" },
    ],
  },
];

function AdminSidebar({
  mobileOpen,
  onClose,
  unreadCount,
}: {
  mobileOpen: boolean;
  onClose: () => void;
  unreadCount: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { name, clearUser } = useAuthStore();

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {
      // ignore
    }
    clearUser();
    router.replace("/login");
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 pt-6 pb-5 border-b border-border">
        <p className="font-serif text-xl text-surface tracking-tightest">
          Tigon Portal
        </p>
        <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-medium bg-accent/20 text-accent tracking-wider uppercase">
          Admin
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navSections.map((section, sIdx) => (
          <div key={sIdx}>
            {section.label && (
              <div className="px-3 pt-4 pb-2">
                <p className="text-[10px] font-medium text-ink-muted uppercase tracking-widest">
                  {section.label}
                </p>
              </div>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.matchPrefix);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative group",
                      isActive
                        ? "bg-accent/10 text-accent border-l-2 border-accent pl-[10px]"
                        : "text-ink-muted hover:text-surface hover:bg-dark-300"
                    )}
                  >
                    <Icon size={16} className="shrink-0" />
                    <span>{item.label}</span>
                    {item.href === "/admin/impulse" && unreadCount > 0 && (
                      <span className="ml-auto inline-flex items-center justify-center w-5 h-5 rounded-full bg-accent text-ink text-[10px] font-bold">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-3 pb-4 border-t border-border pt-4">
        <div className="px-3 py-2 mb-2">
          <p className="text-xs font-medium text-surface truncate">{name ?? "Admin"}</p>
          <p className="text-[10px] text-ink-muted">Administrator</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-ink-muted hover:text-red-400 hover:bg-red-500/10 transition-all duration-150"
        >
          <LogOut size={14} />
          <span>Abmelden</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-[280px] shrink-0 bg-dark-100 border-r border-border h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-dark/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <aside className="relative z-10 flex flex-col w-[280px] bg-dark-100 border-r border-border h-full">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-ink-muted hover:text-surface p-1"
            >
              <X size={18} />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}

function AdminShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function fetchUnread() {
      try {
        const res = await fetch("/api/admin/impulse?status=NEW", {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.impulses?.length ?? 0);
        }
      } catch {
        // ignore
      }
    }
    fetchUnread();
  }, []);

  return (
    <div className="flex min-h-screen bg-dark">
      <AdminSidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        unreadCount={unreadCount}
      />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-dark-100 border-b border-border sticky top-0 z-40">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-ink-muted hover:text-surface p-1"
          >
            <Menu size={20} />
          </button>
          <p className="font-serif text-base text-surface tracking-tightest">
            Tigon Portal
          </p>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={["ADMIN"]} redirectTo="/login">
      <AdminShell>{children}</AdminShell>
    </ProtectedRoute>
  );
}
