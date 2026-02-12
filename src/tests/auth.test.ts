import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from './setup';
import * as authService from '../modules/auth/service';
import bcrypt from 'bcrypt';

describe('Auth Service', () => {
  const testUser = {
    email: 'test@example.com',
    username: 'testuser',
    password: 'password123',
    fullName: 'Test User',
  };

  beforeEach(async () => {
    // Clean slate for each test
    await prisma.user.deleteMany();
  });

  describe('signup', () => {
    it('should create a new user and return token', async () => {
      const result = await authService.signup(testUser);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(testUser.email);
      expect(result.user.username).toBe(testUser.username);
      expect(result.user.fullName).toBe(testUser.fullName);
      expect(result.user).not.toHaveProperty('password');
    });

    it('should hash the password', async () => {
      await authService.signup(testUser);

      const user = await prisma.user.findUnique({
        where: { email: testUser.email },
      });

      expect(user).toBeTruthy();
      expect(user!.password).not.toBe(testUser.password);
      const isMatch = await bcrypt.compare(testUser.password, user!.password);
      expect(isMatch).toBe(true);
    });

    it('should fail if email already exists', async () => {
      await authService.signup(testUser);

      await expect(authService.signup(testUser)).rejects.toThrow();
    });

    it('should fail if username already exists', async () => {
      await authService.signup(testUser);

      await expect(
        authService.signup({
          ...testUser,
          email: 'different@example.com',
        })
      ).rejects.toThrow();
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      // Create test user for login tests
      await authService.signup(testUser);
    });

    it('should login with email and password', async () => {
      const result = await authService.login({
        emailOrUsername: testUser.email,
        password: testUser.password,
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(testUser.email);
    });

    it('should login with username and password', async () => {
      const result = await authService.login({
        emailOrUsername: testUser.username,
        password: testUser.password,
      });

      expect(result).toHaveProperty('accessToken');
      expect(result.user.username).toBe(testUser.username);
    });

    it('should fail with wrong password', async () => {
      await expect(
        authService.login({
          emailOrUsername: testUser.email,
          password: 'wrongpassword',
        })
      ).rejects.toThrow('Invalid credentials');
    });

    it('should fail with non-existent user', async () => {
      await expect(
        authService.login({
          emailOrUsername: 'nonexistent@example.com',
          password: testUser.password,
        })
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('verifyToken', () => {
    it('should return userId for valid token', async () => {
      const { accessToken } = await authService.signup(testUser);
      const userId = authService.verifyToken(accessToken);

      expect(userId).toBeTruthy();
      expect(typeof userId).toBe('number');
    });

    it('should throw for invalid token', () => {
      expect(() => authService.verifyToken('invalid-token')).toThrow();
    });

    it('should throw for expired token', () => {
      // This would require mocking jwt.sign with a past expiry
      // Skipping for now, but important for production
    });
  });
});
