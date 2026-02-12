import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from './setup';
import * as likesService from '../modules/likes/service';
import * as authService from '../modules/auth/service';

describe('Likes Service', () => {
  let userId: number;
  let postId: number;

  beforeEach(async () => {
    // Create test user
    const { user } = await authService.signup({
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123',
      fullName: 'Test User',
    });
    userId = user.id;

    // Create test post
    const post = await prisma.post.create({
      data: {
        content: 'Test post',
        userId,
      },
    });
    postId = post.id;
  });

  describe('toggle', () => {
    it('should like a post when not already liked', async () => {
      const result = await likesService.toggle(postId, userId);

      expect(result.liked).toBe(true);
      expect(result.likesCount).toBe(1);

      // Verify in database
      const like = await prisma.like.findUnique({
        where: {
          postId_userId: { postId, userId },
        },
      });
      expect(like).toBeTruthy();
    });

    it('should unlike a post when already liked', async () => {
      // First like the post
      await likesService.toggle(postId, userId);

      // Then unlike it
      const result = await likesService.toggle(postId, userId);

      expect(result.liked).toBe(false);
      expect(result.likesCount).toBe(0);

      // Verify in database
      const like = await prisma.like.findUnique({
        where: {
          postId_userId: { postId, userId },
        },
      });
      expect(like).toBeNull();
    });

    it('should handle multiple users liking the same post', async () => {
      // Create second user
      const { user: user2 } = await authService.signup({
        email: 'test2@example.com',
        username: 'testuser2',
        password: 'password123',
        fullName: 'Test User 2',
      });

      // Both users like the post
      await likesService.toggle(postId, userId);
      const result = await likesService.toggle(postId, user2.id);

      expect(result.liked).toBe(true);
      expect(result.likesCount).toBe(2);
    });

    it('should fail for non-existent post', async () => {
      await expect(likesService.toggle(99999, userId)).rejects.toThrow();
    });

    it('should fail for invalid userId', async () => {
      await expect(likesService.toggle(postId, 99999)).rejects.toThrow();
    });
  });

  describe('getLikeStatus', () => {
    it('should return true when user has liked the post', async () => {
      await likesService.toggle(postId, userId);

      const status = await likesService.getLikeStatus(postId, userId);
      expect(status).toBe(true);
    });

    it('should return false when user has not liked the post', async () => {
      const status = await likesService.getLikeStatus(postId, userId);
      expect(status).toBe(false);
    });

    it('should return false for unauthenticated user (null userId)', async () => {
      const status = await likesService.getLikeStatus(postId, null);
      expect(status).toBe(false);
    });
  });
});
