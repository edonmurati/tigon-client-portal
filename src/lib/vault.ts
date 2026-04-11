import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
  const hex = process.env.VAULT_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error("VAULT_ENCRYPTION_KEY must be a 64-char hex string (32 bytes)");
  }
  return Buffer.from(hex, "hex");
}

export function encrypt(plaintext: string): { encValue: string; encIv: string; encTag: string } {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "base64");
  encrypted += cipher.final("base64");

  const tag = cipher.getAuthTag();

  return {
    encValue: encrypted,
    encIv: iv.toString("hex"),
    encTag: tag.toString("hex"),
  };
}

export function decrypt(encValue: string, encIv: string, encTag: string): string {
  const key = getKey();
  const iv = Buffer.from(encIv, "hex");
  const tag = Buffer.from(encTag, "hex");
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encValue, "base64", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
