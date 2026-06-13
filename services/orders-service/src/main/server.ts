import { buildApp } from './compositionRoot';
import { env } from '../infrastructure/config/env';
import { ensureSchema } from '../infrastructure/database/schema';

const app = buildApp();

app.listen(env.port, () => {
  console.log(`[orders-service] ouvindo na porta ${env.port} (${env.nodeEnv})`);
});

// Migração resiliente em segundo plano: se o banco estiver fora, o serviço
// permanece de pé e responde com mensagens amigáveis até o banco retornar.
if (env.databaseUrl) {
  void initSchemaWithRetry();
}

async function initSchemaWithRetry(attempt = 1): Promise<void> {
  try {
    await ensureSchema();
    console.log('[orders-service] schema de pedidos pronto.');
  } catch {
    const waitMs = Math.min(30000, attempt * 3000);
    console.error(
      `[orders-service] banco indisponível para migração (tentativa ${attempt}). ` +
        `Nova tentativa em ${waitMs / 1000}s.`,
    );
    setTimeout(() => void initSchemaWithRetry(attempt + 1), waitMs);
  }
}
