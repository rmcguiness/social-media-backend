import { FastifyInstance } from 'fastify';
import { notificationsService } from './service';
import { authenticateUser } from '@/plugins/auth';

export async function notificationRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/notifications
   * Get notifications for the authenticated user
   */
  fastify.get(
    '/api/notifications',
    {
      onRequest: [authenticateUser],
    },
    async (request, reply) => {
      try {
        const userId = request.user.id;
        const limit = request.query.limit ? parseInt(request.query.limit as string, 10) : 20;

        const notifications = await notificationsService.getForUser(userId, limit);

        return reply.send({
          data: notifications,
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Failed to fetch notifications',
        });
      }
    }
  );
}
