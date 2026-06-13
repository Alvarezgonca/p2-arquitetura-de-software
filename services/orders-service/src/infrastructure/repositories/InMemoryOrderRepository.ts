import { Order } from '../../domain/entities/Order';
import { OrderRepository } from '../../domain/repositories/OrderRepository';

/** Repositório em memória — testes e fallback sem banco configurado. */
export class InMemoryOrderRepository implements OrderRepository {
  private readonly items: Order[] = [];

  async save(order: Order): Promise<void> {
    this.items.push(order);
  }

  async findAll(): Promise<Order[]> {
    return [...this.items].reverse();
  }
}
