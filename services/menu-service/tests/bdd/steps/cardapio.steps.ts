import { Given, When, Then, Before } from '@cucumber/cucumber';
import assert from 'node:assert';
import { InMemoryDishRepository } from '../../../src/infrastructure/repositories/InMemoryDishRepository';
import { CreateDish } from '../../../src/application/use-cases/CreateDish';
import { ListDishes } from '../../../src/application/use-cases/ListDishes';
import { DomainError } from '../../../src/domain/errors/DomainError';

let repository: InMemoryDishRepository;
let lastError: unknown;

Before(() => {
  repository = new InMemoryDishRepository();
  lastError = undefined;
});

Given('que o cardápio está vazio', () => {
  repository = new InMemoryDishRepository();
});

When(
  'eu cadastro o prato {string} por {int} reais e {int} centavos',
  async (name: string, reais: number, centavos: number) => {
    const priceCents = reais * 100 + centavos;
    await new CreateDish(repository).execute({ name, priceCents });
  },
);

When('eu tento cadastrar o prato {string} por {int} reais', async (name: string, reais: number) => {
  try {
    await new CreateDish(repository).execute({ name, priceCents: reais * 100 });
  } catch (err) {
    lastError = err;
  }
});

Then('o cardápio deve conter {int} prato(s)', async (count: number) => {
  const dishes = await new ListDishes(repository).execute();
  assert.strictEqual(dishes.length, count);
});

Then('o prato {string} deve estar disponível', async (name: string) => {
  const dishes = await new ListDishes(repository).execute();
  const dish = dishes.find((item) => item.name === name);
  assert.ok(dish, `prato "${name}" não encontrado`);
  assert.strictEqual(dish?.available, true);
});

Then('o cadastro deve ser recusado', () => {
  assert.ok(lastError instanceof DomainError, 'esperava uma violação de regra de negócio');
});
