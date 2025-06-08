const fs = require('fs');
const path = require('path');
const solc = require('solc');

// 路径设置
const contractsDir = path.resolve(__dirname, '../src/blockchain/contracts');
const outputDir = path.resolve(__dirname, '../src/blockchain/abis');

// 确保输出目录存在
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 读取Solidity合约文件
const readContract = (contractName) => {
  const contractPath = path.resolve(contractsDir, `${contractName}.sol`);
  return fs.readFileSync(contractPath, 'utf8');
};

// 创建导入回调以支持OpenZeppelin合约导入
function findImports(importPath) {
  // 处理OpenZeppelin导入
  if (importPath.startsWith('@openzeppelin/')) {
    try {
      const fullPath = path.resolve(__dirname, '../node_modules', importPath);
      return {
        contents: fs.readFileSync(fullPath, 'utf8')
      };
    } catch (error) {
      return {
        error: `Error reading ${importPath}: ${error.message}`
      };
    }
  }
  
  // 处理本地文件导入
  try {
    // 首先检查相对于contracts目录的导入
    const localPath = path.resolve(contractsDir, importPath);
    if (fs.existsSync(localPath)) {
      return {
        contents: fs.readFileSync(localPath, 'utf8')
      };
    } 
    
    // 其他位置的导入
    const fullPath = path.resolve(__dirname, '..', importPath);
    return {
      contents: fs.readFileSync(fullPath, 'utf8')
    };
  } catch (error) {
    return {
      error: `Could not find ${importPath}: ${error.message}`
    };
  }
}

// 编译合约
const compileContract = (contractName) => {
  console.log(`🔧 编译合约: ${contractName}.sol...`);
  
  const contractCode = readContract(contractName);
  
  // solc编译输入格式
  const input = {
    language: 'Solidity',
    sources: {
      [`${contractName}.sol`]: {
        content: contractCode
      }
    },
    settings: {
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode']
        }
      },
      // Monad testnet兼容设置
      evmVersion: "london",
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  };
  
  // 编译
  console.log('🔍 开始编译...');
  console.log('导入依赖: @openzeppelin/contracts');
  const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));
  
  // 处理编译错误
  if (output.errors) {
    const hasError = output.errors.some(error => error.severity === 'error');
    
    output.errors.forEach(error => {
      if (error.severity === 'error') {
        console.error(`❌ 错误: ${error.message}`);
      } else {
        console.warn(`⚠️ 警告: ${error.message}`);
      }
    });
    
    if (hasError) {
      console.error('❌ 编译失败，存在错误，请修复后重试。');
      process.exit(1);
    }
  }
  
  // 提取编译结果
  const contractOutput = output.contracts[`${contractName}.sol`][contractName];
  
  const compiledContract = {
    abi: contractOutput.abi,
    bytecode: contractOutput.evm.bytecode.object
  };
  
  // 保存编译结果
  const outputPath = path.resolve(outputDir, `${contractName}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(compiledContract, null, 2));
  
  console.log(`✅ 合约 ${contractName} 编译完成，输出到: ${outputPath}`);
  
  return compiledContract;
};

// 主函数
const main = () => {
  console.log('🚀 开始编译智能合约...');
  
  try {
    // 编译Sidebet合约
    compileContract('Sidebet');
    
    console.log('🎉 所有合约编译完成');
  } catch (error) {
    console.error(`❌ 编译过程中出错: ${error.message}`);
    process.exit(1);
  }
};

// 执行主函数
main();
