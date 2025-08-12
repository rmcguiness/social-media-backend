import 'dotenv/config';

export const env = {
	PORT: parseInt(process.env.PORT || '4000', 10),
	NODE_ENV: process.env.NODE_ENV || 'development',
	DATABASE_URL: process.env.DATABASE_URL || '',
	JWT_SECRET: process.env.JWT_SECRET || 'dev_secret_change_me',
	JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
	JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
};
