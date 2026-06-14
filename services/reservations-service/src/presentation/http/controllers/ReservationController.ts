import { NextFunction, Request, Response } from 'express';
import { CreateReservation } from '../../../application/use-cases/CreateReservation';
import { ListReservations } from '../../../application/use-cases/ListReservations';
import { UpdateReservationStatus } from '../../../application/use-cases/UpdateReservationStatus';
import { DeleteReservation } from '../../../application/use-cases/DeleteReservation';
import { Reservation } from '../../../domain/entities/Reservation';
import { ReservationFilter } from '../../../domain/repositories/ReservationRepository';

/** Adaptador HTTP de entrada para o agregado Reserva. */
export class ReservationController {
  constructor(
    private readonly createReservation: CreateReservation,
    private readonly listReservations: ListReservations,
    private readonly updateStatus: UpdateReservationStatus,
    private readonly deleteReservation: DeleteReservation,
  ) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filter: ReservationFilter = {};
      if (typeof req.query.status === 'string' && req.query.status.trim()) {
        filter.status = req.query.status.trim();
      }
      if (typeof req.query.date === 'string' && req.query.date.trim()) {
        filter.date = req.query.date.trim();
      }
      const reservations = await this.listReservations.execute(filter);
      res.json({ data: reservations });
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body ?? {};
      const reservation = await this.createReservation.execute({
        customerName: body.customerName,
        phone: body.phone,
        peopleCount: Number(body.peopleCount),
        date: body.date,
        time: body.time,
        area: body.area,
        notes: body.notes,
      });
      res.status(201).json({ data: reservation });
    } catch (err) {
      next(err);
    }
  };

  changeStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const status = (req.body ?? {}).status;
      const reservation = await this.updateStatus.execute(req.params.id, status);
      res.json({ data: reservation });
    } catch (err) {
      next(err);
    }
  };

  remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.deleteReservation.execute(req.params.id);
      res.json({ data: { removed: true } });
    } catch (err) {
      next(err);
    }
  };

  areas = (_req: Request, res: Response): void => {
    res.json({ data: Reservation.areas() });
  };
}
