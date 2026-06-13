export interface PlaceOrderItemInput {
  dishId: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
}

export interface PlaceOrderInput {
  customerName: string;
  tableLabel?: string;
  discountCode?: string;
  items: PlaceOrderItemInput[];
}
