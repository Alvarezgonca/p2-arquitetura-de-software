import express, { Express } from 'express';
import { RepositoryFactory } from '../infrastructure/RepositoryFactory';
import { PlaceOrder } from '../application/use-cases/PlaceOrder';
import { ListOrders } from '../application/use-cases/ListOrders';
import { UpdateOrderStatus } from '../application/use-cases/UpdateOrderStatus';
import { DeleteOrder } from '../application/use-cases/DeleteOrder';
import { OrderController } from '../presentation/http/controllers/OrderController';
import { buildRouter } from '../presentation/http/routes';
import { errorHandler } from '../presentation/http/middlewares/errorHandler';
import { getPool } from '../infrastructure/database/pool';
import { env } from '../infrastructure/config/env';

/**
 * Composition Root: monta o grafo de dependências do serviço de pedidos.
 */
export function buildApp(): Express {
  const orderRepository = RepositoryFactory.createOrderRepository();
  const placeOrder = new PlaceOrder(orderRepository);
  const listOrders = new ListOrders(orderRepository);
  const updateOrderStatus = new UpdateOrderStatus(orderRepository);
  const deleteOrder = new DeleteOrder(orderRepository);
  const controller = new OrderController(placeOrder, listOrders, updateOrderStatus, deleteOrder);

  const app = express();
  app.use(express.json());

  app.get('/health', async (_req, res) => {
    res.json({
      service: 'orders-service',
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
