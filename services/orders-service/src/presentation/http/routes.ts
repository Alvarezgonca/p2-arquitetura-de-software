import { Router } from 'express';
import { OrderController } from './controllers/OrderController';

export function buildRouter(controller: OrderController): Router {
  const router = Router();
  router.get('/orders', controller.list);
  router.post('/orders', controller.create);
  router.patch('/orders/:id/status', controller.updateStatus);
  router.delete('/orders/:id', controller.remove);
  router.get('/discounts', controller.discounts);
  return router;
}
