import { Order } from '../../src/domain/entities/Order';
import { NoDiscountStrategy } from '../../src/domain/discounts/NoDiscountStrategy';
import { InMemoryOrderRepository } from '../../src/infrastructure/repositories/InMemoryOrderRepository';
import { PlaceOrder } from '../../src/application/use-cases/PlaceOrder';
import { UpdateOrderStatus } from '../../src/application/use-cases/UpdateOrderStatus';
import { DomainError } from '../../src/domain/errors/DomainError';

function novoPedido(): Order {
  return Order.create({
    customerName: 'Cliente Teste',
    items: [{ dishId: 'd1', name: 'Prato', unitPriceCents: 1000, quantity: 1 }],
    discount: new NoDiscountStrategy(),
  });
}

describe('Order — máquina de estados', () => {
  it('nasce no status RECEBIDO', () => {
    expect(novoPedido().status).toBe('RECEBIDO');
  });

  it('avança RECEBIDO → EM_PREPARO → PRONTO → ENTREGUE', () => {
    const order = novoPedido();
    order.changeStatus('EM_PREPARO');
    order.changeStatus('PRONTO');
    order.changeStatus('ENTREGUE');
    expect(order.status).toBe('ENTREGUE');
  });

  it('permite cancelar um pedido ainda em preparo', () => {
    const order = novoPedido();
    order.changeStatus('EM_PREPARO');
    order.changeStatus('CANCELADO');
    expect(order.status).toBe('CANCELADO');
  });

  it('recusa transição inválida (RECEBIDO → ENTREGUE)', () => {
    expect(() => novoPedido().changeStatus('ENTREGUE')).toThrow(DomainError);
  });

  it('recusa mudar status de um pedido já entregue', () => {
    const order = novoPedido();
    order.changeStatus('EM_PREPARO');
    order.changeStatus('PRONTO');
    order.changeStatus('ENTREGUE');
    expect(() => order.changeStatus('CANCELADO')).toThrow(DomainError);
  });
});

describe('UpdateOrderStatus (caso de uso)', () => {
  it('persiste o novo status do pedido', async () => {
    const repository = new InMemoryOrderRepository();
    const placed = await new PlaceOrder(repository).execute({
      customerName: 'Ana',
      items: [{ dishId: 'd1', name: 'Prato', unitPriceCents: 1000, quantity: 1 }],
    });

    const updated = await new UpdateOrderStatus(repository).execute(placed.id, 'EM_PREPARO');

    expect(updated.status).toBe('EM_PREPARO');
  });

  it('recusa pedido inexistente', async () => {
    const repository = new InMemoryOrderRepository();
    await expect(
      new UpdateOrderStatus(repository).execute('nao-existe', 'EM_PREPARO'),
    ).rejects.toBeInstanceOf(DomainError);
  });
});
