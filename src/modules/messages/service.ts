// backend/nodejs/social-media-basic/src/modules/messages/service.ts
import type { FastifyInstance } from 'fastify';
import type { CreateConversationBody, CreateMessageBody } from './schemas.js';

export function messagesService(app: FastifyInstance) {
	const prisma = app.prisma;

	return {
		async listConversations(userId: number) {
			const convs = await prisma.conversationParticipant.findMany({
				where: { userId },
				include: {
					conversation: {
						include: {
							participants: {
								include: {
									user: {
										select: {
											id: true,
											username: true,
											name: true,
											image: true,
										},
									},
								},
							},
							messages: {
								orderBy: { createdAt: 'desc' },
								take: 1,
								include: { sender: true },
							},
						},
					},
				},
			});

			return convs.map((p) => ({
				id: p.conversation.id,
				participants: p.conversation.participants.map((pp) => pp.user),
				lastMessage: p.conversation.messages[0]
					? {
							id: p.conversation.messages[0].id,
							content: p.conversation.messages[0].content,
							createdAt: p.conversation.messages[0].createdAt,
							sender: {
								id: p.conversation.messages[0].sender.id,
								name: p.conversation.messages[0].sender.name,
								username: p.conversation.messages[0].sender.username,
								image: p.conversation.messages[0].sender.image ?? '',
							},
					  }
					: null,
			}));
		},

		async createConversation(creatorId: number, input: CreateConversationBody) {
			const conv = await prisma.conversation.create({
				data: {
					participants: {
						create: [
							...new Set([creatorId, ...input.participantIds]).values(),
						].map((uid) => ({ userId: uid })),
					},
				},
			});
			return conv;
		},

		async listMessages(conversationId: number, limit: number, cursor?: number) {
			const msgs = await prisma.message.findMany({
				where: { conversationId },
				take: limit,
				...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
				orderBy: { createdAt: 'desc' },
				include: { sender: true },
			});
			const nextCursor =
				msgs.length === limit ? msgs[msgs.length - 1].id : undefined;
			return {
				items: msgs.map((m) => ({
					id: m.id,
					content: m.content,
					createdAt: m.createdAt,
					sender: {
						id: m.sender.id,
						name: m.sender.name,
						username: m.sender.username,
						image: m.sender.image ?? '',
					},
				})),
				nextCursor,
			};
		},

		async sendMessage(
			senderId: number,
			conversationId: number,
			input: CreateMessageBody
		) {
			const exists = await prisma.conversationParticipant.findFirst({
				where: { conversationId, userId: senderId },
			});
			if (!exists) throw new Error('Forbidden');
			const m = await prisma.message.create({
				data: { senderId, conversationId, content: input.content },
				include: { sender: true },
			});
			return {
				id: m.id,
				content: m.content,
				createdAt: m.createdAt,
				sender: {
					id: m.sender.id,
					name: m.sender.name,
					username: m.sender.username,
					image: m.sender.image ?? '',
				},
			};
		},
	};
}
