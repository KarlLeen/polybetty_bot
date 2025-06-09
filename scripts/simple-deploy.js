const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function main() {
  console.log('🚀 开始部署简化版智能合约...');
  
  try {
    // 检查环境变量
    const rpcUrl = process.env.RPC_URL || 'https://testnet-rpc.monad.xyz';
    const privateKey = process.env.PRIVATE_KEY;
    
    if (!privateKey) {
      console.error('❌ 未找到私钥。请确保在.env文件中设置了PRIVATE_KEY。');
      process.exit(1);
    }
    
    console.log(`连接到RPC: ${rpcUrl}`);
    
    // 加载合约ABI和字节码
    const abiPath = path.resolve(__dirname, '../src/blockchain/abis/Sidebet.json');
    const contractJSON = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
    
    // 连接到区块链
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    console.log(`使用钱包地址: ${wallet.address}`);
    
    const balance = await provider.getBalance(wallet.address);
    console.log(`钱包余额: ${ethers.utils.formatEther(balance)} ETH`);
    
    // 准备部署参数
    const title = "测试投注";
    const options = ["选项A", "选项B"];
    // 在测试网上使用零地址作为USDC地址
    const usdcAddress = "0x0000000000000000000000000000000000000000";
    
    console.log('部署参数:');
    console.log('- 标题:', title);
    console.log('- 选项:', options);
    console.log('- USDC地址:', usdcAddress);
    
    // 创建合约工厂
    const factory = new ethers.ContractFactory(
      contractJSON.abi,
      contractJSON.bytecode,
      wallet
    );
    
    // 部署合约，使用足够的gas限制
    console.log('开始部署合约，这可能需要一些时间...');
    const contract = await factory.deploy(
      title,
      options,
      usdcAddress,
      {
        gasLimit: 5000000,
        gasPrice: ethers.utils.parseUnits('3', 'gwei')
      }
    );
    
    console.log(`合约部署交易哈希: ${contract.deployTransaction.hash}`);
    console.log('等待交易确认...');
    
    await contract.deployed();
    
    console.log(`\n✅ 合约部署成功!`);
    console.log(`合约地址: ${contract.address}`);
    
    // 保存部署信息到文件
    const deployInfo = {
      contractAddress: contract.address,
      deploymentTime: new Date().toISOString(),
      network: 'Monad Testnet',
      title,
      options
    };
    
    fs.writeFileSync(
      path.resolve(__dirname, '../deployment-info.json'),
      JSON.stringify(deployInfo, null, 2)
    );
    
    console.log('\n部署信息已保存到 deployment-info.json');
    console.log('请将此合约地址添加到您的应用程序配置中。');
    
    return contract.address;
  } catch (error) {
    console.error('❌ 部署失败:', error);
    if (error.reason) {
      console.error('错误原因:', error.reason);
    }
    if (error.code) {
      console.error('错误代码:', error.code);
    }
    if (error.transaction) {
      console.error('交易信息:', error.transaction);
    }
    process.exit(1);
  }
}

main()
  .then((address) => {
    console.log(`\n📝 请记住您的合约地址: ${address}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('未处理的错误:', error);
    process.exit(1);
  });
