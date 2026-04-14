import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { LeadStatus } from "@/generated/prisma";

const validStatuses: LeadStatus[] = ["NEW", "CONTACTED", "QUALIFIED", "WON", "LOST", "SPAM"];

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get("status") as LeadStatus | null;

  const leads = await prisma.lead.findMany({
    where:
      statusParam && validStatuses.includes(statusParam)
        ? { status: statusParam }
        : undefined,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ leads });
}
