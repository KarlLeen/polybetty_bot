// Sidebet合约部署脚本 - 基于成功测试的配置
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function main() {
  console.log('🚀 开始部署Sidebet合约到Monad测试网...');
  
  try {
    // 1. 连接到Monad测试网
    const rpcUrl = process.env.RPC_URL || 'https://testnet-rpc.monad.xyz';
    const privateKey = process.env.PRIVATE_KEY;
    
    if (!privateKey) {
      throw new Error('请在.env文件中设置PRIVATE_KEY');
    }
    
    console.log(`连接到RPC: ${rpcUrl}`);
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    console.log(`钱包地址: ${wallet.address}`);
    
    // 2. 检查账户余额
    const balance = await provider.getBalance(wallet.address);
    console.log(`账户余额: ${ethers.utils.formatEther(balance)} ETH`);
    
    // 3. 加载合约ABI和字节码
    const contractPath = path.resolve(__dirname, '../src/blockchain/abis/Sidebet.json');
    const contractData = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
    
    // 4. 准备合约参数
    // 使用极简的参数避免潜在问题
    const title = "Monad测试投注";
    const options = ["选项A", "选项B"];
    // 使用零地址作为USDC合约地址
    const usdcAddress = "0x0000000000000000000000000000000000000000";
    
    console.log('\n合约参数:');
    console.log(`- 标题: ${title}`);
    console.log(`- 选项: ${options.join(', ')}`);
    console.log(`- USDC地址: ${usdcAddress}`);
    
    // 5. 创建合约工厂
    const factory = new ethers.ContractFactory(
      contractData.abi,
      contractData.bytecode,
      wallet
    );
    
    // 6. 设置与测试合约相同的gas配置
    const gasOptions = {
      gasLimit: 2000000, // 增加gas限制以适应更复杂的合约
      maxFeePerGas: ethers.utils.parseUnits('100', 'gwei'),
      maxPriorityFeePerGas: ethers.utils.parseUnits('2', 'gwei'),
    };
    
    console.log('\n部署配置:');
    console.log(`- Gas限制: ${gasOptions.gasLimit}`);
    console.log(`- 最大Gas费用: ${ethers.utils.formatUnits(gasOptions.maxFeePerGas, 'gwei')} gwei`);
    
    // 7. 部署合约
    console.log('\n开始部署合约...');
    const contract = await factory.deploy(
      title, 
      options, 
      usdcAddress,
      gasOptions
    );
    
    console.log(`交易发送成功! 哈希: ${contract.deployTransaction.hash}`);
    console.log('等待交易确认... (这可能需要一些时间)');
    
    // 8. 等待合约部署完成
    await contract.deployed();
    
    // 9. 保存部署信息
    const deploymentInfo = {
      network: 'Monad测试网',
      contractAddress: contract.address,
      deploymentTime: new Date().toISOString(),
      transactionHash: contract.deployTransaction.hash,
      title,
      options,
      usdcAddress
    };
    
    const infoPath = path.resolve(__dirname, '../contract-info.json');
    fs.writeFileSync(infoPath, JSON.stringify(deploymentInfo, null, 2));
    
    console.log(`\n✅ 合约部署成功!`);
    console.log(`合约地址: ${contract.address}`);
    console.log(`部署信息已保存到: contract-info.json`);
    
    return contract.address;
  } catch (error) {
    console.error('\n❌ 部署失败:');
    console.error(error.message);
    
    if (error.transaction) {
      console.log('\n交易详情:');
      console.log(`- 哈希: ${error.transaction.hash}`);
    }
    
    if (error.receipt) {
      console.log('\n交易回执:');
      console.log(`- 状态: ${error.receipt.status}`);
      console.log(`- Gas使用: ${error.receipt.gasUsed.toString()}`);
    }
    
    return null;
  }
}

main()
  .then(address => {
    if (address) {
      console.log(`\n📝 部署完成! 请在您的应用中使用以下合约地址:`);
      console.log(address);
      
      console.log(`\n后续步骤:`);
      console.log(`1. 更新机器人和后端配置使用新合约地址`);
      console.log(`2. 在Monad测试网上测试投注功能`);
      process.exit(0);
    } else {
      console.log('\n请分析上述错误并修复问题后重试。');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('未捕获的错误:', err);
    process.exit(1);
  });
