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
    private readonly reservations: HttpServiceClient,
  ) {}

  listMenu = async (req: Request, res: Response): Promise<void> => {
    try {
      this.forward(res, await this.menu.get(`/dishes${this.queryString(req)}`));
    } catch {
      this.unavailable(res, 'O cardápio está indisponível no momento. Tente novamente em instantes.');
    }
  };

  listCategories = async (_req: Request, res: Response): Promise<void> => {
    try {
      this.forward(res, await this.menu.get('/categories'));
    } catch {
      res.json({ data: [] });
    }
  };

  createDish = async (req: Request, res: Response): Promise<void> => {
    try {
      this.forward(res, await this.menu.post('/dishes', req.body));
    } catch {
      this.unavailable(res, 'Não foi possível salvar o prato agora. Tente novamente em instantes.');
    }
  };

  changeDishAvailability = async (req: Request, res: Response): Promise<void> => {
    try {
      this.forward(res, await this.menu.patch(`/dishes/${req.params.id}/availability`, req.body));
    } catch {
      this.unavailable(res, 'Não foi possível atualizar o prato agora. Tente novamente em instantes.');
    }
  };

  updateDish = async (req: Request, res: Response): Promise<void> => {
    try {
      this.forward(res, await this.menu.put(`/dishes/${req.params.id}`, req.body));
    } catch {
      this.unavailable(res, 'Não foi possível atualizar o prato agora. Tente novamente em instantes.');
    }
  };

  deleteDish = async (req: Request, res: Response): Promise<void> => {
    try {
      this.forward(res, await this.menu.delete(`/dishes/${req.params.id}`));
    } catch {
      this.unavailable(res, 'Não foi possível excluir o prato agora. Tente novamente em instantes.');
    }
  };

  listOrders = async (req: Request, res: Response): Promise<void> => {
    try {
      this.forward(res, await this.orders.get(`/orders${this.queryString(req)}`));
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

  updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      this.forward(res, await this.orders.patch(`/orders/${req.params.id}/status`, req.body));
    } catch {
      this.unavailable(res, 'Não foi possível atualizar o pedido agora. Tente novamente em instantes.');
    }
  };

  deleteOrder = async (req: Request, res: Response): Promise<void> => {
    try {
      this.forward(res, await this.orders.delete(`/orders/${req.params.id}`));
    } catch {
      this.unavailable(res, 'Não foi possível excluir o pedido agora. Tente novamente em instantes.');
    }
  };

  listDiscounts = async (_req: Request, res: Response): Promise<void> => {
    try {
      this.forward(res, await this.orders.get('/discounts'));
    } catch {
      // Fallback estático para não travar a tela de pedidos.
      res.json({ data: ['NENHUM', 'PERCENTUAL_10', 'PERCENTUAL_20', 'COMBO_FAMILIA', 'CUPOM_BEMVINDO'] });
    }
  };

  listReservations = async (req: Request, res: Response): Promise<void> => {
    try {
      this.forward(res, await this.reservations.get(`/reservations${this.queryString(req)}`));
    } catch {
      this.unavailable(res, 'As reservas estão indisponíveis no momento. Tente novamente em instantes.');
    }
  };

  createReservation = async (req: Request, res: Response): Promise<void> => {
    try {
      this.forward(res, await this.reservations.post('/reservations', req.body));
    } catch {
      this.unavailable(res, 'Não foi possível registrar a reserva agora. Tente novamente em instantes.');
    }
  };

  updateReservationStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      this.forward(res, await this.reservations.patch(`/reservations/${req.params.id}/status`, req.body));
    } catch {
      this.unavailable(res, 'Não foi possível atualizar a reserva agora. Tente novamente em instantes.');
    }
  };

  deleteReservation = async (req: Request, res: Response): Promise<void> => {
    try {
      this.forward(res, await this.reservations.delete(`/reservations/${req.params.id}`));
    } catch {
      this.unavailable(res, 'Não foi possível excluir a reserva agora. Tente novamente em instantes.');
    }
  };

  listAreas = async (_req: Request, res: Response): Promise<void> => {
    try {
      this.forward(res, await this.reservations.get('/areas'));
    } catch {
      res.json({ data: ['Salão', 'Varanda', 'Área externa'] });
    }
  };

  /**
   * Agregação com degradação parcial: combina cardápio + pedidos + reservas.
   * Se um serviço estiver fora, a seção dele vem marcada como indisponível,
   * mas o restante do painel continua funcionando.
   */
  dashboard = async (_req: Request, res: Response): Promise<void> => {
    const [menuResult, ordersResult, reservationsResult] = await Promise.allSettled([
      this.menu.get('/dishes'),
      this.orders.get('/orders'),
      this.reservations.get('/reservations'),
    ]);

    const menu =
      menuResult.status === 'fulfilled' && menuResult.value.status < 400
        ? summarizeMenu(menuResult.value.data)
        : { available: false };

    const orders =
      ordersResult.status === 'fulfilled' && ordersResult.value.status < 400
        ? summarizeOrders(ordersResult.value.data)
        : { available: false };

    const reservations =
      reservationsResult.status === 'fulfilled' && reservationsResult.value.status < 400
        ? summarizeReservations(reservationsResult.value.data)
        : { available: false };

    res.json({ data: { menu, orders, reservations } });
  };

  health = async (_req: Request, res: Response): Promise<void> => {
    res.json({
      service: 'gateway',
      status: 'ok',
      downstream: {
        menu: this.menu.state(),
        orders: this.orders.state(),
        reservations: this.reservations.state(),
      },
    });
  };

  private forward(res: Response, result: DownstreamResponse): void {
    res.status(result.status).json(result.data);
  }

  private unavailable(res: Response, message: string): void {
    res.status(503).json({ error: { code: 'SERVICO_INDISPONIVEL', message } });
  }

  /** Repassa apenas os parâmetros de filtro conhecidos, já sanitizados. */
  private queryString(req: Request): string {
    const allowed = ['category', 'search', 'available', 'status', 'date'];
    const params = new URLSearchParams();
    for (const key of allowed) {
      const value = req.query[key];
      if (typeof value === 'string' && value.trim()) {
        params.set(key, value.trim());
      }
    }
    const query = params.toString();
    return query ? `?${query}` : '';
  }
}

