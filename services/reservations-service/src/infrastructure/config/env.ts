/** Configuração lida do ambiente (12-factor). Sem segredos no código. */
export const env = {
  port: Number(process.env.PORT ?? 3003),
  databaseUrl: process.env.DATABASE_URL ?? '',
  nodeEnv: process.env.NODE_ENV ?? 'development',
};
