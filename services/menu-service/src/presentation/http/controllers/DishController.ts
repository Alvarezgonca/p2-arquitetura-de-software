import { NextFunction, Request, Response } from 'express';
import { CreateDish } from '../../../application/use-cases/CreateDish';
import { ListDishes } from '../../../application/use-cases/ListDishes';
import { ListCategories } from '../../../application/use-cases/ListCategories';
import { SetDishAvailability } from '../../../application/use-cases/SetDishAvailability';
import { UpdateDish } from '../../../application/use-cases/UpdateDish';
import { DeleteDish } from '../../../application/use-cases/DeleteDish';
import { DishFilter } from '../../../domain/repositories/DishRepository';

/**
 * Adaptador de entrada HTTP. Traduz requisição/resposta para os casos de
 * uso. Não contém regra de negócio (SRP) — só orquestra e delega erros
 * para o tratador central.
 */
export class DishController {
  constructor(
    private readonly createDish: CreateDish,
    private readonly listDishes: ListDishes,
    private readonly listCategories: ListCategories,
    private readonly setAvailability: SetDishAvailability,
    private readonly updateDish: UpdateDish,
    private readonly deleteDish: DeleteDish,
  ) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dishes = await this.listDishes.execute(this.readFilter(req));
      res.json({ data: dishes });
    } catch (err) {
      next(err);
    }
  };

  categories = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const categories = await this.listCategories.execute();
      res.json({ data: categories });
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

  changeAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const available = Boolean((req.body ?? {}).available);
      const dish = await this.setAvailability.execute(req.params.id, available);
      res.json({ data: dish });
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body ?? {};
      const dish = await this.updateDish.execute(req.params.id, {
        name: body.name,
        description: body.description,
        priceCents: body.priceCents,
        category: body.category,
      });
      res.json({ data: dish });
    } catch (err) {
      next(err);
    }
  };

  remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.deleteDish.execute(req.params.id);
      res.json({ data: { removed: true } });
    } catch (err) {
      next(err);
    }
  };

  /** Extrai os filtros suportados a partir da query string. */
  private readFilter(req: Request): DishFilter {
    const filter: DishFilter = {};
    const { category, search, available } = req.query;
    if (typeof category === 'string' && category.trim()) {
      filter.category = category.trim();
    }
    if (typeof search === 'string' && search.trim()) {
      filter.search = search.trim();
    }
    if (available === 'true') filter.available = true;
    if (available === 'false') filter.available = false;
    return filter;
  }
}
