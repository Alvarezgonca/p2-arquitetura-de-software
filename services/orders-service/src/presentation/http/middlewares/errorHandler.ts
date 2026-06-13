import { NextFunction, Request, Response } from 'express';
import { DatabaseUnavailableError, DomainError } from '../../../domain/errors/DomainError';

/**
 * Tratador central de erros. Mensagens amigáveis para o cliente; detalhes
 * técnicos apenas no log do servidor (o usuário nunca vê stack/erro do banco).
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
    console.error('[orders-service] banco indisponível:', describe(err.cause));
    res.status(503).json({
      error: {
        code: 'SERVICO_INDISPONIVEL',
        message: 'Não foi possível registrar/consultar pedidos agora. Tente novamente em instantes.',
      },
    });
    return;
  }

  console.error('[orders-service] erro inesperado:', describe(err));
  res.status(500).json({
    error: {
      code: 'ERRO_INTERNO',
      message: 'Algo deu errado por aqui. Já estamos verificando, tente novamente em instantes.',
    },
  });
}

function describe(err: unknown): string {
  if (err instanceof Error) {
    return `${err.name}: ${err.message}`;
  }
  return String(err);
}
