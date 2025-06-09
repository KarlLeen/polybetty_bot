// 极简智能合约部署测试
const { ethers } = require('ethers');
require('dotenv').config();

// 获取环境变量
const rpcUrl = process.env.RPC_URL || 'https://testnet-rpc.monad.xyz';
const privateKey = process.env.PRIVATE_KEY;

// 验证私钥
if (!privateKey) {
  console.error('请在.env文件中设置PRIVATE_KEY');
  process.exit(1);
}

// 极简测试合约 - 只有一个存储值和getter/setter
const simpleContractBytecode = '608060405234801561001057600080fd5b50610150806100206000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c80632e64cec11461003b5780636057361d14610059575b600080fd5b610043610075565b60405161005091906100a1565b60405180910390f35b610073600480360381019061006e91906100ed565b61007e565b005b60008054905090565b8060008190555050565b6000819050919050565b61009b81610088565b82525050565b60006020820190506100b66000830184610092565b92915050565b600080fd5b6100ca81610088565b81146100d557600080fd5b50565b6000813590506100e7816100c1565b92915050565b600060208284031215610103576101026100bc565b5b6000610111848285016100d8565b9150509291505056fea264697066735822122044f0132d3ce474328ad23136f583f0c9fc94c39f45acc16df2606d25de9a933064736f6c63430008130033';
const simpleContractAbi = [
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
  console.log('===== 简单合约部署测试 =====');
  
  try {
    // 连接到Monad测试网
    console.log(`连接到RPC: ${rpcUrl}`);
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    
    // 创建钱包
    const wallet = new ethers.Wallet(privateKey, provider);
    console.log(`钱包地址: ${wallet.address}`);
    
    // 检查余额
    const balance = await provider.getBalance(wallet.address);
    console.log(`账户余额: ${ethers.utils.formatEther(balance)} ETH`);
    
    if (balance.eq(0)) {
      console.error('错误: 账户余额为0，无法支付gas费');
      console.log('请确保您的Monad测试网账户有足够的测试ETH');
      process.exit(1);
    }
    
    // 创建合约工厂
    const factory = new ethers.ContractFactory(
      simpleContractAbi,
      simpleContractBytecode,
      wallet
    );
    
    // 部署合约
    console.log('\n开始部署简单存储合约...');
    const deployTx = await factory.getDeployTransaction();
    
    // 设置gas参数
    const gasLimit = 1000000; // 足够的gas限制
    const gasPrice = ethers.utils.parseUnits('3', 'gwei');
    
    console.log(`Gas限制: ${gasLimit}`);
    console.log(`Gas价格: ${gasPrice.toString()} gwei`);
    
    // 发送交易
    const tx = await wallet.sendTransaction({
      ...deployTx,
      gasLimit,
      gasPrice
    });
    
    console.log(`\n交易已发送，哈希: ${tx.hash}`);
    console.log('等待交易确认...');
    
    // 等待交易确认
    const receipt = await tx.wait();
    
    // 检查交易状态
    if (receipt.status === 1) {
      console.log(`\n✅ 合约部署成功!`);
      console.log(`合约地址: ${receipt.contractAddress}`);
      
      // 实例化合约以进行测试
      const contract = new ethers.Contract(
        receipt.contractAddress,
        simpleContractAbi,
        wallet
      );
      
      // 测试合约调用
      console.log('\n测试合约调用:');
      console.log('- 存储值为: 42');
      await (await contract.store(42)).wait();
      
      const value = await contract.retrieve();
      console.log(`- 读取值: ${value.toString()}`);
      
      console.log('\n测试完成！如果您看到这条消息，说明您已成功连接到Monad测试网络并且可以部署合约');
      console.log('现在可以尝试部署Sidebet合约了');
      
      return receipt.contractAddress;
    } else {
      console.error('\n❌ 合约部署失败!');
      console.error('交易虽然被确认，但状态为失败');
      return null;
    }
  } catch (error) {
    console.error('\n❌ 错误:');
    console.error(error.message || error);
    
    if (error.reason) console.error('原因:', error.reason);
    if (error.code) console.error('代码:', error.code);
    
    if (error.message && error.message.includes('insufficient funds')) {
      console.log('\n可能的原因: 账户余额不足以支付gas费');
      console.log('解决方案: 请获取一些Monad测试网ETH');
    }
    
    return null;
  }
}

main()
  .then(address => {
    console.log(address ? `\n部署地址: ${address}` : '\n部署未成功');
    process.exit(address ? 0 : 1);
  })
  .catch(err => {
    console.error('未捕获的错误:', err);
    process.exit(1);
  });
