import { DishRepository } from '../../domain/repositories/DishRepository';
import { DishOutput } from '../dtos';

/**
 * Caso de uso: listar os pratos do cardápio.
 */
export class ListDishes {
  constructor(private readonly repository: DishRepository) {}

  async execute(): Promise<DishOutput[]> {
    const dishes = await this.repository.findAll();
    return dishes.map((dish) => dish.toJSON());
  }
}
