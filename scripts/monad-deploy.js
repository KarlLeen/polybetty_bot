// 针对Monad测试网的极简合约部署
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Monad测试网配置
const RPC_URL = process.env.RPC_URL || 'https://testnet-rpc.monad.xyz';
const CHAIN_ID = process.env.CHAIN_ID || 10143;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// 确保私钥可用
if (!PRIVATE_KEY) {
  console.error('❌ 错误: 请在.env文件中设置PRIVATE_KEY');
  process.exit(1);
}

// 读取合约ABI
const abiPath = path.join(__dirname, '../src/blockchain/abis/Sidebet.json');
const contractData = JSON.parse(fs.readFileSync(abiPath, 'utf8'));

// 连接提供者和钱包
console.log(`连接到 Monad 测试网: ${RPC_URL}`);
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
console.log(`钱包地址: ${wallet.address}`);

async function deployContract() {
  try {
    // 合约参数 - 保持简单明了
    const title = "测试投注";
    const options = ["是", "否"];
    const usdcAddress = "0x0000000000000000000000000000000000000000"; // 零地址作为测试

    // 创建合约工厂
    const factory = new ethers.ContractFactory(
      contractData.abi,
      contractData.bytecode,
      wallet
    );
    
    // 显示部署信息
    console.log('准备部署合约:');
    console.log(`- 标题: ${title}`);
    console.log(`- 选项: ${options.join(', ')}`);
    
    // 部署合约，使用明确的Gas配置
    console.log('\n发送部署交易...');
    const deployTx = await factory.getDeployTransaction(title, options, usdcAddress);
    
    // 手动估算和设置Gas
    const estimatedGas = await provider.estimateGas(deployTx);
    console.log(`估算Gas: ${estimatedGas.toString()}`);
    
    // 增加20%的Gas余量
    const gasLimit = estimatedGas.mul(120).div(100);
    console.log(`设置Gas限制: ${gasLimit.toString()}`);
    
    // 准备交易选项
    const txOptions = {
      gasLimit,
      gasPrice: ethers.utils.parseUnits('3', 'gwei')
    };
    
    // 发送部署交易
    const tx = await wallet.sendTransaction({
      ...deployTx,
      ...txOptions
    });
    
    console.log(`交易已发送，哈希: ${tx.hash}`);
    console.log('等待交易确认...');
    
    // 等待交易确认
    const receipt = await tx.wait();
    
    // 提取合约地址
    const contractAddress = receipt.contractAddress;
    console.log(`\n✅ 合约部署成功!`);
    console.log(`合约地址: ${contractAddress}`);
    
    // 保存信息到文件
    const deploymentInfo = {
      contractAddress,
      deploymentDate: new Date().toISOString(),
      network: 'Monad Testnet',
      title,
      options
    };
    
    fs.writeFileSync(
      path.join(__dirname, '../contract-info.json'),
      JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log('\n部署信息已保存到 contract-info.json');
    return contractAddress;
  } catch (error) {
    console.error('\n❌ 部署失败:');
    console.error(error);
    
    // 输出更详细的错误信息
    if (error.reason) console.error('错误原因:', error.reason);
    if (error.code) console.error('错误代码:', error.code);
    if (error.error && error.error.message) console.error('详细信息:', error.error.message);
    
    return null;
  }
}

// 执行部署
deployContract()
  .then(address => {
    if (address) {
      console.log('\n📝 请在应用程序中使用此合约地址:');
      console.log(`合约地址: ${address}`);
      process.exit(0);
    } else {
      console.error('部署失败，没有返回合约地址');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('未捕获的错误:', err);
    process.exit(1);
  });
