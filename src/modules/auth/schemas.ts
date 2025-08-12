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

export type RegisterBody = z.infer<typeof registerBody>;
export type LoginBody = z.infer<typeof loginBody>;
