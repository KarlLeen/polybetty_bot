import { Bot } from 'grammy';
import { config } from '../shared/config';
import { registerCommands } from './commands';
import { registerCallbackHandlers } from './handlers/callbackHandlers';

/**
 * 启动Telegram机器人
 */
const startBot = async () => {
  // 检查是否有Telegram令牌
  if (!config.bot.token) {
    console.error('错误: 未配置TELEGRAM_BOT_TOKEN环境变量');
    process.exit(1);
  }

  // 初始化机器人
  const bot = new Bot(config.bot.token);

  // 注册所有命令
  registerCommands(bot);
  
  // 注册内联键盘回调处理程序
  registerCallbackHandlers(bot);

  // 错误处理
  bot.catch((err) => {
    console.error('Bot error:', err);
  });

  // 启动机器人
  await bot.start({
    onStart: (botInfo) => {
      console.log(`机器人已启动: @${botInfo.username}`);
    },
  });
};

// 启动机器人
startBot();
