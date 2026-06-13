import { Router } from 'express';
import { GatewayController } from './GatewayController';

export function buildRouter(controller: GatewayController): Router {
  const router = Router();
  router.get('/api/menu', controller.listMenu);
  router.post('/api/menu', controller.createDish);
  router.get('/api/orders', controller.listOrders);
  router.post('/api/orders', controller.createOrder);
  router.get('/api/discounts', controller.listDiscounts);
  router.get('/api/dashboard', controller.dashboard);
  router.get('/api/health', controller.health);
  return router;
}
