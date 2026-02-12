// backend/nodejs/social-media-basic/src/modules/auth/routes.ts
import { FastifyPluginAsync } from 'fastify';
import { registerBody, loginBody, updateProfileBody, type RegisterBody, type LoginBody, type UpdateProfileBody } from './schemas.js';
import { authService } from './service.js';
import { getMailClient, nodemailer } from '../../lib/nodemailer.js';
import { confirmationEmail } from '../../lib/emails/confirmation-email.js';
import { successEmail } from '../../lib/emails/success-email.js';
import { env } from '../../config/env.js';

const routes: FastifyPluginAsync = async (app) => {

	const svc = authService(app);

	app.post(
		'/register',
		{ schema: { body: registerBody } },
		async (req, reply) => {
			const result = await svc.register(req.body as RegisterBody);
			
			// Send confirmation email
			const mail = await getMailClient();
			const firstName = result.name.split(' ')[0];
			const message = await mail.sendMail(
				confirmationEmail(firstName, result.email, env.API_BASE_URL, result.userId)
			);
			
			// Log email preview URL in development
			if (env.NODE_ENV === 'development') {
				console.log('📧 Email preview:', nodemailer.getTestMessageUrl(message));
			}
			
			return reply.code(202).send({
				message: 'Confirmation email sent. Please check your inbox.',
				email: result.email,
			});
		}
	);

	app.get('/confirm-email', async (req, reply) => {
		const userId = parseInt((req.query as { user_id?: string }).user_id || '0', 10);
		
		if (!userId) {
			return reply.code(400).send({ message: 'Invalid verification link' });
		}

		try {
			const user = await svc.confirmEmail(userId);
			
			// Send success email
			const mail = await getMailClient();
			const firstName = user.name.split(' ')[0];
			const message = await mail.sendMail(
				successEmail(firstName, user.email, env.FRONTEND_BASE_URL)
			);
			
			// Log email preview URL in development
			if (env.NODE_ENV === 'development') {
				console.log('📧 Email preview:', nodemailer.getTestMessageUrl(message));
			}
			
			// Redirect to frontend success page
			return reply.redirect(`${env.FRONTEND_BASE_URL}/email-confirmed`);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Verification failed';
			// Redirect to frontend error page
			return reply.redirect(`${env.FRONTEND_BASE_URL}/email-verification-error?error=${encodeURIComponent(errorMessage)}`);
		}
	});

	app.post('/login', { schema: { body: loginBody } }, async (req, reply) => {
		const result = await svc.login(req.body as LoginBody);
		return reply.send(result);
	});

	app.post('/refresh', async (req, reply) => {
		const { refreshToken } = req.body as { refreshToken: string };
		if (!refreshToken) {
			return reply.code(400).send({ message: 'Refresh token required' });
		}
		
		try {
			const result = await svc.refreshAccessToken(refreshToken);
			return reply.send(result);
		} catch (error) {
			return reply.code(401).send({ message: 'Invalid or expired refresh token' });
		}
	});

	app.post('/logout', async (req, reply) => {
		const { refreshToken } = req.body as { refreshToken: string };
		if (!refreshToken) {
			return reply.code(400).send({ message: 'Refresh token required' });
		}
		
		const result = await svc.logout(refreshToken);
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
				bio: true,
				image: true,
				coverImage: true,
				email: true,
			},
		});
		return reply.send({ user: me });
	});

	app.put(
		'/profile',
		{ preHandler: [app.authenticate], schema: { body: updateProfileBody } },
		async (req, reply) => {
			// @ts-ignore
			const payload = req.user as { id: number };
			const body = req.body as UpdateProfileBody;

			// If username is being updated, check uniqueness
			if (body.username) {
				const existing = await app.prisma.user.findFirst({
					where: {
						username: body.username,
						NOT: { id: payload.id },
					},
				});
				if (existing) {
					return reply.code(409).send({ message: 'Username already taken' });
				}
			}

			const updated = await app.prisma.user.update({
				where: { id: payload.id },
				data: {
					...(body.name !== undefined && { name: body.name }),
					...(body.username !== undefined && { username: body.username }),
					...(body.bio !== undefined && { bio: body.bio }),
					...(body.image !== undefined && { image: body.image }),
					...(body.coverImage !== undefined && { coverImage: body.coverImage }),
				},
				select: {
					id: true,
					username: true,
					name: true,
					bio: true,
					image: true,
					coverImage: true,
					email: true,
				},
			});
			return reply.send({ user: updated });
		}
	);

	// Check username availability
	app.get('/check-username/:username', async (req, reply) => {
		const username = (req.params as { username: string }).username;
		
		// Get current user ID if authenticated (to allow keeping own username)
		let currentUserId: number | undefined;
		try {
			await app.authenticate(req, reply);
			// @ts-ignore
			currentUserId = req.user?.id;
		} catch {
			// Not authenticated - that's fine
		}

		const existing = await app.prisma.user.findFirst({
			where: {
				username,
				...(currentUserId && { NOT: { id: currentUserId } }),
			},
		});
		
		return reply.send({ available: !existing });
	});
};

export default routes;
