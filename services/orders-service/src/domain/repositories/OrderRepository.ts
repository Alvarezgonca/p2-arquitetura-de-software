import { Order } from '../entities/Order';

/** Critérios opcionais de busca de pedidos. */
export interface OrderFilter {
  status?: string;
}

/**
 * Porta de saída do agregado Pedido (Repository Pattern). A aplicação
 * depende desta abstração; as implementações vivem na infraestrutura.
 */
export interface OrderRepository {
  save(order: Order): Promise<void>;
  findAll(filter?: OrderFilter): Promise<Order[]>;
  findById(id: string): Promise<Order | null>;
  delete(id: string): Promise<boolean>;
}
