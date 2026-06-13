import { Dish } from '../entities/Dish';

/**
 * Porta de saída (Repository Pattern).
 *
 * O domínio/aplicação dependem desta abstração, nunca da implementação
 * concreta (Inversão de Dependência — o "D" de SOLID). As implementações
 * (PostgreSQL, em memória) vivem na camada de infraestrutura.
 */
export interface DishRepository {
  save(dish: Dish): Promise<void>;
  findAll(): Promise<Dish[]>;
  findById(id: string): Promise<Dish | null>;
}
