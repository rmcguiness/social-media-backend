import { z } from 'zod';

export const createConversationBody = z.object({
	participantIds: z.array(z.number().int().positive()).min(1),
});

export const createMessageBody = z.object({
	content: z.string().min(1).max(2000),
});

export type CreateConversationBody = z.infer<typeof createConversationBody>;
export type CreateMessageBody = z.infer<typeof createMessageBody>;
