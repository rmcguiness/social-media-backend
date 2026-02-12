import { z } from 'zod';

export const createPostBody = z.object({
	title: z.string().min(1).max(200),
	content: z.string().min(1).max(2000),
	image: z.string().url().nullable().optional(),
	parentId: z.number().int().positive().nullable().optional(),
});

export type CreatePostBody = z.infer<typeof createPostBody>;
