import { mkdir, writeFile, unlink, stat } from "node:fs/promises";
import { join, dirname } from "node:path";
import { randomBytes } from "node:crypto";

const UPLOAD_DIR = process.env.UPLOAD_DIR || join(process.cwd(), "uploads");
const MAX_SIZE = (parseInt(process.env.MAX_UPLOAD_SIZE_MB || "50", 10)) * 1024 * 1024;

export function getUploadDir(): string {
  return UPLOAD_DIR;
}

export function getFilePath(storagePath: string): string {
  return join(UPLOAD_DIR, storagePath);
}

export async function saveFile(
  buffer: Buffer,
  originalName: string,
  targetDir: string
): Promise<{ storagePath: string; sizeBytes: number }> {
  if (buffer.length > MAX_SIZE) {
    throw new Error(`File exceeds maximum size of ${process.env.MAX_UPLOAD_SIZE_MB || "50"}MB`);
  }

  const ext = originalName.includes(".") ? originalName.substring(originalName.lastIndexOf(".")) : "";
  const filename = randomBytes(16).toString("hex") + ext;
  const storagePath = join(targetDir, filename);
  const fullPath = getFilePath(storagePath);

  await mkdir(dirname(fullPath), { recursive: true });
  await writeFile(fullPath, buffer);

  return { storagePath, sizeBytes: buffer.length };
}

export async function deleteFile(storagePath: string): Promise<void> {
  const fullPath = getFilePath(storagePath);
  try {
    await unlink(fullPath);
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }
}

export async function fileExists(storagePath: string): Promise<boolean> {
  try {
    await stat(getFilePath(storagePath));
    return true;
  } catch {
    return false;
  }
}
