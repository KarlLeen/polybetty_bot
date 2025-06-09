// Monad测试网智能合约部署脚本 - 最终强化版
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function main() {
  console.log('🚀 开始部署Sidebet合约到Monad测试网...\n');
  
  try {
    // 1. 加载环境变量
    const rpcUrl = process.env.RPC_URL || 'https://testnet-rpc.monad.xyz';
    const privateKey = process.env.PRIVATE_KEY;
    const chainId = parseInt(process.env.CHAIN_ID || '10143');
    
    if (!privateKey) {
      console.error('错误: 缺少私钥。请在.env文件中添加PRIVATE_KEY');
      process.exit(1);
    }
    
    // 2. 连接到Monad测试网
    console.log(`连接到RPC: ${rpcUrl}`);
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    console.log(`钱包地址: ${wallet.address}`);
    
    // 3. 获取钱包余额
    const balance = await provider.getBalance(wallet.address);
    console.log(`账户余额: ${ethers.utils.formatEther(balance)} ETH`);
    
    if (balance.eq(0)) {
      console.error('错误: 账户余额为零，无法支付gas费用');
      console.log('请确保您的Monad测试网账户里有足够的测试ETH');
      process.exit(1);
    }
    
    // 4. 加载合约数据
    console.log('\n加载合约数据...');
    const contractPath = path.resolve(__dirname, '../src/blockchain/abis/Sidebet.json');
    
    if (!fs.existsSync(contractPath)) {
      console.error(`错误: 找不到合约ABI文件: ${contractPath}`);
      process.exit(1);
    }
    
    const contractJSON = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
    console.log('合约数据加载成功');
    
    // 5. 设置合约参数
    const title = "Monad测试投注";
    const options = ["是", "否"];
    const usdcAddress = "0x0000000000000000000000000000000000000000"; // 零地址作为测试
    
    console.log('\n部署参数:');
    console.log(`- 标题: ${title}`);
    console.log(`- 选项: ${options.join(', ')}`);
    console.log(`- USDC地址: ${usdcAddress}`);
    
    // 6. 准备部署合约
    console.log('\n准备部署交易...');
    const factory = new ethers.ContractFactory(
      contractJSON.abi,
      contractJSON.bytecode,
      wallet
    );
    
    // 7. 获取汽油费参数
    console.log('获取当前网络汽油费...');
    const gasPrice = ethers.utils.parseUnits('100', 'gwei');  // 直接设置较高的gas价格
    const gasLimit = 10000000; // 设置足够高的gas限制
    
    console.log(`- 使用Gas价格: 100 gwei`);
    console.log(`- 使用Gas限制: ${gasLimit}`);
    
    // 8. 发送部署交易
    console.log('\n开始部署合约...');
    
    // 创建合约实例
    const contract = await factory.deploy(
      title,
      options,
      usdcAddress,
      { 
        gasLimit: gasLimit,
        gasPrice: gasPrice
      }
    );
    
    console.log(`交易发送成功! 交易哈希: ${contract.deployTransaction.hash}`);
    console.log('正在等待交易确认...');
    
    // 9. 等待交易确认
    const receipt = await contract.deployed();
    
    // 10. 保存部署信息
    const deploymentInfo = {
      network: 'Monad测试网',
      contractAddress: contract.address,
      deploymentTime: new Date().toISOString(),
      transactionHash: contract.deployTransaction.hash,
      blockNumber: contract.deployTransaction.blockNumber,
      title: title,
      options: options,
      usdcAddress: usdcAddress
    };
    
    const infoPath = path.resolve(__dirname, '../contract-info.json');
    fs.writeFileSync(infoPath, JSON.stringify(deploymentInfo, null, 2));
    
    console.log(`\n✅ 部署成功!`);
    console.log(`合约地址: ${contract.address}`);
    console.log(`部署信息已保存到: contract-info.json`);
    
    return {
      success: true,
      contractAddress: contract.address
    };
  } catch (error) {
    console.error('\n❌ 部署失败:');
    console.error(error.message || '未知错误');
    
    // 安全地获取并显示错误详情
    try {
      if (error.transaction) {
        console.log('\n交易详情:');
        console.log(`- 哈希: ${error.transaction.hash || '未知'}`);
        
        if (error.transaction.gasPrice) {
          console.log(`- Gas价格: ${ethers.utils.formatUnits(error.transaction.gasPrice, 'gwei')} gwei`);
        }
        
        if (error.transaction.gasLimit) {
          console.log(`- Gas限制: ${error.transaction.gasLimit.toString()}`);
        }
      }
    } catch (logError) {
      console.log('获取错误详情时出错:', logError.message);
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}

// 执行部署
main()
  .then(result => {
    if (result.success) {
      console.log(`\n📋 后续步骤：`);
      console.log(`1. 在您的应用配置中使用以下合约地址: ${result.contractAddress}`);
      console.log(`2. 更新Telegram机器人和后端API配置`);
      console.log(`3. 在Monad测试网上测试您的投注流程`);
      
      process.exit(0);
    } else {
      console.log(`\n请解决上述错误后重试，或联系开发支持。`);
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('发生未捕获的错误:', err);
    process.exit(1);
  });
