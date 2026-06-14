import { buildApp } from './compositionRoot';
import { env } from '../infrastructure/config/env';
import { ensureSchema } from '../infrastructure/database/schema';

const app = buildApp();

app.listen(env.port, () => {
  console.log(`[reservations-service] ouvindo na porta ${env.port} (${env.nodeEnv})`);
});

// Migração resiliente: tenta preparar o schema em segundo plano, com novas
// tentativas. Se o banco estiver fora, o serviço continua de pé e responde
// com mensagens amigáveis até o banco voltar.
if (env.databaseUrl) {
  void initSchemaWithRetry();
}

async function initSchemaWithRetry(attempt = 1): Promise<void> {
  try {
    await ensureSchema();
    console.log('[reservations-service] schema de reservas pronto.');
  } catch {
    const waitMs = Math.min(30000, attempt * 3000);
    console.error(
      `[reservations-service] banco indisponível para migração (tentativa ${attempt}). ` +
        `Nova tentativa em ${waitMs / 1000}s.`,
    );
    setTimeout(() => void initSchemaWithRetry(attempt + 1), waitMs);
  }
}
