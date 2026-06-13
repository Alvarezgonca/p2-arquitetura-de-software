import { CreateDish } from '../../src/application/use-cases/CreateDish';
import { ListDishes } from '../../src/application/use-cases/ListDishes';
import { InMemoryDishRepository } from '../../src/infrastructure/repositories/InMemoryDishRepository';

describe('Caso de uso CreateDish', () => {
  it('persiste o prato e o retorna com identificador', async () => {
    const repository = new InMemoryDishRepository();
    const createDish = new CreateDish(repository);

    const output = await createDish.execute({
      name: 'Moqueca Capixaba',
      priceCents: 5200,
      category: 'Pratos Principais',
    });

    expect(output.id).toBeDefined();
    expect(output.name).toBe('Moqueca Capixaba');

    const all = await new ListDishes(repository).execute();
    expect(all).toHaveLength(1);
    expect(all[0].name).toBe('Moqueca Capixaba');
  });

  it('propaga erro de validação sem persistir', async () => {
    const repository = new InMemoryDishRepository();
    const createDish = new CreateDish(repository);

    await expect(createDish.execute({ name: '', priceCents: 100 })).rejects.toThrow();

    const all = await new ListDishes(repository).execute();
    expect(all).toHaveLength(0);
  });
});
