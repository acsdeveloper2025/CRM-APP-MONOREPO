import { Pool, PoolClient, QueryResult } from 'pg';
import { logger } from './logger';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

// Enterprise-scale database pool configuration for 500+ concurrent users
const getPoolConfig = () => {
  const totalUsers = parseInt(process.env.TOTAL_CONCURRENT_USERS || '1000');

  // Scale connection pool based on concurrent users
  // Rule: 1 connection per 10 concurrent users, min 20, max 200
  const maxConnections = Math.min(Math.max(Math.floor(totalUsers / 10), 20), 200);

  return {
    connectionString,
    // Enterprise connection pool settings
    max: maxConnections, // Maximum number of connections
    min: Math.floor(maxConnections / 4), // Minimum number of connections (25% of max)
    idleTimeoutMillis: 30000, // 30 seconds idle timeout
    connectionTimeoutMillis: 5000, // 5 seconds connection timeout
    acquireTimeoutMillis: 10000, // 10 seconds acquire timeout
    // Enterprise performance settings
    statement_timeout: 30000, // 30 seconds statement timeout
    query_timeout: 30000, // 30 seconds query timeout
    application_name: 'CRM-Enterprise-Backend',
  };
};

export const pool = new Pool(getPoolConfig());

// Log pool configuration for monitoring
logger.info('Database pool configured for enterprise scale', {
  maxConnections: pool.options.max,
  minConnections: pool.options.min,
  totalConcurrentUsers: process.env.TOTAL_CONCURRENT_USERS || '1000',
});

export const query = async <T = any>(text: string, params: any[] = []): Promise<QueryResult<T>> => {
  return pool.query<T>(text, params);
};

export const withTransaction = async <T>(fn: (client: PoolClient) => Promise<T>): Promise<T> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const connectDatabase = async (): Promise<void> => {
  try {
    await pool.query('SELECT 1');
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error('Database connection failed:', error as any);
    process.exit(1);
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await pool.end();
    logger.info('Database disconnected successfully');
  } catch (error) {
    logger.error('Database disconnection failed:', error as any);
  }
};

