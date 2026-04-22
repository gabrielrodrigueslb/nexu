'use client';

import { apiRequest } from '@/lib/api-client';

import type { ActivityType, Lead, Ticket, User } from '@/components/types';
import { createEmptyPriceRows, type CommercialLeadRecord, type CommercialPriceRow } from './types';

type BackendDirectoryUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  sector: string;
  isActive: boolean;
};

type BackendCatalogItem = {
  id: string;
  name: string;
  type: 'PRODUCT' | 'INTEGRATION';
  active: boolean;
};

type BackendLookupPayload = {
  origins: Array<{ id: string; name: string; active: boolean }>;
  sdrs: Array<{ id: string; name: string; active: boolean }>;
  indicators: Array<{ id: string; name: string; percentSetup: number; active: boolean }>;
  products: BackendCatalogItem[];
  integrations: BackendCatalogItem[];
};

type BackendLeadTask = {
  id: string;
  title: string;
  type: string;
  done: boolean;
  dueDate?: string | null;
  notes?: string | null;
};

type BackendLeadComment = {
  id: string;
  message: string;
  createdAt: string;
  author?: {
    id: string;
    name: string;
    email?: string;
  } | null;
};

type BackendLeadCatalogItem = {
  id: string;
  enabled: boolean;
  setupInCents: number;
  recurringInCents: number;
  catalogItem: BackendCatalogItem;
};

type BackendLead = {
  id: string;
  company: string;
  cnpj?: string | null;
  contact?: string | null;
  email?: string | null;
  phone?: string | null;
  createdAt: string;
  updatedAt: string;
  status: Lead['status'];
  value: number;
  sdrId?: string | null;
  paymentMethod?: string | null;
  isLite?: boolean;
  wonAt?: string | null;
  lostAt?: string | null;
  seller?: { id: string; name: string } | null;
  sdr?: { id: string; name: string } | null;
  origin?: { id: string; name: string } | null;
  indicator?: { id: string; name: string } | null;
  installment?: string | null;
  consultant?: string | null;
  validUntil?: string | null;
  agents?: number;
  supervisors?: number;
  admins?: number;
  observations?: string | null;
  representativeId?: string | null;
  representativeCommission?: number;
  passThroughAmount?: number;
  lossReason?: string | null;
  generatedTicketId?: string | null;
  tasks?: BackendLeadTask[];
  comments?: BackendLeadComment[];
  catalogItems?: BackendLeadCatalogItem[];
  ticket?: {
    id: string;
    code: string;
    status: Ticket['status'];
    createdById?: string;
    assigneeId?: string;
    setupAmount: number;
    recurringAmount: number;
    createdAt: string;
  } | null;
};

type BackendTicket = {
  id: string;
  code: string;
  status: Ticket['status'];
  createdBy?: { id: string } | null;
  assignee?: { id: string } | null;
  setupAmount: number;
  recurringAmount: number;
  createdAt: string;
};

export type CommercialLookups = {
  users: User[];
  origins: Array<{ id: string; name: string; active: boolean }>;
  sdrs: Array<{ id: string; name: string; active: boolean }>;
  indicators: Array<{ id: string; name: string; percentSetup: number; active: boolean }>;
  products: BackendCatalogItem[];
  integrations: BackendCatalogItem[];
  catalogItemMap: Record<string, BackendCatalogItem>;
};

function toDateOnly(value?: string | null) {
  if (!value) return '';
  return value.slice(0, 10);
}

function toDateTimeLocal(value?: string | null) {
  if (!value) return '';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  const offsetMs = parsed.getTimezoneOffset() * 60_000;
  return new Date(parsed.getTime() - offsetMs).toISOString().slice(0, 16);
}

