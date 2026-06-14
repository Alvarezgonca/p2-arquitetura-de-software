import { InMemoryReservationRepository } from '../../src/infrastructure/repositories/InMemoryReservationRepository';
import { CreateReservation } from '../../src/application/use-cases/CreateReservation';
import { ListReservations } from '../../src/application/use-cases/ListReservations';
import { UpdateReservationStatus } from '../../src/application/use-cases/UpdateReservationStatus';
import { DeleteReservation } from '../../src/application/use-cases/DeleteReservation';
import { DomainError } from '../../src/domain/errors/DomainError';

function makeRepo() {
  return new InMemoryReservationRepository();
}

function input(overrides = {}) {
  return {
    customerName: 'Carlos e Ana',
    peopleCount: 2,
    date: '2026-06-21',
    time: '19:30',
    ...overrides,
  };
}

describe('CreateReservation / ListReservations', () => {
  it('cria e lista reservas, filtrando por status', async () => {
    const repo = makeRepo();
    const create = new CreateReservation(repo);
    await create.execute(input());
    await create.execute(input({ customerName: 'Família Souza', date: '2026-06-22', time: '20:00' }));

    const todas = await new ListReservations(repo).execute();
    expect(todas).toHaveLength(2);

    const pendentes = await new ListReservations(repo).execute({ status: 'PENDENTE' });
    expect(pendentes).toHaveLength(2);
  });

  it('filtra por data', async () => {
    const repo = makeRepo();
    await new CreateReservation(repo).execute(input({ date: '2026-06-21' }));
    await new CreateReservation(repo).execute(input({ date: '2026-06-25' }));

    const list = await new ListReservations(repo).execute({ date: '2026-06-25' });
    expect(list).toHaveLength(1);
    expect(list[0].date).toBe('2026-06-25');
  });
});

describe('UpdateReservationStatus', () => {
  it('confirma uma reserva existente', async () => {
    const repo = makeRepo();
    const created = await new CreateReservation(repo).execute(input());
    const updated = await new UpdateReservationStatus(repo).execute(created.id, 'CONFIRMADA');
    expect(updated.status).toBe('CONFIRMADA');
  });

  it('recusa reserva inexistente', async () => {
    const repo = makeRepo();
    await expect(new UpdateReservationStatus(repo).execute('nao-existe', 'CONFIRMADA')).rejects.toBeInstanceOf(
      DomainError,
    );
  });
});

describe('DeleteReservation', () => {
  it('remove uma reserva existente', async () => {
    const repo = makeRepo();
    const created = await new CreateReservation(repo).execute(input());
    await new DeleteReservation(repo).execute(created.id);
    expect(await new ListReservations(repo).execute()).toHaveLength(0);
  });

  it('recusa excluir reserva inexistente', async () => {
    const repo = makeRepo();
    await expect(new DeleteReservation(repo).execute('nao-existe')).rejects.toBeInstanceOf(DomainError);
  });
});
