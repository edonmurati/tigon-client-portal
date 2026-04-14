import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteFile } from "@/lib/storage";
import { logActivity } from "@/lib/activity";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { documentId } = await params;

  const document = await prisma.document.findFirst({
    where: { id: documentId, workspaceId: user.workspaceId, deletedAt: null },
    include: {
      client: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
      uploadedBy: { select: { id: true, name: true } },
    },
  });

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  return NextResponse.json({ document });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { documentId } = await params;

  const document = await prisma.document.findFirst({
    where: { id: documentId, workspaceId: user.workspaceId, deletedAt: null },
  });

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  await deleteFile(document.storagePath);

  await prisma.document.delete({ where: { id: documentId } });

  logActivity({
    workspaceId: user.workspaceId,
    actorId: user.id,
    actorName: user.name,
    kind: "DELETED",
    clientId: document.clientId || undefined,
    projectId: document.projectId ?? undefined,
    subject: `Dokument geloescht: ${document.name}`,
    tags: ["document"],
  });

  return NextResponse.json({ success: true });
}
