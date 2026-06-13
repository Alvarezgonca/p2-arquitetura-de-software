/**
 * Distingue "banco fora do ar" de outros erros, para responder 503
 * amigável quando o banco de pedidos for derrubado.
 */
const CONNECTION_ERROR_CODES = new Set([
  'ECONNREFUSED',
  'ETIMEDOUT',
  'ENOTFOUND',
  'EAI_AGAIN',
  'ECONNRESET',
  'EPIPE',
  '57P01',
  '57P03',
  '08000',
  '08001',
  '08003',
  '08004',
  '08006',
  '53300',
]);

export function isConnectionError(err: unknown): boolean {
  if (!err || typeof err !== 'object') {
    return false;
  }
  const code = (err as { code?: string }).code;
  if (code && CONNECTION_ERROR_CODES.has(code)) {
    return true;
  }
  const message = (err as { message?: string }).message ?? '';
  return /ECONNREFUSED|connect|terminat|shutdown|timeout/i.test(message);
}
