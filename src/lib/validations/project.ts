import { z } from "zod";

export const createProjectSchema = z.object({
  clientId: z.string().cuid().optional(),
  name: z.string().min(1, "Name is required").transform((s) => s.trim()),
  description: z.string().optional(),
  type: z.enum(["CLIENT_PROJECT", "PRODUCT", "INTERNAL"]).optional(),
  health: z.enum(["GREEN", "AMBER", "RED"]).optional(),
  startDate: z.string().datetime().optional().or(z.literal("")),
  budgetCents: z.number().int().nonnegative().optional(),
  repoUrl: z.string().optional(),
  prodUrl: z.string().optional(),
  stagingUrl: z.string().optional(),
  stack: z.array(z.string()).optional(),
  phase: z.string().optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).transform((s) => s.trim()).optional(),
  description: z.string().nullable().optional(),
  status: z.enum(["ACTIVE", "COMPLETED", "PAUSED"]).optional(),
  type: z.enum(["CLIENT_PROJECT", "PRODUCT", "INTERNAL"]).optional(),
  health: z.enum(["GREEN", "AMBER", "RED"]).optional(),
  startDate: z.string().datetime().nullable().optional(),
  budgetCents: z.number().int().nonnegative().nullable().optional(),
  spentCents: z.number().int().nonnegative().nullable().optional(),
  repoUrl: z.string().nullable().optional(),
  prodUrl: z.string().nullable().optional(),
  stagingUrl: z.string().nullable().optional(),
  stack: z.array(z.string()).optional(),
  phase: z.string().nullable().optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
