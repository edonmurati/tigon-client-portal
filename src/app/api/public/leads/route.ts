import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Simple in-memory rate limiter: max 4 requests per IP per 10 minutes
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

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Zu viele Anfragen. Bitte versuche es später erneut." },
      { status: 429 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültiges Format" }, { status: 400 });
  }

  // Required fields
  const unternehmen = typeof body.unternehmen === "string" ? body.unternehmen.trim() : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";

  if (!unternehmen || !name || !email) {
    return NextResponse.json(
      { error: "unternehmen, name und email sind Pflichtfelder" },
      { status: 400 }
    );
  }

  if (!email.includes("@")) {
    return NextResponse.json({ error: "Ungültige E-Mail-Adresse" }, { status: 400 });
  }

  // Resolve workspace — use WORKSPACE_ID env var (single-tenant setup)
  const workspaceId = process.env.WORKSPACE_ID;
  if (!workspaceId) {
    console.error("WORKSPACE_ID env var not set");
    return NextResponse.json({ error: "Serverkonfigurationsfehler" }, { status: 500 });
  }

  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
  if (!workspace) {
    return NextResponse.json({ error: "Workspace nicht gefunden" }, { status: 500 });
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
        rawPayload: body,
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

    return NextResponse.json({ success: true, id: lead.id }, { status: 201 });
  } catch (err) {
    console.error("[public/leads] DB error:", err);
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}
