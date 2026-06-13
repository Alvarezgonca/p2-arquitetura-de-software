export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

/** Lançado quando o circuito está aberto e a chamada falha rápido. */
export class CircuitOpenError extends Error {
  constructor(serviceName: string) {
    super(`Circuito aberto para "${serviceName}"`);
    this.name = 'CircuitOpenError';
  }
}

export interface CircuitBreakerOptions {
  name: string;
  /** Falhas consecutivas para abrir o circuito. */
  failureThreshold?: number;
  /** Tempo (ms) que o circuito fica aberto antes de testar de novo. */
  openTimeoutMs?: number;
  /** Relógio injetável (facilita o teste). */
  now?: () => number;
}

/**
 * Circuit Breaker (padrão de resiliência).
 *
 * Quando um microsserviço para de responder, o circuito "abre" e as
 * chamadas seguintes falham imediatamente — em vez de ficarem penduradas.
 * Assim o gateway devolve rápido uma mensagem amigável ao usuário. Após um
 * intervalo, testa novamente (HALF_OPEN) e fecha se o serviço voltou.
 */
export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failures = 0;
  private nextTryAt = 0;

  private readonly name: string;
  private readonly failureThreshold: number;
  private readonly openTimeoutMs: number;
  private readonly now: () => number;

  constructor(options: CircuitBreakerOptions) {
    this.name = options.name;
    this.failureThreshold = options.failureThreshold ?? 3;
    this.openTimeoutMs = options.openTimeoutMs ?? 10000;
    this.now = options.now ?? (() => Date.now());
  }

  getState(): CircuitState {
    return this.state;
  }

  async execute<T>(action: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (this.now() < this.nextTryAt) {
        throw new CircuitOpenError(this.name);
      }
      this.state = 'HALF_OPEN';
    }

    try {
      const result = await action();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      throw err;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failures += 1;
    if (this.state === 'HALF_OPEN' || this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextTryAt = this.now() + this.openTimeoutMs;
    }
  }
}
