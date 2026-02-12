import type { FastifyInstance } from 'fastify';
import type { CreatePostBody } from './schemas.js';
import { toFrontendPost } from './shapes.js';

export function postsService(app: FastifyInstance) {
	const prisma = app.prisma;

	return {
		async list(limit: number, cursor?: number, currentUserId?: number) {
			const items = await prisma.post.findMany({
				take: limit,
				...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
				orderBy: { createdAt: 'desc' },
				include: {
					user: true,
					_count: { select: { comments: true, likes: true } },
					likes: currentUserId ? {
						where: { userId: currentUserId },
						select: { id: true },
					} : false,
				},
			});
			const nextCursor =
				items.length === limit ? items[items.length - 1].id : null;
			return { 
				data: items.map(p => toFrontendPost(p, currentUserId)), 
				meta: { nextCursor } 
			};
		},

		async byId(id: number, currentUserId?: number) {
			const p = await prisma.post.findUnique({
				where: { id },
				include: {
					user: true,
					_count: { select: { comments: true, likes: true } },
					likes: currentUserId ? {
						where: { userId: currentUserId },
						select: { id: true },
					} : false,
				},
			});
			return p ? toFrontendPost(p, currentUserId) : null;
		},

		async byUser(userId: number, limit: number, cursor?: number, currentUserId?: number) {
			const items = await prisma.post.findMany({
				where: { userId },
				take: limit,
				...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
				orderBy: { createdAt: 'desc' },
				include: {
					user: true,
					_count: { select: { comments: true, likes: true } },
					likes: currentUserId ? {
						where: { userId: currentUserId },
						select: { id: true },
					} : false,
				},
			});
			const nextCursor =
				items.length === limit ? items[items.length - 1].id : null;
			return { 
				data: items.map(p => toFrontendPost(p, currentUserId)), 
				meta: { nextCursor } 
			};
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

		async update(userId: number, id: number, input: Partial<CreatePostBody>) {
			const post = await prisma.post.findUnique({ where: { id } });
			if (!post) throw new Error('Not found');
			if (post.userId !== userId) throw new Error('Forbidden');
			
			const updated = await prisma.post.update({
				where: { id },
				data: {
					...(input.title !== undefined && { title: input.title }),
					...(input.content !== undefined && { content: input.content }),
					...(input.image !== undefined && { image: input.image }),
				},
				include: {
					user: true,
					_count: { select: { comments: true, likes: true } },
				},
			});
			return toFrontendPost(updated);
		},

		async remove(userId: number, id: number) {
			const post = await prisma.post.findUnique({ where: { id } });
			if (!post) throw new Error('Not found');
			if (post.userId !== userId) throw new Error('Forbidden');
			await prisma.post.delete({ where: { id } });
		},
	};
}
