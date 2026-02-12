import { z } from 'zod';

export const registerBody = z.object({
	email: z.string().email(),
	username: z.string().min(3).max(32),
	name: z.string().min(1).max(100),
	password: z.string().min(8).max(128),
	image: z.string().url().optional(),
});

export const loginBody = z.object({
	emailOrUsername: z.string().min(1),
	password: z.string().min(8),
});

export const updateProfileBody = z.object({
	name: z.string().min(1).max(100).optional(),
	username: z.string().min(3).max(32).optional(),
	bio: z.string().max(500).optional(),
	image: z.string().url().optional().nullable(),
	coverImage: z.string().url().optional().nullable(),
});

export type RegisterBody = z.infer<typeof registerBody>;
export type LoginBody = z.infer<typeof loginBody>;
export type UpdateProfileBody = z.infer<typeof updateProfileBody>;
