import { Order } from '../entities/Order';

/**
 * Porta de saída do agregado Pedido (Repository Pattern). A aplicação
 * depende desta abstração; as implementações vivem na infraestrutura.
 */
export interface OrderRepository {
  save(order: Order): Promise<void>;
  findAll(): Promise<Order[]>;
}
