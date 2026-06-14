import { OrderJSON } from '../../domain/entities/Order';
import { OrderRepository } from '../../domain/repositories/OrderRepository';
import { DomainError } from '../../domain/errors/DomainError';

/**
 * Caso de uso: avançar o status de um pedido.
 *
 * Busca o agregado, delega a transição à entidade (que valida a máquina
 * de estados) e persiste. O caso de uso não conhece as regras de transição
 * — elas vivem no domínio (SRP + Tell, Don't Ask).
 */
export class UpdateOrderStatus {
  constructor(private readonly repository: OrderRepository) {}

  async execute(id: string, nextStatus: string): Promise<OrderJSON> {
    const order = await this.repository.findById(id);
    if (!order) {
      throw new DomainError('Pedido não encontrado.');
    }
    order.changeStatus(nextStatus);
    await this.repository.save(order);
    return order.toJSON();
  }
}
