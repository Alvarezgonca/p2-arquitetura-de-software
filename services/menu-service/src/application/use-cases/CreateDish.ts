import { Dish } from '../../domain/entities/Dish';
import { DishRepository } from '../../domain/repositories/DishRepository';
import { CreateDishInput, DishOutput } from '../dtos';

/**
 * Caso de uso: cadastrar um prato no cardápio.
 *
 * Responsabilidade única (SRP): orquestrar a criação de um prato.
 * Depende da abstração DishRepository (DIP), recebida por injeção.
 */
export class CreateDish {
  constructor(private readonly repository: DishRepository) {}

  async execute(input: CreateDishInput): Promise<DishOutput> {
    const dish = Dish.create(input);
    await this.repository.save(dish);
    return dish.toJSON();
  }
}
