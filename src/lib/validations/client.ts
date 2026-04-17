import { z } from "zod";

export const createClientSchema = z.object({
  name: z.string().min(1, "Name is required").transform((s) => s.trim()),
  slug: z
    .string()
    .min(1, "Slug is required")
    .transform((s) => s.trim().toLowerCase()),
  stage: z
    .enum(["COLD", "WARM", "ACTIVE", "PAUSED", "ENDED"])
    .optional(),
  industry: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  monthlyRevenueCents: z.number().int().nonnegative().optional(),
  contractType: z.string().optional(),
  partnershipScope: z.string().optional(),
  user: z
    .object({
      name: z.string().min(1, "User name is required"),
      email: z.string().email("Valid email required"),
    })
    .optional(),
});

export const updateClientSchema = z.object({
  name: z.string().min(1).transform((s) => s.trim()).optional(),
  slug: z
    .string()
    .min(1)
    .transform((s) => s.trim().toLowerCase())
    .optional(),
  stage: z
    .enum(["COLD", "WARM", "ACTIVE", "PAUSED", "ENDED"])
    .optional(),
  industry: z.string().nullable().optional(),
  website: z.string().url().nullable().optional().or(z.literal("")),
  monthlyRevenueCents: z.number().int().nonnegative().nullable().optional(),
  contractType: z.string().nullable().optional(),
  partnershipScope: z.string().nullable().optional(),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
