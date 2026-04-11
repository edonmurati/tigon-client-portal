import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function KundenPage() {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-3xl font-light text-[#FAFAF8]"
            style={{ fontFamily: "var(--font-instrument-serif)" }}
          >
            Kunden
          </h1>
          <p className="text-[#9CA3AF] text-sm mt-1">
            Alle aktiven Kunden und Projekte
          </p>
        </div>
        <button className="bg-[#C8964A] hover:bg-[#B5853F] text-[#08090E] font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors">
          Kunde hinzufügen
        </button>
      </div>

      <div className="bg-[#0F1218] border border-[#1E2330] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#1E2330]">
          <p className="text-xs text-[#9CA3AF] uppercase tracking-widest">
            Kundenliste
          </p>
        </div>
        <div className="p-6 text-center text-[#4B5563] text-sm py-16">
          Noch keine Kunden angelegt. Starten Sie mit dem Seed-Script.
        </div>
      </div>
    </div>
  );
}
