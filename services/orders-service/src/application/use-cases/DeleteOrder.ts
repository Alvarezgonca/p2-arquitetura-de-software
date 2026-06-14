import { OrderRepository } from '../../domain/repositories/OrderRepository';
import { DomainError } from '../../domain/errors/DomainError';

/**
 * Caso de uso: remover um pedido do histórico.
 *
 * Responsabilidade única (SRP): orquestra a exclusão e traduz a ausência
 * do pedido em um erro de domínio amigável.
 */
export class DeleteOrder {
  constructor(private readonly repository: OrderRepository) {}

  async execute(id: string): Promise<void> {
    const removed = await this.repository.delete(id);
    if (!removed) {
      throw new DomainError('Pedido não encontrado.');
    }
  }
}
