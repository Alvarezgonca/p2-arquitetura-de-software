import { Pool } from 'pg';
import { env } from '../config/env';

let pool: Pool | null = null;

/**
 * Pool de conexões PostgreSQL (singleton). Tempos-limite curtos fazem as
 * consultas falharem rápido se o banco cair, em vez de travar o serviço.
 */
export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: env.databaseUrl,
      max: 5,
      connectionTimeoutMillis: 3000,
      idleTimeoutMillis: 10000,
      query_timeout: 5000,
      statement_timeout: 5000,
    });

    pool.on('error', (err) => {
      console.error('[orders-service] erro no pool do Postgres:', err.message);
    });
  }
  return pool;
}
