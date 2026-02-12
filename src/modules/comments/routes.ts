import type { FastifyPluginAsync } from 'fastify';
import { createCommentBody, updateCommentBody, type CreateCommentBody, type UpdateCommentBody } from './schemas.js';
import { commentsService } from './service.js';
import { parsePagination } from '../../utils/pagination.js';

const routes: FastifyPluginAsync = async (app) => {

	const svc = commentsService(app);

	// List comments for a post
	app.get('/:postId', async (req, reply) => {
		const postId = Number((req.params as any).postId);
		const { limit, cursor } = parsePagination((req as any).query);
		const data = await svc.list(postId, limit, cursor);
		return reply.send(data);
	});

	// Create a comment on a post
	app.post(
		'/:postId',
		{ preHandler: [app.authenticate], schema: { body: createCommentBody } },
		async (req, reply) => {
			// @ts-ignore
			const user = req.user as { id: number };
			const postId = Number((req.params as any).postId);
			const created = await svc.create(user.id, postId, req.body as CreateCommentBody);
			return reply.code(201).send(created);
		}
	);

	// Update a comment (owner only)
	app.put(
		'/comment/:commentId',
		{ preHandler: [app.authenticate], schema: { body: updateCommentBody } },
		async (req, reply) => {
			// @ts-ignore
			const user = req.user as { id: number };
			const commentId = Number((req.params as any).commentId);
			const updated = await svc.update(user.id, commentId, req.body as UpdateCommentBody);
			if (!updated) {
				return reply.code(404).send({ message: 'Comment not found or not authorized' });
			}
			return reply.send(updated);
		}
	);

	// Delete a comment (owner only)
	app.delete(
		'/comment/:commentId',
		{ preHandler: [app.authenticate] },
		async (req, reply) => {
			// @ts-ignore
			const user = req.user as { id: number };
			const commentId = Number((req.params as any).commentId);
			const deleted = await svc.remove(user.id, commentId);
			if (!deleted) {
				return reply.code(404).send({ message: 'Comment not found or not authorized' });
			}
			return reply.code(204).send();
		}
	);
};

export default routes;
