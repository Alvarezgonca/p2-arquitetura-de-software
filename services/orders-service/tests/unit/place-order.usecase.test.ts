import { PlaceOrder } from '../../src/application/use-cases/PlaceOrder';
import { ListOrders } from '../../src/application/use-cases/ListOrders';
import { InMemoryOrderRepository } from '../../src/infrastructure/repositories/InMemoryOrderRepository';

describe('Caso de uso PlaceOrder', () => {
  it('registra um pedido aplicando o Combo Família', async () => {
    const repository = new InMemoryOrderRepository();
    const placeOrder = new PlaceOrder(repository);

    const order = await placeOrder.execute({
      customerName: 'Maria',
      discountCode: 'COMBO_FAMILIA',
      items: [{ dishId: 'd1', name: 'Rodízio', unitPriceCents: 6000, quantity: 2 }],
    });

    expect(order.subtotalCents).toBe(12000);
    expect(order.discountCents).toBe(1800);
    expect(order.totalCents).toBe(10200);

    const all = await new ListOrders(repository).execute();
    expect(all).toHaveLength(1);
  });
});
