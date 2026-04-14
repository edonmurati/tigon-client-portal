import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 4;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

const ALLOWED_ORIGINS = [
  "https://tigonautomation.de",
  "https://www.tigonautomation.de",
];

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed =
    origin && (ALLOWED_ORIGINS.includes(origin) || origin.startsWith("http://localhost"))
      ? origin
      : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(req.headers.get("origin")),
  });
}

export async function POST(req: NextRequest) {
  const headers = corsHeaders(req.headers.get("origin"));

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Zu viele Anfragen. Bitte versuche es später erneut." },
      { status: 429, headers }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültiges Format" }, { status: 400, headers });
  }

  if (typeof body.fax === "string" && body.fax.trim() !== "") {
    return NextResponse.json({ success: true }, { status: 201, headers });
  }

  // Required fields
  const unternehmen = typeof body.unternehmen === "string" ? body.unternehmen.trim() : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";

  if (!unternehmen || !name || !email) {
    return NextResponse.json(
      { error: "unternehmen, name und email sind Pflichtfelder" },
      { status: 400, headers }
    );
  }

  if (!email.includes("@")) {
    return NextResponse.json({ error: "Ungültige E-Mail-Adresse" }, { status: 400, headers });
  }

  // Resolve workspace — use WORKSPACE_ID env var (single-tenant setup)
  const workspaceId = process.env.WORKSPACE_ID;
  if (!workspaceId) {
    console.error("WORKSPACE_ID env var not set");
    return NextResponse.json({ error: "Serverkonfigurationsfehler" }, { status: 500, headers });
  }

  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
  if (!workspace) {
    return NextResponse.json({ error: "Workspace nicht gefunden" }, { status: 500, headers });
  }

  const userAgent = req.headers.get("user-agent") ?? undefined;

  // Map form fields → Lead model
  const groesse = typeof body.groesse === "string" ? body.groesse.trim() : undefined;
  const branche = typeof body.branche === "string" ? body.branche.trim() : undefined;
  const budget = typeof body.budget === "string" ? body.budget.trim() : undefined;
  const zeitrahmen = typeof body.zeitrahmen === "string" ? body.zeitrahmen.trim() : undefined;
  const problem = typeof body.problem === "string" ? body.problem.trim() : undefined;
  const servicebedarf = typeof body.servicebedarf === "string" ? body.servicebedarf.trim() : undefined;
  const telefon = typeof body.telefon === "string" ? body.telefon.trim() : undefined;
  const projekttypen = Array.isArray(body.projekttypen)
    ? (body.projekttypen as unknown[]).filter((v): v is string => typeof v === "string")
    : [];

  try {
    const lead = await prisma.lead.create({
      data: {
        workspaceId,
        companyName: unternehmen,
        industry: branche,
        employeeCount: groesse,
        source: "INBOUND",
        status: "NEW",
        notes: problem ? `Problem/Ziel:\n${problem}` : undefined,
        tags: ["inbound", "website-formular"],
        // inbound-specific
        branche,
        telefon,
        budget,
        zeitrahmen,
        problem,
        servicebedarf,
        projekttypen,
        ipAddress: ip,
        userAgent,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rawPayload: body as any,
        // primary contact via ContactPerson — create inline
        contacts: {
          create: {
            name,
            email,
            phone: telefon,
            isPrimary: true,
          },
        },
      },
      select: { id: true },
    });

    return NextResponse.json({ success: true, id: lead.id }, { status: 201, headers });
  } catch (err) {
    console.error("[public/leads] DB error:", err);
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500, headers });
  }
}
