import { NextFunction, Request, Response } from 'express';
import { PlaceOrder } from '../../../application/use-cases/PlaceOrder';
import { ListOrders } from '../../../application/use-cases/ListOrders';
import { UpdateOrderStatus } from '../../../application/use-cases/UpdateOrderStatus';
import { DeleteOrder } from '../../../application/use-cases/DeleteOrder';
import { DiscountStrategyFactory } from '../../../domain/discounts/DiscountStrategyFactory';

/** Adaptador HTTP de entrada para o agregado Pedido. */
export class OrderController {
  constructor(
    private readonly placeOrder: PlaceOrder,
    private readonly listOrders: ListOrders,
    private readonly updateOrderStatus: UpdateOrderStatus,
    private readonly deleteOrder: DeleteOrder,
  ) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const status = typeof req.query.status === 'string' ? req.query.status : undefined;
      const orders = await this.listOrders.execute(status ? { status } : undefined);
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

  updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const status = (req.body ?? {}).status;
      const order = await this.updateOrderStatus.execute(req.params.id, status);
      res.json({ data: order });
    } catch (err) {
      next(err);
    }
  };

  remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.deleteOrder.execute(req.params.id);
      res.json({ data: { removed: true } });
    } catch (err) {
      next(err);
    }
  };

  discounts = (_req: Request, res: Response): void => {
    res.json({ data: DiscountStrategyFactory.availableCodes() });
  };
}
