import mongoose from 'mongoose';
import { logger } from './logger';
import type { EnvConfig } from './env.schema';

let isConnected = false;

export async function initializeMongoDB(config: EnvConfig): Promise<void> {
  try {
    if (config.DATABASE_TYPE !== 'mongodb') {
      logger.info('MongoDB skipped - using PostgreSQL');
      return;
    }

    if (isConnected) {
      logger.info('MongoDB already connected');
      return;
    }

    logger.info('Connecting to MongoDB...');

    const mongoOptions = {
      maxPoolSize: 50,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferMaxEntries: 0,
      bufferCommands: false,
    };

    await mongoose.connect(config.DATABASE_URL, mongoOptions);

    // Set up MongoDB event listeners
    mongoose.connection.on('connected', () => {
      logger.info('MongoDB connected successfully');
    });

    mongoose.connection.on('error', (error) => {
      logger.error({ error }, 'MongoDB connection error');
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    // Graceful shutdown handling
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed through app termination');
      process.exit(0);
    });

    isConnected = true;
    logger.info('✓ MongoDB initialization completed');
  } catch (error) {
    logger.error({ error }, 'Failed to initialize MongoDB');
    throw error;
  }
}

export async function closeMongoDB(): Promise<void> {
  try {
    if (!isConnected) {
      return;
    }

    await mongoose.connection.close();
    isConnected = false;
    logger.info('MongoDB connection closed');
  } catch (error) {
    logger.error({ error }, 'Error closing MongoDB connection');
    throw error;
  }
}

export function getMongoConnection() {
  return mongoose.connection;
}

export function isMongoConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}
