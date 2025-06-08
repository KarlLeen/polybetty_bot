import { Context, CommandContext } from 'grammy';
import { getOrCreateUserAddress } from '../../api/services/userService';

/**
 * 处理/start命令
 * 欢迎用户并提供基本介绍
 */
export const handleStart = async (ctx: CommandContext<Context>): Promise<void> => {
  const telegramUserId = ctx.from?.id;
  if (!telegramUserId) {
    return;
  }

  // 为用户生成或获取地址
  const address = getOrCreateUserAddress(telegramUserId);

  // 发送欢迎信息
  await ctx.reply(
    `欢迎使用社交投机机器人！\n\n` +
    `🎲 这是一个基于区块链的投注平台，你可以创建投注并邀请朋友参与。\n\n` +
    `📝 核心命令:\n` +
    `/createbet - 创建新的投注\n` +
    `/joinbet - 加入现有投注\n` +
    `/betinfo - 查看投注详情\n\n` +
    `🔑 你的区块链地址: \`${address}\`\n\n` +
    `开始使用 /createbet 创建你的第一个投注！`,
    { parse_mode: 'Markdown' }
  );
};
