import { Order } from '../../domain/entities/Order';
import { OrderFilter, OrderRepository } from '../../domain/repositories/OrderRepository';

/** Repositório em memória — testes e fallback sem banco configurado. */
export class InMemoryOrderRepository implements OrderRepository {
  private readonly items = new Map<string, Order>();

  async save(order: Order): Promise<void> {
    this.items.set(order.id, order);
  }

  async findAll(filter?: OrderFilter): Promise<Order[]> {
    let orders = [...this.items.values()].reverse();
    if (filter?.status) {
      const status = filter.status.toUpperCase();
      orders = orders.filter((order) => order.status === status);
    }
    return orders;
  }

  async findById(id: string): Promise<Order | null> {
    return this.items.get(id) ?? null;
  }

  async delete(id: string): Promise<boolean> {
    return this.items.delete(id);
  }
}
