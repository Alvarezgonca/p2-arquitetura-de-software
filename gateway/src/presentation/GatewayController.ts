import { Request, Response } from 'express';
import { DownstreamResponse, HttpServiceClient } from '../infra/HttpServiceClient';

/**
 * Controlador do gateway. Faz o roteamento para os microsserviços e
 * agrega dados. Em qualquer falha a jusante, responde com mensagem
 * AMIGÁVEL (sem detalhes técnicos).
 */
export class GatewayController {
  constructor(
    private readonly menu: HttpServiceClient,
    private readonly orders: HttpServiceClient,
  ) {}

  listMenu = async (_req: Request, res: Response): Promise<void> => {
    try {
      this.forward(res, await this.menu.get('/dishes'));
    } catch {
      this.unavailable(res, 'O cardápio está indisponível no momento. Tente novamente em instantes.');
    }
  };

  createDish = async (req: Request, res: Response): Promise<void> => {
    try {
      this.forward(res, await this.menu.post('/dishes', req.body));
    } catch {
      this.unavailable(res, 'Não foi possível salvar o prato agora. Tente novamente em instantes.');
    }
  };

  listOrders = async (_req: Request, res: Response): Promise<void> => {
    try {
      this.forward(res, await this.orders.get('/orders'));
    } catch {
      this.unavailable(res, 'Os pedidos estão indisponíveis no momento. Tente novamente em instantes.');
    }
  };

  createOrder = async (req: Request, res: Response): Promise<void> => {
    try {
      this.forward(res, await this.orders.post('/orders', req.body));
    } catch {
      this.unavailable(res, 'Não foi possível registrar o pedido agora. Tente novamente em instantes.');
    }
  };

  listDiscounts = async (_req: Request, res: Response): Promise<void> => {
    try {
      this.forward(res, await this.orders.get('/discounts'));
    } catch {
      // Fallback estático para não travar a tela de pedidos.
      res.json({ data: ['NENHUM', 'PERCENTUAL_10', 'COMBO_FAMILIA'] });
    }
  };

  /**
   * Agregação com degradação parcial: combina cardápio + pedidos. Se um
   * serviço estiver fora, a seção dele vem marcada como indisponível, mas
   * o restante do painel continua funcionando.
   */
  dashboard = async (_req: Request, res: Response): Promise<void> => {
    const [menuResult, ordersResult] = await Promise.allSettled([
      this.menu.get('/dishes'),
      this.orders.get('/orders'),
    ]);

    const menu =
      menuResult.status === 'fulfilled' && menuResult.value.status < 400
        ? { available: true, totalDishes: countData(menuResult.value.data) }
        : { available: false };

    const orders =
      ordersResult.status === 'fulfilled' && ordersResult.value.status < 400
        ? summarizeOrders(ordersResult.value.data)
        : { available: false };

    res.json({ data: { menu, orders } });
  };

  health = async (_req: Request, res: Response): Promise<void> => {
    res.json({
      service: 'gateway',
      status: 'ok',
      downstream: { menu: this.menu.state(), orders: this.orders.state() },
    });
  };

  private forward(res: Response, result: DownstreamResponse): void {
    res.status(result.status).json(result.data);
  }

  private unavailable(res: Response, message: string): void {
    res.status(503).json({ error: { code: 'SERVICO_INDISPONIVEL', message } });
  }
}

function countData(payload: unknown): number {
  const data = (payload as { data?: unknown[] } | null)?.data;
  return Array.isArray(data) ? data.length : 0;
}

function summarizeOrders(payload: unknown): {
  available: true;
  totalOrders: number;
  revenueCents: number;
} {
  const data = (payload as { data?: Array<{ totalCents?: number }> } | null)?.data ?? [];
  const list = Array.isArray(data) ? data : [];
  const revenueCents = list.reduce((sum, order) => sum + (Number(order.totalCents) || 0), 0);
  return { available: true, totalOrders: list.length, revenueCents };
}
