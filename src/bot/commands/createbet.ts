import { Context, CommandContext } from 'grammy';
import axios from 'axios';
import { config } from '../../shared/config';
import { formatBetInfo } from '../utils/formatter';
import { InlineKeyboard } from 'grammy';

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
    await ctx.reply('\u274c \u521b\u5efa\u6295\u6ce8\u65f6\u53d1\u751f\u9519\u8bef\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5\u3002', {
      parse_mode: 'Markdown'
    });
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
      
      // 使用新的格式化函数生成投注信息
      const betInfoMessage = formatBetInfo(bet);
      
      // 创建内联键盘
      const keyboard = new InlineKeyboard();
      
      // 添加选项按钮
      bet.options.forEach((option: string, index: number) => {
        keyboard.add({
          text: `选择: ${option}`,
          callback_data: `join:${bet.id}:${index}`
        });
        
        // 每行最多两个按钮
        if (index % 2 === 1 || index === bet.options.length - 1) {
          keyboard.row();
        }
      });
      
      // 添加查看详情按钮
      keyboard.add({
        text: '查看详情',
        callback_data: `view:${bet.id}`
      });
      
      // 发送带有内联键盘的消息
      await ctx.reply(betInfoMessage, { 
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
    } else {
      await ctx.reply('\u274c \u521b\u5efa\u6295\u6ce8\u5931\u8d25: ' + response.data.error, {
        parse_mode: 'Markdown'
      });
    }
  } catch (error) {
    console.error('Create bet error:', error);
    await ctx.reply('❌ 创建投注时发生错误，请稍后再试。');
  }
};
