import { Given, When, Then, Before } from '@cucumber/cucumber';
import assert from 'node:assert';
import { InMemoryReservationRepository } from '../../../src/infrastructure/repositories/InMemoryReservationRepository';
import { CreateReservation } from '../../../src/application/use-cases/CreateReservation';
import { ListReservations } from '../../../src/application/use-cases/ListReservations';
import { UpdateReservationStatus } from '../../../src/application/use-cases/UpdateReservationStatus';
import { DomainError } from '../../../src/domain/errors/DomainError';

let repository: InMemoryReservationRepository;
let lastError: unknown;

Before(() => {
  repository = new InMemoryReservationRepository();
  lastError = undefined;
});

Given('que não há reservas', () => {
  repository = new InMemoryReservationRepository();
});

When(
  'eu registro uma reserva para {string} de {int} pessoas em {string} às {string}',
  async (customerName: string, peopleCount: number, date: string, time: string) => {
    await new CreateReservation(repository).execute({ customerName, peopleCount, date, time });
  },
);

When(
  'eu tento registrar uma reserva para {string} de {int} pessoas em {string} às {string}',
  async (customerName: string, peopleCount: number, date: string, time: string) => {
    try {
      await new CreateReservation(repository).execute({ customerName, peopleCount, date, time });
    } catch (err) {
      lastError = err;
    }
  },
);

When('eu confirmo a reserva de {string}', async (customerName: string) => {
  const reservations = await new ListReservations(repository).execute();
  const target = reservations.find((r) => r.customerName === customerName);
  assert.ok(target, `reserva de "${customerName}" não encontrada`);
  await new UpdateReservationStatus(repository).execute(target.id, 'CONFIRMADA');
});

Then('deve haver {int} reserva(s)', async (count: number) => {
  const reservations = await new ListReservations(repository).execute();
  assert.strictEqual(reservations.length, count);
});

Then(
  'a reserva de {string} deve estar com status {string}',
  async (customerName: string, status: string) => {
    const reservations = await new ListReservations(repository).execute();
    const target = reservations.find((r) => r.customerName === customerName);
    assert.ok(target, `reserva de "${customerName}" não encontrada`);
    assert.strictEqual(target?.status, status);
  },
);

Then('o registro deve ser recusado', () => {
  assert.ok(lastError instanceof DomainError, 'esperava uma violação de regra de negócio');
});
