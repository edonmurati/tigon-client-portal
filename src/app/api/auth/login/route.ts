import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifyPassword,
  hashPassword,
  signAccessToken,
  signRefreshToken,
  setAuthCookies,
} from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body as { email: string; password: string };

    if (!email || !password) {
      return NextResponse.json(
        { error: "E-Mail und Passwort sind erforderlich" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { client: true },
    });

    // Anti-timing: always hash even if user not found
    const dummyHash = "$2b$12$dummy.hash.to.prevent.timing.attacks.xxxxxxxxxxxxxxxx";
    const passwordToVerify = user?.passwordHash ?? dummyHash;
    const isValid = await verifyPassword(password, passwordToVerify);

    if (!user || !isValid) {
      return NextResponse.json(
        { error: "Ungültige Anmeldedaten" },
        { status: 401 }
      );
    }

    const accessToken = await signAccessToken({
      id: user.id,
      role: user.role,
      clientId: user.clientId,
    });
    const refreshToken = await signRefreshToken({ id: user.id });

    // Store refresh token in DB
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const cookieStore = await cookies();
    setAuthCookies(cookieStore, accessToken, refreshToken);

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
    console.error("[auth/login]", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}

// Ensure hashPassword is imported to avoid unused warning
void hashPassword;
