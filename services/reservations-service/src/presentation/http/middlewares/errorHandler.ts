import { NextFunction, Request, Response } from 'express';
import { DatabaseUnavailableError, DomainError } from '../../../domain/errors/DomainError';

/**
 * Tratador central de erros.
 *
 * Converte exceções em respostas HTTP com mensagens AMIGÁVEIS. Detalhes
 * técnicos ficam apenas no log — o usuário final NUNCA vê info técnica.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof DomainError) {
    res.status(422).json({ error: { code: 'VALIDACAO', message: err.message } });
    return;
  }

  if (err instanceof DatabaseUnavailableError) {
    console.error('[reservations-service] banco indisponível:', describe(err.cause));
    res.status(503).json({
      error: {
        code: 'SERVICO_INDISPONIVEL',
        message: 'As reservas estão indisponíveis no momento. Tente novamente em instantes.',
      },
    });
    return;
  }

  console.error('[reservations-service] erro inesperado:', describe(err));
  res.status(500).json({
    error: {
      code: 'ERRO_INTERNO',
      message: 'Algo deu errado por aqui. Tente novamente em instantes.',
    },
  });
}

function describe(err: unknown): string {
  if (err instanceof Error) {
    return `${err.name}: ${err.message}`;
  }
  return String(err);
}
