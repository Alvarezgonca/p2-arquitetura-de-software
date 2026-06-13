import { NoDiscountStrategy } from '../../src/domain/discounts/NoDiscountStrategy';
import { PercentageDiscountStrategy } from '../../src/domain/discounts/PercentageDiscountStrategy';
import { ComboFamiliaStrategy } from '../../src/domain/discounts/ComboFamiliaStrategy';
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
});

describe('DiscountStrategyFactory (Factory)', () => {
  it('resolve os códigos conhecidos', () => {
    expect(DiscountStrategyFactory.create('NENHUM').name).toBe('NENHUM');
    expect(DiscountStrategyFactory.create('PERCENTUAL_10').name).toBe('PERCENTUAL_10');
    expect(DiscountStrategyFactory.create('COMBO_FAMILIA').name).toBe('COMBO_FAMILIA');
  });

  it('rejeita código de desconto inválido', () => {
    expect(() => DiscountStrategyFactory.create('XPTO')).toThrow(DomainError);
  });
});
