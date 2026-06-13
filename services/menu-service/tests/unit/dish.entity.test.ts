import { Dish } from '../../src/domain/entities/Dish';
import { DomainError } from '../../src/domain/errors/DomainError';

describe('Entidade Dish (regras de negócio)', () => {
  it('cria um prato válido e gera um identificador', () => {
    const dish = Dish.create({ name: 'Feijoada', priceCents: 4500, category: 'Pratos' });

    expect(dish.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(dish.name).toBe('Feijoada');
    expect(dish.priceCents).toBe(4500);
    expect(dish.category).toBe('Pratos');
    expect(dish.available).toBe(true);
  });

  it('usa categoria padrão quando não informada', () => {
    const dish = Dish.create({ name: 'Água', priceCents: 600 });
    expect(dish.category).toBe('Geral');
  });

  it('rejeita nome com menos de 2 caracteres', () => {
    expect(() => Dish.create({ name: 'X', priceCents: 1000 })).toThrow(DomainError);
  });

  it('rejeita preço negativo', () => {
    expect(() => Dish.create({ name: 'Pizza', priceCents: -1 })).toThrow(DomainError);
  });

  it('rejeita preço não inteiro (deve ser em centavos)', () => {
    expect(() => Dish.create({ name: 'Pizza', priceCents: 10.5 })).toThrow(DomainError);
  });
});
