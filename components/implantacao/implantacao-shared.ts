'use client';

import { useEffect, useState } from 'react';

import { apiRequest } from '@/lib/api-client';
import type { SupportTask, SupportTicketType } from '@/components/dashboard-support/types';

export const IMPLANTACAO_COLUMNS = ['Briefing', 'Configuração', 'Treinamento', 'Go-live'] as const;

export type ImplantacaoColumn = (typeof IMPLANTACAO_COLUMNS)[number];

export type ImplantacaoTask = SupportTask & {
  assigneeId?: string;
  category: 'produto' | 'integracao' | 'operacional';
};

export type ImplantacaoHistoryItem = {
  id: string;
  actor?: string;
  message: string;
  createdAt: string;
};

export type ImplantacaoAttachment = {
  id: string;
  name: string;
  subtitle?: string;
};

export type ImplantacaoComment = {
  id: string;
  author: string;
  message: string;
  createdAt: string;
};

export type ImplantacaoValueRow = {
  id: string;
  name: string;
  setup: number;
  recurring: number;
};

export type ImplantacaoTicket = {
  id: string;
  proto: string;
  nome: string;
  tipo: SupportTicketType;
  status: 'active' | 'done';
  csStatus: ImplantacaoColumn | 'Concluído';
  produto: string;
  respTec: string;
  createdAt: string;
  updatedAt?: string;
  cnpj: string;
  telefone: string;
  email: string;
  site: string;
  instancia: string;
  plano: string;
  formaPagamento: string;
  respSolicitacao: string;
  observacao: string;
  tasks: ImplantacaoTask[];
  products: ImplantacaoValueRow[];
  integrations: ImplantacaoValueRow[];
  attachments: ImplantacaoAttachment[];
  comments: ImplantacaoComment[];
  history: ImplantacaoHistoryItem[];
};

type DirectoryUser = {
  id: string;
  name: string;
  sector: string;
};

type BackendCatalogItem = {
  id: string;
  enabled: boolean;
  setupInCents: number;
  recurringInCents: number;
  catalogItem: {
    id: string;
    name: string;
    type: 'PRODUCT' | 'INTEGRATION';
  };
};

type BackendTicket = {
  id: string;
  code: string;
  type: 'novo' | 'upsell' | 'renovacao';
  status: 'pendente_financeiro' | 'pagamento_confirmado' | 'em_implantacao' | 'concluido' | 'cancelado';
  csStatus?: string | null;
  company: string;
  cnpj?: string | null;
  contact?: string | null;
  email?: string | null;
  phone?: string | null;
  instance?: string | null;
  plan?: string | null;
  paymentMethod?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  assignee?: { id: string; name: string } | null;
  technicalAssignee?: { id: string; name: string } | null;
  lead?: {
    seller?: { id: string; name: string } | null;
    catalogItems?: BackendCatalogItem[];
  } | null;
  tasks?: Array<{
    id: string;
    title: string;
    done: boolean;
    dueDate?: string | null;
    assignee?: { id: string; name: string } | null;
  }>;
  comments?: Array<{
    id: string;
    message: string;
    createdAt: string;
    author?: { id: string; name: string } | null;
  }>;
};

let techDirectory: Array<{ id: string; name: string }> = [];

function mapStage(ticket: BackendTicket): ImplantacaoTicket['csStatus'] {
  if (ticket.status === 'concluido') return 'Concluído';
  if (ticket.csStatus === 'Configuração') return 'Configuração';
  if (ticket.csStatus === 'Treinamento') return 'Treinamento';
  if (ticket.csStatus === 'Go-live') return 'Go-live';
  return 'Briefing';
}

function buildHistory(ticket: BackendTicket, techName: string) {
  const items: ImplantacaoHistoryItem[] = [
    {
      id: `${ticket.id}-history-created`,
      actor: ticket.assignee?.name || techName,
      message: 'Ticket criado.',
      createdAt: ticket.createdAt,
    },
  ];

  if (ticket.updatedAt !== ticket.createdAt) {
    items.push({
      id: `${ticket.id}-history-updated`,
      actor: techName,
      message:
        ticket.status === 'concluido'
          ? 'Implantação concluída.'
          : `Status atual: ${ticket.csStatus || 'Briefing'}.`,
      createdAt: ticket.updatedAt,
    });
  }

  return items;
}

