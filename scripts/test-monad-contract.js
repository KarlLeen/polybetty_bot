// Monad测试网上已部署合约测试脚本
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// 合约地址（已部署到Monad测试网）
const CONTRACT_ADDRESS = '0x3f9205A61a09a04F71b23f7Ca79234c3BF6F9a43';

async function main() {
  console.log('🚀 开始测试Monad测试网上的Sidebet合约...');
  
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
    
    // 3. 加载合约ABI
    const contractPath = path.resolve(__dirname, '../src/blockchain/abis/Sidebet.json');
    const contractData = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
    
    // 4. 连接到已部署的合约
    const sidebetContract = new ethers.Contract(
      CONTRACT_ADDRESS,
      contractData.abi,
      wallet
    );
    
    console.log('\n🔍 获取投注详情...');
    const betDetails = await sidebetContract.getBetDetails();
    console.log('投注详情:');
    console.log(`- 标题: ${betDetails._title}`);
    console.log(`- 选项: ${betDetails._options.join(', ')}`);
    console.log(`- 总金额: ${betDetails._totalAmount.toString()}`);
    console.log(`- 状态: ${['进行中', '已关闭', '已解决'][betDetails._status]}`);
    
    // 如果投注已解决
    if (betDetails._status == 2) {
      console.log(`- 获胜选项索引: ${betDetails._winnerOptionIndex}`);
      console.log(`- 获胜选项: ${betDetails._options[betDetails._winnerOptionIndex]}`);
    }
    
    // 5. 测试加入投注功能 (如果投注尚未解决)
    if (betDetails._status == 0) {
      console.log('\n💰 测试加入投注...');
      
      // 检查USDC余额和授权
      const usdcAddress = await sidebetContract.usdcAddress();
      console.log(`USDC合约地址: ${usdcAddress}`);
      
      // 由于这是测试网，我们假设USDC地址是我们自己的钱包地址
      // 在生产环境中，需要实际的USDC代币逻辑
      if (usdcAddress === wallet.address) {
        console.log('注意: 当前使用的USDC地址是钱包地址，这仅用于测试。无法测试真实的USDC转账。');
        console.log('跳过加入投注测试...');
      } else {
        // 在实际场景中，需要下面的代码来与USDC交互
        const usdcContract = new ethers.Contract(
          usdcAddress,
          [
            'function approve(address spender, uint256 amount) returns (bool)',
            'function balanceOf(address owner) view returns (uint256)'
          ],
          wallet
        );
        
        const usdcBalance = await usdcContract.balanceOf(wallet.address);
        console.log(`USDC余额: ${usdcBalance.toString()}`);
        
        // 授权USDC给合约
        console.log('授权USDC给投注合约...');
        const amount = ethers.utils.parseUnits('10', 18); // 假设USDC有18位小数
        const approveTx = await usdcContract.approve(CONTRACT_ADDRESS, amount);
        console.log(`授权交易发送成功，哈希: ${approveTx.hash}`);
        console.log('等待授权确认...');
        await approveTx.wait();
        console.log('✅ 授权成功!');
        
        // 加入投注
        console.log('加入投注...');
        const joinBetTx = await sidebetContract.joinBet(0, amount); // 选择第一个选项
        console.log(`加入投注交易发送成功，哈希: ${joinBetTx.hash}`);
        console.log('等待交易确认...');
        await joinBetTx.wait();
        console.log('✅ 加入投注成功!');
      }
    }
    
    // 6. 测试解决投注功能 (如果投注尚未解决且用户是合约所有者)
    const owner = await sidebetContract.owner();
    console.log(`\n合约所有者: ${owner}`);
    
    if (betDetails._status == 0 && owner.toLowerCase() === wallet.address.toLowerCase()) {
      console.log('\n🏆 测试解决投注...');
      console.log('将选项0设置为获胜者...');
      
      const resolveTx = await sidebetContract.resolveBet(0);
      console.log(`解决投注交易发送成功，哈希: ${resolveTx.hash}`);
      console.log('等待交易确认...');
      await resolveTx.wait();
      console.log('✅ 投注解决成功!');
      
      // 获取更新后的状态
      const updatedDetails = await sidebetContract.getBetDetails();
      console.log('\n更新后的投注状态:');
      console.log(`- 状态: ${['进行中', '已关闭', '已解决'][updatedDetails._status]}`);
      console.log(`- 获胜选项索引: ${updatedDetails._winnerOptionIndex}`);
      console.log(`- 获胜选项: ${updatedDetails._options[updatedDetails._winnerOptionIndex]}`);
    } else if (betDetails._status != 0) {
      console.log('\n投注已经解决或关闭，无法执行解决操作');
    } else {
      console.log('\n当前钱包不是合约所有者，无法解决投注');
    }
    
    // 7. 获取用户参与信息
    console.log('\n🧑‍💻 获取用户参与信息...');
    const participation = await sidebetContract.getUserParticipation(wallet.address);
    console.log('用户参与信息:');
    console.log(`- 选择的选项索引: ${participation._optionIndex}`);
    console.log(`- 投注金额: ${participation._amount.toString()}`);
    console.log(`- 是否已领取奖金: ${participation._hasClaimed ? '是' : '否'}`);
    
    console.log('\n✅ 测试完成!');
    
  } catch (error) {
    console.error('\n❌ 测试失败:');
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
  }
}

// 执行主函数
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('未捕获错误:', error);
    process.exit(1);
  });
