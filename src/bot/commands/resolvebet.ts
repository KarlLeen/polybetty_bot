import { Context, CommandContext } from 'grammy';
import axios from 'axios';
import { config } from '../../shared/config';

/**
 * 处理/resolvebet命令
 * 格式: /resolvebet <合约地址> <获胜选项索引>
 * 示例: /resolvebet 0x123abc 1
 */
export const handleResolveBet = async (ctx: CommandContext<Context>): Promise<void> => {
  const telegramUserId = ctx.from?.id;
  if (!telegramUserId) {
    await ctx.reply('无法识别用户。');
  }

  // 解析命令参数
  const text = ctx.message?.text || '';
  const parts = text.split(/\s+/).slice(1); // 去掉命令名称

  if (parts.length !== 2) {
    await ctx.reply(
      '❌ 格式错误！\n\n' +
      '正确格式: /resolvebet <合约地址> <获胜选项索引>\n\n' +
      '示例: /resolvebet 0x123abc 1'
    );
  }

  const [betId, winnerOptionIndexStr] = parts;
  const winnerOptionIndex = parseInt(winnerOptionIndexStr, 10);

  if (isNaN(winnerOptionIndex) || winnerOptionIndex < 0) {
    await ctx.reply('❌ 获胜选项索引必须是一个非负整数。');
  }

  await ctx.reply('⏳ 正在解决投注，请稍候...');

  try {
    // 先获取投注详情以显示选择的选项
    const betResponse = await axios.get(`http://${config.api.host}:${config.api.port}/bets/${betId}`);
    if (!betResponse.data.success) {
      await ctx.reply('❌ 找不到该投注。');
    }

    const bet = betResponse.data.bet;
    if (winnerOptionIndex >= bet.options.length) {
      await ctx.reply(`❌ 无效的选项索引。该投注只有 ${bet.options.length} 个选项。`);
    }

    const winnerOption = bet.options[winnerOptionIndex];

    // 调用API解决投注
    const resolveResponse = await axios.post(`http://${config.api.host}:${config.api.port}/bets/resolve`, {
      betId,
      winnerOptionIndex,
      telegramUserId
    });

    if (resolveResponse.data.success) {
      await ctx.reply(
        `✅ 投注已成功解决！\n\n` +
        `标题: ${bet.title}\n` +
        `获胜选项: ${winnerOptionIndex}. ${winnerOption}\n\n` +
        `获胜者现在可以使用 /claimwinnings ${betId} 领取奖金。`,
        { parse_mode: 'Markdown' }
      );
    } else {
      await ctx.reply('❌ 解决投注失败: ' + resolveResponse.data.error);
    }
  } catch (error) {
    console.error('Resolve bet error:', error);
    await ctx.reply('❌ 解决投注时发生错误，请稍后再试。');
  }
};
