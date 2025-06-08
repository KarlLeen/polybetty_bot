const { ethers } = require('ethers');
require('dotenv').config();

async function testConnection() {
  try {
    console.log('🔍 正在测试与Monad测试网的连接...');
    
    // 从环境变量获取RPC URL
    const rpcUrl = process.env.RPC_URL || 'https://rpc.monad-testnet.network';
    const chainId = parseInt(process.env.CHAIN_ID || '3404');
    
    console.log(`使用RPC: ${rpcUrl}`);
    console.log(`期望的链ID: ${chainId}`);
    
    // 创建提供者
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    
    // 获取网络信息
    const network = await provider.getNetwork();
    console.log(`✅ 已连接到网络:`);
    console.log(`  - 名称: ${network.name}`);
    console.log(`  - 链ID: ${network.chainId}`);
    
    if (network.chainId !== chainId) {
      console.warn(`⚠️ 警告: 链ID不匹配! 配置为 ${chainId}，实际为 ${network.chainId}`);
    } else {
      console.log('✅ 链ID匹配，连接正确');
    }
    
    // 获取最新区块
    const blockNumber = await provider.getBlockNumber();
    console.log(`📦 当前区块高度: ${blockNumber}`);
    
    // 获取燃气价格
    const gasPrice = await provider.getGasPrice();
    console.log(`⛽ 当前燃气价格: ${ethers.utils.formatUnits(gasPrice, 'gwei')} gwei`);
    
    // 获取测试账户余额
    if (process.env.PRIVATE_KEY) {
      const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
      const balance = await provider.getBalance(wallet.address);
      console.log(`💰 测试账户地址: ${wallet.address}`);
      console.log(`💰 账户余额: ${ethers.utils.formatEther(balance)} ETH`);
    }
    
    console.log('✅ Monad测试网连接测试成功!');
    
  } catch (error) {
    console.error('❌ 连接测试失败!');
    console.error(error);
  }
}

testConnection();
