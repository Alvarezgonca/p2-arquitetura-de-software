import { OrderJSON } from '../../domain/entities/Order';
import { OrderRepository } from '../../domain/repositories/OrderRepository';

/** Caso de uso: listar os pedidos registrados. */
export class ListOrders {
  constructor(private readonly repository: OrderRepository) {}

  async execute(): Promise<OrderJSON[]> {
    const orders = await this.repository.findAll();
    return orders.map((order) => order.toJSON());
  }
}
