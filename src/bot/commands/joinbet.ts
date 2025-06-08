import { Context, CommandContext } from 'grammy';
import axios from 'axios';
import { config } from '../../shared/config';

/**
 * 处理/joinbet命令
 * 格式: /joinbet <合约地址> <金额> <选项索引>
 * 示例: /joinbet 0x123abc 10 1
 */
export const handleJoinBet = async (ctx: CommandContext<Context>): Promise<void> => {
  const telegramUserId = ctx.from?.id;
  if (!telegramUserId) {
    await ctx.reply('无法识别用户。');
  }

  // 解析命令参数
  const text = ctx.message?.text || '';
  const parts = text.split(/\s+/).slice(1); // 去掉命令名称

  if (parts.length !== 3) {
    await ctx.reply(
      '❌ 格式错误！\n\n' +
      '正确格式: /joinbet <合约地址> <金额> <选项索引>\n\n' +
      '示例: /joinbet 0x123abc 10 1'
    );
  }

  const [betId, amountStr, optionIndexStr] = parts;
  const amount = parseFloat(amountStr);
  const optionIndex = parseInt(optionIndexStr, 10);

  if (isNaN(amount) || amount <= 0) {
    await ctx.reply('❌ 金额必须是一个正数。');
  }

  if (isNaN(optionIndex) || optionIndex < 0) {
    await ctx.reply('❌ 选项索引必须是一个非负整数。');
  }

  await ctx.reply('⏳ 正在加入投注，请稍候...');

  try {
    // 先获取投注详情以显示选择的选项
    const betResponse = await axios.get(`http://${config.api.host}:${config.api.port}/bets/${betId}`);
    if (!betResponse.data.success) {
      await ctx.reply('❌ 找不到该投注。');
    }

    const bet = betResponse.data.bet;
    if (optionIndex >= bet.options.length) {
      await ctx.reply(`❌ 无效的选项索引。该投注只有 ${bet.options.length} 个选项。`);
    }

    const selectedOption = bet.options[optionIndex];

    // 调用API加入投注
    const joinResponse = await axios.post(`http://${config.api.host}:${config.api.port}/bets/join`, {
      betId,
      amount,
      optionIndex,
      telegramUserId
    });

    if (joinResponse.data.success) {
      await ctx.reply(
        `✅ 成功加入投注！\n\n` +
        `标题: ${bet.title}\n` +
        `你选择了: ${optionIndex}. ${selectedOption}\n` +
        `投注金额: ${amount} USDC\n\n` +
        `使用 /betinfo ${betId} 可以查看投注详情。`,
        { parse_mode: 'Markdown' }
      );
    } else {
      await ctx.reply('❌ 加入投注失败: ' + joinResponse.data.error);
    }
  } catch (error) {
    console.error('Join bet error:', error);
    await ctx.reply('❌ 加入投注时发生错误，请稍后再试。');
  }
};
