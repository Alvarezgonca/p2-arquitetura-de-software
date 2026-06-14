import { Router } from 'express';
import { DishController } from './controllers/DishController';

export function buildRouter(controller: DishController): Router {
  const router = Router();
  router.get('/dishes', controller.list);
  router.post('/dishes', controller.create);
  router.get('/categories', controller.categories);
  router.patch('/dishes/:id/availability', controller.changeAvailability);
  router.put('/dishes/:id', controller.update);
  router.delete('/dishes/:id', controller.remove);
  return router;
}
