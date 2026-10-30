import { z } from 'zod';

export const CreateSessionSchema = z.object({
  title: z.string().trim().max(100).optional(),
});

export const UpdateSessionSchema = z.object({
  title: z.string().trim().min(1, 'Title cannot be empty').max(100).optional(),
  isArchived: z.boolean().optional(),
});

export const SendMessageSchema = z.object({
  content: z.string().min(1, 'Message content cannot be empty').trim(),
});

export type CreateSessionInput = z.infer<typeof CreateSessionSchema>;
export type UpdateSessionInput = z.infer<typeof UpdateSessionSchema>;
export type SendMessageInput = z.infer<typeof SendMessageSchema>;
