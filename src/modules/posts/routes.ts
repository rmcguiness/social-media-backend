import type { FastifyPluginAsync } from 'fastify';
import { createPostBody, type CreatePostBody } from './schemas.js';
import { postsService } from './service.js';
import { z } from 'zod';
import { parsePagination } from '../../utils/pagination.js';

const routes: FastifyPluginAsync = async (app) => {

	const svc = postsService(app);

	app.get('/', async (req, reply) => {
		const { limit, cursor } = parsePagination((req as any).query);
		// Try to get current user if authenticated (optional)
		let currentUserId: number | undefined;
		// Only try to authenticate if Authorization header is present
		if (req.headers.authorization) {
			try {
				await app.authenticate(req, reply);
				currentUserId = (req as any).user?.id;
			} catch {
				// Invalid token - continue as unauthenticated
			}
		}
		const data = await svc.list(limit, cursor, currentUserId);
		return reply.send(data);
	});

	app.get('/user/:userId', async (req, reply) => {
		const userId = Number((req.params as any).userId);
		const { limit, cursor } = parsePagination((req as any).query);
		// Try to get current user if authenticated (optional)
		let currentUserId: number | undefined;
		// Only try to authenticate if Authorization header is present
		if (req.headers.authorization) {
			try {
				await app.authenticate(req, reply);
				currentUserId = (req as any).user?.id;
			} catch {
				// Invalid token - continue as unauthenticated
			}
		}
		const data = await svc.byUser(userId, limit, cursor, currentUserId);
		return reply.send(data);
	});

	app.get('/:id', async (req, reply) => {
		const id = Number((req.params as any).id);
		// Try to get current user if authenticated (optional)
		let currentUserId: number | undefined;
		// Only try to authenticate if Authorization header is present
		if (req.headers.authorization) {
			try {
				await app.authenticate(req, reply);
				currentUserId = (req as any).user?.id;
			} catch {
				// Invalid token - continue as unauthenticated
			}
		}
		const post = await svc.byId(id, currentUserId);
		if (!post) return reply.code(404).send({ message: 'Not found' });
		return reply.send(post);
	});

	app.post(
		'/',
		{ preHandler: [app.authenticate], schema: { body: createPostBody } },
		async (req, reply) => {
			// @ts-ignore
			const user = req.user as { id: number };
			const created = await svc.create(user.id, req.body as CreatePostBody);
			return reply.code(201).send(created);
		}
	);

	app.put(
		'/:id',
		{ preHandler: [app.authenticate], schema: { body: createPostBody.partial() } },
		async (req, reply) => {
			// @ts-ignore
			const user = req.user as { id: number };
			const id = Number((req.params as any).id);
			const updated = await svc.update(user.id, id, req.body as Partial<CreatePostBody>);
			return reply.send(updated);
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
