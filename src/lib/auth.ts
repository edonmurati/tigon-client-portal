import { hash, compare } from "bcryptjs";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/generated/prisma";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  workspaceId: string;
  clientId: string | null;
  clientName: string | null;
}

export interface TokenPayload extends JWTPayload {
  sub: string;
  role: Role;
  clientId?: string;
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const JWT_REFRESH_SECRET = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET!);

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

export async function verifyPassword(password: string, hashed: string): Promise<boolean> {
  return compare(password, hashed);
}

export async function signAccessToken(user: {
  id: string;
  role: Role;
  clientId?: string | null;
}): Promise<string> {
  const payload: Record<string, unknown> = { sub: user.id, role: user.role };
  if (user.clientId) payload.clientId = user.clientId;
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(JWT_SECRET);
}

export async function signRefreshToken(user: { id: string }): Promise<string> {
  return new SignJWT({ sub: user.id })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_REFRESH_SECRET);
}

export async function verifyAccessToken(token: string): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, JWT_SECRET);
  return payload as TokenPayload;
}

export async function verifyRefreshToken(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, JWT_REFRESH_SECRET);
  return payload;
}

export function setAuthCookies(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  accessToken: string,
  refreshToken: string
) {
  const secure = process.env.NODE_ENV === "production";
  cookieStore.set("access_token", accessToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60,
  });
  cookieStore.set("refresh_token", refreshToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/api/auth/refresh",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearAuthCookies(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  cookieStore.delete("access_token");
  cookieStore.set("refresh_token", "", {
    httpOnly: true,
    path: "/api/auth/refresh",
    maxAge: 0,
  });
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  if (!token) return null;
  try {
    const payload = await verifyAccessToken(token);
    const dbUser = await prisma.user.findUnique({
      where: { id: payload.sub! },
      include: { client: true },
    });
    if (!dbUser) return null;
    return {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
      workspaceId: dbUser.workspaceId,
      clientId: dbUser.clientId,
      clientName: dbUser.client?.name ?? null,
    };
  } catch {
    return null;
  }
}

export function hasRole(user: AuthUser, allowed: Role[]): boolean {
  return allowed.includes(user.role);
}
