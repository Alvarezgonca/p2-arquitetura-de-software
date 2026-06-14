import { Given, When, Then, Before } from '@cucumber/cucumber';
import assert from 'node:assert';
import { InMemoryOrderRepository } from '../../../src/infrastructure/repositories/InMemoryOrderRepository';
import { PlaceOrder } from '../../../src/application/use-cases/PlaceOrder';
import { UpdateOrderStatus } from '../../../src/application/use-cases/UpdateOrderStatus';

interface CartItem {
  dishId: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
}

let cart: CartItem[];
let repository: InMemoryOrderRepository;
let placedOrder: { id: string; totalCents: number; status: string } | undefined;

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

When('eu avanço o pedido para o status {string}', async (status: string) => {
  assert.ok(placedOrder, 'o pedido não foi finalizado');
  placedOrder = await new UpdateOrderStatus(repository).execute(placedOrder!.id, status);
});

Then('o total do pedido deve ser {int} reais', (reais: number) => {
  assert.ok(placedOrder, 'o pedido não foi finalizado');
  assert.strictEqual(placedOrder?.totalCents, reais * 100);
});

Then('o status do pedido deve ser {string}', (status: string) => {
  assert.ok(placedOrder, 'o pedido não foi finalizado');
  assert.strictEqual(placedOrder?.status, status);
});
