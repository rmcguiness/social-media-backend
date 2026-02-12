import type { FastifyInstance } from 'fastify';

type UpdateSettingsData = {
	notificationPreferences?: {
		likes?: boolean;
		comments?: boolean;
		follows?: boolean;
		messages?: boolean;
	};
	privacySettings?: {
		accountVisibility?: 'public' | 'private';
		allowDirectMessages?: 'everyone' | 'following' | 'nobody';
	};
};

export function usersService(app: FastifyInstance) {
	const prisma = app.prisma;

	return {
		async get(id: number) {
			return prisma.user.findUnique({
				where: { id },
				select: { id: true, username: true, name: true, image: true },
			});
		},

		async search(q: string | undefined, limit: number, cursor?: number) {
			const users = await prisma.user.findMany({
				where: q
					? {
							OR: [
								{ username: { contains: q, mode: 'insensitive' } },
								{ name: { contains: q, mode: 'insensitive' } },
							],
					  }
					: undefined,
				take: limit,
				...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
				orderBy: { id: 'asc' },
				select: { id: true, username: true, name: true, image: true },
			});
			const nextCursor =
				users.length === limit ? users[users.length - 1].id : undefined;
			return { data: users, meta: { nextCursor } };
		},

		async updateSettings(userId: number, data: UpdateSettingsData) {
			const updateData: any = {};
			
			if (data.notificationPreferences) {
				updateData.notificationPreferences = data.notificationPreferences;
			}
			
			if (data.privacySettings) {
				updateData.privacySettings = data.privacySettings;
			}

			return prisma.user.update({
				where: { id: userId },
				data: updateData,
				select: {
					id: true,
					notificationPreferences: true,
					privacySettings: true,
				},
			});
		},

		async getSettings(userId: number) {
			return prisma.user.findUnique({
				where: { id: userId },
				select: {
					id: true,
					notificationPreferences: true,
					privacySettings: true,
				},
			});
		},
	};
}
