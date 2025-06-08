import { Bet } from '../../shared/types';

/**
 * 格式化投注信息为具有视觉吸引力的文本
 */
export const formatBetInfo = (bet: Bet): string => {
  // 选择状态对应的主要表情符号
  const statusEmoji = {
    'open': '⏳',     // 沙漏表
    'closed': '🔒',  // 锁
    'resolved': '✅'  // 已完成
  }[bet.status] || '🎲'; // 默认投注表情
  
  // 新建投注或已有投注的头部标题
  const headerEmoji = bet.totalAmount > 0 ? '💰' : '🎉';
  const headerText = bet.totalAmount > 0 ? '正在进行的投注' : '新投注';
  
  // 构建标题部分
  let message = `${headerEmoji} *${headerText}!* ${headerEmoji}\n\n`;
  
  // 分隔线
  const divider = '\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n\n';
  
  // 标题部分
  message += `🏧 *标题*: "${bet.title}"\n\n`;
  
  // 状态部分
  message += `${statusEmoji} *状态*: ${formatStatus(bet.status)}\n`;
  
  // 奖池部分
  const poolText = bet.totalAmount > 0 ? `${bet.totalAmount} USDC` : '0 USDC (立即加入!)';
  message += `💰 *奖池*: ${poolText}\n\n`;
  
  // 选项部分添加数字表情
  message += `🎟 *投注选项*:\n`;
  
  const optionEmojis = ['1️\u20e3', '2️\u20e3', '3️\u20e3', '4️\u20e3', '5️\u20e3'];
  
  bet.options.forEach((option, index) => {
    const emoji = index < optionEmojis.length ? optionEmojis[index] : `${index+1}.`;
    const winnerMark = bet.winnerOptionIndex === index ? '🏆 ' : '';
    message += `${emoji} ${winnerMark}${option}\n`;
  });

  // 合约地址
  message += `\n🔗 *合约地址*:\n\`${bet.id}\`\n\n`;
  
  // 如果是打开状态，添加注释
  if (bet.status === 'open') {
    message += `${divider}👉 *点击下方按钮选择选项并投注!*`;
  } else if (bet.status === 'resolved') {
    const winnerIndex = bet.winnerOptionIndex !== undefined && bet.winnerOptionIndex >= 0 ? bet.winnerOptionIndex : -1;
    if (winnerIndex >= 0 && winnerIndex < bet.options.length) {
      message += `${divider}🏆 *获胜选项*: ${bet.options[winnerIndex]}`;
    }
  }

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
