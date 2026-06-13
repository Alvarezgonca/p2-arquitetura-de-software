import { DiscountStrategy } from './DiscountStrategy';

/** Política padrão: sem desconto. */
export class NoDiscountStrategy implements DiscountStrategy {
  readonly name = 'NENHUM';

  calculate(_subtotalCents: number): number {
    return 0;
  }
}
