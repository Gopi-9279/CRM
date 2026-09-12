import app from './app';
import { env } from './config';
import { logger } from './lib/logger';

const startServer = () => {
  try {
    app.listen(env.PORT, () => {
      logger.info(`Server listening on port ${env.PORT}`);
    });
  } catch (error) {
    logger.error(error, 'Failed to start server');
    process.exit(1);
  }
};

startServer();