function toDisplayDateTime(value?: string | null) {
  if (!value) return '';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function centsToAmount(value: number) {
  return value / 100;
}

function buildPriceRows(
  items: BackendLeadCatalogItem[] | undefined,
  catalog: BackendCatalogItem[],
  type: 'PRODUCT' | 'INTEGRATION',
) {
  const selectedItems = items?.filter((item) => item.catalogItem.type === type) ?? [];
  const selectedByName = new Map(selectedItems.map((item) => [item.catalogItem.name, item]));

  return catalog.map((catalogItem): CommercialPriceRow => {
    const current = selectedByName.get(catalogItem.name);

    return {
      id: catalogItem.id,
      name: catalogItem.name,
      enabled: current?.enabled ?? false,
      setup: current ? centsToAmount(current.setupInCents) : 0,
      recurring: current ? centsToAmount(current.recurringInCents) : 0,
    };
  });
}

export function formatBackendDate(value?: string | null) {
  if (!value) return '-';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export async function fetchCommercialLookups(): Promise<CommercialLookups> {
  const [lookupPayload, usersPayload] = await Promise.all([
    apiRequest('/api/backend/catalog/lookups') as Promise<BackendLookupPayload>,
    apiRequest('/api/backend/users/directory?active=true') as Promise<{
      items: BackendDirectoryUser[];
    }>,
  ]);

  const users: User[] = (usersPayload.items || []).map((user) => ({
    id: user.id,
    name: user.name,
    sector: user.sector,
  }));
  const sdrs = (usersPayload.items || [])
    .filter((user) => String(user.role || '').trim().toLowerCase() === 'sdr')
    .map((user) => ({
      id: user.id,
      name: user.name,
      active: user.isActive,
    }));
  const catalogItemMap = Object.fromEntries(
    [...lookupPayload.products, ...lookupPayload.integrations].map((item) => [item.id, item]),
  );

  return {
    users,
    origins: lookupPayload.origins || [],
    sdrs,
    indicators: lookupPayload.indicators || [],
    products: lookupPayload.products || [],
    integrations: lookupPayload.integrations || [],
    catalogItemMap,
  };
}

export function mapBackendLeadToCommercialLead(
  lead: BackendLead,
  lookups: Pick<CommercialLookups, 'products' | 'integrations'>,
): CommercialLeadRecord {
  return {
    id: lead.id,
    company: lead.company,
    cnpj: lead.cnpj ?? undefined,
    contact: lead.contact ?? undefined,
    phone: lead.phone ?? undefined,
    createdAt: toDateOnly(lead.createdAt),
    status: lead.status,
    value: lead.value,
    sellerId: lead.seller?.id ?? undefined,
    sdrId: lead.sdr?.id ?? lead.sdrId ?? undefined,
    originId: lead.origin?.id ?? undefined,
    paymentMethod: lead.paymentMethod ?? undefined,
    isLite: lead.isLite ?? false,
    wonAt: lead.wonAt ?? undefined,
    lostAt: lead.lostAt ?? undefined,
    lossReason: lead.lossReason ?? undefined,
    generatedTicketId: lead.generatedTicketId ?? lead.ticket?.code ?? undefined,
    installment: lead.installment ?? undefined,
    consultant: lead.consultant ?? undefined,
    validUntil: lead.validUntil ?? undefined,
    agents: lead.agents ?? 0,
    supervisors: lead.supervisors ?? 0,
    admins: lead.admins ?? 0,
    observations: lead.observations ?? undefined,
    representativeId: lead.representativeId ?? undefined,
    representativeCommission: lead.representativeCommission ?? 0,
    indicatorId: lead.indicator?.id ?? undefined,
    passThroughAmount: lead.passThroughAmount ?? 0,
    products: buildPriceRows(lead.catalogItems, lookups.products, 'PRODUCT'),
    integrations: buildPriceRows(lead.catalogItems, lookups.integrations, 'INTEGRATION'),
    comments: (lead.comments || []).map((comment) => ({
      id: comment.id,
      author: comment.author?.name || 'Usuário',
      message: comment.message,
      createdAt: toDisplayDateTime(comment.createdAt),
    })),
    tasks: (lead.tasks || []).map((task) => ({
      id: task.id,
      title: task.title,
      type: task.type as ActivityType,
      done: task.done,
      date: toDateTimeLocal(task.dueDate),
      notes: task.notes ?? '',
    })),
  };
}

export function mapCommercialLeadToPayload(
  lead: CommercialLeadRecord,
  lookups: Pick<CommercialLookups, 'products' | 'integrations'>,
) {
  const catalogByName = new Map(
    [...lookups.products, ...lookups.integrations].map((item) => [item.name, item]),
  );
  const catalogItems = [...lead.products, ...lead.integrations]
    .map((row) => {
      const catalogItem = catalogByName.get(row.name);
      if (!catalogItem) {
        return null;
      }

      return {
        catalogItemId: catalogItem.id,
        enabled: row.enabled,
        setupAmount: row.setup || 0,
        recurringAmount: row.recurring || 0,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return {
    company: lead.company,
    cnpj: lead.cnpj || null,
    contact: lead.contact || null,
    email: null,
    phone: lead.phone || null,
    status: lead.status,
    value: lead.value || 0,
    paymentMethod: lead.paymentMethod || null,
    installment: lead.installment || null,
    isLite: lead.isLite ?? false,
    sellerId: lead.sellerId || null,
    sdrId: lead.sdrId || null,
    originId: lead.originId || null,
    indicatorId: lead.indicatorId || lead.representativeId || null,
    consultant: lead.consultant || null,
    validUntil: lead.validUntil || null,
    agents: lead.agents || 0,
    supervisors: lead.supervisors || 0,
    admins: lead.admins || 0,
    observations: lead.observations || null,
    representativeId: lead.representativeId || null,
    representativeCommission: lead.representativeCommission || 0,
    passThroughAmount: lead.passThroughAmount || 0,
    lossReason: lead.lossReason || null,
    wonAt: lead.status === 'Ganho' ? lead.wonAt || new Date().toISOString() : null,
    lostAt: lead.status === 'Perdido' ? new Date().toISOString() : null,
    tasks: lead.tasks.map((task) => ({
      title: task.title,
      type: task.type,
      done: task.done,
      dueDate: task.date ? new Date(task.date).toISOString() : null,
      notes: task.notes || null,
    })),
    catalogItems,
  };
}

export function mapBackendLeadToDashboardLead(lead: BackendLead): Lead {
  return {
    id: lead.id,
    company: lead.company,
    cnpj: lead.cnpj ?? undefined,
    contact: lead.contact ?? undefined,
    createdAt: lead.createdAt,
    status: lead.status,
    value: lead.value,
    sellerId: lead.seller?.id ?? undefined,
    sdrId: lead.sdr?.id ?? lead.sdrId ?? undefined,
    originId: lead.origin?.id ?? undefined,
    paymentMethod: lead.paymentMethod ?? undefined,
    isLite: lead.isLite ?? false,
    wonAt: lead.wonAt ?? undefined,
    lostAt: lead.lostAt ?? undefined,
    generatedTicketId: lead.generatedTicketId ?? undefined,
    tasks: (lead.tasks || [])
      .filter((task) => ['reuniao', 'demo', 'visita'].includes(task.type))
      .map((task) => ({
        title: task.title,
        type: task.type as ActivityType,
        done: task.done,
        date: task.dueDate ? task.dueDate.slice(0, 10) : '',
      })),
  };
}

export function mapBackendLeadTicketToDashboardTicket(lead: BackendLead): Ticket | null {
  if (!lead.ticket) return null;

  return {
    id: lead.ticket.id,
    createdAt: lead.ticket.createdAt,
    status: lead.ticket.status,
    createdBy: lead.ticket.createdById || lead.seller?.id || '',
    assignee: lead.ticket.assigneeId || lead.seller?.id || '',
    setupAmount: lead.ticket.setupAmount,
    recurringAmount: lead.ticket.recurringAmount,
  };
}

export async function fetchCommercialLeads(limit = 100) {
  const payload = await apiRequest(`/api/backend/leads?page=1&limit=${limit}`);
  return (payload.items || []) as BackendLead[];
}

export async function saveCommercialLead(
  lead: CommercialLeadRecord,
  lookups: Pick<CommercialLookups, 'products' | 'integrations'>,
) {
  const payload = mapCommercialLeadToPayload(lead, lookups);
  const path = lead.id ? `/api/backend/leads/${lead.id}` : '/api/backend/leads';
  const method = lead.id ? 'PATCH' : 'POST';
  const response = (await apiRequest(path, {
    method,
    body: JSON.stringify(payload),
  })) as { item: BackendLead };

  return response.item;
}

export async function updateLeadStatus(
  lead: CommercialLeadRecord,
  lookups: Pick<CommercialLookups, 'products' | 'integrations'>,
  patch: Partial<CommercialLeadRecord>,
) {
  const response = (await apiRequest(`/api/backend/leads/${lead.id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      ...mapCommercialLeadToPayload({ ...lead, ...patch }, lookups),
      ...('status' in patch ? { status: patch.status } : {}),
      ...('lossReason' in patch ? { lossReason: patch.lossReason } : {}),
    }),
  })) as { item: BackendLead };

  return response.item;
}

export async function createLeadComment(leadId: string, message: string) {
  const response = (await apiRequest(`/api/backend/leads/${leadId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  })) as { item: BackendLeadComment };

  return response.item;
}

export async function fetchDashboardTickets(limit = 100) {
  try {
    const payload = (await apiRequest(`/api/backend/tickets?page=1&limit=${limit}`)) as {
      items: BackendTicket[];
    };

    return (payload.items || []).map(
      (ticket): Ticket => ({
        id: ticket.id,
        createdAt: ticket.createdAt,
        status: ticket.status,
        createdBy: ticket.createdBy?.id || '',
        assignee: ticket.assignee?.id || '',
        setupAmount: ticket.setupAmount,
        recurringAmount: ticket.recurringAmount,
      }),
    );
  } catch {
    return [];
  }
}

export function buildEmptyLeadFromLookups(
  products: BackendCatalogItem[],
  integrations: BackendCatalogItem[],
): CommercialLeadRecord {
  return {
    id: '',
    company: '',
    cnpj: '',
    contact: '',
    phone: '',
    createdAt: toDateOnly(new Date().toISOString()),
    status: 'Leads',
    value: 0,
    paymentMethod: '',
    installment: '',
    sellerId: '',
    sdrId: '',
    originId: '',
    consultant: '',
    validUntil: '',
    isLite: false,
    agents: 0,
    supervisors: 0,
    admins: 0,
    observations: '',
    representativeId: '',
    representativeCommission: 0,
    indicatorId: '',
    passThroughAmount: 0,
    products: createEmptyPriceRows(products.map((item) => item.name)),
    integrations: createEmptyPriceRows(integrations.map((item) => item.name)),
    comments: [],
    tasks: [],
  };
}
