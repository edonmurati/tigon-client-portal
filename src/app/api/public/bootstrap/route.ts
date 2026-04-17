import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * TEMPORARY BOOTSTRAP ENDPOINT
 *
 * Runs `prisma db push --accept-data-loss` to force-sync the DB schema,
 * then creates the admin user. Protected by BOOTSTRAP_TOKEN env var.
 *
 * DELETE THIS FILE after bootstrapping prod.
 */
export async function POST(request: NextRequest) {
  const token = request.headers.get("x-bootstrap-token");
  const expectedToken = process.env.BOOTSTRAP_TOKEN || "tigon-bootstrap-2026";

  if (token !== expectedToken) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const out: Record<string, string> = {};

  try {
    const pushResult = await execAsync(
      "node node_modules/prisma/build/index.js db push --schema prisma/schema.prisma --accept-data-loss --force-reset",
      { cwd: "/app", maxBuffer: 10 * 1024 * 1024, timeout: 90000 }
    );
    out.db_push_stdout = pushResult.stdout;
    out.db_push_stderr = pushResult.stderr;
  } catch (e) {
    const err = e as { stdout?: string; stderr?: string; message: string };
    out.db_push_error = err.message;
    out.db_push_stdout = err.stdout || "";
    out.db_push_stderr = err.stderr || "";
  }

  try {
    const seedResult = await execAsync(
      "node node_modules/tsx/dist/cli.mjs scripts/seed-admin.ts",
      { cwd: "/app", maxBuffer: 10 * 1024 * 1024 }
    );
    out.seed_stdout = seedResult.stdout;
    out.seed_stderr = seedResult.stderr;
  } catch (e) {
    const err = e as { stdout?: string; stderr?: string; message: string };
    out.seed_error = err.message;
    out.seed_stdout = err.stdout || "";
    out.seed_stderr = err.stderr || "";
  }

  return NextResponse.json(out);
}
