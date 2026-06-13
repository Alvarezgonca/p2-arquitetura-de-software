import { Dish } from '../../domain/entities/Dish';
import { DishRepository } from '../../domain/repositories/DishRepository';

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

  async findAll(): Promise<Dish[]> {
    return [...this.items.values()];
  }

  async findById(id: string): Promise<Dish | null> {
    return this.items.get(id) ?? null;
  }
}