function mapTicket(ticket: BackendTicket): ImplantacaoTicket {
  const technicalId = ticket.technicalAssignee?.id || ticket.assignee?.id || '';
  const techName = ticket.technicalAssignee?.name || ticket.assignee?.name || 'Sem responsável';
  const products = (ticket.lead?.catalogItems || [])
    .filter((item) => item.catalogItem.type === 'PRODUCT' && item.enabled)
    .map((item) => ({
      id: item.id,
      name: item.catalogItem.name,
      setup: item.setupInCents / 100,
      recurring: item.recurringInCents / 100,
    }));
  const integrations = (ticket.lead?.catalogItems || [])
    .filter((item) => item.catalogItem.type === 'INTEGRATION' && item.enabled)
    .map((item) => ({
      id: item.id,
      name: item.catalogItem.name,
      setup: item.setupInCents / 100,
      recurring: item.recurringInCents / 100,
    }));

  return {
    id: ticket.id,
    proto: ticket.code,
    nome: ticket.company,
    tipo: ticket.type === 'upsell' ? 'inclusao' : 'novo',
    status: ticket.status === 'concluido' ? 'done' : 'active',
    csStatus: mapStage(ticket),
    produto: products[0]?.name || integrations[0]?.name || ticket.plan || 'Implantação',
    respTec: technicalId,
    createdAt: ticket.createdAt.slice(0, 10),
    updatedAt: ticket.updatedAt?.slice(0, 10),
    cnpj: ticket.cnpj || '-',
    telefone: ticket.phone || '-',
    email: ticket.email || '-',
    site: ticket.company ? `https://${ticket.company.toLowerCase().replace(/[^a-z0-9]+/g, '')}.com.br` : '-',
    instancia: ticket.instance || '-',
    plano: ticket.plan || '-',
    formaPagamento: ticket.paymentMethod || '-',
    respSolicitacao: ticket.lead?.seller?.name || ticket.assignee?.name || 'Sem responsável',
    observacao: ticket.notes || 'Sem observações registradas.',
    tasks: (ticket.tasks || []).map((task) => ({
      id: task.id,
      title: task.title,
      done: task.done,
      endDate: task.dueDate ? task.dueDate.slice(0, 10) : undefined,
      assigneeId: task.assignee?.id || technicalId,
      category:
        products.some((item) => item.name === task.title)
          ? 'produto'
          : integrations.some((item) => item.name === task.title)
            ? 'integracao'
            : 'operacional',
    })),
    products,
    integrations,
    attachments: [],
    comments: (ticket.comments || []).map((comment) => ({
      id: comment.id,
      author: comment.author?.name || 'Usuário',
      message: comment.message,
      createdAt: comment.createdAt.slice(0, 10),
    })),
    history: buildHistory(ticket, techName),
  };
}

async function fetchImplantacaoTickets() {
  const [pagamentoPayload, implantacaoPayload, concluidosPayload, usersPayload] = await Promise.all([
    apiRequest('/api/backend/tickets?page=1&limit=100&status=pagamento_confirmado') as Promise<{ items: BackendTicket[] }>,
    apiRequest('/api/backend/tickets?page=1&limit=100&status=em_implantacao') as Promise<{ items: BackendTicket[] }>,
    apiRequest('/api/backend/tickets?page=1&limit=100&status=concluido') as Promise<{ items: BackendTicket[] }>,
    apiRequest('/api/backend/users/directory?active=true') as Promise<{ items: DirectoryUser[] }>,
  ]);

  techDirectory = (usersPayload.items || [])
    .filter((user) => ['Implantacao', 'Desenvolvimento', 'Suporte'].includes(user.sector))
    .map((user) => ({ id: user.id, name: user.name }));

  return [
    ...(pagamentoPayload.items || []),
    ...(implantacaoPayload.items || []),
    ...(concluidosPayload.items || []),
  ].map(mapTicket);
}

export function useImplantacaoTickets() {
  const [tickets, setTickets] = useState<ImplantacaoTicket[]>([]);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const nextTickets = await fetchImplantacaoTickets();
        if (!active) return;
        setTickets(nextTickets);
      } catch {
        if (!active) return;
        setTickets([]);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  return [tickets, setTickets] as const;
}

export function getTicketProgress(ticket: ImplantacaoTicket) {
  if (!ticket.tasks.length) return 0;
  return Math.round((ticket.tasks.filter((task) => task.done).length / ticket.tasks.length) * 100);
}

export function getTechNameById(id?: string) {
  return techDirectory.find((tech) => tech.id === id)?.name ?? 'Sem responsável';
}

export function getTechOptions() {
  return techDirectory;
}

export function inDateRange(value: string | undefined, from: string, to: string) {
  if (!value) return true;
  if (from && value < from) return false;
  if (to && value > to) return false;
  return true;
}

export function formatDatePt(value?: string) {
  if (!value) return '-';
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function sumSetup(ticket: ImplantacaoTicket) {
  return ticket.products.reduce((sum, item) => sum + item.setup, 0) + ticket.integrations.reduce((sum, item) => sum + item.setup, 0);
}

export function sumRecurring(ticket: ImplantacaoTicket) {
  return ticket.products.reduce((sum, item) => sum + item.recurring, 0) + ticket.integrations.reduce((sum, item) => sum + item.recurring, 0);
}
