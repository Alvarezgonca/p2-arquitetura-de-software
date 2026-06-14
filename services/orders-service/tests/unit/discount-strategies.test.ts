import { NoDiscountStrategy } from '../../src/domain/discounts/NoDiscountStrategy';
import { PercentageDiscountStrategy } from '../../src/domain/discounts/PercentageDiscountStrategy';
import { ComboFamiliaStrategy } from '../../src/domain/discounts/ComboFamiliaStrategy';
import { FixedAmountDiscountStrategy } from '../../src/domain/discounts/FixedAmountDiscountStrategy';
import { DiscountStrategyFactory } from '../../src/domain/discounts/DiscountStrategyFactory';
import { DomainError } from '../../src/domain/errors/DomainError';

describe('Estratégias de desconto (Strategy)', () => {
  it('NENHUM não aplica desconto', () => {
    expect(new NoDiscountStrategy().calculate(10000)).toBe(0);
  });

  it('Percentual aplica o percentual configurado', () => {
    expect(new PercentageDiscountStrategy('PERCENTUAL_10', 10).calculate(10000)).toBe(1000);
  });

  it('Combo Família não desconta abaixo de R$ 100,00', () => {
    expect(new ComboFamiliaStrategy().calculate(9900)).toBe(0);
  });

  it('Combo Família aplica 15% a partir de R$ 100,00', () => {
    expect(new ComboFamiliaStrategy().calculate(12000)).toBe(1800);
  });

  it('Cupom de valor fixo só vale a partir do mínimo', () => {
    const cupom = new FixedAmountDiscountStrategy('CUPOM_BEMVINDO', 1500, 8000);
    expect(cupom.calculate(7000)).toBe(0);
    expect(cupom.calculate(9000)).toBe(1500);
  });

  it('Cupom nunca desconta mais que o subtotal', () => {
    const cupom = new FixedAmountDiscountStrategy('CUPOM_TESTE', 5000, 0);
    expect(cupom.calculate(3000)).toBe(3000);
  });
});

describe('DiscountStrategyFactory (Factory)', () => {
  it('resolve os códigos conhecidos', () => {
    expect(DiscountStrategyFactory.create('NENHUM').name).toBe('NENHUM');
    expect(DiscountStrategyFactory.create('PERCENTUAL_10').name).toBe('PERCENTUAL_10');
    expect(DiscountStrategyFactory.create('PERCENTUAL_20').name).toBe('PERCENTUAL_20');
    expect(DiscountStrategyFactory.create('COMBO_FAMILIA').name).toBe('COMBO_FAMILIA');
    expect(DiscountStrategyFactory.create('CUPOM_BEMVINDO').name).toBe('CUPOM_BEMVINDO');
  });

  it('rejeita código de desconto inválido', () => {
    expect(() => DiscountStrategyFactory.create('XPTO')).toThrow(DomainError);
  });
});
