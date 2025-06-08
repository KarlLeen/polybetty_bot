import { FastifyInstance } from 'fastify';
import { 
  getOrCreateUserAddress,
  getUserAddress,
  hasUserAddress
} from '../services/userService';

/**
 * 注册用户相关的API路由
 */
export default async function (fastify: FastifyInstance) {
  // 获取或创建用户的区块链地址
  fastify.post<{ Body: { telegramUserId: number } }>('/users/address', async (request, reply) => {
    try {
      const { telegramUserId } = request.body;
      const address = getOrCreateUserAddress(telegramUserId);
      return reply.code(200).send({ success: true, address });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ success: false, error: error.message });
    }
  });

  // 查询用户是否有关联的区块链地址
  fastify.get<{ Querystring: { telegramUserId: string } }>('/users/has-address', async (request, reply) => {
    try {
      const telegramUserId = parseInt(request.query.telegramUserId, 10);
      const hasAddress = hasUserAddress(telegramUserId);
      return reply.code(200).send({ success: true, hasAddress });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ success: false, error: error.message });
    }
  });
  
  // 获取用户的区块链地址
  fastify.get<{ Querystring: { telegramUserId: string } }>('/users/address', async (request, reply) => {
    try {
      const telegramUserId = parseInt(request.query.telegramUserId, 10);
      const address = getUserAddress(telegramUserId);
      if (!address) {
        return reply.code(404).send({ success: false, error: 'User has no associated address' });
      }
      return reply.code(200).send({ success: true, address });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ success: false, error: error.message });
    }
  });
}
