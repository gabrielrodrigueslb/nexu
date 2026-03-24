'use client';

import { useEffect, useState } from 'react';

import { supportTickets, techs } from '@/components/dashboard-support/data';
import type { SupportTask, SupportTicket, SupportTicketType } from '@/components/dashboard-support/types';

export const IMPLANTACAO_STORAGE_KEY = 'nx_implantacao_kanban';
export const IMPLANTACAO_COLUMNS = ['Briefing', 'Configuracao', 'Treinamento', 'Go-live'] as const;

export type ImplantacaoColumn = (typeof IMPLANTACAO_COLUMNS)[number];

export type ImplantacaoTask = SupportTask & {
  assigneeId?: string;
  category: 'produto' | 'integracao' | 'operacional';
};

export type ImplantacaoHistoryItem = {
  id: string;
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
  csStatus: ImplantacaoColumn | 'Concluido';
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
  history: ImplantacaoHistoryItem[];
};

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 16);
}

function makeCnpj(index: number) {
  const base = `${(index + 11).toString().padStart(2, '0')}${(index + 21)
    .toString()
    .padStart(3, '0')}${(index + 31).toString().padStart(3, '0')}0001${(index + 41)
    .toString()
    .padStart(2, '0')}`.slice(0, 14);

  return `${base.slice(0, 2)}.${base.slice(2, 5)}.${base.slice(5, 8)}/${base.slice(8, 12)}-${base.slice(12, 14)}`;
}

function makeProto(index: number) {
  return `COM-202603-${String(329815 + index * 917).padStart(6, '0')}`;
}

function productsForTicket(ticket: SupportTicket, index: number): ImplantacaoValueRow[] {
  const rows: ImplantacaoValueRow[] = [
    {
      id: `${ticket.id}-prod-impl`,
      name: 'Implantacao',
      setup: 3000 + index * 450,
      recurring: 0,
    },
    {
      id: `${ticket.id}-prod-mens`,
      name: 'Mensalidade do Sistema',
      setup: 0,
      recurring: 200 + index * 60,
    },
  ];

  if (ticket.produto === 'CRM') {
    rows.push({
      id: `${ticket.id}-prod-crm`,
      name: 'Consultoria',
      setup: 1200,
      recurring: 0,
    });
  }

  return rows;
}

function integrationsForTicket(ticket: SupportTicket): ImplantacaoValueRow[] {
  if (ticket.produto === 'WhatsApp') {
    return [
      { id: `${ticket.id}-int-a`, name: 'Leia Atende', setup: 500, recurring: 0 },
      { id: `${ticket.id}-int-b`, name: 'Leia Vende', setup: 500, recurring: 0 },
    ];
  }

  if (ticket.produto === 'CRM') {
    return [{ id: `${ticket.id}-int-site`, name: 'Site', setup: 800, recurring: 0 }];
  }

  if (ticket.produto === 'Automacao') {
    return [{ id: `${ticket.id}-int-api`, name: 'Migracao de API', setup: 1300, recurring: 0 }];
  }

  return [{ id: `${ticket.id}-int-align`, name: 'Reuniao de Alinhamento', setup: 0, recurring: 0 }];
}

function historyForTicket(ticket: SupportTicket, respName: string): ImplantacaoHistoryItem[] {
  const items: ImplantacaoHistoryItem[] = [
    {
      id: `${ticket.id}-hist-1`,
      message: `Ticket aprovado para implantacao. ${ticket.tasks.length} tarefa(s) criada(s) automaticamente.`,
      createdAt: ticket.createdAt,
    },
    {
      id: `${ticket.id}-hist-2`,
      message: `Resp. tecnico atribuido: ${respName}.`,
      createdAt: ticket.createdAt,
    },
  ];

  ticket.tasks
    .filter((task) => task.done)
    .forEach((task, index) => {
      items.push({
        id: `${ticket.id}-hist-task-${index}`,
        message: `Tarefa "${task.title}" concluida.`,
        createdAt: task.endDate ?? ticket.updatedAt ?? ticket.createdAt,
      });
    });

  if (ticket.updatedAt) {
    items.push({
      id: `${ticket.id}-hist-final`,
      message:
        ticket.status === 'done'
          ? 'Implantacao concluida e enviada para o historico.'
          : `Ticket atualizado: ${ticket.csStatus}.`,
      createdAt: ticket.updatedAt,
    });
  }

  return items;
}

