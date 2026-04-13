import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").transform((s) => s.trim()),
  description: z.string().optional(),
  assigneeId: z.string().cuid().optional(),
  clientId: z.string().cuid().optional(),
  projectId: z.string().cuid().optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
  dueDate: z.string().datetime().optional().or(z.literal("")),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).transform((s) => s.trim()).optional(),
  description: z.string().nullable().optional(),
  assigneeId: z.string().cuid().nullable().optional(),
  clientId: z.string().cuid().nullable().optional(),
  projectId: z.string().cuid().nullable().optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
  dueDate: z.string().datetime().nullable().optional(),
  completedAt: z.string().datetime().nullable().optional(),
  sortOrder: z.number().int().nonnegative().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
