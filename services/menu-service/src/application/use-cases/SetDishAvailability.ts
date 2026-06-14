import { DishRepository } from '../../domain/repositories/DishRepository';
import { DomainError } from '../../domain/errors/DomainError';
import { DishOutput } from '../dtos';

/**
 * Caso de uso: ligar/desligar a disponibilidade de um prato.
 *
 * Orquestra a busca, delega a mudança de estado à entidade (que continua
 * imutável) e persiste o resultado. Responsabilidade única (SRP).
 */
export class SetDishAvailability {
  constructor(private readonly repository: DishRepository) {}

  async execute(id: string, available: boolean): Promise<DishOutput> {
    const dish = await this.repository.findById(id);
    if (!dish) {
      throw new DomainError('Prato não encontrado no cardápio.');
    }
    const updated = dish.withAvailability(available);
    await this.repository.save(updated);
    return updated.toJSON();
  }
}
