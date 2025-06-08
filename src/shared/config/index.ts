import dotenv from 'dotenv';
dotenv.config();

export const config = {
  // Telegram Bot配置
  bot: {
    token: process.env.TELEGRAM_BOT_TOKEN || '',
  },
  // API服务配置
  api: {
    port: parseInt(process.env.API_PORT || '3000', 10),
    host: process.env.API_HOST || 'localhost',
  },
  // 区块链配置
  blockchain: {
    rpcUrl: process.env.RPC_URL || 'https://testnet-rpc.monad.xyz',
    chainId: process.env.CHAIN_ID ? parseInt(process.env.CHAIN_ID) : 10143,
    privateKey: process.env.PRIVATE_KEY || '', // 用于签名交易的私钥
    usdcContractAddress: process.env.USDC_CONTRACT_ADDRESS || '', // USDC合约地址
  },
  // 开发环境配置
  isDevelopment: process.env.NODE_ENV !== 'production',
};
