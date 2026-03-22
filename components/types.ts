export const CRM_COLS = [
  'Leads',
  'Qualificados',
  'Oportunidade Futura',
  'Apresentacao',
  'No Show',
  'Em Negociacao',
] as const;

export const ACT_COLS = ['reuniao', 'demo', 'visita'] as const;

export type LeadStatus = (typeof CRM_COLS)[number] | 'Ganho' | 'Perdido';
export type ActivityType = (typeof ACT_COLS)[number];
export type TicketStatus =
  | 'pendente_financeiro'
  | 'pagamento_confirmado'
  | 'em_implantacao'
  | 'concluido'
  | 'cancelado';

export type User = { id: string; name: string; sector: string };
export type Origin = { id: string; name: string };
export type SDR = { id: string; name: string };

export type LeadTask = {
  title: string;
  type: ActivityType;
  done: boolean;
  date: string;
};

export type Lead = {
  id: string;
  company: string;
  createdAt: string;
  status: LeadStatus;
  value: number;
  sellerId?: string;
  sdrId?: string;
  originId?: string;
  tasks: LeadTask[];
};

export type Ticket = {
  id: string;
  createdAt: string;
  status: TicketStatus;
  createdBy: string;
  assignee: string;
  setupAmount: number;
  recurringAmount: number;
};

export type GoalsState = {
  leadsTotal: number;
  salesTotal: number;
  sdrs: Record<string, number>;
  sellers: Record<string, number>;
  activitiesMeta: number;
  activitiesIndividual: Record<string, number>;
};
