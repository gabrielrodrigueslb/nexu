'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { CalendarDays, CheckCircle2, Circle, ClipboardList, MessageSquareText, Search, FolderPlus } from 'lucide-react';

import { ModalShell } from '@/components/modal-shell';
import { apiRequest } from '@/lib/api-client';

type UserRecord = {
  id: string;
  name: string;
};

type CatalogType = 'PRODUCT' | 'INTEGRATION';

type TicketComment = {
  id: string;
  message: string;
  createdAt: string;
  author?: { id: string; name: string } | null;
};

type CatalogRow = {
  id: string;
  enabled: boolean;
  setupInCents: number;
  recurringInCents: number;
  catalogItem?: {
    id: string;
    name: string;
    type: CatalogType;
  } | null;
};

type LeadReference = {
  id: string;
  company: string;
  cnpj?: string | null;
  contact?: string | null;
  email?: string | null;
  phone?: string | null;
  paymentMethod?: string | null;
  installment?: string | null;
  isLite?: boolean;
  wonAt?: string | null;
  createdAt: string;
  updatedAt: string;
  observations?: string | null;
  seller?: { id: string; name: string } | null;
  sdr?: { id: string; name: string } | null;
  catalogItems?: CatalogRow[];
  tasks?: Array<{
    id: string;
    title: string;
    done: boolean;
    dueDate?: string | null;
  }>;
  comments?: TicketComment[];
};

type TicketRecord = {
  id: string;
  code: string;
  company: string;
  cnpj?: string | null;
  contact?: string | null;
  email?: string | null;
  phone?: string | null;
  instance?: string | null;
  plan?: string | null;
  paymentMethod?: string | null;
  installment?: string | null;
  type: 'novo' | 'upsell' | 'renovacao';
  status: string;
  csStatus?: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  setupAmount: number;
  recurringAmount: number;
  assignee?: { id: string; name: string } | null;
  technicalAssignee?: { id: string; name: string } | null;
  lead?: LeadReference | null;
  notes?: string | null;
  tasks?: Array<{
    id: string;
    title: string;
    done: boolean;
    dueDate?: string | null;
    assignee?: { id: string; name: string } | null;
  }>;
  comments?: TicketComment[];
};

type EditState = {
  status: string;
  csStatus: string;
  assigneeId: string;
  technicalAssigneeId: string;
  notes: string;
};

function buildEditState(ticket: TicketRecord): EditState {
  return {
    status: ticket.status,
    csStatus: ticket.csStatus || '',
    assigneeId: ticket.assignee?.id || '',
    technicalAssigneeId: ticket.technicalAssignee?.id || '',
    notes: ticket.notes || ticket.lead?.observations || '',
  };
}

type ValueRow = {
  id: string;
  name: string;
  setup: number;
  recurring: number;
};

function formatMoney(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return new Intl.DateTimeFormat('pt-BR').format(parsed);
}

