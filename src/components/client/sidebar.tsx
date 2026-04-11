"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  FolderOpen,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projekte", label: "Projekte", icon: FolderOpen },
  { href: "/einstellungen", label: "Einstellungen", icon: Settings },
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { name, clientName, clearUser } = useAuthStore();

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {
      // ignore
    }
    clearUser();
    router.replace("/login");
  }

  return (
    <div className="flex flex-col h-full bg-dark-100 border-r border-border">
      {/* Header */}
      <div className="px-6 pt-6 pb-5 border-b border-border">
        <div className="flex items-start justify-between">
          <div>
            <span className="font-serif text-xl text-surface tracking-tightest">Tigon</span>
            {clientName && (
              <p className="text-xs text-ink-muted mt-1 truncate max-w-[180px]">{clientName}</p>
            )}
          </div>
          {onClose && (
            <button onClick={onClose} className="text-ink-muted hover:text-surface transition-colors p-1">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors duration-150",
                isActive
                  ? "text-accent bg-accent/10 border-l-2 border-accent pl-[10px]"
                  : "text-ink-muted hover:text-surface hover:bg-dark-200"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-5 border-t border-border pt-4 space-y-1">
        <div className="px-3 py-2">
          <p className="text-xs font-medium text-surface truncate">{name}</p>
          <p className="text-xs text-ink-muted">Client</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-ink-muted hover:text-red-400 hover:bg-red-500/10 transition-colors duration-150 w-full"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Abmelden</span>
        </button>
      </div>
    </div>
  );
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 h-screen sticky top-0">
        <div className="w-full overflow-y-auto">
          <SidebarContent />
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-dark-100 border-b border-border px-4 py-3 flex items-center justify-between">
        <span className="font-serif text-lg text-surface tracking-tightest">Tigon</span>
        <button
          onClick={() => setMobileOpen(true)}
          className="text-ink-muted hover:text-surface transition-colors p-1"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-dark/80 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 h-full overflow-y-auto">
            <SidebarContent onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
