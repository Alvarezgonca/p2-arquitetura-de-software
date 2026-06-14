/**
 * Erro de regra de negócio (violação de invariante do domínio).
 * É um erro "esperado": vira HTTP 422 na camada de apresentação,
 * com mensagem amigável para o cliente.
 */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}

/**
 * Erro de infraestrutura indicando que o banco de dados está
 * indisponível. É tratado como HTTP 503 e nunca expõe detalhes
 * técnicos ao usuário final.
 */
export class DatabaseUnavailableError extends Error {
  constructor(public readonly cause?: unknown) {
    super('Repositório de dados indisponível');
    this.name = 'DatabaseUnavailableError';
  }
}
