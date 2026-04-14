import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, type AuthUser } from "@/lib/auth";
import { ZodSchema, ZodError } from "zod";

/**
 * Verify the request is from an authenticated ADMIN user.
 * Returns the AuthUser or a 401 NextResponse.
 */
export async function requireAdmin(): Promise<
  AuthUser | NextResponse
> {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return user;
}

/**
 * Type guard: checks if requireAdmin returned a Response (unauthorized).
 */
export function isUnauthorized(
  result: AuthUser | NextResponse
): result is NextResponse {
  return result instanceof NextResponse;
}

/**
 * Parse and validate the JSON body of a request against a Zod schema.
 * Returns the parsed data or a 400 NextResponse.
 */
export async function parseBody<T>(
  req: NextRequest,
  schema: ZodSchema<T>
): Promise<T | NextResponse> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    return schema.parse(raw);
  } catch (e) {
    if (e instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: e.flatten().fieldErrors },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
}

/**
 * Type guard: checks if parseBody returned a Response (invalid input).
 */
export function isParseError<T>(
  result: T | NextResponse
): result is NextResponse {
  return result instanceof NextResponse;
}

/** Standard success response */
export function apiSuccess<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

/** Standard error response */
export function apiError(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Ensure a clientId (if given) belongs to the caller's workspace.
 * Returns null if ok or input is null/undefined, or a 404 NextResponse.
 */
export async function assertClientInWorkspace(
  clientId: string | null | undefined,
  workspaceId: string
): Promise<NextResponse | null> {
  if (!clientId) return null;
  const { prisma } = await import("@/lib/prisma");
  const client = await prisma.client.findFirst({
    where: { id: clientId, workspaceId, deletedAt: null },
    select: { id: true },
  });
  if (!client) return apiError("Kunde nicht gefunden", 404);
  return null;
}

/**
 * Ensure a projectId (if given) belongs to the caller's workspace.
 * Returns null if ok or input is null/undefined, or a 404 NextResponse.
 */
export async function assertProjectInWorkspace(
  projectId: string | null | undefined,
  workspaceId: string
): Promise<NextResponse | null> {
  if (!projectId) return null;
  const { prisma } = await import("@/lib/prisma");
  const project = await prisma.project.findFirst({
    where: { id: projectId, workspaceId, deletedAt: null },
    select: { id: true },
  });
  if (!project) return apiError("Projekt nicht gefunden", 404);
  return null;
}
