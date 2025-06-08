import { FastifyInstance } from 'fastify';
import { 
  createBet, 
  getBet, 
  joinExistingBet, 
  resolveExistingBet,
  claimBetWinnings
} from '../services/blockchainService';
import { CreateBetRequest, JoinBetRequest, ResolveBetRequest } from '../../shared/types';

/**
 * 注册投注相关的API路由
 */
export default async function (fastify: FastifyInstance) {
  // 创建新投注
  fastify.post<{ Body: CreateBetRequest }>('/bets', async (request, reply) => {
    try {
      const bet = await createBet(request.body);
      return reply.code(201).send({ success: true, bet });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ success: false, error: error.message });
    }
  });

  // 加入已有投注
  fastify.post<{ Body: JoinBetRequest }>('/bets/join', async (request, reply) => {
    try {
      const success = await joinExistingBet(request.body);
      if (!success) {
        return reply.code(400).send({ success: false, error: 'Failed to join bet' });
      }
      return reply.code(200).send({ success: true });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ success: false, error: error.message });
    }
  });

  // 解决投注
  fastify.post<{ Body: ResolveBetRequest }>('/bets/resolve', async (request, reply) => {
    try {
      const success = await resolveExistingBet(request.body);
      if (!success) {
        return reply.code(400).send({ success: false, error: 'Failed to resolve bet' });
      }
      return reply.code(200).send({ success: true });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ success: false, error: error.message });
    }
  });

  // 获取投注详情
  fastify.get<{ Params: { id: string } }>('/bets/:id', async (request, reply) => {
    try {
      const bet = await getBet(request.params.id);
      if (!bet) {
        return reply.code(404).send({ success: false, error: 'Bet not found' });
      }
      return reply.code(200).send({ success: true, bet });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ success: false, error: error.message });
    }
  });

  // 领取奖金
  fastify.post<{ Body: { betId: string, telegramUserId: number } }>('/bets/claim', async (request, reply) => {
    try {
      const { betId, telegramUserId } = request.body;
      const success = await claimBetWinnings(betId, telegramUserId);
      if (!success) {
        return reply.code(400).send({ success: false, error: 'Failed to claim winnings' });
      }
      return reply.code(200).send({ success: true });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ success: false, error: error.message });
    }
  });
}
