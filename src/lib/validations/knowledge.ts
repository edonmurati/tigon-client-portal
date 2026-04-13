import { z } from "zod";

export const createEntrySchema = z.object({
  title: z.string().min(1, "Title is required").transform((s) => s.trim()),
  content: z.string().min(1, "Content is required"),
  category: z.enum([
    "CHANGELOG",
    "DECISION",
    "HANDOFF",
    "IDEA",
    "PLAN",
    "RESEARCH",
    "SPEC",
    "PLAYBOOK",
    "SOP",
    "MEETING_NOTE",
    "INSIGHT",
    "JOURNAL",
    "OTHER",
  ]),
  clientId: z.string().cuid().optional(),
  projectId: z.string().cuid().optional(),
  tags: z.array(z.string()).optional(),
  pinned: z.boolean().optional(),
});

export const updateEntrySchema = z.object({
  title: z.string().min(1).transform((s) => s.trim()).optional(),
  content: z.string().min(1).optional(),
  category: z
    .enum([
      "CHANGELOG",
      "DECISION",
      "HANDOFF",
      "IDEA",
      "PLAN",
      "RESEARCH",
      "SPEC",
      "PLAYBOOK",
      "SOP",
      "MEETING_NOTE",
      "INSIGHT",
      "JOURNAL",
      "OTHER",
    ])
    .optional(),
  clientId: z.string().cuid().nullable().optional(),
  projectId: z.string().cuid().nullable().optional(),
  tags: z.array(z.string()).optional(),
  pinned: z.boolean().optional(),
});

export type CreateEntryInput = z.infer<typeof createEntrySchema>;
export type UpdateEntryInput = z.infer<typeof updateEntrySchema>;
