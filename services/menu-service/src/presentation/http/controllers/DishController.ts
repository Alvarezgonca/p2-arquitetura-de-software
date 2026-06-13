import { NextFunction, Request, Response } from 'express';
import { CreateDish } from '../../../application/use-cases/CreateDish';
import { ListDishes } from '../../../application/use-cases/ListDishes';

/**
 * Adaptador de entrada HTTP. Traduz requisição/resposta para os casos de
 * uso. Não contém regra de negócio (SRP) — só orquestra e delega erros
 * para o tratador central.
 */
export class DishController {
  constructor(
    private readonly createDish: CreateDish,
    private readonly listDishes: ListDishes,
  ) {}

  list = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dishes = await this.listDishes.execute();
      res.json({ data: dishes });
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body ?? {};
      const dish = await this.createDish.execute({
        name: body.name,
        description: body.description,
        priceCents: body.priceCents,
        category: body.category,
        available: body.available,
      });
      res.status(201).json({ data: dish });
    } catch (err) {
      next(err);
    }
  };
}
