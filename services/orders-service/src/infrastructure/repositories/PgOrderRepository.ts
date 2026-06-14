import type { Pool } from 'pg';
import { Order } from '../../domain/entities/Order';
import { OrderItem, OrderItemProps } from '../../domain/entities/OrderItem';
import { OrderFilter, OrderRepository } from '../../domain/repositories/OrderRepository';
import { DatabaseUnavailableError } from '../../domain/errors/DomainError';
import { getPool } from '../database/pool';
import { isConnectionError } from '../database/connectionErrors';

interface OrderRow {
  id: string;
  customer_name: string;
  table_label: string;
  items: OrderItemProps[];
  discount_name: string;
  subtotal_cents: string | number;
  discount_cents: string | number;
  total_cents: string | number;
  status: string;
  created_at: Date | string;
}

/** Adaptador de persistência do agregado Pedido em PostgreSQL. */
export class PgOrderRepository implements OrderRepository {
  constructor(private readonly pool: Pool = getPool()) {}

  async save(order: Order): Promise<void> {
    const data = order.toJSON();
    try {
      await this.pool.query(
        `INSERT INTO orders
           (id, customer_name, table_label, items, discount_name,
            subtotal_cents, discount_cents, total_cents, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status`,
        [
          data.id,
          data.customerName,
          data.tableLabel,
          JSON.stringify(data.items),
          data.discountName,
          data.subtotalCents,
          data.discountCents,
          data.totalCents,
          data.status,
          data.createdAt,
        ],
      );
    } catch (err) {
      throw this.translate(err);
    }
  }

  async findAll(filter?: OrderFilter): Promise<Order[]> {
    const params: unknown[] = [];
    let where = '';
    if (filter?.status) {
      params.push(filter.status.toUpperCase());
      where = `WHERE status = $${params.length}`;
    }
    try {
      const result = await this.pool.query<OrderRow>(
        `SELECT id, customer_name, table_label, items, discount_name,
                subtotal_cents, discount_cents, total_cents, status, created_at
         FROM orders
         ${where}
         ORDER BY created_at DESC`,
        params,
      );
      return result.rows.map((row) => this.toEntity(row));
    } catch (err) {
      throw this.translate(err);
    }
  }

  async findById(id: string): Promise<Order | null> {
    try {
      const result = await this.pool.query<OrderRow>(
        `SELECT id, customer_name, table_label, items, discount_name,
                subtotal_cents, discount_cents, total_cents, status, created_at
         FROM orders
         WHERE id = $1`,
        [id],
      );
      const row = result.rows[0];
      return row ? this.toEntity(row) : null;
    } catch (err) {
      throw this.translate(err);
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await this.pool.query('DELETE FROM orders WHERE id = $1', [id]);
      return (result.rowCount ?? 0) > 0;
    } catch (err) {
      throw this.translate(err);
    }
  }

  private toEntity(row: OrderRow): Order {
    const items = (row.items ?? []).map((item) => OrderItem.restore(item));
    return Order.restore({
      id: row.id,
      customerName: row.customer_name,
      tableLabel: row.table_label,
      items,
      discountName: row.discount_name,
      subtotalCents: Number(row.subtotal_cents),
      discountCents: Number(row.discount_cents),
      totalCents: Number(row.total_cents),
      status: row.status,
      createdAt: new Date(row.created_at).toISOString(),
    });
  }

  private translate(err: unknown): Error {
    if (isConnectionError(err)) {
      return new DatabaseUnavailableError(err);
    }
    return err instanceof Error ? err : new Error('Erro desconhecido no repositório de pedidos');
  }
}
