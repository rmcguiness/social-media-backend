import type { FastifyInstance } from 'fastify';
import type { UploadedImage } from '../../utils/upload-image.js';

export type UpdateProfileData = {
	name?: string;
	username?: string;
	bio?: string;
	image?: string;
	coverImage?: string;
};

export function profileService(app: FastifyInstance) {
	const prisma = app.prisma;

	return {
		async updateProfile(userId: number, data: UpdateProfileData) {
			return prisma.user.update({
				where: { id: userId },
				data,
				select: {
					id: true,
					email: true,
					username: true,
					name: true,
					bio: true,
					image: true,
					coverImage: true,
				},
			});
		},

		async uploadAvatar(userId: number, imageData: UploadedImage) {
			return prisma.user.update({
				where: { id: userId },
				data: { image: imageData.url },
				select: {
					id: true,
					image: true,
				},
			});
		},

		async uploadCover(userId: number, imageData: UploadedImage) {
			return prisma.user.update({
				where: { id: userId },
				data: { coverImage: imageData.url },
				select: {
					id: true,
					coverImage: true,
				},
			});
		},
	};
}
