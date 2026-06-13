import type { Pool } from 'pg';
import { Dish } from '../../domain/entities/Dish';
import { DishRepository } from '../../domain/repositories/DishRepository';
import { DatabaseUnavailableError } from '../../domain/errors/DomainError';
import { getPool } from '../database/pool';
import { isConnectionError } from '../database/connectionErrors';

interface DishRow {
  id: string;
  name: string;
  description: string;
  price_cents: string | number;
  category: string;
  available: boolean;
}

/**
 * Implementação do repositório com PostgreSQL (adaptador de saída).
 *
 * Traduz erros de conexão em DatabaseUnavailableError, isolando o restante
 * da aplicação dos detalhes do driver (Liskov: substitui a porta sem que
 * os casos de uso percebam a troca).
 */
export class PgDishRepository implements DishRepository {
  constructor(private readonly pool: Pool = getPool()) {}

  async save(dish: Dish): Promise<void> {
    const data = dish.toJSON();
    try {
      await this.pool.query(
        `INSERT INTO dishes (id, name, description, price_cents, category, available)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           description = EXCLUDED.description,
           price_cents = EXCLUDED.price_cents,
           category = EXCLUDED.category,
           available = EXCLUDED.available`,
        [data.id, data.name, data.description, data.priceCents, data.category, data.available],
      );
    } catch (err) {
      throw this.translate(err);
    }
  }

  async findAll(): Promise<Dish[]> {
    try {
      const result = await this.pool.query<DishRow>(
        `SELECT id, name, description, price_cents, category, available
         FROM dishes
         ORDER BY category, name`,
      );
      return result.rows.map((row) => this.toEntity(row));
    } catch (err) {
      throw this.translate(err);
    }
  }

  async findById(id: string): Promise<Dish | null> {
    try {
      const result = await this.pool.query<DishRow>(
        `SELECT id, name, description, price_cents, category, available
         FROM dishes
         WHERE id = $1`,
        [id],
      );
      const row = result.rows[0];
      return row ? this.toEntity(row) : null;
    } catch (err) {
      throw this.translate(err);
    }
  }

  private toEntity(row: DishRow): Dish {
    return Dish.restore({
      id: row.id,
      name: row.name,
      description: row.description,
      priceCents: Number(row.price_cents),
      category: row.category,
      available: row.available,
    });
  }

  private translate(err: unknown): Error {
    if (isConnectionError(err)) {
      return new DatabaseUnavailableError(err);
    }
    return err instanceof Error ? err : new Error('Erro desconhecido no repositório de pratos');
  }
}
