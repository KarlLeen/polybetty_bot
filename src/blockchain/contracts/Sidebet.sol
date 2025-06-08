// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Sidebet
 * @dev 一个简单的投注合约，使用USDC作为支付货币
 */
contract Sidebet is Ownable {
    // 投注状态
    enum Status { Open, Closed, Resolved }

    // 合约状态变量
    string public title;
    string[] public options;
    uint public totalAmount;
    Status public status;
    address public usdcAddress;
    uint public winnerOptionIndex;
    bool public winningsClaimed;

    // 用户投注记录
    struct Participation {
        uint optionIndex;
        uint amount;
        bool hasClaimed;
    }
    
    // 用户地址 => 投注记录
    mapping(address => Participation) public participations;
    // 选项索引 => 该选项的总投注金额
    mapping(uint => uint) public optionTotals;
    // 参与了指定选项的用户地址列表
    mapping(uint => address[]) public optionParticipants;

    // 事件
    event BetCreated(string title, string[] options);
    event BetJoined(address user, uint optionIndex, uint amount);
    event BetResolved(uint winnerOptionIndex);
    event WinningsClaimed(address user, uint amount);

    /**
     * @dev 构造函数 - 创建一个新的投注
     * @param _title 投注标题
     * @param _options 投注选项数组
     * @param _usdcAddress USDC合约地址
     */
    constructor(
        string memory _title,
        string[] memory _options,
        address _usdcAddress
    ) {
        require(_options.length >= 2, "At least 2 options required");
        require(_usdcAddress != address(0), "Invalid USDC address");

        title = _title;
        options = _options;
        status = Status.Open;
        usdcAddress = _usdcAddress;
        
        emit BetCreated(_title, _options);
    }

    /**
     * @dev 允许用户加入投注
     * @param _optionIndex 选择的选项索引
     * @param _amount 投注金额 (USDC)
     */
    function joinBet(uint _optionIndex, uint _amount) external {
        require(status == Status.Open, "Bet is not open");
        require(_optionIndex < options.length, "Invalid option index");
        require(_amount > 0, "Amount must be greater than 0");
        require(participations[msg.sender].amount == 0, "Already participated");
        
        IERC20 usdc = IERC20(usdcAddress);
        
        // 转移USDC到合约
        require(usdc.transferFrom(msg.sender, address(this), _amount), "USDC transfer failed");
        
        // 记录参与信息
        participations[msg.sender] = Participation({
            optionIndex: _optionIndex,
            amount: _amount,
            hasClaimed: false
        });
        
        // 更新相关统计
        totalAmount += _amount;
        optionTotals[_optionIndex] += _amount;
        optionParticipants[_optionIndex].push(msg.sender);
        
        emit BetJoined(msg.sender, _optionIndex, _amount);
    }
    
    /**
     * @dev 解决投注，确定获胜选项 (仅限合约所有者)
     * @param _winnerOptionIndex 获胜选项的索引
     */
    function resolveBet(uint _winnerOptionIndex) external onlyOwner {
        require(status == Status.Open, "Bet is not open");
        require(_winnerOptionIndex < options.length, "Invalid option index");
        
        status = Status.Resolved;
        winnerOptionIndex = _winnerOptionIndex;
        
        emit BetResolved(_winnerOptionIndex);
    }
    
    /**
     * @dev 允许获胜者认领奖金
     */
    function claimWinnings() external {
        require(status == Status.Resolved, "Bet is not resolved yet");
        require(!participations[msg.sender].hasClaimed, "Already claimed");
        
        Participation storage participation = participations[msg.sender];
        require(participation.amount > 0, "No participation found");
        require(participation.optionIndex == winnerOptionIndex, "Not a winner");
        
        participation.hasClaimed = true;
        
        // 计算获胜者应得的金额
        uint winningAmount = 0;
        if (optionTotals[winnerOptionIndex] > 0) {
            winningAmount = (participation.amount * totalAmount) / optionTotals[winnerOptionIndex];
        }
        
        IERC20 usdc = IERC20(usdcAddress);
        require(usdc.transfer(msg.sender, winningAmount), "USDC transfer failed");
        
        emit WinningsClaimed(msg.sender, winningAmount);
    }
    
    /**
     * @dev 获取投注的详细信息
     */
    function getBetDetails() external view returns (
        string memory _title,
        string[] memory _options,
        uint _totalAmount,
        Status _status,
        uint _winnerOptionIndex
    ) {
        return (title, options, totalAmount, status, winnerOptionIndex);
    }
    
    /**
     * @dev 获取用户参与信息
     */
    function getUserParticipation(address _user) external view returns (
        uint _optionIndex,
        uint _amount,
        bool _hasClaimed
    ) {
        Participation memory participation = participations[_user];
        return (participation.optionIndex, participation.amount, participation.hasClaimed);
    }
    
    /**
     * @dev 获取某个选项的总参与金额
     */
    function getOptionTotal(uint _optionIndex) external view returns (uint) {
        require(_optionIndex < options.length, "Invalid option index");
        return optionTotals[_optionIndex];
    }
}
