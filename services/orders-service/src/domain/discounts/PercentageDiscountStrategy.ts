import { DiscountStrategy } from './DiscountStrategy';

/** Desconto percentual simples sobre o subtotal. */
export class PercentageDiscountStrategy implements DiscountStrategy {
  constructor(
    readonly name: string,
    private readonly percent: number,
  ) {}

  calculate(subtotalCents: number): number {
    return Math.round(subtotalCents * (this.percent / 100));
  }
}
