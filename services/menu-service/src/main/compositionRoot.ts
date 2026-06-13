import express, { Express } from 'express';
import { RepositoryFactory } from '../infrastructure/RepositoryFactory';
import { CreateDish } from '../application/use-cases/CreateDish';
import { ListDishes } from '../application/use-cases/ListDishes';
import { DishController } from '../presentation/http/controllers/DishController';
import { buildRouter } from '../presentation/http/routes';
import { errorHandler } from '../presentation/http/middlewares/errorHandler';
import { getPool } from '../infrastructure/database/pool';
import { env } from '../infrastructure/config/env';

/**
 * Composition Root: único lugar que conhece as implementações concretas e
 * monta o grafo de dependências (Injeção de Dependência manual). As demais
 * camadas recebem suas dependências prontas, sempre por abstração.
 */
export function buildApp(): Express {
  const dishRepository = RepositoryFactory.createDishRepository();
  const createDish = new CreateDish(dishRepository);
  const listDishes = new ListDishes(dishRepository);
  const controller = new DishController(createDish, listDishes);

  const app = express();
  app.use(express.json());

  app.get('/health', async (_req, res) => {
    res.json({
      service: 'menu-service',
      status: 'ok',
      database: await databaseStatus(),
    });
  });

  app.use(buildRouter(controller));
  app.use(errorHandler);
  return app;
}

/** Verifica a conexão sem nunca lançar — alimenta o /health. */
async function databaseStatus(): Promise<'up' | 'down' | 'not-configured'> {
  if (!env.databaseUrl) {
    return 'not-configured';
  }
  try {
    await getPool().query('SELECT 1');
    return 'up';
  } catch {
    return 'down';
  }
}
