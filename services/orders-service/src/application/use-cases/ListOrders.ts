import { OrderJSON } from '../../domain/entities/Order';
import { OrderFilter, OrderRepository } from '../../domain/repositories/OrderRepository';

/** Caso de uso: listar os pedidos registrados, opcionalmente por status. */
export class ListOrders {
  constructor(private readonly repository: OrderRepository) {}

  async execute(filter?: OrderFilter): Promise<OrderJSON[]> {
    const orders = await this.repository.findAll(filter);
    return orders.map((order) => order.toJSON());
  }
}
