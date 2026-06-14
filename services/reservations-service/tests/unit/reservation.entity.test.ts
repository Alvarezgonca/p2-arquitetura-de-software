import { Reservation } from '../../src/domain/entities/Reservation';
import { DomainError } from '../../src/domain/errors/DomainError';

function nova(overrides: Partial<Parameters<typeof Reservation.create>[0]> = {}): Reservation {
  return Reservation.create({
    customerName: 'Família Souza',
    peopleCount: 4,
    date: '2026-06-20',
    time: '20:00',
    ...overrides,
  });
}

describe('Reservation — criação e invariantes', () => {
  it('nasce no status PENDENTE com área padrão', () => {
    const r = nova().toJSON();
    expect(r.status).toBe('PENDENTE');
    expect(r.area).toBe('Salão');
  });

  it('recusa nome curto', () => {
    expect(() => nova({ customerName: 'A' })).toThrow(DomainError);
  });

  it('recusa quantidade de pessoas fora do limite', () => {
    expect(() => nova({ peopleCount: 0 })).toThrow(DomainError);
    expect(() => nova({ peopleCount: 99 })).toThrow(DomainError);
  });

  it('recusa data e hora inválidas', () => {
    expect(() => nova({ date: '20/06' })).toThrow(DomainError);
    expect(() => nova({ time: '8h' })).toThrow(DomainError);
  });

  it('recusa área inexistente', () => {
    expect(() => nova({ area: 'Cozinha' })).toThrow(DomainError);
  });
});

describe('Reservation — máquina de estados', () => {
  it('avança PENDENTE → CONFIRMADA → CONCLUIDA', () => {
    const r = nova();
    r.changeStatus('CONFIRMADA');
    r.changeStatus('CONCLUIDA');
    expect(r.status).toBe('CONCLUIDA');
  });

  it('permite cancelar uma reserva pendente', () => {
    const r = nova();
    r.changeStatus('CANCELADA');
    expect(r.status).toBe('CANCELADA');
  });

  it('recusa transição inválida (PENDENTE → CONCLUIDA)', () => {
    expect(() => nova().changeStatus('CONCLUIDA')).toThrow(DomainError);
  });

  it('recusa mudar status de reserva concluída', () => {
    const r = nova();
    r.changeStatus('CONFIRMADA');
    r.changeStatus('CONCLUIDA');
    expect(() => r.changeStatus('CANCELADA')).toThrow(DomainError);
  });
});
