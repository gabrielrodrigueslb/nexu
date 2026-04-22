import type { Lead } from '@/components/types';

export type CommercialTaskType =
  | 'reuniao'
  | 'ligacao'
  | 'whatsapp'
  | 'email'
  | 'demo'
  | 'follow'
  | 'visita'
  | 'outro';

export type CommercialLeadTask = {
  id: string;
  title: string;
  type: CommercialTaskType;
  done: boolean;
  date?: string;
  notes?: string;
};

export type CommercialComment = {
  id: string;
  author: string;
  message: string;
  createdAt: string;
};

export type CommercialPriceRow = {
  id: string;
  name: string;
  enabled: boolean;
  setup: number;
  recurring: number;
};

export type CommercialLeadRecord = Omit<Lead, 'tasks'> & {
  phone?: string;
  installment?: string;
  consultant?: string;
  validUntil?: string;
  agents?: number;
  supervisors?: number;
  admins?: number;
  observations?: string;
  representativeId?: string;
  representativeCommission?: number;
  indicatorId?: string;
  passThroughAmount?: number;
  products: CommercialPriceRow[];
  integrations: CommercialPriceRow[];
  comments: CommercialComment[];
  lossReason?: string;
  tasks: CommercialLeadTask[];
};

export const COMMERCIAL_TASK_TYPES: Array<{
  id: CommercialTaskType;
  label: string;
  icon: string;
}> = [
  { id: 'reuniao', label: 'Reunião', icon: 'handshake' },
  { id: 'ligacao', label: 'Ligacao', icon: 'phone' },
  { id: 'whatsapp', label: 'WhatsApp', icon: 'message-circle' },
  { id: 'email', label: 'E-mail', icon: 'mail' },
  { id: 'demo', label: 'Demo', icon: 'monitor' },
  { id: 'follow', label: 'Follow-up', icon: 'refresh-cw' },
  { id: 'visita', label: 'Visita', icon: 'car' },
  { id: 'outro', label: 'Outro', icon: 'pin' },
];

export const PRODUCT_CATALOG = [
  'Implantacao',
  'URA',
  'Consultoria',
  'Importacao de Contato',
  'CRM',
  'PABX',
] as const;

export const INTEGRATION_CATALOG = [
  'WhatsApp Oficial',
  'Meta Ads',
  'ERP',
  'Webhook Financeiro',
  'API Atendimento',
] as const;

export function createEmptyPriceRows(values: readonly string[]): CommercialPriceRow[] {
  return values.map((name) => ({
    id: name.toLowerCase().replace(/\s+/g, '-'),
    name,
    enabled: false,
    setup: 0,
    recurring: 0,
  }));
}

export function toCommercialLeadRecord(lead: Lead): CommercialLeadRecord {
  return {
    ...lead,
    phone: undefined,
    installment: undefined,
    consultant: undefined,
    validUntil: undefined,
    agents: 0,
    supervisors: 0,
    admins: 0,
    observations: undefined,
    representativeId: undefined,
    representativeCommission: 0,
    indicatorId: undefined,
    passThroughAmount: 0,
    products: createEmptyPriceRows(PRODUCT_CATALOG),
    integrations: createEmptyPriceRows(INTEGRATION_CATALOG),
    comments: [],
    tasks: lead.tasks.map((task, index) => ({
      id: `${lead.id}-task-${index + 1}`,
      title: task.title,
      type: task.type,
      done: task.done,
      date: task.date,
      notes: '',
    })),
  };
}

export function computeLeadTotals(lead: Pick<CommercialLeadRecord, 'products' | 'integrations'>) {
  const selectedProducts = lead.products.filter((item) => item.enabled);
  const selectedIntegrations = lead.integrations.filter((item) => item.enabled);

  const productSetup = selectedProducts.reduce((sum, item) => sum + item.setup, 0);
  const productRecurring = selectedProducts.reduce((sum, item) => sum + item.recurring, 0);
  const integrationSetup = selectedIntegrations.reduce((sum, item) => sum + item.setup, 0);
  const integrationRecurring = selectedIntegrations.reduce(
    (sum, item) => sum + item.recurring,
    0,
  );

  const totalSetup = productSetup + integrationSetup;
  const totalRecurring = productRecurring + integrationRecurring;

  return {
    productSetup,
    productRecurring,
    integrationSetup,
    integrationRecurring,
    totalSetup,
    totalRecurring,
    grandTotal: totalSetup + totalRecurring,
  };
}

export function cloneLeadRecord(lead: CommercialLeadRecord): CommercialLeadRecord {
  return {
    ...lead,
    products: lead.products.map((item) => ({ ...item })),
    integrations: lead.integrations.map((item) => ({ ...item })),
    tasks: lead.tasks.map((task) => ({ ...task })),
    comments: lead.comments.map((comment) => ({ ...comment })),
  };
}

export function makeLeadId(current: CommercialLeadRecord[]) {
  const next = current.length + 1;
  return `L${next}`;
}

export function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function makeCommercialTicketCode() {
  const suffix = Date.now().toString().slice(-6);
  return `COM-${suffix}`;
}
