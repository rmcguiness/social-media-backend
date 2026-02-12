import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';
import { env } from '../config/env.js';
import type { FastifyReply, FastifyRequest } from 'fastify';

declare module '@fastify/jwt' {
	interface FastifyJWT {
		user: { id: number; username: string };
	}
}

export default fp(async (app) => {
	await app.register(jwt, {
		secret: env.JWT_SECRET,
		sign: { expiresIn: env.JWT_EXPIRES_IN },
	});

	app.decorate(
		'authenticate',
		async (request: FastifyRequest, reply: FastifyReply) => {
			try {
				await request.jwtVerify();
			} catch {
				return reply.code(401).send({ message: 'Unauthorized' });
			}
		}
	);
});

declare module 'fastify' {
	interface FastifyInstance {
		authenticate: (
			request: FastifyRequest,
			reply: FastifyReply
		) => Promise<void>;
	}
}
