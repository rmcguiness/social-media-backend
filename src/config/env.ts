import 'dotenv/config';

export const env = {
	PORT: parseInt(process.env.PORT || '4000', 10),
	NODE_ENV: process.env.NODE_ENV || 'development',
	DATABASE_URL: process.env.DATABASE_URL || '',
	JWT_SECRET: process.env.JWT_SECRET || 'dev_secret_change_me',
	JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
	JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
	CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
	CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
	CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
	API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:4000',
	FRONTEND_BASE_URL: process.env.FRONTEND_BASE_URL || 'http://localhost:3000',
	SMTP_HOST: process.env.SMTP_HOST || 'smtp.ethereal.email',
	SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
	SMTP_SECURE: process.env.SMTP_SECURE === 'true',
	SMTP_USER: process.env.SMTP_USER || '',
	SMTP_PASS: process.env.SMTP_PASS || '',
};