function formatDateTime(value?: string | null) {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return `${new Intl.DateTimeFormat('pt-BR').format(parsed)} ${parsed.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

function centsToMoney(value?: number | null) {
  return (value || 0) / 100;
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    pendente_financeiro: 'Ag. Pagamento',
    pagamento_confirmado: 'Pag. Confirmado',
    em_implantacao: 'Em Implantação',
    concluido: 'Implantado',
    cancelado: 'Cancelado',
  };

  return labels[status] || status;
}

function statusClassName(status: string) {
  if (status === 'pendente_financeiro') return 'border-[#fde68a] bg-[#fffbeb] text-[#d97706]';
  if (status === 'pagamento_confirmado') return 'border-[#bbf7d0] bg-[#ecfdf5] text-[#059669]';
  if (status === 'em_implantacao') return 'border-[#bfdbfe] bg-[#eff6ff] text-[#2563eb]';
  if (status === 'concluido') return 'border-[#a7f3d0] bg-[#ecfdf5] text-[#047857]';
  if (status === 'cancelado') return 'border-[#fecaca] bg-[#fef2f2] text-[#dc2626]';
  return 'border-[#e2e8f0] bg-[#f8fafc] text-[#475569]';
}

function ticketTypeLabel(type: TicketRecord['type']) {
  if (type === 'upsell') return 'Upsell';
  if (type === 'renovacao') return 'Renovação';
  return 'Novo';
}

function fieldValue(value?: string | number | null) {
  if (value === null || value === undefined || value === '') return '-';
  return String(value);
}

function initialsFromName(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function buildValueRows(ticket: TicketRecord, type: CatalogType): ValueRow[] {
  const rows = (ticket.lead?.catalogItems || [])
    .filter((item) => item.enabled && item.catalogItem?.type === type)
    .map((item) => ({
      id: item.id,
      name: item.catalogItem?.name || '-',
      setup: centsToMoney(item.setupInCents),
      recurring: centsToMoney(item.recurringInCents),
    }));

  if (rows.length || type === 'INTEGRATION') return rows;

  if (!ticket.setupAmount && !ticket.recurringAmount) return [];

  return [
    {
      id: `${ticket.id}-contract-values`,
      name: ticket.plan || 'Contrato',
      setup: ticket.setupAmount,
      recurring: ticket.recurringAmount,
    },
  ];
}

function buildTaskRows(ticket: TicketRecord) {
  const ticketTasks = (ticket.tasks || []).map((task) => ({
    id: `ticket-${task.id}`,
    title: task.title,
    done: task.done,
    dueDate: task.dueDate,
    assignee: task.assignee?.name || '',
    group: 'Tarefas do ticket',
  }));

  const leadTasks = (ticket.lead?.tasks || []).map((task) => ({
    id: `lead-${task.id}`,
    title: task.title,
    done: task.done,
    dueDate: task.dueDate,
    assignee: ticket.lead?.seller?.name || '',
    group: 'Tarefas do lead',
  }));

  return [...ticketTasks, ...leadTasks];
}

function buildHistory(ticket: TicketRecord) {
  const items = [
    {
      id: `${ticket.id}-created`,
      actor: ticket.assignee?.name || ticket.lead?.seller?.name || 'Sistema',
      message: `Ticket gerado${ticket.lead?.company ? ` a partir do lead: ${ticket.lead.company}` : ''}.`,
      createdAt: ticket.createdAt,
      tone: 'blue',
    },
  ];

  if (ticket.lead?.wonAt) {
    items.push({
      id: `${ticket.id}-won`,
      actor: ticket.lead.seller?.name || 'Comercial',
      message: 'Lead ganho.',
      createdAt: ticket.lead.wonAt,
      tone: 'green',
    });
  }

  if (['pagamento_confirmado', 'em_implantacao', 'concluido'].includes(ticket.status)) {
    items.push({
      id: `${ticket.id}-payment`,
      actor: ticket.assignee?.name || 'Comercial',
      message: 'Pagamento confirmado.',
      createdAt: ticket.updatedAt || ticket.createdAt,
      tone: 'green',
    });
  }

  if (['em_implantacao', 'concluido'].includes(ticket.status)) {
    items.push({
      id: `${ticket.id}-approved`,
      actor: ticket.assignee?.name || 'Comercial',
      message: 'Aprovado para implantação.',
      createdAt: ticket.updatedAt || ticket.createdAt,
      tone: 'green',
    });
  }

  if (ticket.completedAt) {
    items.push({
      id: `${ticket.id}-completed`,
      actor: ticket.technicalAssignee?.name || 'Implantação',
      message: 'Implantação concluída.',
      createdAt: ticket.completedAt,
      tone: 'green',
    });
  }

  return items;
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="mb-2 mt-4 flex items-center gap-2 border-b border-[#e2e8f0] pb-2 text-[13px] font-extrabold text-[#0f172a]">
      {children}
    </div>
  );
}

function FieldCard({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="rounded-[10px] border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3">
      <div className="mb-2 text-[11px] font-extrabold uppercase tracking-[.08em] text-[#64748b]">
        {label}
      </div>
      <div className="min-h-[22px] text-[15px] font-medium text-[#0f172a]">{fieldValue(value)}</div>
    </div>
  );
}

function ValueTable({ emptyLabel, label, rows }: { emptyLabel: string; label: string; rows: ValueRow[] }) {
  return (
    <div>
      <SectionTitle>{label}</SectionTitle>
      <div className="overflow-hidden rounded-[10px] border border-[#e2e8f0]">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="bg-[#f8fafc]">
              <th className="px-4 py-3 text-left text-[11px] font-extrabold uppercase tracking-[.08em] text-[#64748b]">
                {label === 'Produtos' ? 'Produto' : 'Integração'}
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-extrabold uppercase tracking-[.08em] text-[#64748b]">
                Setup
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-extrabold uppercase tracking-[.08em] text-[#64748b]">
                Recorrência
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row) => (
                <tr key={row.id} className="border-t border-[#e2e8f0]">
                  <td className="px-4 py-3 font-semibold text-[#0f172a]">{row.name}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-[#0f172a]">{formatMoney(row.setup)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-[#0f172a]">{formatMoney(row.recurring)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="border-t border-[#e2e8f0] px-4 py-5 text-center text-[13px] text-[#64748b]">
                  {emptyLabel}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Journey({ status }: { status: string }) {
  const activeIndex =
    status === 'concluido'
      ? 3
      : status === 'em_implantacao'
        ? 2
        : status === 'pagamento_confirmado'
          ? 1
          : 0;
  const steps = ['Cadastro', 'Pagamento', 'Aprovação', 'Implantado'];

  return (
    <div className="flex flex-row items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
      {steps.map((step, index) => {
        const done = index < activeIndex;
        const active = index === activeIndex;
        return (
          <div key={step} className="flex min-w-[125px] flex-1 items-center gap-2">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-[13px] font-extrabold ${
                done || active
                  ? 'border-[#2563eb] bg-[#2563eb] text-white'
                  : 'border-[#e2e8f0] bg-white text-[#64748b]'
              }`}
            >
              {done ? <CheckCircle2 className="size-4" /> : index + 1}
            </span>
            <span className={`whitespace-nowrap text-[12px] font-bold ${done || active ? 'text-[#2563eb]' : 'text-[#64748b]'}`}>
              {step}
            </span>
            {index < steps.length - 1 ? <span className="h-[2px] min-w-[20px] flex-1 bg-[#e2e8f0]" /> : null}
          </div>
        );
      })}
    </div>
  );
}

