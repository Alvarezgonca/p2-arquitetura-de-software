import { Dish } from '../entities/Dish';

/** Critérios opcionais de busca do cardápio. */
export interface DishFilter {
  category?: string;
  search?: string;
  available?: boolean;
}

/**
 * Porta de saída (Repository Pattern).
 *
 * O domínio/aplicação dependem desta abstração, nunca da implementação
 * concreta (Inversão de Dependência — o "D" de SOLID). As implementações
 * (PostgreSQL, em memória) vivem na camada de infraestrutura.
 */
export interface DishRepository {
  save(dish: Dish): Promise<void>;
  findAll(filter?: DishFilter): Promise<Dish[]>;
  findById(id: string): Promise<Dish | null>;
  delete(id: string): Promise<boolean>;
}
