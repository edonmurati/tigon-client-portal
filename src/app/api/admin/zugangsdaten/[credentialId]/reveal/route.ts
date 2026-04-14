import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/vault";
import { logActivity } from "@/lib/activity";

interface RouteParams {
  params: Promise<{ credentialId: string }>;
}

export async function POST(_req: NextRequest, { params }: RouteParams) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { credentialId } = await params;

  const credential = await prisma.credential.findFirst({
    where: { id: credentialId, workspaceId: user.workspaceId, deletedAt: null },
  });

  if (!credential) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let value: string;
  try {
    value = decrypt(credential.encValue, credential.encIv, credential.encTag);
  } catch {
    return NextResponse.json({ error: "Decryption failed" }, { status: 500 });
  }

  logActivity({
    workspaceId: user.workspaceId,
    actorId: user.id,
    actorName: user.name,
    kind: "NOTE",
    clientId: credential.clientId ?? undefined,
    projectId: credential.projectId ?? undefined,
    subject: `Zugangsdaten eingesehen: ${credential.label}`,
    tags: ["credential", "reveal"],
  });

  return NextResponse.json({ value });
}
