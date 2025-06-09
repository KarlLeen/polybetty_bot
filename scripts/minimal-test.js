// 最简版测试合约部署脚本
const { ethers } = require('ethers');
require('dotenv').config();

// 极简存储合约的字节码和ABI（仅包含set/get功能）
const STORAGE_BYTECODE = '608060405234801561001057600080fd5b50610150806100206000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c80632e64cec11461003b5780636057361d14610059575b600080fd5b610043610075565b60405161005091906100a1565b60405180910390f35b610073600480360381019061006e91906100ed565b61007e565b005b60008054905090565b8060008190555050565b6000819050919050565b61009b81610088565b82525050565b60006020820190506100b66000830184610092565b92915050565b600080fd5b6100ca81610088565b81146100d557600080fd5b50565b6000813590506100e7816100c1565b92915050565b600060208284031215610103576101026100bc565b5b6000610111848285016100d8565b9150509291505056fea264697066735822122044f0132d3ce474328ad23136f583f0c9fc94c39f45acc16df2606d25de9a933064736f6c63430008130033';
const STORAGE_ABI = [
  {
    "inputs": [],
    "name": "retrieve",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "num", "type": "uint256"}],
    "name": "store",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

async function main() {
  try {
    console.log('🧪 Monad测试网最小化测试');
    
    // 连接到Monad测试网
    const rpcUrl = process.env.RPC_URL || 'https://testnet-rpc.monad.xyz';
    const privateKey = process.env.PRIVATE_KEY;
    
    if (!privateKey) {
      console.error('错误: 缺少私钥。请在.env文件中添加PRIVATE_KEY');
      process.exit(1);
    }
    
    console.log(`连接到RPC: ${rpcUrl}`);
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    console.log(`钱包地址: ${wallet.address}`);
    
    // 检查网络连接
    const network = await provider.getNetwork();
    console.log(`连接到网络: ${network.name} (chainId: ${network.chainId})`);
    
    // 检查账户余额
    const balance = await provider.getBalance(wallet.address);
    console.log(`账户余额: ${ethers.utils.formatEther(balance)} ETH`);
    
    if (balance.eq(0)) {
      console.error('错误: 账户余额为零，无法支付gas费用');
      process.exit(1);
    }
    
    // 准备合约工厂
    const factory = new ethers.ContractFactory(
      STORAGE_ABI,
      STORAGE_BYTECODE,
      wallet
    );
    
    // 使用高固定gas费用来确保交易被处理
    const gasOptions = {
      gasLimit: 1000000,
      maxFeePerGas: ethers.utils.parseUnits('100', 'gwei'),
      maxPriorityFeePerGas: ethers.utils.parseUnits('2', 'gwei'),
    };
    
    console.log('\n部署简单存储合约...');
    console.log(`Gas限制: ${gasOptions.gasLimit}`);
    console.log(`最大Gas费用: ${ethers.utils.formatUnits(gasOptions.maxFeePerGas, 'gwei')} gwei`);
    
    // 部署合约
    console.log('\n发送交易...');
    const contract = await factory.deploy(gasOptions);
    console.log(`交易哈希: ${contract.deployTransaction.hash}`);
    
    console.log('等待确认...');
    await contract.deployed();
    
    console.log(`\n✅ 成功部署简单存储合约!`);
    console.log(`合约地址: ${contract.address}`);
    
    // 测试合约功能
    console.log('\n测试合约功能:');
    console.log('存储值: 42');
    const tx = await contract.store(42, { gasLimit: 100000 });
    await tx.wait();
    
    const value = await contract.retrieve();
    console.log(`读取值: ${value.toString()}`);
    
    console.log('\n测试成功! Monad测试网连接和部署正常工作。');
    return true;
  } catch (error) {
    console.error('\n❌ 测试失败:');
    console.error(error.message);
    
    // 提供更详细的错误信息
    if (error.code === 'INSUFFICIENT_FUNDS') {
      console.log('\n问题: 账户余额不足');
      console.log('解决方案: 获取更多测试网ETH');
    } else if (error.code === 'NETWORK_ERROR') {
      console.log('\n问题: 网络连接问题');
      console.log('解决方案: 检查RPC URL是否正确，以及网络是否可达');
    } else if (error.reason) {
      console.log(`\n问题原因: ${error.reason}`);
    }
    
    return false;
  }
}

main()
  .then(success => {
    if (success) {
      console.log('\n既然测试合约可以成功部署，您应该可以尝试部署Sidebet合约了。');
      console.log('问题可能出在Sidebet合约本身或其构造函数参数上。');
      process.exit(0);
    } else {
      console.log('\n请解决上述问题后再尝试部署合约。');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('未捕获错误:', err);
    process.exit(1);
  });
