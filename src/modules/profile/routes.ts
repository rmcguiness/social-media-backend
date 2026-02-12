import type { FastifyPluginAsync } from 'fastify';
import { profileService } from './service.js';
import { uploadImageToCloudinary } from '../../utils/upload-image.js';

const routes: FastifyPluginAsync = async (app) => {
	const svc = profileService(app);

	// Upload avatar
	app.post(
		'/avatar',
		{ preHandler: [app.authenticate] },
		async (req, reply) => {
			try {
				const data = await req.file();
				
				if (!data) {
					return reply.code(400).send({ message: 'No file uploaded' });
				}

				// Validate file type
				if (!data.mimetype.startsWith('image/')) {
					return reply.code(400).send({ message: 'File must be an image' });
				}

				// Validate file size (5MB max)
				const maxSize = 5 * 1024 * 1024; // 5MB in bytes
				const fileSize = data.file.bytesRead || 0;
				if (fileSize > maxSize) {
					return reply.code(400).send({ message: 'File too large. Maximum size is 5MB' });
				}

				// Upload to Cloudinary
				const uploadedImage = await uploadImageToCloudinary(data, 'avatars');

				// Update user profile
				const user = await svc.uploadAvatar(req.user.id, uploadedImage);

				return reply.send({
					image: user.image,
					message: 'Avatar uploaded successfully',
				});
			} catch (error) {
				console.error('Avatar upload error:', error);
				return reply.code(500).send({ message: 'Failed to upload avatar' });
			}
		}
	);

	// Upload cover image
	app.post(
		'/cover',
		{ preHandler: [app.authenticate] },
		async (req, reply) => {
			try {
				const data = await req.file();
				
				if (!data) {
					return reply.code(400).send({ message: 'No file uploaded' });
				}

				// Validate file type
				if (!data.mimetype.startsWith('image/')) {
					return reply.code(400).send({ message: 'File must be an image' });
				}

				// Validate file size (10MB max for covers)
				const maxSize = 10 * 1024 * 1024; // 10MB in bytes
				const fileSize = data.file.bytesRead || 0;
				if (fileSize > maxSize) {
					return reply.code(400).send({ message: 'File too large. Maximum size is 10MB' });
				}

				// Upload to Cloudinary
				const uploadedImage = await uploadImageToCloudinary(data, 'covers');

				// Update user profile
				const user = await svc.uploadCover(req.user.id, uploadedImage);

				return reply.send({
					coverImage: user.coverImage,
					message: 'Cover image uploaded successfully',
				});
			} catch (error) {
				console.error('Cover upload error:', error);
				return reply.code(500).send({ message: 'Failed to upload cover image' });
			}
		}
	);
};

export default routes;
