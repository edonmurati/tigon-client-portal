import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveFile } from "@/lib/storage";
import { logActivity } from "@/lib/activity";
import { assertClientInWorkspace, assertProjectInWorkspace } from "@/lib/api";
import type { DocumentCategory } from "@/generated/prisma";

const VALID_CATEGORIES: DocumentCategory[] = [
  "CONTRACT",
  "INVOICE",
  "PROPOSAL",
  "BRIEFING",
  "SCREENSHOT",
  "DIAGRAM",
  "LEGAL",
  "AVV",
  "DPA",
  "OTHER",
];

function parseCategory(value: string | null | undefined): DocumentCategory | null {
  if (!value) return null;
  return VALID_CATEGORIES.includes(value as DocumentCategory)
    ? (value as DocumentCategory)
    : null;
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");
  const projectId = searchParams.get("projectId");
  const category = searchParams.get("category");

  const categoryFilter = parseCategory(category);

  const documents = await prisma.document.findMany({
    where: {
      workspaceId: user.workspaceId,
      deletedAt: null,
      ...(clientId ? { clientId } : {}),
      ...(projectId ? { projectId } : {}),
      ...(categoryFilter ? { category: categoryFilter } : {}),
    },
    include: {
      client: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
      uploadedBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ documents });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const clientId = formData.get("clientId") as string | null;
  const projectId = formData.get("projectId") as string | null;
  const category = formData.get("category") as string | null;
  const displayName = formData.get("displayName") as string | null;

  const clientCheck = await assertClientInWorkspace(clientId, user.workspaceId);
  if (clientCheck) return clientCheck;
  const projectCheck = await assertProjectInWorkspace(projectId, user.workspaceId);
  if (projectCheck) return projectCheck;

  const buffer = Buffer.from(await file.arrayBuffer());
  const targetDir = clientId ? `clients/${clientId}` : "general";

  let storagePath: string;
  let sizeBytes: number;
  try {
    ({ storagePath, sizeBytes } = await saveFile(buffer, file.name, targetDir));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const document = await prisma.document.create({
    data: {
      workspaceId: user.workspaceId,
      name: file.name,
      displayName: displayName?.trim() || null,
      mimeType: file.type || "application/octet-stream",
      sizeBytes,
      storagePath,
      category: parseCategory(category) ?? "OTHER",
      clientId: clientId || null,
      projectId: projectId || null,
      uploadedById: user.id,
    },
    include: {
      client: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
      uploadedBy: { select: { id: true, name: true } },
    },
  });

  logActivity({
    workspaceId: user.workspaceId,
    actorId: user.id,
    actorName: user.name,
    kind: "CREATED",
    clientId: clientId || undefined,
    projectId: document.projectId ?? undefined,
    subject: `Dokument hochgeladen: ${file.name}`,
    summary: category || undefined,
    changes: { sizeBytes },
    tags: ["document"],
  });

  return NextResponse.json({ document }, { status: 201 });
}
