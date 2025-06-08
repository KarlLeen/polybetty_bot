import { Bot, Context } from 'grammy';
import axios from 'axios';
import { config } from '../../shared/config';
import { InlineKeyboard } from 'grammy';

/**
 * 处理内联键盘回调
 */
export const registerCallbackHandlers = (bot: Bot) => {
  // 处理选择投注选项按钮
  bot.callbackQuery(/^join:(.+):(\d+)$/, async (ctx) => {
    // 匹配格式 join:合约地址:选项索引
    const [, betId, optionIndexStr] = ctx.match as RegExpMatchArray;
    const optionIndex = parseInt(optionIndexStr, 10);
    
    // 获取投注详情
    try {
      const response = await axios.get(`http://${config.api.host}:${config.api.port}/bets/${betId}`);
      
      if (!response.data.success) {
        await ctx.answerCallbackQuery({
          text: '❌ 无法获取投注详情',
          show_alert: true
        });
        return;
      }
      
      const bet = response.data.bet;
      if (bet.status !== 'open') {
        await ctx.answerCallbackQuery({
          text: '❌ 此投注已不可加入',
          show_alert: true
        });
        return;
      }
      
      const selectedOption = bet.options[optionIndex];
      
      // 创建金额选择键盘
      const keyboard = new InlineKeyboard();
      [1, 5, 10, 20, 50].forEach(amount => {
        keyboard.add({
          text: `${amount} USDC`,
          callback_data: `amount:${betId}:${optionIndex}:${amount}`
        });
      });
      
      // 添加自定义金额按钮
      keyboard.row().add({
        text: "自定义金额",
        callback_data: `custom_amount:${betId}:${optionIndex}`
      });
      
      // 回复一个简短确认，关闭回调查询
      await ctx.answerCallbackQuery();
      
      // 发送选项和金额选择消息
      await ctx.reply(
        `📊 *投注: ${bet.title}*\n\n` +
        `您选择了: *${selectedOption}*\n\n` +
        `请选择投注金额:`,
        {
          parse_mode: 'Markdown',
          reply_markup: keyboard
        }
      );
    } catch (error) {
      console.error('Join bet callback error:', error);
      await ctx.answerCallbackQuery({
        text: '❌ 处理选择时发生错误',
        show_alert: true
      });
    }
  });
  
  // 处理选择金额按钮
  bot.callbackQuery(/^amount:(.+):(\d+):(\d+)$/, async (ctx) => {
    // 匹配格式 amount:合约地址:选项索引:金额
    const [, betId, optionIndexStr, amountStr] = ctx.match as RegExpMatchArray;
    const optionIndex = parseInt(optionIndexStr, 10);
    const amount = parseInt(amountStr, 10);
    const telegramUserId = ctx.from.id;
    
    await ctx.answerCallbackQuery({ text: '处理中...' });
    
    try {
      // 获取投注详情以显示选择的选项
      const betResponse = await axios.get(`http://${config.api.host}:${config.api.port}/bets/${betId}`);
      if (!betResponse.data.success) {
        await ctx.reply('❌ 找不到该投注。');
        return;
      }
      
      const bet = betResponse.data.bet;
      if (optionIndex >= bet.options.length) {
        await ctx.reply(`❌ 无效的选项索引。该投注只有 ${bet.options.length} 个选项。`);
        return;
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
          `使用 /betinfo ${betId} 可以查看投注详情。`
        );
      } else {
        await ctx.reply('❌ 加入投注失败: ' + joinResponse.data.error);
      }
    } catch (error) {
      console.error('Join bet amount error:', error);
      await ctx.reply('❌ 加入投注时发生错误，请稍后再试。');
    }
  });
  
  // 处理自定义金额按钮
  bot.callbackQuery(/^custom_amount:(.+):(\d+)$/, async (ctx) => {
    // 匹配格式 custom_amount:合约地址:选项索引
    const [, betId, optionIndexStr] = ctx.match as RegExpMatchArray;
    const optionIndex = parseInt(optionIndexStr, 10);
    
    // 存储用户选择的投注信息到会话状态 (这需要会话中间件，但我们在此简单演示)
    // 在真实实现中，应该使用session中间件来存储这些状态
    
    await ctx.answerCallbackQuery();
    
    // 提示用户输入自定义金额
    await ctx.reply(
      `💰 请使用以下格式输入您的投注金额:\n\n` +
      `/joinbet ${betId} ${optionIndex} <金额>\n\n` +
      `例如: /joinbet ${betId} ${optionIndex} 15.5`
    );
  });
  
  // 处理查看详情按钮
  bot.callbackQuery(/^view:(.+)$/, async (ctx) => {
    const [, betId] = ctx.match as RegExpMatchArray;
    
    await ctx.answerCallbackQuery({ text: '正在获取最新投注详情...' });
    
    // 重新调用betinfo命令查看最新详情
    await ctx.reply(`/betinfo ${betId}`);
  });
};
