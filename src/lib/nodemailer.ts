import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter: nodemailer.Transporter | null = null;

export async function getMailClient() {
	if (transporter) {
		return transporter;
	}

	// In development, use Ethereal Email (test account)
	if (env.NODE_ENV === 'development') {
		const testAccount = await nodemailer.createTestAccount();

		transporter = nodemailer.createTransport({
			host: 'smtp.ethereal.email',
			port: 587,
			secure: false,
			auth: {
				user: testAccount.user,
				pass: testAccount.pass,
			},
		});

		return transporter;
	}

	// In production, use configured SMTP
	transporter = nodemailer.createTransport({
		host: env.SMTP_HOST,
		port: env.SMTP_PORT,
		secure: env.SMTP_SECURE,
		auth: {
			user: env.SMTP_USER,
			pass: env.SMTP_PASS,
		},
	});

	return transporter;
}

export { nodemailer };
