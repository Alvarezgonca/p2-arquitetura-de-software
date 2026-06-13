import { NextFunction, Request, Response } from 'express';

/**
 * Rede de segurança: qualquer erro não tratado vira uma resposta amigável.
 * Detalhes técnicos ficam apenas no log do servidor.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error('[gateway] erro inesperado:', err instanceof Error ? err.message : String(err));
  res.status(503).json({
    error: {
      code: 'SERVICO_INDISPONIVEL',
      message: 'Estamos com instabilidade no momento. Tente novamente em instantes.',
    },
  });
}
