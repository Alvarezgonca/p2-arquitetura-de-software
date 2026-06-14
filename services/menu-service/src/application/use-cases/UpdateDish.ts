import { DishRepository } from '../../domain/repositories/DishRepository';
import { DomainError } from '../../domain/errors/DomainError';
import { DishOutput } from '../dtos';

/**
 * Caso de uso: editar os dados de um prato existente.
 *
 * Busca o prato, delega a validação da edição à entidade (que continua
 * imutável, devolvendo uma nova instância) e persiste. As regras de nome e
 * preço vivem no domínio — o caso de uso só orquestra (SRP).
 */
export class UpdateDish {
  constructor(private readonly repository: DishRepository) {}

  async execute(
    id: string,
    input: { name?: string; description?: string; priceCents?: number; category?: string },
  ): Promise<DishOutput> {
    const dish = await this.repository.findById(id);
    if (!dish) {
      throw new DomainError('Prato não encontrado no cardápio.');
    }
    const updated = dish.withDetails(input);
    await this.repository.save(updated);
    return updated.toJSON();
  }
}
