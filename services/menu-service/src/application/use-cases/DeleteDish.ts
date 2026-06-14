import { DishRepository } from '../../domain/repositories/DishRepository';
import { DomainError } from '../../domain/errors/DomainError';

/**
 * Caso de uso: remover um prato do cardápio.
 *
 * Responsabilidade única (SRP): só orquestra a exclusão e traduz a
 * ausência do prato em um erro de domínio amigável.
 */
export class DeleteDish {
  constructor(private readonly repository: DishRepository) {}

  async execute(id: string): Promise<void> {
    const removed = await this.repository.delete(id);
    if (!removed) {
      throw new DomainError('Prato não encontrado no cardápio.');
    }
  }
}
