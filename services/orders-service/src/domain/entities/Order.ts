import { randomUUID } from 'node:crypto';
import { DomainError } from '../errors/DomainError';
import { OrderItem, OrderItemProps } from './OrderItem';
import { DiscountStrategy } from '../discounts/DiscountStrategy';

export interface OrderProps {
  id: string;
  customerName: string;
  tableLabel: string;
  items: OrderItem[];
  discountName: string;
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  status: string;
  createdAt: string;
}

export interface OrderJSON {
  id: string;
  customerName: string;
  tableLabel: string;
  items: OrderItemProps[];
  discountName: string;
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  status: string;
  createdAt: string;
}

/**
 * Raiz de agregação "Pedido".
 *
 * Calcula subtotal, aplica a estratégia de desconto recebida e determina
 * o total. Toda a regra fica aqui, no domínio — o caso de uso só orquestra.
 */
export class Order {
  private constructor(private readonly props: OrderProps) {}

  static create(input: {
    customerName: string;
    tableLabel?: string;
    items: OrderItemProps[];
    discount: DiscountStrategy;
  }): Order {
    const customerName = (input.customerName ?? '').trim();
    if (customerName.length < 2) {
      throw new DomainError('Informe o nome do cliente (mínimo 2 caracteres).');
    }
    if (!Array.isArray(input.items) || input.items.length === 0) {
      throw new DomainError('O pedido deve conter ao menos um item.');
    }

    const items = input.items.map((item) => OrderItem.create(item));
    const subtotalCents = items.reduce((sum, item) => sum + item.subtotalCents, 0);
    const rawDiscount = input.discount.calculate(subtotalCents);
    const discountCents = Math.min(subtotalCents, Math.max(0, Math.round(rawDiscount)));
    const totalCents = subtotalCents - discountCents;

    return new Order({
      id: randomUUID(),
      customerName,
      tableLabel: (input.tableLabel ?? '').trim() || 'Balcão',
      items,
      discountName: input.discount.name,
      subtotalCents,
      discountCents,
      totalCents,
      status: 'RECEBIDO',
      createdAt: new Date().toISOString(),
    });
  }

  static restore(props: OrderProps): Order {
    return new Order(props);
  }

  get id(): string {
    return this.props.id;
  }

  get customerName(): string {
    return this.props.customerName;
  }

  get totalCents(): number {
    return this.props.totalCents;
  }

  get subtotalCents(): number {
    return this.props.subtotalCents;
  }

  get discountCents(): number {
    return this.props.discountCents;
  }

  toJSON(): OrderJSON {
    return {
      id: this.props.id,
      customerName: this.props.customerName,
      tableLabel: this.props.tableLabel,
      items: this.props.items.map((item) => item.toJSON()),
      discountName: this.props.discountName,
      subtotalCents: this.props.subtotalCents,
      discountCents: this.props.discountCents,
      totalCents: this.props.totalCents,
      status: this.props.status,
      createdAt: this.props.createdAt,
    };
  }
}
