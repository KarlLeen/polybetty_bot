import { Bot } from 'grammy';
import { handleStart } from './start';
import { handleCreateBet } from './createbet';
import { handleJoinBet } from './joinbet';
import { handleResolveBet } from './resolvebet';
import { handleBetInfo } from './betinfo';

/**
 * 注册所有机器人命令
 */
export const registerCommands = (bot: Bot) => {
  // 注册命令
  bot.command('start', handleStart);
  bot.command('createbet', handleCreateBet);
  bot.command('joinbet', handleJoinBet);
  bot.command('resolvebet', handleResolveBet);
  bot.command('betinfo', handleBetInfo);

  // 设置命令菜单
  bot.api.setMyCommands([
    { command: 'start', description: '开始使用机器人' },
    { command: 'createbet', description: '创建新的投注' },
    { command: 'joinbet', description: '加入已有投注' },
    { command: 'resolvebet', description: '解决投注 (仅限创建者)' },
    { command: 'betinfo', description: '查看投注详情' },
  ]);
};
