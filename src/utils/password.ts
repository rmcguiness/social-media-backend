import { hash, verify } from 'argon2';

export const hashPassword = (plain: string) => hash(plain);
export const verifyPassword = (hashValue: string, plain: string) =>
	verify(hashValue, plain);
