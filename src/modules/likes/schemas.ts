import { z } from 'zod';
export const likeToggleParams = z.object({
	postId: z.coerce.number().int().positive(),
});
