import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifyRefreshToken,
  signAccessToken,
  signRefreshToken,
  setAuthCookies,
} from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refresh_token")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: "Kein Refresh-Token vorhanden" },
        { status: 401 }
      );
    }

    // Verify JWT signature first
    let payload;
    try {
      payload = await verifyRefreshToken(refreshToken);
    } catch {
      return NextResponse.json(
        { error: "Ungültiger Refresh-Token" },
        { status: 401 }
      );
    }

    // Check DB: must exist, not revoked, not expired
    const dbToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: { include: { client: true } } },
    });

    if (!dbToken || dbToken.revokedAt || dbToken.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Sitzung abgelaufen. Bitte erneut anmelden." },
        { status: 401 }
      );
    }

    if (dbToken.userId !== payload.sub) {
      return NextResponse.json({ error: "Ungültige Sitzung" }, { status: 401 });
    }

    const user = dbToken.user;

    // Rotate: revoke old, create new
    const newRefreshToken = await signRefreshToken({ id: user.id });
    const newAccessToken = await signAccessToken({
      id: user.id,
      role: user.role,
      clientId: user.clientId,
    });

    await prisma.$transaction([
      prisma.refreshToken.update({
        where: { id: dbToken.id },
        data: { revokedAt: new Date() },
      }),
      prisma.refreshToken.create({
        data: {
          token: newRefreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      }),
    ]);

    setAuthCookies(cookieStore, newAccessToken, newRefreshToken);

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        clientId: user.clientId,
        clientName: user.client?.name ?? null,
      },
    });
  } catch (error) {
    console.error("[auth/refresh]", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}
