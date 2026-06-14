/** Configuração do gateway lida do ambiente. */
export const env = {
  port: Number(process.env.PORT ?? 8080),
  menuServiceUrl: process.env.MENU_SERVICE_URL ?? 'http://localhost:3001',
  ordersServiceUrl: process.env.ORDERS_SERVICE_URL ?? 'http://localhost:3002',
  reservationsServiceUrl: process.env.RESERVATIONS_SERVICE_URL ?? 'http://localhost:3003',
  nodeEnv: process.env.NODE_ENV ?? 'development',
};
