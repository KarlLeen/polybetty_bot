import { Context, CommandContext, InlineKeyboard } from 'grammy';
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
    await ctx.reply('\u274c \u83b7\u53d6\u6295\u6ce8\u4fe1\u606f\u65f6\u53d1\u751f\u9519\u8bef\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5\u3002', {
      parse_mode: 'Markdown'
    });
  }

  const betId = parts[0];

  await ctx.reply('⏳ 正在获取投注信息...');

  try {
    // 调用API获取投注信息
    const response = await axios.get(`http://${config.api.host}:${config.api.port}/bets/${betId}`);

    if (response.data.success) {
      const bet = response.data.bet;
      
      // 创建内联键盘，仅在投注状态为open时显示
      let keyboard: InlineKeyboard | undefined;
      if (bet.status === 'open') {
        keyboard = new InlineKeyboard();
        
        // 为每个选项添加按钮
        bet.options.forEach((option: string, index: number) => {
          // TypeScript不知道这里的keyboard一定被初始化了:在这个作用域中我们已经通过new操作初始化了keyboard
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          keyboard!.add({
            text: `选择: ${option}`,
            callback_data: `join:${bet.id}:${index}`
          });
          
          // 每行最多两个按钮
          if (index % 2 === 1 || index === bet.options.length - 1) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            keyboard!.row();
          }
        });
        
        // 添加查看详情按钮
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        keyboard!.add({
          text: "查看详情",
          callback_data: `view:${bet.id}`
        });
      }

      // 发送带有内联键盘的消息
      await ctx.reply(formatBetInfo(bet), { 
        parse_mode: 'Markdown',
        // 仅在keyboard存在时将其添加到reply_markup
        ...(keyboard ? { reply_markup: keyboard } : {})
      });
    } else {
      await ctx.reply('\u274c \u83b7\u53d6\u6295\u6ce8\u4fe1\u606f\u5931\u8d25: ' + response.data.error, {
        parse_mode: 'Markdown'
      });
    }
  } catch (error) {
    console.error('Get bet info error:', error);
    await ctx.reply('❌ 获取投注信息时发生错误，请稍后再试。');
  }
};
