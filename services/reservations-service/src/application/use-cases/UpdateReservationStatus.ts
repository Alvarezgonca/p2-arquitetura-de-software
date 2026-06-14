import { ReservationRepository } from '../../domain/repositories/ReservationRepository';
import { DomainError } from '../../domain/errors/DomainError';
import { ReservationOutput } from '../dtos';

/**
 * Caso de uso: avançar o status de uma reserva.
 *
 * Busca o agregado, delega a transição à entidade (que valida a máquina de
 * estados) e persiste. As regras de transição vivem no domínio (SRP).
 */
export class UpdateReservationStatus {
  constructor(private readonly repository: ReservationRepository) {}

  async execute(id: string, nextStatus: string): Promise<ReservationOutput> {
    const reservation = await this.repository.findById(id);
    if (!reservation) {
      throw new DomainError('Reserva não encontrada.');
    }
    reservation.changeStatus(nextStatus);
    await this.repository.save(reservation);
    return reservation.toJSON();
  }
}
