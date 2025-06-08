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
    await ctx.reply('\u65e0\u6cd5\u8bc6\u522b\u7528\u6237\u3002', 
      { parse_mode: 'Markdown' }
    );
    return;
  }

  // 解析命令参数
  const text = ctx.message?.text || '';
  const parts = text.split(/\s+/).slice(1); // 去掉命令名称

  if (parts.length !== 2) {
    await ctx.reply(
      '\u274c \u683c\u5f0f\u9519\u8bef\uff01\n\n' +
      '\u6b63\u786e\u683c\u5f0f: /resolvebet <\u5408\u7ea6\u5730\u5740> <\u83b7\u80dc\u9009\u9879\u7d22\u5f15>\n\n' +
      '\u793a\u4f8b: /resolvebet 0x123abc 1',
      { parse_mode: 'Markdown' }
    );
    return;
  }

  const [betId, winnerOptionIndexStr] = parts;
  const winnerOptionIndex = parseInt(winnerOptionIndexStr, 10);

  if (isNaN(winnerOptionIndex) || winnerOptionIndex < 0) {
    await ctx.reply('\u274c \u83b7\u80dc\u9009\u9879\u7d22\u5f15\u5fc5\u987b\u662f\u4e00\u4e2a\u975e\u8d1f\u6574\u6570\u3002', 
      { parse_mode: 'Markdown' }
    );
    return;
  }

  await ctx.reply('⏳ 正在解决投注，请稍候...');

  try {
    // 先获取投注详情以显示选择的选项
    const betResponse = await axios.get(`http://${config.api.host}:${config.api.port}/bets/${betId}`);
    if (!betResponse.data.success) {
      await ctx.reply('\u274c \u627e\u4e0d\u5230\u8be5\u6295\u6ce8\u3002', 
        { parse_mode: 'Markdown' }
      );
      return;
    }

    const bet = betResponse.data.bet;
    if (winnerOptionIndex >= bet.options.length) {
      await ctx.reply(`\u274c \u65e0\u6548\u7684\u9009\u9879\u7d22\u5f15\u3002\u8be5\u6295\u6ce8\u53ea\u6709 ${bet.options.length} \u4e2a\u9009\u9879\u3002`, 
        { parse_mode: 'Markdown' }
      );
      return;
    }
    
    // 检查投注状态
    if (bet.status !== 'open') {
      await ctx.reply(`\u274c \u65e0\u6cd5\u89e3\u51b3\u6295\u6ce8\u3002\u6295\u6ce8\u72b6\u6001\u5fc5\u987b\u4e3a "open"\uff0c\u5f53\u524d\u72b6\u6001\u4e3a "${bet.status}"\u3002`, 
        { parse_mode: 'Markdown' }
      );
      return;
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
