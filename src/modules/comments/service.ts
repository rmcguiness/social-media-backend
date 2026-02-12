import type { FastifyInstance } from 'fastify';
import type { CreateCommentBody, UpdateCommentBody } from './schemas.js';

export function commentsService(app: FastifyInstance) {
	const prisma = app.prisma;

	return {
		async list(postId: number, limit: number, cursor?: number) {
			// Only get top-level comments (no parentId)
			const items = await prisma.comment.findMany({
				where: { postId, parentId: null },
				take: limit,
				...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
				orderBy: { createdAt: 'desc' },
				include: { 
					user: true,
					replies: {
						include: { user: true },
						orderBy: { createdAt: 'asc' },
					},
				},
			});
			const nextCursor =
				items.length === limit ? items[items.length - 1].id : undefined;
			return {
				data: items.map((c) => ({
					id: c.id,
					content: c.content,
					userId: c.userId,
					user: { id: c.user.id, name: c.user.name, username: c.user.username, image: c.user.image ?? '' },
					createdAt: c.createdAt,
					replies: c.replies.map((r) => ({
						id: r.id,
						content: r.content,
						userId: r.userId,
						user: { id: r.user.id, name: r.user.name, username: r.user.username, image: r.user.image ?? '' },
						createdAt: r.createdAt,
						parentId: r.parentId,
					})),
				})),
				meta: { nextCursor },
			};
		},

		async create(userId: number, postId: number, input: CreateCommentBody) {
			const c = await prisma.comment.create({
				data: { 
					userId, 
					postId, 
					content: input.content,
					...(input.parentId ? { parentId: input.parentId } : {}),
				},
				include: { user: true },
			});
			return {
				id: c.id,
				content: c.content,
				userId: c.userId,
				user: { id: c.user.id, name: c.user.name, username: c.user.username, image: c.user.image ?? '' },
				createdAt: c.createdAt,
				parentId: c.parentId ?? undefined,
			};
		},

		async update(userId: number, commentId: number, input: UpdateCommentBody) {
			// First check if comment exists and belongs to user
			const existing = await prisma.comment.findUnique({
				where: { id: commentId },
			});
			
			if (!existing || existing.userId !== userId) {
				return null;
			}

			const c = await prisma.comment.update({
				where: { id: commentId },
				data: { content: input.content },
				include: { user: true },
			});
			
			return {
				id: c.id,
				content: c.content,
				userId: c.userId,
				user: { id: c.user.id, name: c.user.name, username: c.user.username, image: c.user.image ?? '' },
				createdAt: c.createdAt,
			};
		},

		async remove(userId: number, commentId: number) {
			// First check if comment exists and belongs to user
			const existing = await prisma.comment.findUnique({
				where: { id: commentId },
			});
			
			if (!existing || existing.userId !== userId) {
				return false;
			}

			await prisma.comment.delete({
				where: { id: commentId },
			});
			
			return true;
		},
	};
}
