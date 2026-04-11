import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clearAuthCookies } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refresh_token")?.value;

    if (refreshToken) {
      // Revoke refresh token in DB (best effort)
      await prisma.refreshToken
        .update({
          where: { token: refreshToken },
          data: { revokedAt: new Date() },
        })
        .catch(() => {
          // Token may not exist — ignore
        });
    }

    clearAuthCookies(cookieStore);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[auth/logout]", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}

// Allow GET for convenience (e.g., from a link)
export { POST as GET };
