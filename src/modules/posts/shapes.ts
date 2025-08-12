import type { Post, User } from '@prisma/client';

type PostCounts = { comments: number; likes: number };

export function toFrontendPost(
	p: Post & { user: User } & { _count: PostCounts }
) {
	return {
		id: p.id,
		parentId: p.parentId ?? null,
		title: p.title,
		content: p.content,
		image: p.image ?? null,
		likes: p._count.likes,
		comments: p._count.comments,
		shares: p.shares,
		user: {
			id: p.user.id,
			name: p.user.name,
			image: p.user.image ?? '',
		},
		createdAt: p.createdAt,
		updatedAt: p.updatedAt,
	};
}
