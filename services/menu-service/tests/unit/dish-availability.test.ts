import { Dish } from '../../src/domain/entities/Dish';
import { InMemoryDishRepository } from '../../src/infrastructure/repositories/InMemoryDishRepository';
import { CreateDish } from '../../src/application/use-cases/CreateDish';
import { ListDishes } from '../../src/application/use-cases/ListDishes';
import { ListCategories } from '../../src/application/use-cases/ListCategories';
import { SetDishAvailability } from '../../src/application/use-cases/SetDishAvailability';
import { DomainError } from '../../src/domain/errors/DomainError';

describe('Disponibilidade do prato (entidade imutável)', () => {
  it('withAvailability devolve uma nova instância com o estado trocado', () => {
    const dish = Dish.create({ name: 'Moqueca', priceCents: 5900 });
    const off = dish.withAvailability(false);

    expect(dish.available).toBe(true); // original intacto
    expect(off.available).toBe(false);
    expect(off.id).toBe(dish.id);
  });
});

describe('SetDishAvailability (caso de uso)', () => {
  it('desliga a disponibilidade de um prato existente', async () => {
    const repository = new InMemoryDishRepository();
    const created = await new CreateDish(repository).execute({ name: 'Tapioca', priceCents: 1800 });

    const updated = await new SetDishAvailability(repository).execute(created.id, false);

    expect(updated.available).toBe(false);
  });

  it('recusa prato inexistente', async () => {
    const repository = new InMemoryDishRepository();
    await expect(new SetDishAvailability(repository).execute('nao-existe', false)).rejects.toBeInstanceOf(
      DomainError,
    );
  });
});

describe('ListDishes com filtros e ListCategories', () => {
  async function seedRepo(): Promise<InMemoryDishRepository> {
    const repository = new InMemoryDishRepository();
    const create = new CreateDish(repository);
    await create.execute({ name: 'Bruschetta', priceCents: 2490, category: 'Entradas' });
    await create.execute({ name: 'Risoto de Camarão', priceCents: 6990, category: 'Principais' });
    await create.execute({ name: 'Pudim', priceCents: 1500, category: 'Sobremesas', available: false });
    return repository;
  }

  it('filtra por categoria', async () => {
    const repository = await seedRepo();
    const dishes = await new ListDishes(repository).execute({ category: 'Entradas' });
    expect(dishes).toHaveLength(1);
    expect(dishes[0].name).toBe('Bruschetta');
  });

  it('filtra por busca textual', async () => {
    const repository = await seedRepo();
    const dishes = await new ListDishes(repository).execute({ search: 'camarão' });
    expect(dishes).toHaveLength(1);
    expect(dishes[0].name).toBe('Risoto de Camarão');
  });

  it('filtra por disponibilidade', async () => {
    const repository = await seedRepo();
    const dishes = await new ListDishes(repository).execute({ available: false });
    expect(dishes).toHaveLength(1);
    expect(dishes[0].name).toBe('Pudim');
  });

  it('lista as categorias distintas em ordem', async () => {
    const repository = await seedRepo();
    const categories = await new ListCategories(repository).execute();
    expect(categories).toEqual(['Entradas', 'Principais', 'Sobremesas']);
  });
});
