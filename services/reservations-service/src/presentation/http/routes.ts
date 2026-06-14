import { Router } from 'express';
import { ReservationController } from './controllers/ReservationController';

export function buildRouter(controller: ReservationController): Router {
  const router = Router();
  router.get('/reservations', controller.list);
  router.post('/reservations', controller.create);
  router.patch('/reservations/:id/status', controller.changeStatus);
  router.delete('/reservations/:id', controller.remove);
  router.get('/areas', controller.areas);
  return router;
}
