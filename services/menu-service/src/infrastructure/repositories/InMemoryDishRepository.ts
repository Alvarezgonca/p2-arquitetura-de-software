import { Dish } from '../../domain/entities/Dish';
import { DishFilter, DishRepository } from '../../domain/repositories/DishRepository';

/**
 * Implementação em memória do repositório.
 *
 * Usada nos testes (TDD/BDD) e como fallback quando não há banco
 * configurado. Mesma interface da versão PostgreSQL (Repository Pattern),
 * o que permite testar os casos de uso sem infraestrutura externa.
 */
export class InMemoryDishRepository implements DishRepository {
  private readonly items = new Map<string, Dish>();

  async save(dish: Dish): Promise<void> {
    this.items.set(dish.id, dish);
  }

  async findAll(filter?: DishFilter): Promise<Dish[]> {
    let dishes = [...this.items.values()];
    if (filter?.category) {
      const category = filter.category.toLowerCase();
      dishes = dishes.filter((dish) => dish.category.toLowerCase() === category);
    }
    if (filter?.search) {
      const term = filter.search.toLowerCase();
      dishes = dishes.filter(
        (dish) =>
          dish.name.toLowerCase().includes(term) ||
          dish.description.toLowerCase().includes(term),
      );
    }
    if (filter?.available !== undefined) {
      dishes = dishes.filter((dish) => dish.available === filter.available);
    }
    return dishes.sort(
      (a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name),
    );
  }

  async findById(id: string): Promise<Dish | null> {
    return this.items.get(id) ?? null;
  }

  async delete(id: string): Promise<boolean> {
    return this.items.delete(id);
  }
}
