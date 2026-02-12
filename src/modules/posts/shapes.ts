import type { Post, User, Like } from '@prisma/client';

type PostCounts = { comments: number; likes: number };
type PostWithData = Post & { 
	user: User;
	_count: PostCounts;
	likes?: Pick<Like, 'id'>[] | boolean;
};

export function toFrontendPost(p: PostWithData, currentUserId?: number) {
	const likedByMe = currentUserId && Array.isArray(p.likes) ? p.likes.length > 0 : false;
	
	return {
		id: p.id,
		parentId: p.parentId ?? null,
		title: p.title,
		content: p.content,
		image: p.image ?? null,
		likes: p._count.likes,
		comments: p._count.comments,
		shares: p.shares,
		likedByMe,
		user: {
			id: p.user.id,
			name: p.user.name,
			username: p.user.username,
			image: p.user.image ?? '',
		},
		createdAt: p.createdAt,
		updatedAt: p.updatedAt,
	};
}
