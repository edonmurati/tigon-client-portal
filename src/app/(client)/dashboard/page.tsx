import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  return (
    <div className="p-8">
      <h1
        className="text-3xl font-light text-[#FAFAF8] mb-2"
        style={{ fontFamily: "var(--font-instrument-serif)" }}
      >
        Willkommen, {user.name}
      </h1>
      <p className="text-[#9CA3AF] text-sm">
        {user.clientName
          ? `${user.clientName} — Ihr Projektportal`
          : "Ihr persönlicher Arbeitsbereich"}
      </p>

      <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-[#0F1218] border border-[#1E2330] rounded-xl p-6">
          <p className="text-xs text-[#9CA3AF] uppercase tracking-widest mb-2">
            Impulse
          </p>
          <p className="text-2xl font-semibold text-[#FAFAF8]">—</p>
          <p className="text-xs text-[#4B5563] mt-1">Noch keine Impulse</p>
        </div>
        <div className="bg-[#0F1218] border border-[#1E2330] rounded-xl p-6">
          <p className="text-xs text-[#9CA3AF] uppercase tracking-widest mb-2">
            Projekte
          </p>
          <p className="text-2xl font-semibold text-[#FAFAF8]">—</p>
          <p className="text-xs text-[#4B5563] mt-1">Wird geladen…</p>
        </div>
        <div className="bg-[#0F1218] border border-[#1E2330] rounded-xl p-6">
          <p className="text-xs text-[#9CA3AF] uppercase tracking-widest mb-2">
            Meilensteine
          </p>
          <p className="text-2xl font-semibold text-[#FAFAF8]">—</p>
          <p className="text-xs text-[#4B5563] mt-1">Wird geladen…</p>
        </div>
      </div>
    </div>
  );
}
