import { NextFunction, Request, Response } from 'express';
import { PlaceOrder } from '../../../application/use-cases/PlaceOrder';
import { ListOrders } from '../../../application/use-cases/ListOrders';
import { DiscountStrategyFactory } from '../../../domain/discounts/DiscountStrategyFactory';

/** Adaptador HTTP de entrada para o agregado Pedido. */
export class OrderController {
  constructor(
    private readonly placeOrder: PlaceOrder,
    private readonly listOrders: ListOrders,
  ) {}

  list = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orders = await this.listOrders.execute();
      res.json({ data: orders });
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body ?? {};
      const order = await this.placeOrder.execute({
        customerName: body.customerName,
        tableLabel: body.tableLabel,
        discountCode: body.discountCode,
        items: Array.isArray(body.items) ? body.items : [],
      });
      res.status(201).json({ data: order });
    } catch (err) {
      next(err);
    }
  };

  discounts = (_req: Request, res: Response): void => {
    res.json({ data: DiscountStrategyFactory.availableCodes() });
  };
}
