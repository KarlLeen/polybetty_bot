import { ethers } from 'ethers';
import { config } from '../../shared/config';

// 导入编译后的ABI (编译合约后会自动生成)
// 如果导入失败，请先运行 npm run compile:contracts
let SidebetABI: any[];
let SidebetBytecode: string;

try {
  const compiledContract = require('../../blockchain/abis/Sidebet.json');
  SidebetABI = compiledContract.abi;
  SidebetBytecode = compiledContract.bytecode;
} catch (error) {
  console.warn('警告: 无法加载Sidebet合约ABI和字节码，请先运行 npm run compile:contracts');
  SidebetABI = [];
  SidebetBytecode = '';
}

// USDC合约ABI
const USDC_ABI: any[] = [
  // ERC20标准方法
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)'
];

/**
 * 获取区块链提供者和签名者
 */
export const getProviderAndSigner = () => {
  // 使用ethers v5的方式创建JsonRpcProvider
  const provider = new ethers.providers.JsonRpcProvider(config.blockchain.rpcUrl);
  const signer = new ethers.Wallet(config.blockchain.privateKey, provider);
  
  // 检测当前网络是否为Monad测试网
  provider.getNetwork().then((network) => {
    const networkName = network.chainId === 3404 ? 'Monad Testnet' : network.name || `Chain ID: ${network.chainId}`;
    console.log(`连接到网络: ${networkName}, 链ID: ${network.chainId}`);
    if (network.chainId !== config.blockchain.chainId) {
      console.warn(`警告: 配置的链ID(${config.blockchain.chainId})与提供者的链ID(${network.chainId})不匹配`);
    }
  }).catch((err) => {
    console.error('无法连接到区块链网络:', err instanceof Error ? err.message : String(err));
  });
  
  return { provider, signer };
};

/**
 * 部署Sidebet合约
 */
export const deploySidebetContract = async (
  title: string, 
  options: string[]
): Promise<string> => {
  const { signer } = getProviderAndSigner();
  
  // 检查是否有字节码和ABI
  if (!SidebetBytecode || SidebetBytecode === '' || SidebetABI.length === 0) {
    throw new Error('合约字节码或ABI未加载，请先运行 npm run compile:contracts');
  }
  
  const sidebetFactory = new ethers.ContractFactory(
    SidebetABI, 
    SidebetBytecode,
    signer
  );
  
  console.log('开始部署Sidebet合约到Monad测试网...');
  console.log(`标题: ${title}, 选项数量: ${options.length}`);
  console.log(`USDC地址: ${config.blockchain.usdcContractAddress}`);
  
  const contract = await sidebetFactory.deploy(
    title,
    options,
    config.blockchain.usdcContractAddress
  );
  
  // ethers v5中使用deployTransaction和deployed()
  console.log(`合约部署交易哈希: ${contract.deployTransaction.hash}`);
  console.log('等待合约部署确认...');
  
  await contract.deployed();
  
  console.log(`Sidebet合约已部署至: ${contract.address}`);
  return contract.address;
};

/**
 * 加入投注
 */
export const joinBet = async (
  betContractAddress: string,
  optionIndex: number,
  amount: number
): Promise<string> => {
  const { provider, signer } = getProviderAndSigner();
  
  // 获取网络ID以确定是否在测试网络上
  const network = await provider.getNetwork();
  const isTestnet = network.chainId === config.blockchain.chainId;
  
  const amountInUnits = ethers.utils.parseUnits(amount.toString(), 6); // USDC有6位小数
  
  // 如果是Monad测试网，跳过USDC授权步骤
  if (!isTestnet || config.blockchain.usdcContractAddress === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE') {
    console.log('测试环境：跳过USDC授权步骤');
  } else {
    // 在非测试环境中执行正常的USDC授权流程
    console.log(`批准USDC转账到合约: ${betContractAddress}`);
    console.log(`金额: ${amount} USDC`);
    
    try {
      // 先批准USDC转账
      const usdcContract = new ethers.Contract(
        config.blockchain.usdcContractAddress,
        USDC_ABI,
        signer
      );
      
      const approveTx = await usdcContract.approve(betContractAddress, amountInUnits);
      console.log(`批准交易哈希: ${approveTx.hash}`);
      
      console.log('等待批准交易确认...');
      await approveTx.wait();
      console.log('USDC批准成功');
    } catch (error) {
      console.error('USDC授权失败：', error instanceof Error ? error.message : String(error));
      console.log('继续尝试加入投注，但可能会失败...');
    }
  }
  
  // 加入投注
  const betContract = new ethers.Contract(
    betContractAddress,
    SidebetABI,
    signer
  );
  
  console.log(`加入投注, 选择选项: ${optionIndex}`);
  try {
    // 尝试直接加入投注，无需USDC批准
    const joinTx = await betContract.joinBet(
      optionIndex,
      amountInUnits,
      { gasLimit: 300000 } // 手动设置gasLimit以避免估算问题
    );
    
    console.log(`加入投注交易哈希: ${joinTx.hash}`);
    console.log('等待交易确认...');
    
    const receipt = await joinTx.wait();
    console.log('成功加入投注！');
    
    return receipt.transactionHash;
  } catch (error) {
    console.error('加入投注失败：', error instanceof Error ? error.message : String(error));
    throw new Error(`加入投注失败: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * 解决投注
 */
export const resolveBet = async (
  betContractAddress: string,
  winnerOptionIndex: number
): Promise<string> => {
  const { signer } = getProviderAndSigner();
  
  const betContract = new ethers.Contract(
    betContractAddress,
    SidebetABI,
    signer
  );
  
  console.log(`解决投注合约: ${betContractAddress}`);
  console.log(`设置获胜选项: ${winnerOptionIndex}`);
  
  const tx = await betContract.resolveBet(winnerOptionIndex);
  console.log(`解决投注交易哈希: ${tx.hash}`);
  console.log('等待交易确认...');
  
  const receipt = await tx.wait();
  console.log('投注已成功解决！');
  
  return receipt.transactionHash;
};

/**
 * 获取投注详情
 */
export const getBetDetails = async (betContractAddress: string) => {
  const { provider } = getProviderAndSigner();
  
  const betContract = new ethers.Contract(
    betContractAddress,
    SidebetABI,
    provider
  );
  
  console.log(`获取投注详情: ${betContractAddress}`);
  
  try {
    const details = await betContract.getBetDetails();
    
    console.log('获取投注详情成功');
    
    return {
      title: details._title,
      options: details._options,
      totalAmount: ethers.utils.formatUnits(details._totalAmount, 6),
      status: ['Open', 'Closed', 'Resolved'][details._status],
      winnerOptionIndex: details._winnerOptionIndex.toNumber(),
    };
  } catch (error) {
    console.error('获取投注详情失败:', error);
    throw new Error(`获取投注详情失败: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * 领取奖金
 */
export const claimWinnings = async (betContractAddress: string): Promise<string> => {
  const { signer } = getProviderAndSigner();
  
  const betContract = new ethers.Contract(
    betContractAddress,
    SidebetABI,
    signer
  );
  
  console.log(`从合约领取奖金: ${betContractAddress}`);
  
  const tx = await betContract.claimWinnings();
  console.log(`领取奖金交易哈希: ${tx.hash}`);
  console.log('等待交易确认...');
  
  const receipt = await tx.wait();
  console.log('成功领取奖金！');
  
  return receipt.transactionHash;
};
