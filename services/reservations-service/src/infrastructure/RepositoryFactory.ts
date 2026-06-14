import { ReservationRepository } from '../domain/repositories/ReservationRepository';
import { PgReservationRepository } from './repositories/PgReservationRepository';
import { InMemoryReservationRepository } from './repositories/InMemoryReservationRepository';
import { env } from './config/env';

/**
 * Factory: escolhe a implementação concreta do repositório conforme o
 * ambiente. Com DATABASE_URL usa PostgreSQL; sem ela (testes), memória.
 */
export class RepositoryFactory {
  static createReservationRepository(): ReservationRepository {
    if (env.databaseUrl) {
      return new PgReservationRepository();
    }
    return new InMemoryReservationRepository();
  }
}
