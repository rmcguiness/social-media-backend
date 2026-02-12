import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { build } from '../server.js';
import type { FastifyInstance } from 'fastify';

describe('Comments with Nested Replies', () => {
	let app: FastifyInstance;
	let authToken: string;
	let userId: number;
	let postId: number;
	let parentCommentId: number;

	beforeAll(async () => {
		app = await build();
		await app.ready();

		// Create a test user
		const signupRes = await app.inject({
			method: 'POST',
			url: '/api/auth/signup',
			payload: {
				email: `test-comments-${Date.now()}@example.com`,
				username: `testuser${Date.now()}`,
				name: 'Test User',
				password: 'TestPassword123!',
			},
		});

		expect(signupRes.statusCode).toBe(201);
		const signupData = signupRes.json();
		authToken = signupData.token;
		userId = signupData.user.id;

		// Create a test post
		const postRes = await app.inject({
			method: 'POST',
			url: '/api/posts',
			headers: { authorization: `Bearer ${authToken}` },
			payload: {
				title: 'Test Post for Comments',
				content: 'This is a test post',
			},
		});

		expect(postRes.statusCode).toBe(201);
		postId = postRes.json().id;
	});

	afterAll(async () => {
		await app.close();
	});

	it('should create a top-level comment', async () => {
		const res = await app.inject({
			method: 'POST',
			url: `/api/comments/${postId}`,
			headers: { authorization: `Bearer ${authToken}` },
			payload: {
				content: 'This is a parent comment',
			},
		});

		expect(res.statusCode).toBe(201);
		const comment = res.json();
		expect(comment.content).toBe('This is a parent comment');
		expect(comment.userId).toBe(userId);
		expect(comment.parentId).toBeUndefined();
		
		parentCommentId = comment.id;
	});

	it('should create a reply to a comment', async () => {
		const res = await app.inject({
			method: 'POST',
			url: `/api/comments/${postId}`,
			headers: { authorization: `Bearer ${authToken}` },
			payload: {
				content: 'This is a reply',
				parentId: parentCommentId,
			},
		});

		expect(res.statusCode).toBe(201);
		const reply = res.json();
		expect(reply.content).toBe('This is a reply');
		expect(reply.userId).toBe(userId);
		expect(reply.parentId).toBe(parentCommentId);
	});

	it('should fetch comments with nested replies', async () => {
		const res = await app.inject({
			method: 'GET',
			url: `/api/comments/${postId}`,
		});

		expect(res.statusCode).toBe(200);
		const result = res.json();
		expect(result.data).toBeInstanceOf(Array);
		
		// Find the parent comment
		const parentComment = result.data.find((c: any) => c.id === parentCommentId);
		expect(parentComment).toBeDefined();
		expect(parentComment.content).toBe('This is a parent comment');
		
		// Check that replies are included
		expect(parentComment.replies).toBeInstanceOf(Array);
		expect(parentComment.replies.length).toBeGreaterThan(0);
		
		// Verify reply content
		const reply = parentComment.replies[0];
		expect(reply.content).toBe('This is a reply');
		expect(reply.parentId).toBe(parentCommentId);
	});

	it('should create nested replies (3 levels deep)', async () => {
		// Create first reply
		const reply1Res = await app.inject({
			method: 'POST',
			url: `/api/comments/${postId}`,
			headers: { authorization: `Bearer ${authToken}` },
			payload: {
				content: 'First level reply',
				parentId: parentCommentId,
			},
		});
		const reply1 = reply1Res.json();

		// Create second level reply (reply to reply)
		const reply2Res = await app.inject({
			method: 'POST',
			url: `/api/comments/${postId}`,
			headers: { authorization: `Bearer ${authToken}` },
			payload: {
				content: 'Second level reply',
				parentId: reply1.id,
			},
		});
		const reply2 = reply2Res.json();

		expect(reply2.parentId).toBe(reply1.id);
		expect(reply2Res.statusCode).toBe(201);
	});

	it('should delete a parent comment and cascade to replies', async () => {
		// Create a new parent comment
		const parentRes = await app.inject({
			method: 'POST',
			url: `/api/comments/${postId}`,
			headers: { authorization: `Bearer ${authToken}` },
			payload: {
				content: 'Parent to delete',
			},
		});
		const parent = parentRes.json();

		// Create a reply
		const replyRes = await app.inject({
			method: 'POST',
			url: `/api/comments/${postId}`,
			headers: { authorization: `Bearer ${authToken}` },
			payload: {
				content: 'Reply to delete',
				parentId: parent.id,
			},
		});
		const reply = replyRes.json();

		// Delete parent
		const deleteRes = await app.inject({
			method: 'DELETE',
			url: `/api/comments/comment/${parent.id}`,
			headers: { authorization: `Bearer ${authToken}` },
		});
		expect(deleteRes.statusCode).toBe(204);

		// Verify reply is also deleted (cascade)
		const commentsRes = await app.inject({
			method: 'GET',
			url: `/api/comments/${postId}`,
		});
		const comments = commentsRes.json();
		const deletedReply = comments.data.flatMap((c: any) => c.replies).find((r: any) => r?.id === reply.id);
		expect(deletedReply).toBeUndefined();
	});

	it('should not allow replies with invalid parentId', async () => {
		const res = await app.inject({
			method: 'POST',
			url: `/api/comments/${postId}`,
			headers: { authorization: `Bearer ${authToken}` },
			payload: {
				content: 'Reply to nonexistent comment',
				parentId: 999999,
			},
		});

		// Should fail due to foreign key constraint
		expect(res.statusCode).toBeGreaterThanOrEqual(400);
	});
});
