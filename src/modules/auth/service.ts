import type { FastifyInstance } from 'fastify';
import type { RegisterBody, LoginBody } from './schemas.js';
import { hashPassword, verifyPassword } from '../../utils/password.js';
import dayjs from 'dayjs';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

interface TokenPair {
	accessToken: string;
	refreshToken: string;
}

export function authService(app: FastifyInstance) {
	const prisma = app.prisma;

	// Helper: Generate refresh token (random string)
	const generateRefreshToken = (): string => {
		return crypto.randomBytes(64).toString('hex');
	};

	// Helper: Hash refresh token for storage
	const hashRefreshToken = async (token: string): Promise<string> => {
		return await bcrypt.hash(token, 10);
	};

	// Helper: Verify refresh token hash
	const verifyRefreshToken = async (token: string, hash: string): Promise<boolean> => {
		return await bcrypt.compare(token, hash);
	};

	// Helper: Create token pair
	const createTokenPair = async (userId: number, username: string): Promise<TokenPair> => {
		// Generate short-lived access token (15 minutes)
		const accessToken = app.jwt.sign(
			{ id: userId, username },
			{ expiresIn: '15m' }
		);

		// Generate long-lived refresh token (30 days)
		const refreshToken = generateRefreshToken();
		const tokenHash = await hashRefreshToken(refreshToken);

		// Store refresh token in database
		await prisma.refreshToken.create({
			data: {
				userId,
				tokenHash,
				expiresAt: dayjs().add(30, 'day').toDate(),
			},
		});

		return { accessToken, refreshToken };
	};

	return {
		async register(input: RegisterBody) {
			// Check if email or username already exists (confirmed or unconfirmed)
			const existingUser = await prisma.user.findFirst({
				where: { OR: [{ email: input.email }, { username: input.username }] },
			});
			if (existingUser) throw new Error('User already exists');

			const existingUnconfirmed = await prisma.unconfirmedUser.findFirst({
				where: { OR: [{ email: input.email }, { username: input.username }] },
			});
			if (existingUnconfirmed) {
				// Delete old unconfirmed user and create new one (allows retry)
				await prisma.unconfirmedUser.delete({ where: { id: existingUnconfirmed.id } });
			}

			// Create unconfirmed user
			const unconfirmedUser = await prisma.unconfirmedUser.create({
				data: {
					email: input.email,
					username: input.username,
					name: input.name,
					passwordHash: await hashPassword(input.password),
				},
			});

			return { userId: unconfirmedUser.id, email: unconfirmedUser.email, name: unconfirmedUser.name };
		},

		async confirmEmail(userId: number) {
			// Get unconfirmed user
			const unconfirmedUser = await prisma.unconfirmedUser.findUnique({
				where: { id: userId },
			});

			if (!unconfirmedUser) {
				throw new Error('User not found or already confirmed');
			}

			// Check if confirmation is within 15 minutes
			const expirationTime = dayjs(unconfirmedUser.createdAt).add(15, 'minute');
			if (dayjs().isAfter(expirationTime)) {
				// Delete expired unconfirmed user
				await prisma.unconfirmedUser.delete({ where: { id: userId } });
				throw new Error('Verification link expired. Please sign up again.');
			}

			// Create confirmed user
			const user = await prisma.user.create({
				data: {
					email: unconfirmedUser.email,
					username: unconfirmedUser.username,
					name: unconfirmedUser.name,
					passwordHash: unconfirmedUser.passwordHash,
					emailVerified: true,
					emailVerifiedAt: new Date(),
				},
				select: {
					id: true,
					username: true,
					name: true,
					email: true,
					image: true,
				},
			});

			// Delete unconfirmed user
			await prisma.unconfirmedUser.delete({ where: { id: userId } });

			return user;
		},

		async login(input: LoginBody) {
			const user = await prisma.user.findFirst({
				where: {
					OR: [
						{ email: input.emailOrUsername },
						{ username: input.emailOrUsername },
					],
				},
			});
			if (!user) throw new Error('Invalid credentials');

			const ok = await verifyPassword(user.passwordHash, input.password);
			if (!ok) throw new Error('Invalid credentials');

			// Create token pair (access + refresh)
			const { accessToken, refreshToken } = await createTokenPair(user.id, user.username);

			const safe = {
				id: user.id,
				username: user.username,
				name: user.name,
				image: user.image,
				email: user.email,
			};
			return { user: safe, accessToken, refreshToken };
		},

		async refreshAccessToken(refreshToken: string) {
			// Find all non-revoked refresh tokens
			const storedTokens = await prisma.refreshToken.findMany({
				where: {
					revokedAt: null,
					expiresAt: { gte: new Date() },
				},
				include: {
					user: {
						select: {
							id: true,
							username: true,
						},
					},
				},
			});

			// Check each token hash until we find a match
			let matchedToken = null;
			for (const stored of storedTokens) {
				const isValid = await verifyRefreshToken(refreshToken, stored.tokenHash);
				if (isValid) {
					matchedToken = stored;
					break;
				}
			}

			if (!matchedToken) {
				throw new Error('Invalid or expired refresh token');
			}

			// Revoke old refresh token (rotation)
			await prisma.refreshToken.update({
				where: { id: matchedToken.id },
				data: { revokedAt: new Date() },
			});

			// Generate new token pair
			const { accessToken, refreshToken: newRefreshToken } = await createTokenPair(
				matchedToken.user.id,
				matchedToken.user.username
			);

			return { accessToken, refreshToken: newRefreshToken };
		},

		async logout(refreshToken: string) {
			// Find all non-revoked refresh tokens for verification
			const storedTokens = await prisma.refreshToken.findMany({
				where: {
					revokedAt: null,
				},
			});

			// Find matching token and revoke it
			for (const stored of storedTokens) {
				const isValid = await verifyRefreshToken(refreshToken, stored.tokenHash);
				if (isValid) {
					await prisma.refreshToken.update({
						where: { id: stored.id },
						data: { revokedAt: new Date() },
					});
					return { success: true };
				}
			}

			// Token not found or already revoked
			return { success: false };
		},
	};
}
