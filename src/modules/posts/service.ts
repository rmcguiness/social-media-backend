import type { FastifyInstance } from 'fastify';
import type { CreatePostBody } from './schemas.js';
import { toFrontendPost } from './shapes.js';

export function postsService(app: FastifyInstance) {
	const prisma = app.prisma;

	return {
		async list(limit: number, cursor?: number) {
			const items = await prisma.post.findMany({
				take: limit,
				...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
				orderBy: { createdAt: 'desc' },
				include: {
					user: true,
					_count: { select: { comments: true, likes: true } },
				},
			});
			const nextCursor =
				items.length === limit ? items[items.length - 1].id : undefined;
			return { items: items.map(toFrontendPost), nextCursor };
		},

		async byId(id: number) {
			const p = await prisma.post.findUnique({
				where: { id },
				include: {
					user: true,
					_count: { select: { comments: true, likes: true } },
				},
			});
			return p ? toFrontendPost(p) : null;
		},

		async create(userId: number, input: CreatePostBody) {
			const p = await prisma.post.create({
				data: {
					userId,
					title: input.title,
					content: input.content,
					image: input.image ?? null,
					parentId: input.parentId ?? null,
				},
				include: {
					user: true,
					_count: { select: { comments: true, likes: true } },
				},
			});
			return toFrontendPost(p);
		},

		async remove(userId: number, id: number) {
			const post = await prisma.post.findUnique({ where: { id } });
			if (!post) throw new Error('Not found');
			if (post.userId !== userId) throw new Error('Forbidden');
			await prisma.post.delete({ where: { id } });
		},
	};
}
