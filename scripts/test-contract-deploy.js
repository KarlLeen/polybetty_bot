const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// 测试合约部署和基本交互
async function testContractDeploy() {
  console.log('🔍 开始测试合约部署流程...');
  
  try {
    // 1. 检查配置
    const rpcUrl = process.env.RPC_URL;
    const privateKey = process.env.PRIVATE_KEY;
    
    if (!rpcUrl || !privateKey) {
      throw new Error('请确保在.env文件中设置了RPC_URL和PRIVATE_KEY');
    }
    
    console.log(`使用RPC: ${rpcUrl}`);
    console.log('加载ABI和字节码...');
    
    // 2. 加载合约ABI和字节码
    let sidebetArtifact;
    try {
      const abiPath = path.resolve(__dirname, '../src/blockchain/abis/Sidebet.json');
      sidebetArtifact = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
    } catch (error) {
      console.error('无法加载合约ABI和字节码:', error);
      console.log('请先运行 npm run compile:contracts 编译合约');
      return;
    }
    
    // 3. 设置以太坊连接
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    const signer = wallet.connect(provider);
    
    console.log(`钱包地址: ${wallet.address}`);
    
    // 4. 获取网络信息
    const network = await provider.getNetwork();
    console.log(`连接到网络: ${network.name} (chain ID: ${network.chainId})`);
    
    // 5. 部署合约
    console.log('\n🚀 部署Sidebet合约...');
    const title = "测试投注";
    const options = ["选项A", "选项B", "选项C"];
    
    // 使用测试USDC地址(Monad测试网没有官方USDC，使用零地址)
    const usdcAddress = "0x0000000000000000000000000000000000000000";
    
    const sidebetFactory = new ethers.ContractFactory(
      sidebetArtifact.abi, 
      sidebetArtifact.bytecode, 
      signer
    );
    
    console.log('正在部署合约...');
    console.log(`- 标题: ${title}`);
    console.log(`- 选项: ${options.join(', ')}`);
    console.log(`- USDC地址: ${usdcAddress}`);
    
    const contract = await sidebetFactory.deploy(title, options, usdcAddress);
    
    console.log('等待交易确认...');
    await contract.deployed();
    
    console.log(`✅ 合约部署成功! 地址: ${contract.address}`);
    
    // 6. 与合约交互 - 读取状态
    console.log('\n📖 读取合约状态...');
    
    const contractTitle = await contract.title();
    console.log(`标题: ${contractTitle}`);
    
    const contractOptions = await contract.getOptions();
    console.log('选项:');
    contractOptions.forEach((opt, i) => {
      console.log(`  ${i}: ${opt}`);
    });
    
    const totalAmount = await contract.totalAmount();
    console.log(`总金额: ${ethers.utils.formatEther(totalAmount)} ETH`);
    
    const state = await contract.state();
    const states = ['Open', 'Closed', 'Resolved'];
    console.log(`状态: ${states[state]}`);
    
    // 7. 测试加入投注(仅模拟，不执行实际交易)
    console.log('\n🧪 模拟加入投注(不执行交易)...');
    
    // 获取加入投注所需的gas估算
    const optionIndex = 0;
    const amount = ethers.utils.parseEther('0.01'); // 0.01 ETH
    
    try {
      const gasEstimate = await contract.estimateGas.joinBet(optionIndex, { value: amount });
      console.log(`加入投注需要的gas: ${gasEstimate.toString()}`);
      console.log('模拟加入投注成功! (未执行实际交易)');
    } catch (error) {
      console.log('模拟加入投注失败:', error.message);
    }
    
    console.log('\n🎉 合约部署和测试完成!');
    
    return {
      success: true,
      contractAddress: contract.address
    };
  } catch (error) {
    console.error('❌ 合约部署测试失败:');
    console.error(error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 执行测试
testContractDeploy()
  .then((result) => {
    if (result.success) {
      console.log(`\n✨ 测试完成! 合约地址: ${result.contractAddress}`);
    } else {
      console.log(`\n❌ 测试失败: ${result.error}`);
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('测试过程中出现未处理的错误:', error);
    process.exit(1);
  });
