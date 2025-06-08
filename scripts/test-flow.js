const axios = require('axios');
const { ethers } = require('ethers');
require('dotenv').config();

// API 基础URL
const API_BASE_URL = `http://${process.env.API_HOST || 'localhost'}:${process.env.API_PORT || 3000}`;

// 模拟Telegram用户ID
const TELEGRAM_USER_ID = 123456789;

/**
 * 端到端测试流程
 * 测试全流程：创建投注 -> 获取投注详情 -> 加入投注 -> 解决投注 -> 领取奖金
 */
async function testEndToEndFlow() {
  console.log('🚀 开始端到端测试流程...');
  console.log(`API服务地址: ${API_BASE_URL}`);
  
  try {
    // 步骤1：创建投注
    console.log('\n📝 步骤1: 创建投注...');
    const createResponse = await axios.post(`${API_BASE_URL}/bets`, {
      title: "Monad测试网价格会涨吗?",
      options: ["会", "不会"],
      telegramUserId: TELEGRAM_USER_ID
    });
    
    if (!createResponse.data.success) {
      throw new Error(`创建投注失败: ${createResponse.data.error}`);
    }
    
    const bet = createResponse.data.bet;
    console.log('✅ 投注创建成功!');
    console.log(`标题: ${bet.title}`);
    console.log(`选项: ${bet.options.join(', ')}`);
    console.log(`合约地址: ${bet.id}`);
    console.log(`创建者地址: ${bet.creator}`);
    
    // 暂停一下，等待区块确认
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 步骤2：获取投注详情
    console.log('\n📊 步骤2: 获取投注详情...');
    const getResponse = await axios.get(`${API_BASE_URL}/bets/${bet.id}`);
    
    if (!getResponse.data.success) {
      throw new Error(`获取投注详情失败: ${getResponse.data.error}`);
    }
    
    const betDetails = getResponse.data.bet;
    console.log('✅ 获取投注详情成功!');
    console.log(`状态: ${betDetails.status}`);
    console.log(`总金额: ${betDetails.totalAmount} USDC`);
    
    // 步骤3：加入投注
    console.log('\n🤝 步骤3: 加入投注...');
    const joinResponse = await axios.post(`${API_BASE_URL}/bets/join`, {
      betId: bet.id,
      optionIndex: 0, // 选择"会"
      amount: 10,     // 投注10 USDC
      telegramUserId: TELEGRAM_USER_ID + 1 // 模拟另一个用户
    });
    
    if (!joinResponse.data.success) {
      throw new Error(`加入投注失败: ${joinResponse.data.error}`);
    }
    
    console.log('✅ 加入投注成功!');
    
    // 暂停一下，等待区块确认
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 步骤4：再次获取投注详情，查看更新后的状态
    console.log('\n📊 步骤4: 再次获取投注详情...');
    const updatedGetResponse = await axios.get(`${API_BASE_URL}/bets/${bet.id}`);
    
    if (!updatedGetResponse.data.success) {
      throw new Error(`获取更新后的投注详情失败: ${updatedGetResponse.data.error}`);
    }
    
    const updatedBetDetails = updatedGetResponse.data.bet;
    console.log('✅ 获取更新后的投注详情成功!');
    console.log(`状态: ${updatedBetDetails.status}`);
    console.log(`总金额: ${updatedBetDetails.totalAmount} USDC`);
    
    // 步骤5：解决投注
    console.log('\n🏆 步骤5: 解决投注...');
    const resolveResponse = await axios.post(`${API_BASE_URL}/bets/resolve`, {
      betId: bet.id,
      winnerOptionIndex: 0, // "会"获胜
      telegramUserId: TELEGRAM_USER_ID // 原始创建者
    });
    
    if (!resolveResponse.data.success) {
      throw new Error(`解决投注失败: ${resolveResponse.data.error}`);
    }
    
    console.log('✅ 投注解决成功!');
    
    // 暂停一下，等待区块确认
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 步骤6：获取已解决的投注详情
    console.log('\n📊 步骤6: 获取已解决的投注详情...');
    const resolvedGetResponse = await axios.get(`${API_BASE_URL}/bets/${bet.id}`);
    
    if (!resolvedGetResponse.data.success) {
      throw new Error(`获取已解决的投注详情失败: ${resolvedGetResponse.data.error}`);
    }
    
    const resolvedBetDetails = resolvedGetResponse.data.bet;
    console.log('✅ 获取已解决的投注详情成功!');
    console.log(`状态: ${resolvedBetDetails.status}`);
    console.log(`获胜选项索引: ${resolvedBetDetails.winnerOptionIndex}`);
    console.log(`获胜选项: ${resolvedBetDetails.options[resolvedBetDetails.winnerOptionIndex]}`);
    
    // 步骤7：领取奖金
    console.log('\n💰 步骤7: 领取奖金...');
    const claimResponse = await axios.post(`${API_BASE_URL}/bets/claim`, {
      betId: bet.id,
      telegramUserId: TELEGRAM_USER_ID + 1 // 参与者领取奖金
    });
    
    if (!claimResponse.data.success) {
      throw new Error(`领取奖金失败: ${claimResponse.data.error}`);
    }
    
    console.log('✅ 奖金领取成功!');
    
    console.log('\n🎉 端到端测试流程完成!\n');
    
  } catch (error) {
    console.error('❌ 测试过程中出现错误:');
    console.error(error.response?.data || error.message || error);
  }
}

// 运行测试
testEndToEndFlow();
