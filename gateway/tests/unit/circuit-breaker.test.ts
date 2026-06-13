import { CircuitBreaker, CircuitOpenError } from '../../src/infra/CircuitBreaker';

describe('CircuitBreaker (resiliência)', () => {
  const fail = () => Promise.reject(new Error('falha simulada'));

  it('abre o circuito após atingir o limite de falhas e passa a falhar rápido', async () => {
    let clock = 0;
    const breaker = new CircuitBreaker({
      name: 'teste',
      failureThreshold: 2,
      openTimeoutMs: 1000,
      now: () => clock,
    });

    await expect(breaker.execute(fail)).rejects.toThrow('falha simulada');
    await expect(breaker.execute(fail)).rejects.toThrow('falha simulada');
    expect(breaker.getState()).toBe('OPEN');

    // Com o circuito aberto, falha imediatamente sem executar a ação.
    await expect(breaker.execute(fail)).rejects.toBeInstanceOf(CircuitOpenError);
  });

  it('vai para HALF_OPEN após o tempo e fecha quando o serviço volta', async () => {
    let clock = 0;
    const breaker = new CircuitBreaker({
      name: 'teste',
      failureThreshold: 1,
      openTimeoutMs: 1000,
      now: () => clock,
    });

    await expect(breaker.execute(fail)).rejects.toThrow();
    expect(breaker.getState()).toBe('OPEN');

    clock = 1500; // tempo de espera passou
    const result = await breaker.execute(() => Promise.resolve('ok'));
    expect(result).toBe('ok');
    expect(breaker.getState()).toBe('CLOSED');
  });
});
