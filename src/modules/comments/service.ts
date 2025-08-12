import type { FastifyInstance } from 'fastify';
import type { CreateCommentBody } from './schemas.js';

export function commentsService(app: FastifyInstance) {
	const prisma = app.prisma;

	return {
		async list(postId: number, limit: number, cursor?: number) {
			const items = await prisma.comment.findMany({
				where: { postId },
				take: limit,
				...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
				orderBy: { createdAt: 'desc' },
				include: { user: true },
			});
			const nextCursor =
				items.length === limit ? items[items.length - 1].id : undefined;
			return {
				items: items.map((c) => ({
					id: c.id,
					content: c.content,
					user: { id: c.user.id, name: c.user.name, image: c.user.image ?? '' },
					createdAt: c.createdAt,
				})),
				nextCursor,
			};
		},

		async create(userId: number, postId: number, input: CreateCommentBody) {
			const c = await prisma.comment.create({
				data: { userId, postId, content: input.content },
				include: { user: true },
			});
			return {
				id: c.id,
				content: c.content,
				user: { id: c.user.id, name: c.user.name, image: c.user.image ?? '' },
				createdAt: c.createdAt,
			};
		},
	};
}
