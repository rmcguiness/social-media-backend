import Fastify from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import prismaPlugin from './plugins/prisma.js';
import authPlugin from './plugins/auth.js';
import corsPlugin from './plugins/cors.js';
import rateLimitPlugin from './plugins/rateLimit.js';
import { env } from './config/env.js';

import authRoutes from './modules/auth/routes.js';
import userRoutes from './modules/users/routes.js';
import postRoutes from './modules/posts/routes.js';
import commentRoutes from './modules/comments/routes.js';
import likeRoutes from './modules/likes/routes.js';
import messageRoutes from './modules/messages/routes.js';
import notificationRoutes from './modules/notifications/routes.js';

async function buildServer() {
	const app = Fastify({
		logger: {
			transport:
				env.NODE_ENV === 'development' ? { target: 'pino-pretty' } : undefined,
			level: 'info',
		},
	}).withTypeProvider<ZodTypeProvider>();

	app.setValidatorCompiler(validatorCompiler);
	app.setSerializerCompiler(serializerCompiler);

	await app.register(prismaPlugin);
	await app.register(corsPlugin);
	await app.register(rateLimitPlugin);
	await app.register(authPlugin);

	app.get('/health', async () => ({ ok: true }));

	await app.register(authRoutes, { prefix: '/api/auth' });
	await app.register(userRoutes, { prefix: '/api/users' });
	await app.register(postRoutes, { prefix: '/api/posts' });
	await app.register(commentRoutes, { prefix: '/api/comments' });
	await app.register(likeRoutes, { prefix: '/api/likes' });
	await app.register(messageRoutes, { prefix: '/api' });
	await app.register(notificationRoutes, { prefix: '/api/notifications' });

	return app;
}

const start = async () => {
	const app = await buildServer();
	try {
		await app.listen({ port: env.PORT, host: '0.0.0.0' });
		app.log.info(`Server running on :${env.PORT}`);
	} catch (err) {
		app.log.error(err);
		process.exit(1);
	}
};

start();
