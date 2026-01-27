import type { FastifyPluginAsync } from 'fastify';
import { userQuery } from './schemas.js';
import { usersService } from './service.js';
import { parsePagination } from '../../utils/pagination.js';

const routes: FastifyPluginAsync = async (app) => {
	const svc = usersService(app);

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
};

export default routes;
