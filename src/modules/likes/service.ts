import type { FastifyInstance } from 'fastify';

export function likesService(app: FastifyInstance) {
	const prisma = app.prisma;

	return {
		async toggle(userId: number, postId: number) {
			const existing = await prisma.like.findUnique({
				where: { userId_postId: { userId, postId } },
			});
			if (existing) {
				await prisma.like.delete({ where: { id: existing.id } });
				const count = await prisma.like.count({ where: { postId } });
				return { liked: false, likes: count };
			} else {
				await prisma.like.create({ data: { userId, postId } });
				const count = await prisma.like.count({ where: { postId } });
				return { liked: true, likes: count };
			}
		},
	};
}
