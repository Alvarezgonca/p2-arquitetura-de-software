import { randomUUID } from 'node:crypto';
import { DomainError } from '../errors/DomainError';

export interface DishProps {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  category: string;
  available: boolean;
}

/**
 * Entidade de domínio "Prato".
 *
 * Centraliza as regras de negócio do item de cardápio. Não conhece
 * Express, banco de dados ou qualquer detalhe de infraestrutura
 * (regra de dependência da Arquitetura Limpa: o domínio é o núcleo).
 */
export class Dish {
  private constructor(private readonly props: DishProps) {}

  /**
   * Fábrica de criação. Valida as invariantes e gera o identificador.
   * (Factory Method — a construção válida fica encapsulada na entidade.)
   */
  static create(input: {
    name: string;
    description?: string;
    priceCents: number;
    category?: string;
    available?: boolean;
  }): Dish {
    const name = (input.name ?? '').trim();
    if (name.length < 2) {
      throw new DomainError('O nome do prato deve ter ao menos 2 caracteres.');
    }
    if (!Number.isInteger(input.priceCents) || input.priceCents < 0) {
      throw new DomainError('O preço do prato deve ser um valor inteiro em centavos maior ou igual a zero.');
    }
    return new Dish({
      id: randomUUID(),
      name,
      description: (input.description ?? '').trim(),
      priceCents: input.priceCents,
      category: (input.category ?? 'Geral').trim() || 'Geral',
      available: input.available ?? true,
    });
  }

  /** Reidrata uma entidade a partir de dados já persistidos (sem revalidar id). */
  static restore(props: DishProps): Dish {
    return new Dish(props);
  }

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string {
    return this.props.description;
  }

  get priceCents(): number {
    return this.props.priceCents;
  }

  get category(): string {
    return this.props.category;
  }

  get available(): boolean {
    return this.props.available;
  }

  /** Representação serializável para as bordas (controllers, repositórios). */
  toJSON(): DishProps {
    return { ...this.props };
  }
}
