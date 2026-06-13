import { DiscountStrategy } from './DiscountStrategy';

/**
 * Combo Família: 15% de desconto quando o subtotal atinge R$ 100,00.
 * Abaixo disso, não há desconto.
 */
export class ComboFamiliaStrategy implements DiscountStrategy {
  readonly name = 'COMBO_FAMILIA';
  private readonly thresholdCents = 10000;
  private readonly percent = 15;

  calculate(subtotalCents: number): number {
    if (subtotalCents < this.thresholdCents) {
      return 0;
    }
    return Math.round(subtotalCents * (this.percent / 100));
  }
}
