import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { LeadSource } from "@/generated/prisma";

// In-memory rate limit store: IP -> { count, resetAt }
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count += 1;
  return true;
}

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed =
    origin === "https://tigonautomation.de" ||
    origin?.startsWith("http://localhost") ||
    origin?.startsWith("http://127.0.0.1")
      ? origin
      : "https://tigonautomation.de";

  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

// OPTIONS preflight
export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin");
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}

// Known Lead fields from FormData type in tigon-website/src/app/kontakt/page.tsx
// (minus fax and datenschutz)
const KNOWN_FIELDS = new Set([
  "name",
  "email",
  "telefon",
  "unternehmen",
  "servicebedarf",
  "branche",
  "groesse",
  "website",
  "aktuelleSoftware",
  "projekttypen",
  "problem",
  "nutzer",
  "integrationen",
  "anforderungen",
  "budget",
  "zeitrahmen",
  "quelle",
]);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  const headers = corsHeaders(origin);

  // Parse body
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers });
  }

  // Honeypot: if fax is non-empty, silently succeed (bot trap)
  if (body.fax && String(body.fax).trim() !== "") {
    return NextResponse.json({ ok: true }, { headers });
  }

  // Rate limit
  const ip = getClientIp(req);
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Zu viele Anfragen. Bitte warten Sie 10 Minuten." },
      { status: 429, headers }
    );
  }

  // Validation
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const unternehmen = typeof body.unternehmen === "string" ? body.unternehmen.trim() : "";
  const problem = typeof body.problem === "string" ? body.problem.trim() : "";

  if (!name) {
    return NextResponse.json({ error: "Name ist erforderlich." }, { status: 400, headers });
  }
  if (name.length > 100) {
    return NextResponse.json({ error: "Name darf max. 100 Zeichen haben." }, { status: 400, headers });
  }
  if (!email) {
    return NextResponse.json({ error: "E-Mail ist erforderlich." }, { status: 400, headers });
  }
  if (email.length > 255) {
    return NextResponse.json({ error: "E-Mail darf max. 255 Zeichen haben." }, { status: 400, headers });
  }
  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: "Ungültige E-Mail-Adresse." }, { status: 400, headers });
  }
  if (!unternehmen) {
    return NextResponse.json({ error: "Unternehmen ist erforderlich." }, { status: 400, headers });
  }
  if (problem.length > 5000) {
    return NextResponse.json({ error: "Beschreibung darf max. 5000 Zeichen haben." }, { status: 400, headers });
  }

  // Extract known fields
  const telefon = typeof body.telefon === "string" ? body.telefon.trim() || null : null;
  const servicebedarf = typeof body.servicebedarf === "string" ? body.servicebedarf.trim() || null : null;
  const branche = typeof body.branche === "string" ? body.branche.trim() || null : null;
  const groesse = typeof body.groesse === "string" ? body.groesse.trim() || null : null;
  const website = typeof body.website === "string" ? body.website.trim() || null : null;
  const aktuelleSoftware = typeof body.aktuelleSoftware === "string" ? body.aktuelleSoftware.trim() || null : null;
  const projekttypen = Array.isArray(body.projekttypen)
    ? (body.projekttypen as unknown[]).filter((t): t is string => typeof t === "string")
    : [];
  const nutzer = typeof body.nutzer === "string" ? body.nutzer.trim() || null : null;
  const integrationen = typeof body.integrationen === "string" ? body.integrationen.trim() || null : null;
  const anforderungen = typeof body.anforderungen === "string" ? body.anforderungen.trim() || null : null;
  const budget = typeof body.budget === "string" ? body.budget.trim() || null : null;
  const zeitrahmen = typeof body.zeitrahmen === "string" ? body.zeitrahmen.trim() || null : null;
  const quelle = typeof body.quelle === "string" ? body.quelle.trim() || null : null;

  // Collect unknown extra fields into rawPayload
  const extra: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(body)) {
    if (!KNOWN_FIELDS.has(key) && key !== "fax" && key !== "datenschutz") {
      extra[key] = val;
    }
  }
  const rawPayload = Object.keys(extra).length > 0 ? JSON.stringify(extra) : null;

  // Metadata
  const ipAddress = ip !== "unknown" ? ip : null;
  const userAgent = req.headers.get("user-agent") ?? null;

  // Determine source
  const source: LeadSource = "WEBSITE_KONTAKT";

  // Persist
  const lead = await prisma.lead.create({
    data: {
      name,
      email,
      telefon,
      unternehmen,
      servicebedarf,
      branche,
      groesse,
      website,
      aktuelleSoftware,
      projekttypen,
      problem: problem || null,
      nutzer,
      integrationen,
      anforderungen,
      budget,
      zeitrahmen,
      quelle,
      source,
      ipAddress,
      userAgent,
      rawPayload,
    },
  });

  // Activity log (no userId — public submission)
  await prisma.activityLog.create({
    data: {
      action: "LEAD_CREATED",
      entityType: "Lead",
      entityId: lead.id,
      meta: JSON.stringify({ name: lead.name, unternehmen: lead.unternehmen }),
    },
  });

  return NextResponse.json({ ok: true, id: lead.id }, { headers });
}
