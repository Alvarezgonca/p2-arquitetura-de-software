import { InMemoryOrderRepository } from '../../src/infrastructure/repositories/InMemoryOrderRepository';
import { PlaceOrder } from '../../src/application/use-cases/PlaceOrder';
import { ListOrders } from '../../src/application/use-cases/ListOrders';
import { DeleteOrder } from '../../src/application/use-cases/DeleteOrder';
import { DomainError } from '../../src/domain/errors/DomainError';

function placeOrder(repository: InMemoryOrderRepository) {
  return new PlaceOrder(repository).execute({
    customerName: 'Cliente Teste',
    items: [{ dishId: 'd1', name: 'Prato', unitPriceCents: 1000, quantity: 1 }],
  });
}

describe('DeleteOrder (caso de uso)', () => {
  it('remove um pedido existente do histórico', async () => {
    const repository = new InMemoryOrderRepository();
    const order = await placeOrder(repository);

    await new DeleteOrder(repository).execute(order.id);

    const orders = await new ListOrders(repository).execute();
    expect(orders).toHaveLength(0);
  });

  it('recusa excluir pedido inexistente', async () => {
    const repository = new InMemoryOrderRepository();
    await expect(new DeleteOrder(repository).execute('nao-existe')).rejects.toBeInstanceOf(DomainError);
  });
});
