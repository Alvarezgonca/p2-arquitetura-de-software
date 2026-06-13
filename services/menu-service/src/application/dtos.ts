/** Objetos de transporte entre a camada de aplicação e as bordas. */

export interface CreateDishInput {
  name: string;
  description?: string;
  priceCents: number;
  category?: string;
  available?: boolean;
}

export interface DishOutput {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  category: string;
  available: boolean;
}
