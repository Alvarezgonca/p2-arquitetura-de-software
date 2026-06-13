import { Order, OrderJSON } from '../../domain/entities/Order';
import { OrderRepository } from '../../domain/repositories/OrderRepository';
import { DiscountStrategyFactory } from '../../domain/discounts/DiscountStrategyFactory';
import { PlaceOrderInput } from '../dtos';

/**
 * Caso de uso: registrar um pedido.
 *
 * Resolve a estratégia de desconto pela factory e delega o cálculo ao
 * domínio. Responsabilidade única: orquestrar (SRP). Depende apenas da
 * abstração OrderRepository (DIP).
 */
export class PlaceOrder {
  constructor(private readonly repository: OrderRepository) {}

  async execute(input: PlaceOrderInput): Promise<OrderJSON> {
    const discount = DiscountStrategyFactory.create(input.discountCode);
    const order = Order.create({
      customerName: input.customerName,
      tableLabel: input.tableLabel,
      items: input.items,
      discount,
    });
    await this.repository.save(order);
    return order.toJSON();
  }
}
