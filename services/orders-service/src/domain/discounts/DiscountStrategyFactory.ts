import { DomainError } from '../errors/DomainError';
import { DiscountStrategy } from './DiscountStrategy';
import { NoDiscountStrategy } from './NoDiscountStrategy';
import { PercentageDiscountStrategy } from './PercentageDiscountStrategy';
import { ComboFamiliaStrategy } from './ComboFamiliaStrategy';

/**
 * Factory que resolve o código de desconto para a estratégia concreta.
 * Une os padrões Factory + Strategy: o caso de uso só conhece o contrato.
 */
export class DiscountStrategyFactory {
  static create(code?: string): DiscountStrategy {
    switch ((code ?? 'NENHUM').toUpperCase()) {
      case 'NENHUM':
        return new NoDiscountStrategy();
      case 'PERCENTUAL_10':
        return new PercentageDiscountStrategy('PERCENTUAL_10', 10);
      case 'COMBO_FAMILIA':
        return new ComboFamiliaStrategy();
      default:
        throw new DomainError(`Tipo de desconto inválido: ${code}`);
    }
  }

  static availableCodes(): string[] {
    return ['NENHUM', 'PERCENTUAL_10', 'COMBO_FAMILIA'];
  }
}
