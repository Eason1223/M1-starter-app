import dotenv from 'dotenv';
import express from 'express';

import { connectDB } from './database';
import { errorHandler, notFoundHandler } from './errorHandler.middleware';
import router from './routes';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(express.json());

app.use('/api', router);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('*', notFoundHandler);
app.use(errorHandler);

connectDB();

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  process.on('SIGINT', () => {
    console.log('\n  Received SIGINT (Ctrl+C). Shutting down gracefully...');

    server.close(err => {
      if (err) {
        console.error('❌ Error during server shutdown:', err);
        process.exit(1);
      }

      console.log('✅ Server closed successfully');
      process.exit(0);
    });
  });
});
