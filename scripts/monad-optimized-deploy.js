// 针对Monad测试网优化的合约部署脚本
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function main() {
  console.log('🚀 开始部署合约到Monad测试网...');
  
  try {
    // 1. 加载环境变量
    const rpcUrl = process.env.RPC_URL || 'https://testnet-rpc.monad.xyz';
    const privateKey = process.env.PRIVATE_KEY;
    
    if (!privateKey) {
      throw new Error('请在.env文件中设置PRIVATE_KEY');
    }
    
    // 2. 连接到Monad测试网
    console.log(`连接到RPC: ${rpcUrl}`);
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    console.log(`钱包地址: ${wallet.address}`);
    
    // 3. 检查账户余额
    const balance = await provider.getBalance(wallet.address);
    console.log(`账户余额: ${ethers.utils.formatEther(balance)} ETH`);
    
    if (balance.eq(0)) {
      throw new Error('账户余额为0，无法支付gas费');
    }
    
    // 4. 加载合约ABI和字节码
    const contractPath = path.resolve(__dirname, '../src/blockchain/abis/Sidebet.json');
    const contractData = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
    
    // 5. 准备合约参数
    const title = "测试投注";
    const options = ["选项A", "选项B"];
    const usdcAddress = "0x0000000000000000000000000000000000000000"; // 零地址作为测试
    
    console.log('\n合约部署参数:');
    console.log(`- 标题: ${title}`);
    console.log(`- 选项: ${options.join(', ')}`);
    console.log(`- USDC地址: ${usdcAddress}`);
    
    // 6. 获取当前网络的燃料价格信息
    console.log('\n获取当前网络燃料价格...');
    const feeData = await provider.getFeeData();
    console.log(`- 基本燃料价格: ${ethers.utils.formatUnits(feeData.gasPrice, 'gwei')} gwei`);
    
    // Monad测试网需要较高的gas价格，我们将其设置为当前gasPrice的1.5倍
    const gasPrice = feeData.gasPrice.mul(15).div(10); 
    console.log(`- 使用的燃料价格: ${ethers.utils.formatUnits(gasPrice, 'gwei')} gwei (当前值的1.5倍)`);
    
    // 7. 创建合约工厂
    const factory = new ethers.ContractFactory(
      contractData.abi,
      contractData.bytecode,
      wallet
    );
    
    // 8. 部署合约
    console.log('\n准备部署交易...');
    const deployTx = await factory.getDeployTransaction(title, options, usdcAddress);
    
    // 9. 估算Gas使用量
    console.log('估算燃料限制...');
    let gasLimit;
    try {
      const estimatedGas = await provider.estimateGas(deployTx);
      // 增加30%的余量
      gasLimit = estimatedGas.mul(13).div(10); 
      console.log(`- 估算燃料: ${estimatedGas.toString()}`);
      console.log(`- 使用燃料限制: ${gasLimit.toString()} (增加30%余量)`);
    } catch (error) {
      console.warn('估算燃料失败，使用默认值');
      gasLimit = 3000000; // 默认值
      console.log(`- 使用默认燃料限制: ${gasLimit}`);
    }
    
    // 10. 发送交易
    console.log('\n发送部署交易...');
    const tx = {
      ...deployTx,
      gasLimit,
      gasPrice,
      nonce: await wallet.getTransactionCount()
    };
    
    const signedTx = await wallet.sendTransaction(tx);
    console.log(`交易已发送! 哈希: ${signedTx.hash}`);
    console.log('等待交易确认... (可能需要几分钟)');
    
    // 11. 等待交易确认
    const receipt = await signedTx.wait(2); // 等待2个确认
    
    // 12. 处理结果
    if (receipt.status === 1) {
      const contractAddress = receipt.contractAddress;
      console.log(`\n✅ 合约部署成功!`);
      console.log(`合约地址: ${contractAddress}`);
      
      // 13. 保存部署信息
      const deploymentInfo = {
        contractAddress,
        deploymentTime: new Date().toISOString(),
        network: 'Monad Testnet',
        blockNumber: receipt.blockNumber,
        transactionHash: receipt.transactionHash,
        title,
        options
      };
      
      fs.writeFileSync(
        path.resolve(__dirname, '../contract-deployment.json'),
        JSON.stringify(deploymentInfo, null, 2)
      );
      
      console.log('\n部署信息已保存到: contract-deployment.json');
      
      return {
        success: true,
        contractAddress
      };
    } else {
      throw new Error('部署交易被确认，但状态显示失败');
    }
  } catch (error) {
    console.error('\n❌ 部署失败:');
    console.error(error.message || error);
    
    if (error.reason) console.error(`原因: ${error.reason}`);
    if (error.code) console.error(`代码: ${error.code}`);
    
    return {
      success: false,
      error: error.message || '未知错误'
    };
  }
}

main()
  .then((result) => {
    if (result.success) {
      console.log(`\n📝 部署完成! 请记住您的合约地址: ${result.contractAddress}`);
      
      console.log(`\n接下来的步骤:`);
      console.log(`1. 将此地址更新到您的应用配置中`);
      console.log(`2. 重启您的Telegram机器人服务`);
      
      process.exit(0);
    } else {
      console.error(`\n❌ 部署未成功: ${result.error}`);
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error('未捕获的错误:', err);
    process.exit(1);
  });
