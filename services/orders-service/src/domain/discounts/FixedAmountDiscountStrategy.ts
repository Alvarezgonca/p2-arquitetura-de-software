import { DiscountStrategy } from './DiscountStrategy';

/**
 * Desconto de valor fixo (cupom), aplicado somente quando o subtotal
 * atinge um mínimo. Nunca desconta mais do que o próprio subtotal.
 */
export class FixedAmountDiscountStrategy implements DiscountStrategy {
  constructor(
    readonly name: string,
    private readonly amountCents: number,
    private readonly minSubtotalCents = 0,
  ) {}

  calculate(subtotalCents: number): number {
    if (subtotalCents < this.minSubtotalCents) {
      return 0;
    }
    return Math.min(subtotalCents, this.amountCents);
  }
}
