import { FastifyInstance } from 'fastify';
import betsRoutes from './bets';
import usersRoutes from './users';

/**
 * 注册所有API路由
 */
export default async function (fastify: FastifyInstance) {
  // 注册子路由
  await fastify.register(betsRoutes);
  await fastify.register(usersRoutes);
  
  // 添加根路径健康检查端点
  fastify.get('/', async () => {
    return { status: 'ok', service: 'telegram-betting-bot-api' };
  });
}
