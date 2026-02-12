import type { FastifyPluginAsync } from 'fastify';
import { notificationsService } from './service.js';

const routes: FastifyPluginAsync = async (app) => {
	/**
	 * GET /api/notifications
	 * Get notifications for the authenticated user
	 */
	app.get(
		'/',
		{
			preHandler: [app.authenticate],
		},
		async (request, reply) => {
			const userId = request.user.id;
			const limit = (request.query as any).limit
				? parseInt((request.query as any).limit as string, 10)
				: 20;

			const notifications = await notificationsService.getForUser(userId, limit);

			return reply.send({
				data: notifications,
			});
		}
	);
};

export default routes;
