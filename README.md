# Telegram 社交投机机器人

这是一个基于区块链的Telegram投注机器人MVP项目。用户可以通过Telegram创建投注、参与投注，并在链上结算结果。

## 功能

- `/start` - 欢迎用户，提供基本介绍
- `/createbet` - 创建新的投注
- `/joinbet` - 加入现有投注
- `/resolvebet` - 解决投注（仅限创建者）
- `/betinfo` - 查询投注信息

## 技术栈

- Telegram Bot: grammY (TypeScript)
- 后端服务: Fastify (Node.js/TypeScript)
- 智能合约: Solidity
- 区块链交互: ethers.js

## 项目结构

```
bet/
├── src/
│   ├── bot/          # Telegram 机器人模块
│   ├── api/          # Fastify 后端服务
│   ├── blockchain/   # 区块链相关代码
│   └── shared/       # 共享模块
└── test/            # 测试目录
```

## 安装与运行

1. 安装依赖
```
npm install
```

2. 配置环境变量
```
cp .env.example .env
# 编辑 .env 文件填写必要配置
```

3. 编译智能合约
```
npm run compile:contracts
```

4. 开发模式运行
```
# 启动 API 后端
npm run dev:api

# 启动 Telegram 机器人
npm run dev:bot
```

5. 生产模式运行
```
npm run build
npm run start:api
npm run start:bot
```
