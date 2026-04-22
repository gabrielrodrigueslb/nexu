export type SupportTicketType = 'novo' | 'inclusao';
export type SupportTicketStatus = 'active' | 'done';

export type SupportTask = {
  id: string;
  title: string;
  done: boolean;
  endDate?: string;
};

export type SupportTicket = {
  id: string;
  nome: string;
  tipo: SupportTicketType;
  status: SupportTicketStatus;
  csStatus: string;
  produto: string;
  respTec: string;
  createdAt: string;
  updatedAt?: string;
  tasks: SupportTask[];
};

export type SupportTech = {
  id: string;
  name: string;
};

export type TicketListKind = 'active' | 'done' | 'overdue';

export type TimeBucket = {
  lbl: string;
  n: number;
  color: string;
};
