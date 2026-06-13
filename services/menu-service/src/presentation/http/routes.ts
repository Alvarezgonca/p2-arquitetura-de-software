import { Router } from 'express';
import { DishController } from './controllers/DishController';

export function buildRouter(controller: DishController): Router {
  const router = Router();
  router.get('/dishes', controller.list);
  router.post('/dishes', controller.create);
  return router;
}
