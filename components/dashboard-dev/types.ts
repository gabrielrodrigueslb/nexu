export const DEV_COLS = [
  'Backlog',
  'Em Desenvolvimento',
  'Code Review',
  'QA',
  'Concluido',
] as const;

export type DevStatus = (typeof DEV_COLS)[number];
export type DevType = 'Feature' | 'Task' | 'Bug';
export type Complexity = 'Simples' | 'Media' | 'Complexa';
export type DevListKind = 'open' | 'done' | 'overdue';

export type DevUser = {
  id: string;
  name: string;
};

export type Sprint = {
  id: string;
  name: string;
  start: string;
  end: string;
  goal?: string;
  closed: boolean;
};

export type DevTicket = {
  id: number;
  title: string;
  devStatus: DevStatus;
  devType: DevType;
  category: string;
  complexity: Complexity;
  resp: string;
  createdAt: string;
  updatedAt?: string;
  deadline?: string;
  totalPts: number;
  sprintId?: string;
  docDone?: boolean;
  prodBug?: boolean;
  reopened?: boolean;
  incident?: boolean;
  compliment?: boolean;
  criticalBug?: boolean;
};

export type ResolutionBucket = {
  lbl: string;
  n: number;
  color: string;
};
