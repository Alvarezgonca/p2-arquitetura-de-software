import { Order } from '../../src/domain/entities/Order';
import { NoDiscountStrategy } from '../../src/domain/discounts/NoDiscountStrategy';
import { PercentageDiscountStrategy } from '../../src/domain/discounts/PercentageDiscountStrategy';
import { DomainError } from '../../src/domain/errors/DomainError';

const baseItem = { dishId: 'd1', name: 'Risoto', unitPriceCents: 5000, quantity: 2 };

describe('Entidade Order (regras de negócio)', () => {
  it('calcula subtotal e total sem desconto', () => {
    const order = Order.create({
      customerName: 'João',
      items: [baseItem],
      discount: new NoDiscountStrategy(),
    });

    expect(order.subtotalCents).toBe(10000);
    expect(order.discountCents).toBe(0);
    expect(order.totalCents).toBe(10000);
  });

  it('aplica desconto percentual ao total', () => {
    const order = Order.create({
      customerName: 'João',
      items: [baseItem],
      discount: new PercentageDiscountStrategy('PERCENTUAL_10', 10),
    });

    expect(order.discountCents).toBe(1000);
    expect(order.totalCents).toBe(9000);
  });

  it('rejeita pedido sem itens', () => {
    expect(() =>
      Order.create({ customerName: 'João', items: [], discount: new NoDiscountStrategy() }),
    ).toThrow(DomainError);
  });

  it('rejeita pedido sem nome de cliente', () => {
    expect(() =>
      Order.create({ customerName: '', items: [baseItem], discount: new NoDiscountStrategy() }),
    ).toThrow(DomainError);
  });
});
