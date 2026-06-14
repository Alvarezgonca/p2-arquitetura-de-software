import { CircuitBreaker } from './CircuitBreaker';

export interface DownstreamResponse {
  status: number;
  data: unknown;
}

/** Erro de um microsserviço a jusante (5xx, rede ou timeout). */
export class DownstreamError extends Error {
  constructor(
    public readonly status: number,
    public readonly data: unknown,
  ) {
    super(`Falha do serviço a jusante (${status})`);
    this.name = 'DownstreamError';
  }
}

/**
 * Adaptador HTTP para um microsserviço (Adapter Pattern).
 *
 * Encapsula `fetch` + timeout + Circuit Breaker atrás de uma interface
 * simples (get/post). Respostas 2xx/4xx são repassadas; 5xx, rede e
 * timeout contam como falha e podem abrir o circuito.
 */
export class HttpServiceClient {
  private readonly breaker: CircuitBreaker;

  constructor(
    private readonly baseUrl: string,
    name: string,
    private readonly timeoutMs = 4000,
  ) {
    this.breaker = new CircuitBreaker({ name, failureThreshold: 3, openTimeoutMs: 8000 });
  }

  get(path: string): Promise<DownstreamResponse> {
    return this.request('GET', path);
  }

  post(path: string, body: unknown): Promise<DownstreamResponse> {
    return this.request('POST', path, body);
  }

  patch(path: string, body: unknown): Promise<DownstreamResponse> {
    return this.request('PATCH', path, body);
  }

  put(path: string, body: unknown): Promise<DownstreamResponse> {
    return this.request('PUT', path, body);
  }

  delete(path: string): Promise<DownstreamResponse> {
    return this.request('DELETE', path);
  }

  state(): string {
    return this.breaker.getState();
  }

  private request(method: string, path: string, body?: unknown): Promise<DownstreamResponse> {
    return this.breaker.execute(async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        const response = await fetch(`${this.baseUrl}${path}`, {
          method,
          headers: { 'content-type': 'application/json' },
          body: body === undefined ? undefined : JSON.stringify(body),
          signal: controller.signal,
        });
        const data = await this.safeJson(response);
        if (response.status >= 500) {
          throw new DownstreamError(response.status, data);
        }
        return { status: response.status, data };
      } finally {
        clearTimeout(timer);
      }
    });
  }

  private async safeJson(response: Response): Promise<unknown> {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }
}
