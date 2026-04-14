import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ impulseId: string }> }
) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { impulseId } = await params;

  let body: { content?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { content } = body;
  if (!content || typeof content !== "string" || content.trim().length === 0) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  // Verify impulse exists in workspace, fetch related data for webhook
  const impulse = await prisma.impulse.findFirst({
    where: {
      id: impulseId,
      deletedAt: null,
      project: { workspaceId: user.workspaceId, deletedAt: null },
    },
    include: {
      project: {
        include: {
          client: true,
        },
      },
      author: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (!impulse) {
    return NextResponse.json({ error: "Impulse not found" }, { status: 404 });
  }

  const comment = await prisma.impulseComment.create({
    data: {
      impulseId,
      authorId: user.id,
      content: content.trim(),
    },
    include: {
      author: {
        select: { id: true, name: true, role: true },
      },
    },
  });

  // Fire n8n webhook (fire-and-forget)
  const webhookBase = process.env.N8N_WEBHOOK_BASE;
  if (webhookBase) {
    const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://portal.tigonautomation.de"}/projekte/${impulse.projectId}/impulse/${impulse.id}`;
    fetch(`${webhookBase}/portal-impulse-response`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        impulseId: impulse.id,
        impulseTitle: impulse.title,
        clientName: impulse.project.client?.name ?? "",
        clientEmail: impulse.author.email,
        responsePreview: content.trim().substring(0, 200),
        portalUrl,
      }),
    }).catch(() => {});
  }

  return NextResponse.json({ comment }, { status: 201 });
}
