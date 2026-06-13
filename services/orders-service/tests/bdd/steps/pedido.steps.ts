import { Given, When, Then, Before } from '@cucumber/cucumber';
import assert from 'node:assert';
import { InMemoryOrderRepository } from '../../../src/infrastructure/repositories/InMemoryOrderRepository';
import { PlaceOrder } from '../../../src/application/use-cases/PlaceOrder';

interface CartItem {
  dishId: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
}

let cart: CartItem[];
let repository: InMemoryOrderRepository;
let placedOrder: { totalCents: number } | undefined;

Before(() => {
  cart = [];
  repository = new InMemoryOrderRepository();
  placedOrder = undefined;
});

Given(
  'um carrinho com o item {string} a {int} reais e quantidade {int}',
  (name: string, reais: number, quantity: number) => {
    cart.push({ dishId: name.toLowerCase(), name, unitPriceCents: reais * 100, quantity });
  },
);

When(
  'eu finalizo o pedido para {string} com o desconto {string}',
  async (customerName: string, discountCode: string) => {
    placedOrder = await new PlaceOrder(repository).execute({
      customerName,
      discountCode,
      items: cart,
    });
  },
);

Then('o total do pedido deve ser {int} reais', (reais: number) => {
  assert.ok(placedOrder, 'o pedido não foi finalizado');
  assert.strictEqual(placedOrder?.totalCents, reais * 100);
});
