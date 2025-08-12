import type { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { likesService } from './service.js';
import { likeToggleParams } from './schemas.js';

const routes: FastifyPluginAsync = async (app) => {
	app.withTypeProvider(ZodTypeProvider);
	const svc = likesService(app);

	app.post(
		'/:postId/toggle',
		{ preHandler: [app.authenticate], schema: { params: likeToggleParams } },
		async (req, reply) => {
			// @ts-ignore
			const user = req.user as { id: number };
			const postId = Number((req.params as any).postId);
			const data = await svc.toggle(user.id, postId);
			return reply.send(data);
		}
	);
};

export default routes;
