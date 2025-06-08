import Fastify from 'fastify';
import { config } from '../shared/config';
import routes from './routes';

const startServer = async () => {
  const fastify = Fastify({
    logger: config.isDevelopment,
  });

  // 注册CORS处理
  fastify.register(require('@fastify/cors'), {
    origin: '*', // 允许所有域，在生产环境中应该限制
  });

  // 注册路由
  await fastify.register(routes);

  try {
    await fastify.listen({
      port: config.api.port,
      host: config.api.host,
    });
    console.log(`Server is running on ${config.api.host}:${config.api.port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// 启动服务器
startServer();
