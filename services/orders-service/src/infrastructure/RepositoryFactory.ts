import { OrderRepository } from '../domain/repositories/OrderRepository';
import { PgOrderRepository } from './repositories/PgOrderRepository';
import { InMemoryOrderRepository } from './repositories/InMemoryOrderRepository';
import { env } from './config/env';

/** Factory: PostgreSQL quando há DATABASE_URL; memória caso contrário. */
export class RepositoryFactory {
  static createOrderRepository(): OrderRepository {
    if (env.databaseUrl) {
      return new PgOrderRepository();
    }
    return new InMemoryOrderRepository();
  }
}
