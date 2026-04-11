import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    clientId?: string;
    name?: string;
    description?: string;
    startDate?: string;
    liveUrl?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { clientId, name, description, startDate, liveUrl } = body;

  if (!clientId || !name) {
    return NextResponse.json(
      { error: "clientId and name are required" },
      { status: 400 }
    );
  }

  if (liveUrl && !liveUrl.startsWith("https://")) {
    return NextResponse.json(
      { error: "liveUrl must start with https://" },
      { status: 400 }
    );
  }

  // Verify client exists
  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const project = await prisma.project.create({
    data: {
      clientId,
      name: name.trim(),
      description: description?.trim() || null,
      startDate: startDate ? new Date(startDate) : null,
      liveUrl: liveUrl?.trim() || null,
    },
  });

  return NextResponse.json({ project }, { status: 201 });
}
