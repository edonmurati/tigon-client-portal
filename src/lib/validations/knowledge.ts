import { z } from "zod";

const entryCategoryEnum = z.enum([
  "SPEC",
  "PLAN",
  "MEETING_NOTE",
  "IDEA",
  "INSIGHT",
  "RESEARCH",
  "OTHER",
]);

export const createEntrySchema = z.object({
  title: z.string().min(1, "Title is required").transform((s) => s.trim()),
  content: z.string().min(1, "Content is required"),
  category: entryCategoryEnum,
  clientId: z.string().cuid().optional(),
  projectId: z.string().cuid().optional(),
  tags: z.array(z.string()).optional(),
  pinned: z.boolean().optional(),
});

export const updateEntrySchema = z.object({
  title: z.string().min(1).transform((s) => s.trim()).optional(),
  content: z.string().min(1).optional(),
  category: entryCategoryEnum.optional(),
  clientId: z.string().cuid().nullable().optional(),
  projectId: z.string().cuid().nullable().optional(),
  tags: z.array(z.string()).optional(),
  pinned: z.boolean().optional(),
});

export type CreateEntryInput = z.infer<typeof createEntrySchema>;
export type UpdateEntryInput = z.infer<typeof updateEntrySchema>;
