import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getFilePath, fileExists } from "@/lib/storage";

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
  });

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const exists = await fileExists(document.storagePath);
  if (!exists) {
    return NextResponse.json({ error: "File not found on disk" }, { status: 404 });
  }

  const filePath = getFilePath(document.storagePath);
  const fileBuffer = await readFile(filePath);

  const filename = encodeURIComponent(document.displayName || document.name);

  return new Response(fileBuffer, {
    headers: {
      "Content-Type": document.mimeType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(document.sizeBytes),
    },
  });
}
