"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { setUser, clearUser, setAuthChecked, _authChecked } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          clearUser();
        }
      } catch {
        clearUser();
      } finally {
        setAuthChecked(true);
      }
    }

    checkSession();
  }, [setUser, clearUser, setAuthChecked]);

  // Don't block render — let middleware handle redirects
  return <>{children}</>;
}

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  redirectTo = "/login",
}: ProtectedRouteProps) {
  const { isLoggedIn, role, _authChecked } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!_authChecked) return;

    if (!isLoggedIn) {
      router.replace(redirectTo);
      return;
    }

    if (allowedRoles && role && !allowedRoles.includes(role)) {
      router.replace(role === "ADMIN" ? "/admin" : "/dashboard");
    }
  }, [_authChecked, isLoggedIn, role, router, redirectTo, allowedRoles]);

  if (!_authChecked) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
