import { getPool } from './pool';

const DDL = `
CREATE TABLE IF NOT EXISTS dishes (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  category TEXT NOT NULL DEFAULT 'Geral',
  available BOOLEAN NOT NULL DEFAULT true
);
`;

const SEED = `
INSERT INTO dishes (id, name, description, price_cents, category, available) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Bruschetta da Casa', 'Pão italiano tostado, tomate, manjericão e azeite', 2490, 'Entradas', true),
  ('22222222-2222-2222-2222-222222222222', 'Risoto de Camarão', 'Arroz arbóreo cremoso com camarões frescos', 6990, 'Pratos Principais', true),
  ('33333333-3333-3333-3333-333333333333', 'Filé ao Molho Madeira', 'Filé mignon com molho madeira e batatas rústicas', 7890, 'Pratos Principais', true),
  ('44444444-4444-4444-4444-444444444444', 'Petit Gâteau', 'Bolo quente de chocolate com sorvete de creme', 2890, 'Sobremesas', true),
  ('55555555-5555-5555-5555-555555555555', 'Suco Natural 500ml', 'Laranja, abacaxi com hortelã ou maracujá', 1290, 'Bebidas', true)
ON CONFLICT (id) DO NOTHING;
`;

/** Cria a tabela (idempotente) e popula dados de demonstração. */
export async function ensureSchema(): Promise<void> {
  const pool = getPool();
  await pool.query(DDL);
  await pool.query(SEED);
}
