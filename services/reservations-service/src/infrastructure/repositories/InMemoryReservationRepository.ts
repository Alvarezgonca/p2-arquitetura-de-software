import { Reservation } from '../../domain/entities/Reservation';
import {
  ReservationFilter,
  ReservationRepository,
} from '../../domain/repositories/ReservationRepository';

/** Repositório em memória — testes e fallback sem banco configurado. */
export class InMemoryReservationRepository implements ReservationRepository {
  private readonly items = new Map<string, Reservation>();

  async save(reservation: Reservation): Promise<void> {
    this.items.set(reservation.id, reservation);
  }

  async findAll(filter?: ReservationFilter): Promise<Reservation[]> {
    let reservations = [...this.items.values()];
    if (filter?.status) {
      const status = filter.status.toUpperCase();
      reservations = reservations.filter((r) => r.status === status);
    }
    if (filter?.date) {
      reservations = reservations.filter((r) => r.date === filter.date);
    }
    return reservations.sort(
      (a, b) => a.toJSON().date.localeCompare(b.toJSON().date) || a.toJSON().time.localeCompare(b.toJSON().time),
    );
  }

  async findById(id: string): Promise<Reservation | null> {
    return this.items.get(id) ?? null;
  }

  async delete(id: string): Promise<boolean> {
    return this.items.delete(id);
  }
}
