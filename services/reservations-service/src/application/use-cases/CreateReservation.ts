import { Reservation } from '../../domain/entities/Reservation';
import { ReservationRepository } from '../../domain/repositories/ReservationRepository';
import { CreateReservationInput, ReservationOutput } from '../dtos';

/**
 * Caso de uso: registrar uma reserva de mesa.
 *
 * Delega a validação das invariantes ao domínio (entidade Reservation) e
 * só orquestra a persistência. Depende da abstração do repositório (DIP).
 */
export class CreateReservation {
  constructor(private readonly repository: ReservationRepository) {}

  async execute(input: CreateReservationInput): Promise<ReservationOutput> {
    const reservation = Reservation.create(input);
    await this.repository.save(reservation);
    return reservation.toJSON();
  }
}
