// 简单的用户服务，管理用户与钱包地址的关联
// 在真实应用中，应该使用数据库存储这些信息

// 存储Telegram用户ID和区块链地址的映射
const userAddressMap: Map<number, string> = new Map();

/**
 * 为Telegram用户关联一个区块链地址
 * MVP阶段，我们可以使用一个简化的方法，为每个用户关联一个唯一地址
 */
export const associateUserWithAddress = (telegramUserId: number, address: string): boolean => {
  userAddressMap.set(telegramUserId, address);
  return true;
};

/**
 * 获取用户的区块链地址
 */
export const getUserAddress = (telegramUserId: number): string | undefined => {
  return userAddressMap.get(telegramUserId);
};

/**
 * 检查用户是否已经有关联的地址
 */
export const hasUserAddress = (telegramUserId: number): boolean => {
  return userAddressMap.has(telegramUserId);
};

/**
 * 在MVP阶段，我们可以为每个新用户生成一个伪随机地址
 * 在实际应用中，用户应该关联自己的钱包地址
 */
export const generateAddressForUser = (telegramUserId: number): string => {
  // 生成一个伪随机的以太坊地址（仅用于MVP示范）
  const address = `0x${Math.random().toString(16).substring(2, 42)}`;
  associateUserWithAddress(telegramUserId, address);
  return address;
};

/**
 * 获取用户地址，如果不存在则生成一个新的
 */
export const getOrCreateUserAddress = (telegramUserId: number): string => {
  let address = getUserAddress(telegramUserId);
  if (!address) {
    address = generateAddressForUser(telegramUserId);
  }
  return address;
};
