import type { FastifyInstance } from 'fastify';
import type { RegisterBody, LoginBody } from './schemas.js';
import { hashPassword, verifyPassword } from '../../utils/password.js';

export function authService(app: FastifyInstance) {
	const prisma = app.prisma;

	return {
		async register(input: RegisterBody) {
			const exists = await prisma.user.findFirst({
				where: { OR: [{ email: input.email }, { username: input.username }] },
			});
			if (exists) throw new Error('User already exists');

			const user = await prisma.user.create({
				data: {
					email: input.email,
					username: input.username,
					name: input.name,
					image: input.image,
					passwordHash: await hashPassword(input.password),
				},
				select: {
					id: true,
					username: true,
					name: true,
					image: true,
					email: true,
				},
			});

			const token = app.jwt.sign({ id: user.id, username: user.username });
			return { user, token };
		},

		async login(input: LoginBody) {
			const user = await prisma.user.findFirst({
				where: {
					OR: [
						{ email: input.emailOrUsername },
						{ username: input.emailOrUsername },
					],
				},
			});
			if (!user) throw new Error('Invalid credentials');

			const ok = await verifyPassword(user.passwordHash, input.password);
			if (!ok) throw new Error('Invalid credentials');

			const token = app.jwt.sign({ id: user.id, username: user.username });
			const safe = {
				id: user.id,
				username: user.username,
				name: user.name,
				image: user.image,
				email: user.email,
			};
			return { user: safe, token };
		},
	};
}
