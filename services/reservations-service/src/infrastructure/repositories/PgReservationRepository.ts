import type { Pool } from 'pg';
import { Reservation } from '../../domain/entities/Reservation';
import {
  ReservationFilter,
  ReservationRepository,
} from '../../domain/repositories/ReservationRepository';
import { DatabaseUnavailableError } from '../../domain/errors/DomainError';
import { getPool } from '../database/pool';
import { isConnectionError } from '../database/connectionErrors';

interface ReservationRow {
  id: string;
  customer_name: string;
  phone: string;
  people_count: string | number;
  date: string;
  time: string;
  area: string;
  notes: string;
  status: string;
  created_at: string;
}

/** Adaptador de persistência do agregado Reserva em PostgreSQL. */
export class PgReservationRepository implements ReservationRepository {
  constructor(private readonly pool: Pool = getPool()) {}

  async save(reservation: Reservation): Promise<void> {
    const data = reservation.toJSON();
    try {
      await this.pool.query(
        `INSERT INTO reservations
           (id, customer_name, phone, people_count, date, time, area, notes, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO UPDATE SET
           customer_name = EXCLUDED.customer_name,
           phone = EXCLUDED.phone,
           people_count = EXCLUDED.people_count,
           date = EXCLUDED.date,
           time = EXCLUDED.time,
           area = EXCLUDED.area,
           notes = EXCLUDED.notes,
           status = EXCLUDED.status`,
        [
          data.id,
          data.customerName,
          data.phone,
          data.peopleCount,
          data.date,
          data.time,
          data.area,
          data.notes,
          data.status,
          data.createdAt,
        ],
      );
    } catch (err) {
      throw this.translate(err);
    }
  }

  async findAll(filter?: ReservationFilter): Promise<Reservation[]> {
    const conditions: string[] = [];
    const params: unknown[] = [];
    if (filter?.status) {
      params.push(filter.status.toUpperCase());
      conditions.push(`status = $${params.length}`);
    }
    if (filter?.date) {
      params.push(filter.date);
      conditions.push(`date = $${params.length}`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    try {
      const result = await this.pool.query<ReservationRow>(
        `SELECT id, customer_name, phone, people_count, date, time, area, notes, status, created_at
         FROM reservations
         ${where}
         ORDER BY date, time`,
        params,
      );
      return result.rows.map((row) => this.toEntity(row));
    } catch (err) {
      throw this.translate(err);
    }
  }

  async findById(id: string): Promise<Reservation | null> {
    try {
      const result = await this.pool.query<ReservationRow>(
        `SELECT id, customer_name, phone, people_count, date, time, area, notes, status, created_at
         FROM reservations
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
      const result = await this.pool.query('DELETE FROM reservations WHERE id = $1', [id]);
      return (result.rowCount ?? 0) > 0;
    } catch (err) {
      throw this.translate(err);
    }
  }

  private toEntity(row: ReservationRow): Reservation {
    return Reservation.restore({
      id: row.id,
      customerName: row.customer_name,
      phone: row.phone,
      peopleCount: Number(row.people_count),
      date: row.date,
      time: row.time,
      area: row.area,
      notes: row.notes,
      status: row.status,
      createdAt: row.created_at,
    });
  }

  private translate(err: unknown): Error {
    if (isConnectionError(err)) {
      return new DatabaseUnavailableError(err);
    }
    return err instanceof Error ? err : new Error('Erro desconhecido no repositório de reservas');
  }
}
