import { buildApp } from './compositionRoot';
import { env } from '../config/env';

buildApp().listen(env.port, () => {
  console.log(`[gateway] ouvindo na porta ${env.port} (${env.nodeEnv})`);
});
