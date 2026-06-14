import { ReservationRepository } from '../../domain/repositories/ReservationRepository';
import { DomainError } from '../../domain/errors/DomainError';

/** Caso de uso: remover uma reserva do histórico. */
export class DeleteReservation {
  constructor(private readonly repository: ReservationRepository) {}

  async execute(id: string): Promise<void> {
    const removed = await this.repository.delete(id);
    if (!removed) {
      throw new DomainError('Reserva não encontrada.');
    }
  }
}
