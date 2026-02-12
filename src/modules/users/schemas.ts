import { z } from 'zod';

export const userQuery = z.object({
	q: z.string().optional(),
	limit: z.string().optional(),
	cursor: z.string().optional(),
});
