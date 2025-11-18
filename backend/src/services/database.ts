import { Pool, PoolConfig } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const poolConfig: PoolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'ai_education',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

class DatabaseService {
  private pool: Pool;

  constructor() {
    this.pool = new Pool(poolConfig);

    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  getPool(): Pool {
    return this.pool;
  }

  async query(text: string, params?: any[]) {
    const start = Date.now();
    try {
      const res = await this.pool.query(text, params);
      const duration = Date.now() - start;
      console.log('Executed query', { text, duration, rows: res.rowCount });
      return res;
    } catch (error) {
      console.error('Database query error', { text, error });
      throw error;
    }
  }

  async getClient() {
    return await this.pool.connect();
  }

  async end() {
    await this.pool.end();
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.query('SELECT 1');
      return true;
    } catch (error) {
      console.error('Database health check failed', error);
      return false;
    }
  }
}

export default new DatabaseService();
