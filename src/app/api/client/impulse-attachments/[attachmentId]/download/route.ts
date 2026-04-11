import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getFilePath } from "@/lib/storage";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ attachmentId: string }> }
) {
  const user = await getAuthUser();

  if (!user || user.role !== "CLIENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!user.clientId) {
    return NextResponse.json({ error: "No client associated" }, { status: 400 });
  }

  const { attachmentId } = await params;

  const attachment = await prisma.impulseAttachment.findUnique({
    where: { id: attachmentId },
    include: {
      impulse: {
        include: {
          project: {
            select: { clientId: true },
          },
        },
      },
    },
  });

  if (!attachment || attachment.impulse.project.clientId !== user.clientId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const filePath = getFilePath(attachment.storagePath);
  let fileBuffer: Buffer;
  try {
    fileBuffer = await readFile(filePath);
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  return new Response(fileBuffer as unknown as BodyInit, {
    headers: {
      "Content-Type": attachment.mimeType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(attachment.name)}"`,
      "Content-Length": String(attachment.sizeBytes),
      "Cache-Control": "private, max-age=3600",
    },
  });
}
