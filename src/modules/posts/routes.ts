import type { FastifyPluginAsync } from 'fastify';
import { createPostBody } from './schemas.js';
import { postsService } from './service.js';
import { z } from 'zod';
import { parsePagination } from '../../utils/pagination.js';

const routes: FastifyPluginAsync = async (app) => {

	const svc = postsService(app);

	app.get('/', async (req, reply) => {
		const { limit, cursor } = parsePagination((req as any).query);
		const data = await svc.list(limit, cursor);
		return reply.send(data);
	});

	app.get('/:id', async (req, reply) => {
		const id = Number((req.params as any).id);
		const post = await svc.byId(id);
		if (!post) return reply.code(404).send({ message: 'Not found' });
		return reply.send(post);
	});

	app.post(
		'/',
		{ preHandler: [app.authenticate], schema: { body: createPostBody } },
		async (req, reply) => {
			// @ts-ignore
			const user = req.user as { id: number };
			const created = await svc.create(user.id, req.body);
			return reply.code(201).send(created);
		}
	);

	app.delete('/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
		// @ts-ignore
		const user = req.user as { id: number };
		const id = Number((req.params as any).id);
		await svc.remove(user.id, id);
		return reply.code(204).send();
	});
};

export default routes;
