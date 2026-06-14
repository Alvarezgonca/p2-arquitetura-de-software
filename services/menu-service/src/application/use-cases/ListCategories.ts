import { DishRepository } from '../../domain/repositories/DishRepository';

/**
 * Caso de uso: listar as categorias distintas do cardápio (ordenadas).
 * Útil para montar filtros na interface sem expor o catálogo inteiro.
 */
export class ListCategories {
  constructor(private readonly repository: DishRepository) {}

  async execute(): Promise<string[]> {
    const dishes = await this.repository.findAll();
    const categories = new Set(dishes.map((dish) => dish.category));
    return [...categories].sort((a, b) => a.localeCompare(b));
  }
}
