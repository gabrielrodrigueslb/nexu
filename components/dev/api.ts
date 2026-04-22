'use client';

import { apiRequest } from '@/lib/api-client';

export type DevApiUser = {
  id: string;
  name: string;
};

export type DevApiSprint = {
  id: string;
  name: string;
  goal?: string | null;
  start: string;
  end: string;
  closed: boolean;
  createdAt: string;
  closedAt?: string | null;
};

export type DevApiComment = {
  id: string;
  author: string;
  authorId: string;
  message: string;
  createdAt: string;
};

export type DevApiTicket = {
  id: number;
  proto: string;
  title: string;
  category: string;
  devType: 'Epic' | 'Feature' | 'Task' | 'Bug';
  devStatus:
    | 'Backlog'
    | 'Análise'
    | 'Pronto para Desenvolver'
    | 'Em Desenvolvimento'
    | 'Testes'
    | 'Code Review'
    | 'Concluído';
  complexity: 'Simples' | 'Média' | 'Complexa';
  resp: string;
  score: number;
  totalPts: number;
  createdAt: string;
  updatedAt?: string | null;
  startDate?: string | null;
  deadline?: string | null;
  concludedAt?: string | null;
  sprintId?: string | null;
  parentId?: number | null;
  clientName?: string | null;
  description: string;
  createdBy: string;
  protoExt?: string | null;
  instance?: string | null;
  cnpj?: string | null;
  clientPhone?: string | null;
  tags: string[];
  criteria: {
    imp?: number;
    ris?: number;
    fre?: number;
    esf?: number;
    deb?: number;
  };
  history: Array<{
    id: string;
    user: string;
    message: string;
    createdAt: string;
  }>;
  incident?: boolean;
  compliment?: boolean;
  docDone?: boolean;
  prodBug?: boolean;
  reopened?: boolean;
  criticalBug?: boolean;
  comments: DevApiComment[];
};

export type DevLookupsPayload = {
  users: DevApiUser[];
  sprints: DevApiSprint[];
};

function toDateTime(value?: string | null) {
  if (!value) return undefined;
  return `${value}T00:00:00.000Z`;
}

export async function fetchDevLookups() {
  return (await apiRequest('/api/backend/development/lookups')) as DevLookupsPayload;
}

export async function fetchDevTickets(limit = 100) {
  const payload = (await apiRequest(`/api/backend/development/tickets?page=1&limit=${limit}`)) as {
    items: DevApiTicket[];
  };

  return payload.items || [];
}

export async function createDevTicket(ticket: Partial<DevApiTicket> & Pick<DevApiTicket, 'proto' | 'title' | 'category' | 'devType' | 'devStatus' | 'complexity' | 'score' | 'totalPts' | 'description'>) {
  const payload = {
    ...ticket,
    assigneeId: ticket.resp || null,
    tags: ticket.tags || [],
    criteria: ticket.criteria || {},
    history: ticket.history || [],
    createdAt: toDateTime(ticket.createdAt),
    startDate: toDateTime(ticket.startDate),
    deadline: toDateTime(ticket.deadline),
    resolvedAt: toDateTime(ticket.concludedAt),
  };

  const response = (await apiRequest('/api/backend/development/tickets', {
    method: 'POST',
    body: JSON.stringify(payload),
  })) as { item: DevApiTicket };

  return response.item;
}

export async function updateDevTicket(ticketId: number, patch: Partial<DevApiTicket>) {
  const payload = {
    ...patch,
    assigneeId: 'resp' in patch ? patch.resp || null : undefined,
    tags: patch.tags,
    criteria: patch.criteria,
    history: patch.history,
    createdAt: 'createdAt' in patch ? toDateTime(patch.createdAt) : undefined,
    startDate: 'startDate' in patch ? toDateTime(patch.startDate) : undefined,
    deadline: 'deadline' in patch ? toDateTime(patch.deadline) : undefined,
    resolvedAt: 'concludedAt' in patch ? toDateTime(patch.concludedAt) : undefined,
  };

  const response = (await apiRequest(`/api/backend/development/tickets/${ticketId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })) as { item: DevApiTicket };

  return response.item;
}

export async function deleteDevTicket(ticketId: number) {
  await apiRequest(`/api/backend/development/tickets/${ticketId}`, {
    method: 'DELETE',
  });
}

export async function createDevComment(ticketId: number, message: string) {
  const response = (await apiRequest(`/api/backend/development/tickets/${ticketId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  })) as { item: DevApiComment };

  return response.item;
}

export async function createDevSprint(payload: {
  name: string;
  goal?: string;
  start: string;
  end: string;
}) {
  const response = (await apiRequest('/api/backend/development/sprints', {
    method: 'POST',
    body: JSON.stringify({
      name: payload.name,
      goal: payload.goal || null,
      startDate: `${payload.start}T00:00:00.000Z`,
      endDate: `${payload.end}T23:59:59.999Z`,
    }),
  })) as { item: DevApiSprint };

  return response.item;
}

export async function updateDevSprint(
  sprintId: string,
  payload: Partial<{ name: string; goal: string; start: string; end: string; closed: boolean; closedAt?: string }>,
) {
  const response = (await apiRequest(`/api/backend/development/sprints/${sprintId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      ...payload,
      startDate: 'start' in payload && payload.start ? `${payload.start}T00:00:00.000Z` : undefined,
      endDate: 'end' in payload && payload.end ? `${payload.end}T23:59:59.999Z` : undefined,
      closedAt: 'closedAt' in payload && payload.closedAt ? `${payload.closedAt}T23:59:59.999Z` : payload.closedAt === null ? null : undefined,
    }),
  })) as { item: DevApiSprint };

  return response.item;
}
