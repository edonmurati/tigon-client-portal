"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { setUser } = useAuthStore();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Anmeldung fehlgeschlagen");
        return;
      }

      setUser(data.user);

      if (data.user.role === "ADMIN") {
        router.replace("/admin");
      } else {
        router.replace("/dashboard");
      }
    } catch {
      setError("Verbindungsfehler. Bitte versuchen Sie es erneut.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#08090E] flex items-center justify-center px-4">
      {/* Background texture */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #C8964A 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }}
      />

      {/* Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-[#C8964A] opacity-[0.04] blur-[120px] pointer-events-none" />

      <div className="relative w-full max-w-sm">
        {/* Logo mark */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-12 h-12 rounded-xl bg-[#C8964A] flex items-center justify-center mb-4 shadow-[0_0_40px_rgba(200,150,74,0.3)]">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 3L20 7.5V16.5L12 21L4 16.5V7.5L12 3Z"
                fill="#08090E"
                fillOpacity="0.9"
              />
              <path
                d="M12 7L16.5 9.5V14.5L12 17L7.5 14.5V9.5L12 7Z"
                fill="#C8964A"
                fillOpacity="0.6"
              />
            </svg>
          </div>
          <h1
            className="text-2xl font-light tracking-tight text-[#FAFAF8]"
            style={{ fontFamily: "var(--font-instrument-serif)" }}
          >
            Tigon Portal
          </h1>
          <p className="text-sm text-[#9CA3AF] mt-1">
            Ihr persönlicher Arbeitsbereich
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#0F1218] border border-[#1E2330] rounded-2xl p-8 shadow-[0_24px_80px_rgba(0,0,0,0.6)]">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-xs font-medium text-[#9CA3AF] uppercase tracking-widest"
              >
                E-Mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="name@unternehmen.de"
                className="w-full bg-[#161B24] border border-[#1E2330] rounded-lg px-4 py-3 text-[#FAFAF8] placeholder:text-[#4B5563] text-sm focus:outline-none focus:border-[#C8964A] focus:ring-1 focus:ring-[#C8964A] transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-xs font-medium text-[#9CA3AF] uppercase tracking-widest"
              >
                Passwort
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full bg-[#161B24] border border-[#1E2330] rounded-lg px-4 py-3 text-[#FAFAF8] placeholder:text-[#4B5563] text-sm focus:outline-none focus:border-[#C8964A] focus:ring-1 focus:ring-[#C8964A] transition-colors"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  className="shrink-0"
                >
                  <circle cx="7" cy="7" r="6" stroke="#ef4444" strokeWidth="1.5" />
                  <path
                    d="M7 4v3M7 9.5v.5"
                    stroke="#ef4444"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#C8964A] hover:bg-[#B5853F] disabled:opacity-60 disabled:cursor-not-allowed text-[#08090E] font-semibold text-sm py-3 rounded-lg transition-all duration-200 shadow-[0_4px_20px_rgba(200,150,74,0.25)] hover:shadow-[0_4px_28px_rgba(200,150,74,0.4)] flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-[#08090E]/30 border-t-[#08090E] rounded-full animate-spin" />
                  Anmelden…
                </>
              ) : (
                "Anmelden"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[#4B5563] mt-6">
          Tigon Automation &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
