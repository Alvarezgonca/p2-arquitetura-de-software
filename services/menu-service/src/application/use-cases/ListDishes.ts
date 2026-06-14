import { DishFilter, DishRepository } from '../../domain/repositories/DishRepository';
import { DishOutput } from '../dtos';

/**
 * Caso de uso: listar os pratos do cardápio, com filtros opcionais
 * (categoria, busca textual e disponibilidade).
 */
export class ListDishes {
  constructor(private readonly repository: DishRepository) {}

  async execute(filter?: DishFilter): Promise<DishOutput[]> {
    const dishes = await this.repository.findAll(filter);
    return dishes.map((dish) => dish.toJSON());
  }
}
