import { Pool } from 'pg';
import { env } from '../config/env';

let pool: Pool | null = null;

/**
 * Pool de conexões PostgreSQL (singleton, criado sob demanda).
 *
 * Os tempos-limite garantem que, se o banco cair, as consultas falhem
 * rápido em vez de travar o serviço — peça-chave da resiliência exigida.
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
      console.error('[reservations-service] erro no pool do Postgres:', err.message);
    });
  }
  return pool;
}
