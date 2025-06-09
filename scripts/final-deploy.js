// 最终优化版 - Monad测试网智能合约部署脚本
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function deployContract() {
  console.log('🔍 Monad测试网合约部署 - 最终优化版');
  
  try {
    // 1. 环境准备
    const rpcUrl = process.env.RPC_URL || 'https://testnet-rpc.monad.xyz';
    const privateKey = process.env.PRIVATE_KEY;
    const chainId = parseInt(process.env.CHAIN_ID || '10143');
    
    if (!privateKey) {
      throw new Error('请在.env文件中设置PRIVATE_KEY');
    }
    
    // 2. 连接到网络
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    console.log(`钱包地址: ${wallet.address}`);
    
    // 3. 余额检查
    const balance = await provider.getBalance(wallet.address);
    console.log(`余额: ${ethers.utils.formatEther(balance)} ETH`);
    
    // 4. 加载合约ABI
    const abiPath = path.resolve(__dirname, '../src/blockchain/abis/Sidebet.json');
    const contractJSON = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
    
    // 5. 简化合约参数 - 使用最简单的测试参数
    const title = "测试投注";
    const options = ["是", "否"];
    // 使用零地址作为USDC地址，避免集成问题
    const usdcAddress = "0x0000000000000000000000000000000000000000";
    
    console.log(`\n部署参数:`);
    console.log(`- 标题: ${title}`);
    console.log(`- 选项: ${options.join(', ')}`);
    console.log(`- USDC地址: ${usdcAddress}`);
    
    // 6. 设置Monad测试网优化的交易参数
    const feeData = await provider.getFeeData();
    
    // 通过网络状态动态调整燃料价格，使用较高的值确保交易被打包
    const baseGasPrice = feeData.gasPrice;
    const gasPrice = baseGasPrice.mul(2); // 使用2倍的燃料价格
    
    console.log(`\n燃料价格设置:`);
    console.log(`- 基础价格: ${ethers.utils.formatUnits(baseGasPrice, 'gwei')} gwei`);
    console.log(`- 使用价格: ${ethers.utils.formatUnits(gasPrice, 'gwei')} gwei (基础价格的2倍)`);
    
    // 7. 准备合约
    console.log('\n准备合约部署...');
    const factory = new ethers.ContractFactory(
      contractJSON.abi, 
      contractJSON.bytecode, 
      wallet
    );
    
    // 8. 手动设置高额固定燃料限制，避免估算问题
    const gasLimit = 3000000;
    console.log(`- 燃料限制: ${gasLimit}`);
    
    // 9. 发送部署交易
    console.log(`\n发送部署交易...`);
    const deploymentTx = await factory.deploy(
      title,
      options,
      usdcAddress,
      {
        gasPrice,
        gasLimit
      }
    );
    
    console.log(`交易哈希: ${deploymentTx.deployTransaction.hash}`);
    console.log('等待交易确认...');
    
    // 10. 等待确认
    const receipt = await deploymentTx.deployTransaction.wait(2);
    const contractAddress = receipt.contractAddress;
    
    console.log(`\n✅ 部署成功! `);
    console.log(`合约地址: ${contractAddress}`);
    
    // 11. 保存信息
    const deploymentInfo = {
      network: 'Monad Testnet',
      contractAddress,
      deploymentTime: new Date().toISOString(),
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      title,
      options
    };
    
    const outputPath = path.resolve(__dirname, '../deployment.json');
    fs.writeFileSync(outputPath, JSON.stringify(deploymentInfo, null, 2));
    console.log(`\n部署信息已保存到: ${outputPath}`);
    
    return contractAddress;
  } catch (error) {
    console.error('\n❌ 部署出错:');
    console.error(error.message);
    
    if (error.transaction) {
      console.log('\n交易详情:');
      console.log(`- 哈希: ${error.transaction.hash}`);
      console.log(`- Gas价格: ${ethers.utils.formatUnits(error.transaction.gasPrice, 'gwei')} gwei`);
      console.log(`- Gas限制: ${error.transaction.gasLimit.toString()}`);
    }
    
    if (error.receipt) {
      console.log('\n交易回执:');
      console.log(`- 状态: ${error.receipt.status}`);
      console.log(`- 区块号: ${error.receipt.blockNumber}`);
      console.log(`- Gas使用: ${error.receipt.gasUsed.toString()}`);
    }
    
    return null;
  }
}

// 执行部署
deployContract()
  .then(address => {
    if (address) {
      console.log(`\n📝 请在您的应用中更新使用以下合约地址:\n${address}\n`);
      process.exit(0);
    } else {
      console.log('\n请检查错误信息，修复问题后重试。');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('未捕获的错误:', err);
    process.exit(1);
  });
