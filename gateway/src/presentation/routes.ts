import { Router } from 'express';
import { GatewayController } from './GatewayController';

export function buildRouter(controller: GatewayController): Router {
  const router = Router();
  router.get('/api/menu', controller.listMenu);
  router.post('/api/menu', controller.createDish);
  router.get('/api/menu/categories', controller.listCategories);
  router.patch('/api/menu/:id/availability', controller.changeDishAvailability);
  router.put('/api/menu/:id', controller.updateDish);
  router.delete('/api/menu/:id', controller.deleteDish);
  router.get('/api/orders', controller.listOrders);
  router.post('/api/orders', controller.createOrder);
  router.patch('/api/orders/:id/status', controller.updateOrderStatus);
  router.delete('/api/orders/:id', controller.deleteOrder);
  router.get('/api/discounts', controller.listDiscounts);
  router.get('/api/reservations', controller.listReservations);
  router.post('/api/reservations', controller.createReservation);
  router.patch('/api/reservations/:id/status', controller.updateReservationStatus);
  router.delete('/api/reservations/:id', controller.deleteReservation);
  router.get('/api/reservation-areas', controller.listAreas);
  router.get('/api/dashboard', controller.dashboard);
  router.get('/api/health', controller.health);
  return router;
}
