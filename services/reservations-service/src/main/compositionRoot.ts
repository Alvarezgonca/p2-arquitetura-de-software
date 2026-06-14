import express, { Express } from 'express';
import { RepositoryFactory } from '../infrastructure/RepositoryFactory';
import { CreateReservation } from '../application/use-cases/CreateReservation';
import { ListReservations } from '../application/use-cases/ListReservations';
import { UpdateReservationStatus } from '../application/use-cases/UpdateReservationStatus';
import { DeleteReservation } from '../application/use-cases/DeleteReservation';
import { ReservationController } from '../presentation/http/controllers/ReservationController';
import { buildRouter } from '../presentation/http/routes';
import { errorHandler } from '../presentation/http/middlewares/errorHandler';
import { getPool } from '../infrastructure/database/pool';
import { env } from '../infrastructure/config/env';

/**
 * Composition Root: monta o grafo de dependências do serviço de reservas.
 */
export function buildApp(): Express {
  const repository = RepositoryFactory.createReservationRepository();
  const createReservation = new CreateReservation(repository);
  const listReservations = new ListReservations(repository);
  const updateStatus = new UpdateReservationStatus(repository);
  const deleteReservation = new DeleteReservation(repository);
  const controller = new ReservationController(
    createReservation,
    listReservations,
    updateStatus,
    deleteReservation,
  );

  const app = express();
  app.use(express.json());

  app.get('/health', async (_req, res) => {
    res.json({
      service: 'reservations-service',
      status: 'ok',
      database: await databaseStatus(),
    });
  });

  app.use(buildRouter(controller));
  app.use(errorHandler);
  return app;
}

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