interface OrderSummary {
  totalCents?: number;
  status?: string;
  items?: Array<{ name?: string; quantity?: number }>;
}

function summarizeMenu(payload: unknown): {
  available: true;
  totalDishes: number;
  availableDishes: number;
} {
  const data = (payload as { data?: Array<{ available?: boolean }> } | null)?.data ?? [];
  const list = Array.isArray(data) ? data : [];
  const availableDishes = list.filter((dish) => dish.available !== false).length;
  return { available: true, totalDishes: list.length, availableDishes };
}

function summarizeOrders(payload: unknown): {
  available: true;
  totalOrders: number;
  revenueCents: number;
  averageTicketCents: number;
  byStatus: Record<string, number>;
  topDishes: Array<{ name: string; quantity: number }>;
} {
  const data = (payload as { data?: OrderSummary[] } | null)?.data ?? [];
  const list = Array.isArray(data) ? data : [];

  // Pedidos cancelados não entram no faturamento.
  const billable = list.filter((order) => order.status !== 'CANCELADO');
  const revenueCents = billable.reduce((sum, order) => sum + (Number(order.totalCents) || 0), 0);
  const averageTicketCents = billable.length ? Math.round(revenueCents / billable.length) : 0;

  const byStatus: Record<string, number> = {};
  for (const order of list) {
    const status = order.status || 'RECEBIDO';
    byStatus[status] = (byStatus[status] || 0) + 1;
  }

  const quantities = new Map<string, number>();
  for (const order of list) {
    for (const item of order.items ?? []) {
      const name = item.name || 'Item';
      quantities.set(name, (quantities.get(name) || 0) + (Number(item.quantity) || 0));
    }
  }
  const topDishes = [...quantities.entries()]
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  return {
    available: true,
    totalOrders: list.length,
    revenueCents,
    averageTicketCents,
    byStatus,
    topDishes,
  };
}

interface ReservationSummary {
  status?: string;
  peopleCount?: number;
}

function summarizeReservations(payload: unknown): {
  available: true;
  totalReservations: number;
  upcomingGuests: number;
  byStatus: Record<string, number>;
} {
  const data = (payload as { data?: ReservationSummary[] } | null)?.data ?? [];
  const list = Array.isArray(data) ? data : [];

  const byStatus: Record<string, number> = {};
  for (const reservation of list) {
    const status = reservation.status || 'PENDENTE';
    byStatus[status] = (byStatus[status] || 0) + 1;
  }

  // Convidados esperados = reservas ainda ativas (pendentes ou confirmadas).
  const upcomingGuests = list
    .filter((r) => r.status === 'PENDENTE' || r.status === 'CONFIRMADA')
    .reduce((sum, r) => sum + (Number(r.peopleCount) || 0), 0);

  return {
    available: true,
    totalReservations: list.length,
    upcomingGuests,
    byStatus,
  };
}
