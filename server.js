import * as dotenv from 'dotenv';
import Fastify from 'fastify';
import closeWithGrace from 'close-with-grace';

import { app } from './lib/fastify/app.js';

dotenv.config();

const fastify = Fastify({
  logger: true
});

fastify.register(app);

const closeListeners = closeWithGrace({
  delay: process.env.FASTIFY_CLOSE_GRACE_DELAY ? parseInt(process.env.FASTIFY_CLOSE_GRACE_DELAY) : 500
}, async ({ signal, err, manual }) => {
  if (err) {
    fastify.log.error(err);
  }
  if (signal) {
    fastify.log.info(`Caught [signal=${signal}] - Exiting...`);
  }
  await fastify.close();
});

fastify.addHook('onClose', async (instance) => {
  closeListeners.uninstall();
});

const startServer = async () => {
  try {
    await fastify.listen({
      host: '::',
      port: process.env.PORT || 3000
    });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

startServer();