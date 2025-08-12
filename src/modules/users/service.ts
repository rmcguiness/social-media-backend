import type { FastifyInstance } from 'fastify';

export function usersService(app: FastifyInstance) {
	const prisma = app.prisma;

	return {
		async get(id: number) {
			return prisma.user.findUnique({
				where: { id },
				select: { id: true, username: true, name: true, image: true },
			});
		},

		async search(q: string | undefined, limit: number, cursor?: number) {
			const users = await prisma.user.findMany({
				where: q
					? {
							OR: [
								{ username: { contains: q, mode: 'insensitive' } },
								{ name: { contains: q, mode: 'insensitive' } },
							],
					  }
					: undefined,
				take: limit,
				...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
				orderBy: { id: 'asc' },
				select: { id: true, username: true, name: true, image: true },
			});
			const nextCursor =
				users.length === limit ? users[users.length - 1].id : undefined;
			return { items: users, nextCursor };
		},
	};
}
