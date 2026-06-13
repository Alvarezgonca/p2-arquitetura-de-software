import { DomainError } from '../errors/DomainError';

export interface OrderItemProps {
  dishId: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
}

/**
 * Objeto de valor "Item do Pedido".
 *
 * Guarda um instantâneo (snapshot) do prato no momento do pedido —
 * nome e preço — para que o pedido não dependa do cardápio depois de
 * registrado (autonomia entre microsserviços).
 */
export class OrderItem {
  private constructor(private readonly props: OrderItemProps) {}

  static create(input: OrderItemProps): OrderItem {
    const name = (input.name ?? '').trim();
    if (!input.dishId || input.dishId.trim().length === 0) {
      throw new DomainError('Cada item do pedido precisa referenciar um prato.');
    }
    if (name.length === 0) {
      throw new DomainError('Cada item do pedido precisa de um nome.');
    }
    if (!Number.isInteger(input.unitPriceCents) || input.unitPriceCents < 0) {
      throw new DomainError('O preço unitário deve ser inteiro (centavos) e não negativo.');
    }
    if (!Number.isInteger(input.quantity) || input.quantity <= 0) {
      throw new DomainError('A quantidade de cada item deve ser um inteiro maior que zero.');
    }
    return new OrderItem({ ...input, name });
  }

  /** Reidrata sem revalidar (dados já persistidos). */
  static restore(props: OrderItemProps): OrderItem {
    return new OrderItem(props);
  }

  get dishId(): string {
    return this.props.dishId;
  }

  get name(): string {
    return this.props.name;
  }

  get unitPriceCents(): number {
    return this.props.unitPriceCents;
  }

  get quantity(): number {
    return this.props.quantity;
  }

  get subtotalCents(): number {
    return this.props.unitPriceCents * this.props.quantity;
  }

  toJSON(): OrderItemProps {
    return { ...this.props };
  }
}
