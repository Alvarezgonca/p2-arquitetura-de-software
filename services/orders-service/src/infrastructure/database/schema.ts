import { getPool } from './pool';

const DDL = `
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY,
  customer_name TEXT NOT NULL,
  table_label TEXT NOT NULL DEFAULT 'Balcão',
  items JSONB NOT NULL,
  discount_name TEXT NOT NULL DEFAULT 'NENHUM',
  subtotal_cents INTEGER NOT NULL,
  discount_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'RECEBIDO',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`;

const SEED = `
INSERT INTO orders
  (id, customer_name, table_label, items, discount_name, subtotal_cents, discount_cents, total_cents, status, created_at)
VALUES
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Pedido de Demonstração',
    'Mesa 5',
    '[{"dishId":"22222222-2222-2222-2222-222222222222","name":"Risoto de Camarão","unitPriceCents":6990,"quantity":1}]'::jsonb,
    'NENHUM', 6990, 0, 6990, 'RECEBIDO', now()
  )
ON CONFLICT (id) DO NOTHING;
`;

/** Cria a tabela (idempotente) e popula um pedido de demonstração. */
export async function ensureSchema(): Promise<void> {
  const pool = getPool();
  await pool.query(DDL);
  await pool.query(SEED);
}
