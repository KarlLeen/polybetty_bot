import { 
  deploySidebetContract, 
  joinBet, 
  resolveBet, 
  getBetDetails,
  claimWinnings,
  getProviderAndSigner
} from '../../blockchain/ethers/contractInteraction';
import { config } from '../../shared/config';
import { Bet, BetStatus, CreateBetRequest, JoinBetRequest, ResolveBetRequest } from '../../shared/types';

// 内存中存储已创建的投注 (可以替换为数据库)
const betsStore: Map<string, Bet> = new Map();
// 存储Telegram用户ID和区块链地址的映射 (可以替换为数据库)
const userAddressMap: Map<number, string> = new Map();

/**
 * 创建新的投注
 */
export const createBet = async (data: CreateBetRequest): Promise<Bet> => {
  // 获取用户地址 (在真实应用中，这应该是用户的钱包地址)
  let userAddress = userAddressMap.get(data.telegramUserId);
  
  // 如果用户没有关联区块链地址，则生成一个新地址 (MVP阶段简化处理)
  if (!userAddress) {
    // 生成一个假的地址，在真实应用中应该验证用户的钱包地址
    userAddress = `0x${Math.random().toString(16).substring(2, 42)}`;
    userAddressMap.set(data.telegramUserId, userAddress);
  }

  // 部署投注合约
  const contractAddress = await deploySidebetContract(data.title, data.options);

  // 创建投注对象
  const bet: Bet = {
    id: contractAddress,
    title: data.title,
    options: data.options,
    totalAmount: 0,
    status: BetStatus.OPEN,
    creator: userAddress
  };

  // 存储投注信息
  betsStore.set(contractAddress, bet);

  return bet;
};

/**
 * 检查当前环境是否为测试环境
 */
async function isTestEnvironment(): Promise<boolean> {
  try {
    const { provider } = getProviderAndSigner();
    const network = await provider.getNetwork();
    
    // 检查是否为Monad测试网或本地开发环境
    const isTestnet = network.chainId === config.blockchain.chainId;
    const isTestUSDC = config.blockchain.usdcContractAddress === '0x3D2747e4D6F0Fe22cf3E6A336acca74bEed9abc5';
    
    return isTestnet && isTestUSDC;
  } catch (error) {
    console.error('检查网络环境失败:', error);
    return false;
  }
}

/**
 * 加入已有的投注
 */
export const joinExistingBet = async (data: JoinBetRequest): Promise<boolean> => {
  // 获取用户地址
  let userAddress = userAddressMap.get(data.telegramUserId);
  
  // 如果用户没有关联地址，则生成一个新地址
  if (!userAddress) {
    userAddress = `0x${Math.random().toString(16).substring(2, 42)}`;
    userAddressMap.set(data.telegramUserId, userAddress);
  }

  // 检查投注是否存在
  const bet = betsStore.get(data.betId);
  if (!bet || bet.status !== BetStatus.OPEN) {
    return false;
  }

  // 检查是否为测试环境
  const testMode = await isTestEnvironment();

  try {
    if (testMode) {
      console.log('测试环境检测到，使用模拟模式加入投注');
      // 在测试环境中，只模拟加入投注而不实际调用区块链
      // 更新内存中的投注总金额
      bet.totalAmount += data.amount;
      betsStore.set(data.betId, bet);
      console.log(`模拟加入投注成功: 用户 ${userAddress} 为选项 ${data.optionIndex} 投注 ${data.amount} USDC`);
      return true;
    } else {
      // 在正式环境中，调用真实的区块链交互
      console.log('使用真实区块链交互加入投注');
      await joinBet(data.betId, data.optionIndex, data.amount);
      
      // 更新内存中的投注总金额 (实际应用中应该从合约获取最新状态)
      bet.totalAmount += data.amount;
      betsStore.set(data.betId, bet);
      return true;
    }
  } catch (error) {
    console.error('加入投注失败:', error);
    throw error;
  }
};

/**
 * 解决投注
 */
export const resolveExistingBet = async (data: ResolveBetRequest): Promise<boolean> => {
  // 检查投注是否存在
  const bet = betsStore.get(data.betId);
  if (!bet || bet.status !== BetStatus.OPEN) {
    return false;
  }
  
  // 确保选项索引有效
  if (data.winnerOptionIndex < 0 || data.winnerOptionIndex >= bet.options.length) {
    return false;
  }

  // 检查是否为测试环境
  const testMode = await isTestEnvironment();
  
  try {
    if (testMode) {
      console.log('测试环境检测到，使用模拟模式解决投注');
      // 在测试环境中，只在内存中更新状态
      bet.status = BetStatus.RESOLVED;
      bet.winnerOptionIndex = data.winnerOptionIndex;
      betsStore.set(data.betId, bet);
      console.log(`模拟解决投注成功: 获胜选项 ${data.winnerOptionIndex}`);
      return true;
    } else {
      // 在区块链上解决投注
      await resolveBet(data.betId, data.winnerOptionIndex);
      
      // 更新内存中的投注状态
      bet.status = BetStatus.RESOLVED;
      bet.winnerOptionIndex = data.winnerOptionIndex;
      betsStore.set(data.betId, bet);
      return true;
    }
  } catch (error) {
    console.error('解决投注失败:', error);
    throw error;
  }
};

/**
 * 获取投注详情
 */
export const getBet = async (betId: string): Promise<Bet | null> => {
  // 优先从内存中获取
  let bet = betsStore.get(betId);
  
  if (!bet) {
    try {
      // 尝试从区块链获取详情
      const details = await getBetDetails(betId);
      
      // 构建投注对象 (创建者地址未知)
      bet = {
        id: betId,
        title: details.title,
        options: details.options,
        totalAmount: parseFloat(details.totalAmount),
        status: details.status === 'Open' ? BetStatus.OPEN : 
                details.status === 'Closed' ? BetStatus.CLOSED : BetStatus.RESOLVED,
        creator: 'unknown', // 区块链上无法直接获取创建者
        winnerOptionIndex: details.status === 'Resolved' ? details.winnerOptionIndex : undefined
      };
      
      // 存储到内存
      betsStore.set(betId, bet);
    } catch (error) {
      return null; // 找不到投注
    }
  }
  
  return bet;
};

/**
 * 领取投注奖金
 */
export const claimBetWinnings = async (betId: string, telegramUserId: number): Promise<boolean> => {
  // 检查投注是否存在且已解决
  const bet = betsStore.get(betId);
  if (!bet || bet.status !== BetStatus.RESOLVED) {
    return false;
  }
  
  // 获取用户地址
  const userAddress = userAddressMap.get(telegramUserId);
  if (!userAddress) {
    return false;
  }

  // 检查是否为测试环境
  const testMode = await isTestEnvironment();
  
  try {
    if (testMode) {
      console.log('测试环境检测到，使用模拟模式领取奖金');
      // 在测试环境中，只模拟领取奖金
      console.log(`模拟领取奖金成功: 用户 ${userAddress}`);
      return true;
    } else {
      // 在区块链上领取奖金
      await claimWinnings(betId);
      return true;
    }
  } catch (error) {
    console.error('领取奖金失败:', error);
    throw error;
  }
};
