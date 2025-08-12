import { z } from 'zod';

export const createCommentBody = z.object({
	content: z.string().min(1).max(1000),
});

export type CreateCommentBody = z.infer<typeof createCommentBody>;