function buildSeedTickets(): ImplantacaoTicket[] {
  return supportTickets.map((ticket, index) => {
    const slug = slugify(ticket.nome);
    const techName = techs.find((tech) => tech.id === ticket.respTec)?.name ?? 'Sem responsavel';
    const products = productsForTicket(ticket, index);
    const integrations = integrationsForTicket(ticket);

    return {
      id: ticket.id,
      proto: makeProto(index),
      nome: ticket.nome,
      tipo: ticket.tipo,
      status: ticket.status,
      csStatus:
        ticket.status === 'done'
          ? 'Concluido'
          : IMPLANTACAO_COLUMNS.includes(ticket.csStatus as ImplantacaoColumn)
            ? (ticket.csStatus as ImplantacaoColumn)
            : 'Briefing',
      produto: ticket.produto,
      respTec: ticket.respTec,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      cnpj: makeCnpj(index),
      telefone: `(11) 9${String(87000000 + index * 133).slice(0, 8)}`,
      email: `${slug}@cliente.com.br`,
      site: `https://${slug}.com.br`,
      instancia: `${slug}.com`,
      plano: ticket.tipo === 'inclusao' ? 'Profissional' : 'Basico',
      formaPagamento: index % 2 === 0 ? 'A vista' : 'Boleto Bancario',
      respSolicitacao: techName,
      observacao: `Lead ganho: ${ticket.nome}. Implantacao em acompanhamento na etapa ${ticket.csStatus}.`,
      tasks: ticket.tasks.map((task, taskIndex) => ({
        ...task,
        assigneeId: ticket.respTec,
        category:
          taskIndex === 0
            ? 'produto'
            : taskIndex === 1
              ? 'integracao'
              : 'operacional',
      })),
      products,
      integrations,
      history: historyForTicket(ticket, techName),
    };
  });
}

function normalizeTask(task: ImplantacaoTask, fallbackAssigneeId: string): ImplantacaoTask {
  return {
    ...task,
    assigneeId: task.assigneeId ?? fallbackAssigneeId,
    category: task.category ?? 'operacional',
  };
}

function normalizeStoredTickets(raw: unknown): ImplantacaoTicket[] {
  const seed = buildSeedTickets();
  if (!Array.isArray(raw)) return seed;

  const byId = new Map(
    raw
      .filter((item): item is Partial<ImplantacaoTicket> & { id: string } => {
        return Boolean(item && typeof item === 'object' && 'id' in item && (item as { id?: unknown }).id);
      })
      .map((item) => [item.id, item]),
  );

  return seed.map((ticket) => {
    const stored = byId.get(ticket.id);
    if (!stored) return ticket;

    return {
      ...ticket,
      ...stored,
      csStatus:
        stored.status === 'done'
          ? 'Concluido'
          : IMPLANTACAO_COLUMNS.includes(stored.csStatus as ImplantacaoColumn)
            ? (stored.csStatus as ImplantacaoColumn)
            : ticket.csStatus,
      tasks: Array.isArray(stored.tasks)
        ? stored.tasks.map((task) =>
            normalizeTask(task as ImplantacaoTask, stored.respTec ?? ticket.respTec),
          )
        : ticket.tasks,
      products: Array.isArray(stored.products) ? stored.products : ticket.products,
      integrations: Array.isArray(stored.integrations) ? stored.integrations : ticket.integrations,
      history: Array.isArray(stored.history) ? stored.history : ticket.history,
    };
  });
}

export function loadImplantacaoTickets() {
  if (typeof window === 'undefined') return buildSeedTickets();

  try {
    const raw = window.localStorage.getItem(IMPLANTACAO_STORAGE_KEY);
    if (!raw) return buildSeedTickets();
    return normalizeStoredTickets(JSON.parse(raw));
  } catch {
    return buildSeedTickets();
  }
}

export function saveImplantacaoTickets(tickets: ImplantacaoTicket[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(IMPLANTACAO_STORAGE_KEY, JSON.stringify(tickets));
}

export function useImplantacaoTickets() {
  const [tickets, setTickets] = useState<ImplantacaoTicket[]>(() => buildSeedTickets());

  useEffect(() => {
    setTickets(loadImplantacaoTickets());
  }, []);

  useEffect(() => {
    saveImplantacaoTickets(tickets);
  }, [tickets]);

  return [tickets, setTickets] as const;
}

export function getTicketProgress(ticket: ImplantacaoTicket) {
  if (!ticket.tasks.length) return 0;
  return Math.round((ticket.tasks.filter((task) => task.done).length / ticket.tasks.length) * 100);
}

export function getTechNameById(id?: string) {
  return techs.find((tech) => tech.id === id)?.name ?? 'Sem responsavel';
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
