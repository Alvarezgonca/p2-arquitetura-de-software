/**
 * Erro de regra de negócio (violação de invariante do domínio).
 * Vira HTTP 422 na apresentação, com mensagem amigável.
 */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}

/**
 * Erro de infraestrutura: banco de dados indisponível. Vira HTTP 503 e
 * jamais expõe detalhes técnicos ao usuário final.
 */
export class DatabaseUnavailableError extends Error {
  constructor(public readonly cause?: unknown) {
    super('Repositório de dados indisponível');
    this.name = 'DatabaseUnavailableError';
  }
}
