import { ReservationRepository, ReservationFilter } from '../../domain/repositories/ReservationRepository';
import { ReservationOutput } from '../dtos';

/** Caso de uso: listar reservas, com filtros opcionais. */
export class ListReservations {
  constructor(private readonly repository: ReservationRepository) {}

  async execute(filter?: ReservationFilter): Promise<ReservationOutput[]> {
    const reservations = await this.repository.findAll(filter);
    return reservations.map((r) => r.toJSON());
  }
}
