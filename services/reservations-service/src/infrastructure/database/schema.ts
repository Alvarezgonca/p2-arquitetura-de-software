import { getPool } from './pool';

const DDL = `
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  people_count INTEGER NOT NULL CHECK (people_count >= 1),
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  area TEXT NOT NULL DEFAULT 'Salão',
  notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'PENDENTE',
  created_at TEXT NOT NULL
);
`;

const SEED = `
INSERT INTO reservations (id, customer_name, phone, people_count, date, time, area, notes, status, created_at) VALUES
  ('aaaa1111-1111-1111-1111-111111111111', 'Família Souza', '21999990001', 4, '2026-06-20', '20:00', 'Salão', 'Aniversário', 'CONFIRMADA', '2026-06-13T12:00:00.000Z'),
  ('bbbb2222-2222-2222-2222-222222222222', 'Carlos e Ana', '21999990002', 2, '2026-06-21', '19:30', 'Varanda', '', 'PENDENTE', '2026-06-13T12:00:00.000Z')
ON CONFLICT (id) DO NOTHING;
`;

/** Cria a tabela (idempotente) e popula dados de demonstração. */
export async function ensureSchema(): Promise<void> {
  const pool = getPool();
  await pool.query(DDL);
  await pool.query(SEED);
}
