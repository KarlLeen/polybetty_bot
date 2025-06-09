const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// 简化的合约部署脚本
async function deployContract() {
  console.log('🔍 开始部署智能合约...');
  
  try {
    // 1. 检查配置
    const rpcUrl = process.env.RPC_URL;
    const privateKey = process.env.PRIVATE_KEY;
    const chainId = parseInt(process.env.CHAIN_ID || '0');
    
    if (!rpcUrl || !privateKey) {
      throw new Error('请确保在.env文件中设置了RPC_URL和PRIVATE_KEY');
    }
    
    console.log(`使用RPC: ${rpcUrl}`);
    console.log(`链ID: ${chainId}`);
    
    // 2. 加载合约ABI和字节码
    let sidebetArtifact;
    try {
      const abiPath = path.resolve(__dirname, '../src/blockchain/abis/Sidebet.json');
      console.log(`从路径加载ABI: ${abiPath}`);
      sidebetArtifact = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
    } catch (error) {
      console.error('无法加载合约ABI和字节码:', error);
      console.log('请先运行 npm run compile:contracts 编译合约');
      return;
    }
    
    // 3. 设置以太坊连接
    console.log('初始化区块链连接...');
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
    const options = ["选项A", "选项B"];
    
    // 使用测试USDC地址
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
    
    // 添加Gas限制
    const gasLimit = 3000000; // 提供足够的gas
    console.log(`设置gas限制: ${gasLimit}`);
    
    const contract = await sidebetFactory.deploy(
      title, 
      options, 
      usdcAddress,
      { gasLimit }
    );
    
    console.log(`合约部署交易哈希: ${contract.deployTransaction.hash}`);
    console.log('等待交易确认...');
    await contract.deployed();
    
    console.log(`✅ 合约部署成功! 地址: ${contract.address}`);
    
    // 保存合约地址到文件
    const deploymentInfo = {
      contractAddress: contract.address,
      deploymentTimestamp: new Date().toISOString(),
      title,
      options,
      deployer: wallet.address
    };
    
    fs.writeFileSync(
      path.resolve(__dirname, '../deployment-info.json'), 
      JSON.stringify(deploymentInfo, null, 2)
    );
    console.log('部署信息已保存到 deployment-info.json');
    
    return {
      success: true,
      contractAddress: contract.address
    };
  } catch (error) {
    console.error('❌ 合约部署失败:');
    console.error(error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 执行部署
deployContract()
  .then((result) => {
    if (result && result.success) {
      console.log(`\n✨ 部署完成! 合约地址: ${result.contractAddress}`);
      process.exit(0);
    } else {
      console.log(`\n❌ 部署失败: ${result ? result.error : '未知错误'}`);
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('部署过程中出现未处理的错误:', error);
    process.exit(1);
  });
