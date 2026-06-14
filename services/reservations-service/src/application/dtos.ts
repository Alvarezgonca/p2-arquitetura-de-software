/** Objetos de transporte entre a camada de aplicação e as bordas. */

export interface CreateReservationInput {
  customerName: string;
  phone?: string;
  peopleCount: number;
  date: string;
  time: string;
  area?: string;
  notes?: string;
}

export interface ReservationOutput {
  id: string;
  customerName: string;
  phone: string;
  peopleCount: number;
  date: string;
  time: string;
  area: string;
  notes: string;
  status: string;
  createdAt: string;
}
