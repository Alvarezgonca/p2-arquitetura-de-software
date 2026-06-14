import { Dish } from '../../src/domain/entities/Dish';
import { InMemoryDishRepository } from '../../src/infrastructure/repositories/InMemoryDishRepository';
import { CreateDish } from '../../src/application/use-cases/CreateDish';
import { UpdateDish } from '../../src/application/use-cases/UpdateDish';
import { DeleteDish } from '../../src/application/use-cases/DeleteDish';
import { ListDishes } from '../../src/application/use-cases/ListDishes';
import { DomainError } from '../../src/domain/errors/DomainError';

describe('Dish.withDetails (edição imutável)', () => {
  it('aplica as mudanças preservando id e devolvendo nova instância', () => {
    const dish = Dish.create({ name: 'Moqueca', priceCents: 5900, category: 'Principais' });
    const edited = dish.withDetails({ name: 'Moqueca Capixaba', priceCents: 6500 });

    expect(dish.name).toBe('Moqueca'); // original intacto
    expect(edited.name).toBe('Moqueca Capixaba');
    expect(edited.priceCents).toBe(6500);
    expect(edited.category).toBe('Principais'); // campo não informado é mantido
    expect(edited.id).toBe(dish.id);
  });

  it('recusa nome curto e preço inválido na edição', () => {
    const dish = Dish.create({ name: 'Tapioca', priceCents: 1800 });
    expect(() => dish.withDetails({ name: 'A' })).toThrow(DomainError);
    expect(() => dish.withDetails({ priceCents: -1 })).toThrow(DomainError);
  });
});

describe('UpdateDish (caso de uso)', () => {
  it('edita um prato existente', async () => {
    const repository = new InMemoryDishRepository();
    const created = await new CreateDish(repository).execute({ name: 'Pizza', priceCents: 4000 });

    const updated = await new UpdateDish(repository).execute(created.id, { priceCents: 4500 });

    expect(updated.priceCents).toBe(4500);
    const reloaded = await repository.findById(created.id);
    expect(reloaded?.priceCents).toBe(4500);
  });

  it('recusa editar prato inexistente', async () => {
    const repository = new InMemoryDishRepository();
    await expect(new UpdateDish(repository).execute('nao-existe', { name: 'X' })).rejects.toBeInstanceOf(
      DomainError,
    );
  });
});

describe('DeleteDish (caso de uso)', () => {
  it('remove um prato existente do cardápio', async () => {
    const repository = new InMemoryDishRepository();
    const created = await new CreateDish(repository).execute({ name: 'Brigadeiro', priceCents: 500 });

    await new DeleteDish(repository).execute(created.id);

    const dishes = await new ListDishes(repository).execute();
    expect(dishes).toHaveLength(0);
  });

  it('recusa excluir prato inexistente', async () => {
    const repository = new InMemoryDishRepository();
    await expect(new DeleteDish(repository).execute('nao-existe')).rejects.toBeInstanceOf(DomainError);
  });
});
