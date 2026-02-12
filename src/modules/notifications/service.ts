import { prisma } from '@/utils/prisma';

export type NotificationType = 'like' | 'comment';

export type Notification = {
  id: string;
  type: NotificationType;
  userId: number;
  actorId: number;
  postId: number;
  createdAt: Date;
  actor: {
    id: number;
    name: string;
    username: string;
    image: string | null;
  };
  post: {
    id: number;
    title: string;
  };
};

export const notificationsService = {
  /**
   * Get notifications for a user
   * Aggregates likes and comments on the user's posts
   */
  async getForUser(userId: number, limit = 20): Promise<Notification[]> {
    // Get likes on user's posts
    const likes = await prisma.like.findMany({
      where: {
        post: {
          userId,
        },
        // Don't show self-likes as notifications
        userId: {
          not: userId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
        post: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    // Get comments on user's posts
    const comments = await prisma.comment.findMany({
      where: {
        post: {
          userId,
        },
        // Don't show self-comments as notifications
        userId: {
          not: userId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
        post: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    // Combine and format notifications
    const likeNotifications: Notification[] = likes.map((like) => ({
      id: `like-${like.id}`,
      type: 'like' as const,
      userId,
      actorId: like.userId,
      postId: like.postId,
      createdAt: like.createdAt,
      actor: like.user,
      post: like.post,
    }));

    const commentNotifications: Notification[] = comments.map((comment) => ({
      id: `comment-${comment.id}`,
      type: 'comment' as const,
      userId,
      actorId: comment.userId,
      postId: comment.postId,
      createdAt: comment.createdAt,
      actor: comment.user,
      post: comment.post,
    }));

    // Merge and sort by createdAt
    const allNotifications = [...likeNotifications, ...commentNotifications]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);

    return allNotifications;
  },
};
