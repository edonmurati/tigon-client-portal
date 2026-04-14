import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    // seed: "npx tsx prisma/seed.ts", // disabled until seed is rewritten for new schema
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
