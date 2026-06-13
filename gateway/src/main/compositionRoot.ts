import express, { Express } from 'express';
import { env } from '../config/env';
import { HttpServiceClient } from '../infra/HttpServiceClient';
import { GatewayController } from '../presentation/GatewayController';
import { buildRouter } from '../presentation/routes';
import { errorHandler } from '../presentation/middlewares/errorHandler';

/** Composition Root do gateway: cria os clientes e injeta no controlador. */
export function buildApp(): Express {
  const menuClient = new HttpServiceClient(env.menuServiceUrl, 'menu-service');
  const ordersClient = new HttpServiceClient(env.ordersServiceUrl, 'orders-service');
  const controller = new GatewayController(menuClient, ordersClient);

  const app = express();
  app.use(express.json());
  app.use(buildRouter(controller));
  app.use(errorHandler);
  return app;
}
