import { Bet } from '../../shared/types';

/**
 * 格式化投注信息为可读文本
 */
export const formatBetInfo = (bet: Bet): string => {
  let message = `🎲 *投注详情* 🎲\n\n` +
                `*标题*: ${bet.title}\n` +
                `*状态*: ${formatStatus(bet.status)}\n` +
                `*总金额*: ${bet.totalAmount} USDC\n\n` +
                `*选项*:\n`;
  
  bet.options.forEach((option, index) => {
    const winnerMark = bet.winnerOptionIndex === index ? '🏆 ' : '';
    message += `${index}. ${winnerMark}${option}\n`;
  });

  message += `\n*合约地址*: \`${bet.id}\``;

  return message;
};

/**
 * 格式化投注状态
 */
export const formatStatus = (status: string): string => {
  switch (status) {
    case 'open':
      return '🟢 开放中';
    case 'closed':
      return '🟠 已关闭';
    case 'resolved':
      return '🔵 已解决';
    default:
      return status;
  }
};
