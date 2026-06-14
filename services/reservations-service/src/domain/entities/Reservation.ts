import { randomUUID } from 'node:crypto';
import { DomainError } from '../errors/DomainError';

export interface ReservationProps {
  id: string;
  customerName: string;
  phone: string;
  peopleCount: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  area: string;
  notes: string;
  status: string;
  createdAt: string;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;
const MAX_PEOPLE = 20;
const AREAS = ['Salão', 'Varanda', 'Área externa'];

/**
 * Entidade de domínio "Reserva de mesa".
 *
 * Concentra as regras do agendamento (capacidade, data/hora, área e a
 * máquina de estados). Não conhece Express nem banco — é o núcleo da
 * Arquitetura Limpa.
 */
export class Reservation {
  /**
   * Máquina de estados da reserva. A regra de quais transições são
   * permitidas mora aqui, no domínio (Tell, Don't Ask).
   */
  private static readonly TRANSITIONS: Record<string, readonly string[]> = {
    PENDENTE: ['CONFIRMADA', 'CANCELADA'],
    CONFIRMADA: ['CONCLUIDA', 'CANCELADA'],
    CONCLUIDA: [],
    CANCELADA: [],
  };

  static readonly STATUSES = Object.keys(Reservation.TRANSITIONS);

  private constructor(private readonly props: ReservationProps) {}

  static create(input: {
    customerName: string;
    phone?: string;
    peopleCount: number;
    date: string;
    time: string;
    area?: string;
    notes?: string;
  }): Reservation {
    const customerName = (input.customerName ?? '').trim();
    if (customerName.length < 2) {
      throw new DomainError('Informe o nome de quem reserva (mínimo 2 caracteres).');
    }
    if (!Number.isInteger(input.peopleCount) || input.peopleCount < 1 || input.peopleCount > MAX_PEOPLE) {
      throw new DomainError(`A reserva deve ser para 1 a ${MAX_PEOPLE} pessoas.`);
    }
    const date = (input.date ?? '').trim();
    if (!DATE_RE.test(date)) {
      throw new DomainError('Informe uma data válida para a reserva.');
    }
    const time = (input.time ?? '').trim();
    if (!TIME_RE.test(time)) {
      throw new DomainError('Informe um horário válido para a reserva.');
    }
    const area = (input.area ?? '').trim() || AREAS[0];
    if (!AREAS.includes(area)) {
      throw new DomainError(`Área inválida. Escolha entre: ${AREAS.join(', ')}.`);
    }

    return new Reservation({
      id: randomUUID(),
      customerName,
      phone: (input.phone ?? '').trim(),
      peopleCount: input.peopleCount,
      date,
      time,
      area,
      notes: (input.notes ?? '').trim(),
      status: 'PENDENTE',
      createdAt: new Date().toISOString(),
    });
  }

  static restore(props: ReservationProps): Reservation {
    return new Reservation(props);
  }

  /** Lista as áreas disponíveis para reserva (fonte única da verdade). */
  static areas(): string[] {
    return [...AREAS];
  }

  /**
   * Avança a reserva para o próximo status respeitando a máquina de estados.
   * Lança DomainError se a transição não for permitida.
   */
  changeStatus(next: string): void {
    const target = (next ?? '').toUpperCase();
    const allowed = Reservation.TRANSITIONS[this.props.status] ?? [];
    if (!allowed.includes(target)) {
      throw new DomainError(
        `Transição de status inválida: de "${this.props.status}" para "${target || '—'}".`,
      );
    }
    this.props.status = target;
  }

  get id(): string {
    return this.props.id;
  }

  get status(): string {
    return this.props.status;
  }

  get date(): string {
    return this.props.date;
  }

  toJSON(): ReservationProps {
    return { ...this.props };
  }
}
