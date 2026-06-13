import { DishRepository } from '../domain/repositories/DishRepository';
import { PgDishRepository } from './repositories/PgDishRepository';
import { InMemoryDishRepository } from './repositories/InMemoryDishRepository';
import { env } from './config/env';

/**
 * Factory: escolhe a implementação concreta do repositório conforme o
 * ambiente. Com DATABASE_URL usa PostgreSQL; sem ela (testes), memória.
 * As camadas internas seguem dependendo apenas da abstração.
 */
export class RepositoryFactory {
  static createDishRepository(): DishRepository {
    if (env.databaseUrl) {
      return new PgDishRepository();
    }
    return new InMemoryDishRepository();
  }
}
