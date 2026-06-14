import { Reservation } from '../entities/Reservation';

/** Critérios opcionais de busca de reservas. */
export interface ReservationFilter {
  status?: string;
  date?: string;
}

/**
 * Porta de saída do agregado Reserva (Repository Pattern). A aplicação
 * depende desta abstração; as implementações vivem na infraestrutura.
 */
export interface ReservationRepository {
  save(reservation: Reservation): Promise<void>;
  findAll(filter?: ReservationFilter): Promise<Reservation[]>;
  findById(id: string): Promise<Reservation | null>;
  delete(id: string): Promise<boolean>;
}
