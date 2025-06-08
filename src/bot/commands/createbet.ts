import { Context, CommandContext } from 'grammy';
import axios from 'axios';
import { config } from '../../shared/config';

/**
 * 处理/createbet命令
 * 格式: /createbet <标题> <选项1> <选项2> ...
 * 示例: /createbet 明天会下雨吗? 会 不会
 */
export const handleCreateBet = async (ctx: CommandContext<Context>): Promise<void> => {
  const telegramUserId = ctx.from?.id;
  if (!telegramUserId) {
    await ctx.reply('无法识别用户。');
  }

  // 解析命令参数
  const text = ctx.message?.text || '';
  const parts = text.split(/\s+/).slice(1); // 去掉命令名称
  
  if (parts.length < 3) {
    await ctx.reply(
      '❌ 格式错误！\n\n' +
      '正确格式: /createbet <标题> <选项1> <选项2> ...\n\n' +
      '示例: /createbet 明天会下雨吗? 会 不会'
    );
  }

  const title = parts[0];
  const options = parts.slice(1);

  await ctx.reply('⏳ 正在创建投注，请稍候...');

  try {
    // 调用API创建投注
    const response = await axios.post(`http://${config.api.host}:${config.api.port}/bets`, {
      title,
      options,
      telegramUserId
    });

    if (response.data.success) {
      const bet = response.data.bet;
      await ctx.reply(
        `✅ 投注已成功创建！\n\n` +
        `标题: ${bet.title}\n\n` +
        `选项:\n${options.map((opt, i) => `${i}. ${opt}`).join('\n')}\n\n` +
        `合约地址: \`${bet.id}\`\n\n` +
        `其他人现在可以使用 /joinbet ${bet.id} <金额> <选项索引> 加入此投注。`,
        { parse_mode: 'Markdown' }
      );
    } else {
      await ctx.reply('❌ 创建投注失败: ' + response.data.error);
    }
  } catch (error) {
    console.error('Create bet error:', error);
    await ctx.reply('❌ 创建投注时发生错误，请稍后再试。');
  }
};
