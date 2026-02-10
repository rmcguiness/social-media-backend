import type { FastifyPluginAsync } from 'fastify';
import { createCommentBody, type CreateCommentBody } from './schemas.js';
import { commentsService } from './service.js';
import { parsePagination } from '../../utils/pagination.js';

const routes: FastifyPluginAsync = async (app) => {

	const svc = commentsService(app);

	app.get('/:postId', async (req, reply) => {
		const postId = Number((req.params as any).postId);
		const { limit, cursor } = parsePagination((req as any).query);
		const data = await svc.list(postId, limit, cursor);
		return reply.send(data);
	});

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
};

export default routes;
