import { Context, CommandContext } from 'grammy';
import axios from 'axios';
import { config } from '../../shared/config';
import { formatBetInfo } from '../utils/formatter';

/**
 * 处理/betinfo命令
 * 格式: /betinfo <合约地址>
 * 示例: /betinfo 0x123abc
 */
export const handleBetInfo = async (ctx: CommandContext<Context>): Promise<void> => {
  // 解析命令参数
  const text = ctx.message?.text || '';
  const parts = text.split(/\s+/).slice(1); // 去掉命令名称

  if (parts.length !== 1) {
    await ctx.reply(
      '❌ 格式错误！\n\n' +
      '正确格式: /betinfo <合约地址>\n\n' +
      '示例: /betinfo 0x123abc'
    );
  }

  const betId = parts[0];

  await ctx.reply('⏳ 正在获取投注信息...');

  try {
    // 调用API获取投注信息
    const response = await axios.get(`http://${config.api.host}:${config.api.port}/bets/${betId}`);

    if (response.data.success) {
      const bet = response.data.bet;
      await ctx.reply(formatBetInfo(bet), { parse_mode: 'Markdown' });
    } else {
      await ctx.reply('❌ 获取投注信息失败: ' + response.data.error);
    }
  } catch (error) {
    console.error('Get bet info error:', error);
    await ctx.reply('❌ 获取投注信息时发生错误，请稍后再试。');
  }
};
