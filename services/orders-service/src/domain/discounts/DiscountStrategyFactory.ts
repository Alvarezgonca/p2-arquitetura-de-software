import { DomainError } from '../errors/DomainError';
import { DiscountStrategy } from './DiscountStrategy';
import { NoDiscountStrategy } from './NoDiscountStrategy';
import { PercentageDiscountStrategy } from './PercentageDiscountStrategy';
import { ComboFamiliaStrategy } from './ComboFamiliaStrategy';
import { FixedAmountDiscountStrategy } from './FixedAmountDiscountStrategy';

/**
 * Factory que resolve o código de desconto para a estratégia concreta.
 * Une os padrões Factory + Strategy: o caso de uso só conhece o contrato.
 * Adicionar uma nova política não altera o pedido nem o caso de uso (OCP).
 */
export class DiscountStrategyFactory {
  static create(code?: string): DiscountStrategy {
    switch ((code ?? 'NENHUM').toUpperCase()) {
      case 'NENHUM':
        return new NoDiscountStrategy();
      case 'PERCENTUAL_10':
        return new PercentageDiscountStrategy('PERCENTUAL_10', 10);
      case 'PERCENTUAL_20':
        return new PercentageDiscountStrategy('PERCENTUAL_20', 20);
      case 'COMBO_FAMILIA':
        return new ComboFamiliaStrategy();
      case 'CUPOM_BEMVINDO':
        // R$ 15,00 de desconto em pedidos a partir de R$ 80,00.
        return new FixedAmountDiscountStrategy('CUPOM_BEMVINDO', 1500, 8000);
      default:
        throw new DomainError(`Tipo de desconto inválido: ${code}`);
    }
  }

  static availableCodes(): string[] {
    return ['NENHUM', 'PERCENTUAL_10', 'PERCENTUAL_20', 'COMBO_FAMILIA', 'CUPOM_BEMVINDO'];
  }
}
