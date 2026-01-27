import type { FastifyPluginAsync } from 'fastify';
import { createConversationBody, createMessageBody } from './schemas.js';
import { messagesService } from './service.js';
import { parsePagination } from '../../utils/pagination.js';

const routes: FastifyPluginAsync = async (app) => {
	const svc = messagesService(app);

	app.get(
		'/conversations',
		{ preHandler: [app.authenticate] },
		async (req, reply) => {
			// @ts-ignore
			const user = req.user as { id: number };
			const items = await svc.listConversations(user.id);
			return reply.send({ items });
		}
	);

	app.post(
		'/conversations',
		{
			preHandler: [app.authenticate],
			schema: { body: createConversationBody },
		},
		async (req, reply) => {
			// @ts-ignore
			const user = req.user as { id: number };
			const conv = await svc.createConversation(user.id, req.body);
			return reply.code(201).send(conv);
		}
	);

	app.get(
		'/conversations/:id/messages',
		{ preHandler: [app.authenticate] },
		async (req, reply) => {
			const conversationId = Number((req.params as any).id);
			const { limit, cursor } = parsePagination((req as any).query);
			const data = await svc.listMessages(conversationId, limit, cursor);
			return reply.send(data);
		}
	);

	app.post(
		'/conversations/:id/messages',
		{ preHandler: [app.authenticate], schema: { body: createMessageBody } },
		async (req, reply) => {
			// @ts-ignore
			const user = req.user as { id: number };
			const conversationId = Number((req.params as any).id);
			const m = await svc.sendMessage(user.id, conversationId, req.body);
			return reply.code(201).send(m);
		}
	);
};

export default routes;
