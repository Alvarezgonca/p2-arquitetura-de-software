/**
 * Strategy Pattern — contrato das políticas de desconto.
 *
 * Cada algoritmo de desconto implementa esta interface. Adicionar uma
 * nova política não exige alterar o pedido nem o caso de uso
 * (Aberto/Fechado — o "O" de SOLID).
 */
export interface DiscountStrategy {
  /** Identificador legível da política (persistido junto ao pedido). */
  readonly name: string;

  /** Retorna o valor do desconto, em centavos, para um dado subtotal. */
  calculate(subtotalCents: number): number;
}
