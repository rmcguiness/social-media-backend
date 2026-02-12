import type { FastifyPluginAsync } from 'fastify';
import { userQuery } from './schemas.js';
import { usersService } from './service.js';
import { parsePagination } from '../../utils/pagination.js';

const routes: FastifyPluginAsync = async (app) => {
	const svc = usersService(app);

	// Get user by username
	app.get('/username/:username', async (req, reply) => {
		const username = (req.params as any).username;
		const user = await svc.getByUsername(username);
		if (!user) return reply.code(404).send({ message: 'User not found' });
		return reply.send(user);
	});

	app.get('/:id', async (req, reply) => {
		const id = Number((req.params as any).id);
		const user = await svc.get(id);
		if (!user) return reply.code(404).send({ message: 'Not found' });
		return reply.send(user);
	});

	app.get('/', { schema: { querystring: userQuery } }, async (req, reply) => {
		const { q } = req.query as any as { q?: string };
		const { limit, cursor } = parsePagination((req as any).query);
		const data = await svc.search(q, limit, cursor);
		return reply.send(data);
	});

	// Get user settings (authenticated)
	app.get('/me/settings', { onRequest: [app.authenticate] }, async (req, reply) => {
		const settings = await svc.getSettings(req.user.id);
		if (!settings) return reply.code(404).send({ message: 'User not found' });
		return reply.send(settings);
	});

	// Update user settings (authenticated)
	app.patch('/me/settings', { onRequest: [app.authenticate] }, async (req, reply) => {
		const updated = await svc.updateSettings(req.user.id, req.body as any);
		return reply.send(updated);
	});
};

export default routes;