export function CommercialClosedClients() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [tickets, setTickets] = useState<TicketRecord[]>([]);
  const [error, setError] = useState('');
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);
  const [isApprovingImplementation, setIsApprovingImplementation] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState('');
  const [editState, setEditState] = useState<EditState>({
    status: '',
    csStatus: '',
    assigneeId: '',
    technicalAssigneeId: '',
    notes: '',
  });

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setError('');
        const [ticketPayload, usersPayload] = await Promise.all([
          apiRequest('/api/backend/tickets/closed-clients?page=1&limit=100') as Promise<{ items: TicketRecord[] }>,
          apiRequest('/api/backend/users/directory?active=true') as Promise<{ items: UserRecord[] }>,
        ]);

        if (!active) return;
        setTickets(ticketPayload.items || []);
        setUsers(usersPayload.items || []);
      } catch (nextError) {
        if (!active) return;
        setError(nextError instanceof Error ? nextError.message : 'Falha ao carregar clientes fechados.');
        setTickets([]);
        setUsers([]);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return tickets.filter((ticket) => {
      if (!normalized) return true;

      return [
        ticket.code,
        ticket.company,
        ticket.cnpj || ticket.lead?.cnpj || '',
        statusLabel(ticket.status),
        ticket.assignee?.name || '',
        ticket.technicalAssignee?.name || '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalized);
    });
  }, [query, tickets]);

  const selectedTicket = tickets.find((ticket) => ticket.id === selectedTicketId) ?? null;
  const selectedProducts = selectedTicket ? buildValueRows(selectedTicket, 'PRODUCT') : [];
  const selectedIntegrations = selectedTicket ? buildValueRows(selectedTicket, 'INTEGRATION') : [];
  const selectedTasks = selectedTicket ? buildTaskRows(selectedTicket) : [];
  const selectedHistory = selectedTicket ? buildHistory(selectedTicket) : [];
  const totalSetup = [...selectedProducts, ...selectedIntegrations].reduce((sum, item) => sum + item.setup, 0);
  const totalRecurring = [...selectedProducts, ...selectedIntegrations].reduce((sum, item) => sum + item.recurring, 0);

  function openTicket(ticket: TicketRecord) {
    setSelectedTicketId(ticket.id);
    setIsEditing(false);
    setError('');
    setEditState(buildEditState(ticket));
  }

  function closeTicket() {
    setSelectedTicketId(null);
    setIsEditing(false);
    setCommentDraft('');
  }

  function cancelEdit() {
    if (!selectedTicket) return;
    setEditState(buildEditState(selectedTicket));
    setIsEditing(false);
  }

  async function refreshTicket(ticketId: string) {
    const refreshed = (await apiRequest(`/api/backend/tickets/closed-clients/${ticketId}`)) as { item: TicketRecord };
    setTickets((current) =>
      current.map((ticket) => (ticket.id === refreshed.item.id ? refreshed.item : ticket)),
    );
    return refreshed.item;
  }

  async function saveTicketChanges() {
    if (!selectedTicket) return;
    setError('');

    try {
      const response = (await apiRequest(`/api/backend/tickets/closed-clients/${selectedTicket.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: editState.status,
          csStatus: editState.csStatus || null,
          assigneeId: editState.assigneeId || undefined,
          technicalAssigneeId: editState.technicalAssigneeId || null,
          notes: editState.notes || null,
        }),
      })) as { item: TicketRecord };

      setTickets((current) =>
        current.map((ticket) => (ticket.id === response.item.id ? response.item : ticket)),
      );
      setIsEditing(false);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Falha ao salvar cliente fechado.');
    }
  }

  async function confirmPayment() {
    if (!selectedTicket) return;
    setIsConfirmingPayment(true);
    setError('');

    try {
      const response = (await apiRequest(
        `/api/backend/tickets/closed-clients/${selectedTicket.id}/confirm-payment`,
        { method: 'PATCH' },
      )) as { item: TicketRecord };

      setTickets((current) =>
        current.map((ticket) => (ticket.id === response.item.id ? response.item : ticket)),
      );
      setEditState((current) => ({
        ...current,
        status: response.item.status,
        csStatus: response.item.csStatus || current.csStatus,
      }));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Falha ao confirmar pagamento.');
    } finally {
      setIsConfirmingPayment(false);
    }
  }

  async function approveImplementation() {
    if (!selectedTicket) return;
    setIsApprovingImplementation(true);
    setError('');

    try {
      const response = (await apiRequest(
        `/api/backend/tickets/closed-clients/${selectedTicket.id}/approve-implementation`,
        { method: 'PATCH' },
      )) as { item: TicketRecord };

      setTickets((current) =>
        current.map((ticket) => (ticket.id === response.item.id ? response.item : ticket)),
      );
      setEditState((current) => ({
        ...current,
        status: response.item.status,
        csStatus: response.item.csStatus || current.csStatus,
      }));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Falha ao aprovar implantação.');
    } finally {
      setIsApprovingImplementation(false);
    }
  }

  async function addComment() {
    if (!selectedTicket || !commentDraft.trim()) return;
    setError('');

    try {
      await apiRequest(`/api/backend/tickets/closed-clients/${selectedTicket.id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ message: commentDraft.trim() }),
      });

      await refreshTicket(selectedTicket.id);
      setCommentDraft('');
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Falha ao adicionar comentário.');
    }
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="mb-6">
        <h1 className="text-[20px] font-extrabold tracking-[-0.4px] text-[#0f172a]">Clientes Fechados</h1>
        <p className="mt-0.5 text-[13px] text-[#64748b]">
          Acompanhe contratos fechados, implantação e histórico do cliente.
        </p>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-[8px] border border-[#e2e8f0] bg-white px-4 py-3 shadow-sm">
        <Search className="size-4 text-[#64748b]" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por protocolo, empresa ou responsável"
          className="w-full border-none bg-transparent text-[13px] outline-none"
        />
      </div>

      {error ? (
        <div className="mb-4 rounded-[10px] border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-[13px] font-medium text-[#991b1b]">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-[14px] border border-[#e2e8f0] bg-white shadow-sm">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-[#f8fafc]">
              {['Protocolo', 'Empresa', 'Status', 'Responsável', 'Total'].map((column) => (
                <th
                  key={column}
                  className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[.06em] text-[#64748b]"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length ? (
              filtered.map((ticket) => (
                <tr
                  key={ticket.id}
                  className="cursor-pointer border-t border-[#e2e8f0] hover:bg-[#f8fafc]"
                  onClick={() => openTicket(ticket)}
                >
                  <td className="px-4 py-3 font-mono text-[12px] font-semibold text-[#2563eb]">{ticket.code}</td>
                  <td className="px-4 py-3 text-[12px] text-[#0f172a]">{ticket.company}</td>
                  <td className="px-4 py-3 text-[12px] text-[#475569]">
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusClassName(ticket.status)}`}>
                      {statusLabel(ticket.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-[#475569]">{ticket.assignee?.name ?? '-'}</td>
                  <td className="px-4 py-3 text-[12px] text-[#475569]">
                    {formatMoney(ticket.setupAmount + ticket.recurringAmount)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="border-t border-[#e2e8f0] px-4 py-8 text-center text-[13px] text-[#64748b]">
                  Nenhum cliente fechado encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ModalShell
        open={Boolean(selectedTicket)}
        onClose={closeTicket}
        title={selectedTicket?.company || 'Cliente fechado'}
        description={
          selectedTicket
            ? `CNPJ: ${fieldValue(selectedTicket.cnpj || selectedTicket.lead?.cnpj)} · ${statusLabel(selectedTicket.status)}`
            : undefined
        }
        maxWidthClassName="!fixed !top-0 !right-0 !bottom-0 !left-auto !translate-x-0 !translate-y-0 !m-0 !h-screen !w-full !max-w-[800px] !rounded-none sm:!rounded-l-[20px] !border-l border-[#e2e8f0] shadow-2xl flex flex-col overflow-y-auto"
        headerActions={
          selectedTicket ? (
            <div className="flex items-center gap-2">
              {isEditing ? (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="rounded-[8px] border-[1.5px] border-[#e2e8f0] px-4 py-2 text-[13px] font-bold text-[#64748b] hover:bg-[#f8fafc]"
                >
                  Cancelar
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                disabled={isEditing}
                className="rounded-[8px] border-[1.5px] border-[#e2e8f0] px-4 py-2 text-[13px] font-bold text-[#0f172a] hover:bg-[#f8fafc] disabled:cursor-default disabled:opacity-60"
              >
                Editar
              </button>
            </div>
          ) : null
        }
        footer={
          selectedTicket ? (
            <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={closeTicket}
                  className="rounded-[8px] border border-[#e2e8f0] px-6 py-2 text-[13px] font-semibold text-[#475569] hover:bg-[#f8fafc]"
                >
                  Fechar
                </button>
                {isEditing ? (
                  <button
                    type="button"
                    onClick={saveTicketChanges}
                    className="rounded-[8px] bg-[#2563eb] px-6 py-2 text-[13px] font-semibold text-white hover:bg-[#1d4ed8]"
                  >
                    Salvar
                  </button>
                ) : null}
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                {selectedTicket.status === 'pendente_financeiro' ? (
                  <button
                    type="button"
                    onClick={confirmPayment}
                    disabled={isConfirmingPayment}
                    className="rounded-[8px] bg-[#059669] px-6 py-2 text-[13px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isConfirmingPayment ? 'Confirmando...' : 'Confirmar pagamento'}
                  </button>
                ) : null}
                {selectedTicket.status === 'pagamento_confirmado' ? (
                  <button
                    type="button"
                    onClick={approveImplementation}
                    disabled={isApprovingImplementation}
                    className="rounded-[8px] bg-[#2563eb] px-6 py-2 text-[13px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isApprovingImplementation ? 'Aprovando...' : 'Aprovar Implantação'}
                  </button>
                ) : null}
              </div>
            </div>
          ) : null
        }
      >
        {selectedTicket ? (
          <div className="space-y-4">
            <div className="rounded-[10px] border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-[12px] font-extrabold uppercase tracking-[.12em] text-[#64748b]">
                    Protocolo
                  </span>
                  <span className="font-mono text-[15px] font-extrabold tracking-[.08em] text-[#2563eb]">
                    {selectedTicket.code}
                  </span>
                  <ClipboardList className="size-4 text-[#0f172a]" />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-3 py-1 text-[12px] font-extrabold ${statusClassName(selectedTicket.status)}`}>
                    {statusLabel(selectedTicket.status)}
                  </span>
                  <span className="rounded-full border border-[#bbf7d0] bg-[#ecfdf5] px-3 py-1 text-[12px] font-extrabold text-[#059669]">
                    {ticketTypeLabel(selectedTicket.type)}
                  </span>
                  <span className="rounded-full border border-[#fde68a] bg-[#fffbeb] px-3 py-1 text-[12px] font-extrabold text-[#d97706]">
                    Novo Ticket
                  </span>
                </div>
              </div>
            </div>

            <Journey status={selectedTicket.status} />

            <div className="flex flex-wrap items-center gap-2 text-[13px] font-semibold text-[#334155]">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#f1f5f9] px-3 py-1">
                <CalendarDays className="size-3.5" />
                {formatDate(selectedTicket.createdAt)}
              </span>
              <span className="inline-flex rounded-full bg-[#f1f5f9] px-3 py-1">
                {selectedTicket.assignee?.name || selectedTicket.lead?.seller?.name || 'Sem responsável'}
              </span>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <FieldCard label="Nome" value={selectedTicket.company || selectedTicket.lead?.company} />
              <FieldCard label="CNPJ" value={selectedTicket.cnpj || selectedTicket.lead?.cnpj} />
              <FieldCard label="Telefone" value={selectedTicket.phone || selectedTicket.lead?.phone} />
              <FieldCard label="Instância" value={selectedTicket.instance} />
              <FieldCard label="E-mail" value={selectedTicket.email || selectedTicket.lead?.email} />
              <FieldCard label="Site" value={null} />
              <FieldCard label="Plano" value={selectedTicket.plan || (selectedTicket.lead?.isLite ? 'Lite' : null)} />
              <div className="rounded-[10px] border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3">
                <div className="mb-2 text-[11px] font-extrabold uppercase tracking-[.08em] text-[#64748b]">
                  Resp. Solicitação
                </div>
                <select
                  value={editState.assigneeId}
                  onChange={(event) => setEditState((current) => ({ ...current, assigneeId: event.target.value }))}
                  disabled={!isEditing}
                  className="w-full bg-transparent text-[15px] font-medium text-[#0f172a] outline-none disabled:cursor-default"
                >
                  <option value="">Sem responsável</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>
              <FieldCard
                label="Pagamento"
                value={[selectedTicket.paymentMethod || selectedTicket.lead?.paymentMethod, selectedTicket.installment || selectedTicket.lead?.installment]
                  .filter(Boolean)
                  .join(' · ')}
              />
            </div>

            <div>
              <div className="mb-2 text-[11px] font-extrabold uppercase tracking-[.08em] text-[#64748b]">
                Observação
              </div>
              <textarea
                id="closed-client-notes"
                value={editState.notes}
                onChange={(event) => setEditState((current) => ({ ...current, notes: event.target.value }))}
                readOnly={!isEditing}
                className="min-h-[78px] w-full rounded-[10px] border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 text-[14px] text-[#0f172a] outline-none read-only:cursor-default"
                placeholder="Sem observação"
              />
            </div>

            <ValueTable emptyLabel="Nenhum produto registrado." label="Produtos" rows={selectedProducts} />
            <ValueTable emptyLabel="Nenhuma integração registrada." label="Integrações" rows={selectedIntegrations} />

            <div className="grid grid-cols-2 gap-4 rounded-[8px] bg-[#0f172a] px-4 py-3 text-white">
              <div>
                <div className="text-[11px] font-semibold text-[#94a3b8]">Total Setup</div>
                <div className="text-[18px] font-extrabold">{formatMoney(totalSetup)}</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold text-[#94a3b8]">Total Recorrência</div>
                <div className="text-[18px] font-extrabold">{formatMoney(totalRecurring)}</div>
              </div>
            </div>

            <SectionTitle>
              <CheckCircle2 className="size-4 text-[#16a34a]" />
              Tarefas {selectedTasks.filter((task) => task.done).length}/{selectedTasks.length}
            </SectionTitle>
            <div className="space-y-2">
              {selectedTasks.length ? (
                selectedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex flex-col gap-2 rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 text-[13px] sm:flex-row sm:items-center sm:justify-between"
                  >
                    <label className="flex flex-1 items-center gap-3 text-[#0f172a]">
                      <input checked={task.done} readOnly type="checkbox" className="size-4 accent-[#2563eb]" />
                      <span className="font-medium">{task.title}</span>
                    </label>
                    <div className="flex items-center gap-4 pl-7 sm:pl-0">
                      <span className="w-[120px] text-left text-[#64748b]">{task.assignee || '-'}</span>
                      <span className="w-[90px] text-right text-[#64748b]">{formatDate(task.dueDate)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[8px] border border-dashed border-[#cbd5e1] px-4 py-5 text-center text-[13px] text-[#64748b]">
                  Nenhuma tarefa registrada.
                </div>
              )}
            </div>

            <SectionTitle>Anexos <span className="text-[11px] font-normal text-[#64748b] ml-1">(clique para adicionar)</span></SectionTitle>
            <div className="flex cursor-pointer items-center justify-center gap-2 rounded-[8px] border border-dashed border-[#cbd5e1] bg-[#f8fafc] px-4 py-4 transition-colors hover:bg-[#fffbeb]">
              <FolderPlus className="size-4 text-[#d97706]" />
              <span className="text-[13px] font-medium text-[#d97706]">Clique para adicionar PDF, imagem ou documento</span>
            </div>

            <SectionTitle>Histórico</SectionTitle>
            <div className="max-h-[250px] space-y-3 overflow-y-auto border-l border-[#e2e8f0] pl-4 scrollbar-thin">
              {selectedHistory.map((item) => (
                <div key={item.id} className="relative text-[13px]">
                  <Circle
                    className={`absolute -left-[23px] top-1 size-3 fill-current ${
                      item.tone === 'green' ? 'text-[#059669]' : 'text-[#2563eb]'
                    }`}
                  />
                  <div className="font-semibold text-[#0f172a]">
                    {item.actor} <span className="font-normal">{item.message}</span>
                  </div>
                  <div className="text-[11px] text-[#64748b]">{formatDateTime(item.createdAt)}</div>
                </div>
              ))}
            </div>

            <SectionTitle>
              <MessageSquareText className="size-4 text-[#64748b]" />
              Comentários {(selectedTicket.comments || []).length}
            </SectionTitle>
            <div>
              <div className="mb-[10px] max-h-[200px] overflow-y-auto">
                {(selectedTicket.comments || []).length ? (
                (selectedTicket.comments || []).map((comment) => (
                  <div key={comment.id} className="mb-3 flex gap-[10px]">
                    <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-[#2563eb] text-[11px] font-bold text-white">
                      {initialsFromName(comment.author?.name || 'Usuário')}
                    </div>
                    <div className="flex-1 rounded-[0_10px_10px_10px] border border-[#e2e8f0] bg-[#f8fafc] px-[13px] py-[10px]">
                      <div className="mb-1 text-[11px] text-[#64748b]">
                        <strong className="font-semibold text-[#0f172a]">
                          {comment.author?.name || 'Usuário'}
                        </strong>{' '}
                        {formatDateTime(comment.createdAt)}
                      </div>
                      <div className="whitespace-pre-wrap text-[13px] leading-[1.5] text-[#0f172a]">
                        {comment.message}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-[12px] text-[#64748b]">
                  Nenhum comentário.
                </div>
              )}
              </div>
              <div className="mb-1 flex gap-2">
                <textarea
                  value={commentDraft}
                  onChange={(event) => setCommentDraft(event.target.value)}
                  rows={2}
                  placeholder="Adicionar comentário..."
                  className="min-h-[80px] flex-1 rounded-[8px] border-[1.5px] border-[#e2e8f0] bg-[#f8fafc] px-3 py-[9px] text-[13px] outline-none"
                />
                <button
                  type="button"
                  onClick={addComment}
                  className="self-end rounded-[8px] bg-[#2563eb] px-[12px] py-[6px] text-[12px] font-semibold text-white"
                >
                  Comentar
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </ModalShell>
    </div>
  );
}
