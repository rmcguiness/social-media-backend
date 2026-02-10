// backend/nodejs/social-media-basic/src/modules/auth/routes.ts
import { FastifyPluginAsync } from 'fastify';
import { registerBody, loginBody, type RegisterBody, type LoginBody } from './schemas.js';
import { authService } from './service.js';

const routes: FastifyPluginAsync = async (app) => {

	const svc = authService(app);

	app.post(
		'/register',
		{ schema: { body: registerBody } },
		async (req, reply) => {
			const result = await svc.register(req.body as RegisterBody);
			return reply.send(result);
		}
	);

	app.post('/login', { schema: { body: loginBody } }, async (req, reply) => {
		const result = await svc.login(req.body as LoginBody);
		return reply.send(result);
	});

	app.get('/me', { preHandler: [app.authenticate] }, async (req, reply) => {
		// @ts-ignore
		const payload = req.user as { id: number };
		const me = await app.prisma.user.findUnique({
			where: { id: payload.id },
			select: {
				id: true,
				username: true,
				name: true,
				image: true,
				email: true,
			},
		});
		return reply.send({ user: me });
	});
};

export default routes;
