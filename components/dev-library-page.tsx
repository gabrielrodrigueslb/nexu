'use client';

import { useState } from 'react';
import { Copy, MessageSquareText, Download, Plus } from 'lucide-react';

import { useCurrentAdminUser } from '@/components/admin-users-storage';
import { ModalShell } from '@/components/modal-shell';
import {
  ALL_DEV_STATUSES,
  DEV_CATEGORIES,
  DEV_FILTER_TYPES,
  DEV_SPRINTS,
  DEV_USERS,
  INITIAL_DEV_TICKETS,
  type DevStatus,
  type DevTicket as BaseDevTicket,
  type DevType,
} from '@/components/dev-kanban-data';
import { cn } from '@/lib/utils';
import { formatMoney } from '@/components/utils';

type DevCriteria = {
  imp: number;
  ris: number;
  fre: number;
  esf: number;
  deb: number;
};

type DevHistoryItem = {
  id: string;
  user: string;
  message: string;
  createdAt: string;
};

type DevTag = {
  id: string;
  name: string;
  color: string;
};

type DevTicket = BaseDevTicket & {
  createdBy: string;
  protoExt?: string;
  instance?: string;
  cnpj?: string;
  clientPhone?: string;
  updatedAt?: number;
  concludedAt?: number;
  totalPts?: number;
  tags: string[];
  criteria: DevCriteria;
  history: DevHistoryItem[];
};

type TicketFormState = {
  title: string;
  category: string;
  devType: DevType;
  devStatus: DevStatus;
  resp: string;
  sprintId: string;
  parentId: string;
  clientName: string;
  protoExt: string;
  instance: string;
  cnpj: string;
  clientPhone: string;
  startDate: string;
  deadline: string;
  imp: string;
  ris: string;
  fre: string;
  esf: string;
  deb: string;
  description: string;
};

const DEV_TAGS: DevTag[] = [
  { id: 'tag-prioridade', name: 'Prioridade', color: '#2563eb' },
  { id: 'tag-habilis', name: 'Habilis', color: '#d97706' },
  { id: 'tag-meta', name: 'Meta', color: '#7c3aed' },
  { id: 'tag-hotfix', name: 'Hotfix', color: '#dc2626' },
  { id: 'tag-ux', name: 'UX', color: '#0f766e' },
];

const CURRENT_USER_ID = DEV_USERS[0]?.id ?? '';
const ANALYSIS_STATUS = ALL_DEV_STATUSES[1];
const COMPLETED_STATUS = ALL_DEV_STATUSES[ALL_DEV_STATUSES.length - 1];
let nextGeneratedTicketId = Math.max(...INITIAL_DEV_TICKETS.map((ticket) => ticket.id), 0) + 1;
let nextGeneratedHistoryId = 1;
let nextGeneratedCommentId = 1;

const EMPTY_FORM: TicketFormState = {
  title: '',
  category: DEV_CATEGORIES[0],
  devType: 'Task',
  devStatus: 'Backlog',
  resp: DEV_USERS[0]?.id ?? '',
  sprintId: '',
  parentId: '',
  clientName: '',
  protoExt: '',
  instance: '',
  cnpj: '',
  clientPhone: '',
  startDate: '',
  deadline: '',
  imp: '0',
  ris: '0',
  fre: '0',
  esf: '0',
  deb: '0',
  description: '',
};

function formatDateTime(value: Date = new Date()) {
  return value.toLocaleDateString('pt-BR') + ' ' + value.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function getInitials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((word) => word[0]?.toUpperCase()).join('') || '?';
}

function calcScore(criteria: DevCriteria) {
  return Math.round(criteria.imp * 0.3 * 5 + criteria.ris * 0.25 * 5 + criteria.fre * 0.2 * 5 + criteria.deb * 0.15 * 5 + criteria.esf * 0.1 * 5);
}

function defaultCriteriaForScore(score: number): DevCriteria {
  if (score >= 12) return { imp: 3, ris: 3, fre: 3, esf: 3, deb: 1 };
  if (score >= 9) return { imp: 2, ris: 2, fre: 2, esf: 1, deb: 1 };
  if (score >= 6) return { imp: 2, ris: 1, fre: 1, esf: 1, deb: 1 };
  return { imp: 1, ris: 1, fre: 0, esf: 1, deb: 0 };
}

function normalizeInitialTickets(tickets: BaseDevTicket[]): DevTicket[] {
  return tickets.map((ticket, index) => {
    const criteria = defaultCriteriaForScore(ticket.score);
    const activityDate = ticket.deadline ?? ticket.startDate ?? ticket.createdAt;
    const activityTimestamp = activityDate ? new Date(`${activityDate}T18:00:00`).getTime() : undefined;
    const primaryTag = ticket.category === 'Habilis' ? 'tag-habilis' : ticket.category === 'Meta' ? 'tag-meta' : ticket.devType === 'Bug' ? 'tag-hotfix' : ticket.category === 'UX / Interface' ? 'tag-ux' : 'tag-prioridade';

    return {
      ...ticket,
      createdBy: DEV_USERS[index % DEV_USERS.length]?.id ?? CURRENT_USER_ID,
      protoExt: ticket.category === 'Habilis' || ticket.category === 'Meta' ? `EXT-${String(240 + index).padStart(3, '0')}` : undefined,
      instance: ticket.clientName ? ticket.clientName.toUpperCase() : undefined,
      cnpj: index % 2 === 0 ? `00.000.000/000${(index % 9) + 1}-0${index % 9}` : undefined,
      clientPhone: index % 2 === 0 ? '(11) 99999-0000' : undefined,
      updatedAt: activityTimestamp,
      concludedAt: ticket.devStatus === COMPLETED_STATUS ? activityTimestamp : undefined,
      totalPts: Math.max(0, Math.round(ticket.score / 2)),
      tags: [primaryTag],
      criteria,
      history: [
        {
          id: `history-${ticket.id}-created`,
          user: DEV_USERS[index % DEV_USERS.length]?.name ?? 'Sistema',
          message: 'Ticket criado',
          createdAt: formatDateTime(new Date(`${ticket.createdAt}T10:37:00`)),
        },
      ],
    };
  });
}

function formatDate(date: string | undefined) {
  if (!date) return '-';
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year}`;
}

function formatLibraryDate(value: number | string | undefined) {
  if (!value) return '-';
  if (typeof value === 'number') {
    return new Date(value).toLocaleDateString('pt-BR');
  }
  return formatDate(value);
}

function getLibrarySortTime(ticket: DevTicket) {
  if (ticket.concludedAt) return ticket.concludedAt;
  if (ticket.updatedAt) return ticket.updatedAt;
  const fallbackDate = ticket.deadline ?? ticket.startDate ?? ticket.createdAt;
  return fallbackDate ? new Date(`${fallbackDate}T00:00:00`).getTime() : 0;
}

function getNowTimestamp() {
  return Date.now();
}

function buildProtocol() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const suffix = String(Math.floor(Math.random() * 900000) + 100000);
  return `DEV-${year}${month}-${suffix}`;
}

function buildTicketId() {
  const id = nextGeneratedTicketId;
  nextGeneratedTicketId += 1;
  return id;
}

function buildHistoryId(ticketId: number) {
  const id = `history-${ticketId}-${nextGeneratedHistoryId}`;
  nextGeneratedHistoryId += 1;
  return id;
}

function buildCommentId(ticketId: number) {
  const id = `comment-${ticketId}-${nextGeneratedCommentId}`;
  nextGeneratedCommentId += 1;
  return id;
}

function getPriority(score: number) {
  if (score >= 12) return { label: 'CRÍTICO', badgeClassName: 'border-[#fecaca] bg-[#fef2f2] text-[#dc2626]', borderClassName: 'border-l-[#dc2626]', scoreClassName: 'text-[#dc2626]' };
  if (score >= 9) return { label: 'ALTO', badgeClassName: 'border-[#fde68a] bg-[#fffbeb] text-[#d97706]', borderClassName: 'border-l-[#d97706]', scoreClassName: 'text-[#d97706]' };
  if (score >= 6) return { label: 'MÉDIO', badgeClassName: 'border-[#fde68a] bg-[#fefce8] text-[#854d0e]', borderClassName: 'border-l-[#ca8a04]', scoreClassName: 'text-[#ca8a04]' };
  return { label: 'BAIXO', badgeClassName: 'border-[#a7f3d0] bg-[#ecfdf5] text-[#059669]', borderClassName: 'border-l-[#059669]', scoreClassName: 'text-[#059669]' };
}

function getStatusBadgeClass(status: DevStatus) {
  switch (status) {
    case 'Backlog': return 'border-[#e2e8f0] bg-[#f1f5f9] text-[#475569]';
    case ANALYSIS_STATUS: return 'border-[#fde68a] bg-[#fffbeb] text-[#d97706]';
    case 'Pronto para Desenvolver': return 'border-[#bfdbfe] bg-[#eff6ff] text-[#2563eb]';
    case 'Em Desenvolvimento': return 'border-[#ddd6fe] bg-[#f5f3ff] text-[#7c3aed]';
    case 'Testes': return 'border-[#fde68a] bg-[#fefce8] text-[#854d0e]';
    case 'Code Review': return 'border-[#f9a8d4] bg-[#fdf2f8] text-[#9d174d]';
    case COMPLETED_STATUS: return 'border-[#a7f3d0] bg-[#ecfdf5] text-[#059669]';
  }
}

function getTypeBadgeClass(type: DevType) {
  const styles: Record<DevType, string> = {
    Epic: 'border-[#ddd6fe] bg-[#f5f3ff] text-[#7c3aed]',
    Feature: 'border-[#bfdbfe] bg-[#eff6ff] text-[#2563eb]',
    Task: 'border-[#e2e8f0] bg-[#f1f5f9] text-[#475569]',
    Bug: 'border-[#fecaca] bg-[#fef2f2] text-[#dc2626]',
  };
  return styles[type];
}

function Badge({ children, className }: { children: React.ReactNode; className?: string; }) {
  return (
    <span className={cn('inline-flex items-center rounded-full border px-[10px] py-[4px] text-[11px] font-bold whitespace-nowrap', className)}>
      {children}
    </span>
  );
}

function FormLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-[11px] font-bold tracking-[.06em] text-[#64748b] uppercase">{children}</label>;
}

export function DevLibraryPage() {
  const { currentUser: sessionUser } = useCurrentAdminUser();
  const [tickets, setTickets] = useState<DevTicket[]>(() => normalizeInitialTickets(INITIAL_DEV_TICKETS));
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [responsibleFilter, setResponsibleFilter] = useState('');
  const [sprintFilter, setSprintFilter] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
  const [editingTicketId, setEditingTicketId] = useState<number | null>(null);
  const [formState, setFormState] = useState<TicketFormState>(EMPTY_FORM);
  const [commentDraft, setCommentDraft] = useState('');
  const [tagPickerTicketId, setTagPickerTicketId] = useState<number | null>(null);
  const [deadlineTicketId, setDeadlineTicketId] = useState<number | null>(null);
  const [deadlineDraft, setDeadlineDraft] = useState('');
  const [deadlineReason, setDeadlineReason] = useState('');

  const usersById = DEV_USERS.reduce<Record<string, (typeof DEV_USERS)[number]>>((acc, user) => {
    acc[user.id] = user;
    return acc;
  }, {});

  const sprintsById = DEV_SPRINTS.reduce<Record<string, (typeof DEV_SPRINTS)[number]>>((acc, sprint) => {
    acc[sprint.id] = sprint;
    return acc;
  }, {});

  const epicMap = tickets.reduce<Record<number, string>>((acc, ticket) => {
    if (ticket.devType === 'Epic') acc[ticket.id] = ticket.title;
    return acc;
  }, {});

  const selectedTicket = tickets.find((ticket) => ticket.id === selectedTicketId) ?? null;
  const currentUser = sessionUser
    ? { id: sessionUser.id, name: sessionUser.name }
    : DEV_USERS.find((user) => user.id === CURRENT_USER_ID) ?? DEV_USERS[0];
  const selectedDeadlineTicket = tickets.find((ticket) => ticket.id === deadlineTicketId) ?? null;
  const selectedTagTicket = tickets.find((ticket) => ticket.id === tagPickerTicketId) ?? null;
  const tagsById = DEV_TAGS.reduce<Record<string, DevTag>>((acc, tag) => {
    acc[tag.id] = tag;
    return acc;
  }, {});

  const completedTickets = tickets.filter((ticket) => ticket.devStatus === COMPLETED_STATUS);
  const visibleTickets = completedTickets
    .filter((ticket) => (typeFilter ? ticket.devType === typeFilter : true))
    .filter((ticket) => (categoryFilter ? ticket.category === categoryFilter : true))
    .filter((ticket) => (responsibleFilter ? ticket.resp === responsibleFilter : true))
    .filter((ticket) => (sprintFilter ? ticket.sprintId === sprintFilter : true));

  const responsibleUsers = DEV_USERS.filter((user) =>
    completedTickets.some((ticket) => ticket.resp === user.id),
  );
  const libraryTypes: DevType[] = ['Epic', ...DEV_FILTER_TYPES];
  const sortedVisibleTickets = [...visibleTickets].sort(
    (left, right) => getLibrarySortTime(right) - getLibrarySortTime(left),
  );
  const hasActiveFilters = Boolean(
    typeFilter || categoryFilter || responsibleFilter || sprintFilter,
  );

  const formCriteria: DevCriteria = {
    imp: Number(formState.imp) || 0,
    ris: Number(formState.ris) || 0,
    fre: Number(formState.fre) || 0,
    esf: Number(formState.esf) || 0,
    deb: Number(formState.deb) || 0,
  };
  const formScore = calcScore(formCriteria);

  function updateFormField<Key extends keyof TicketFormState>(key: Key, value: TicketFormState[Key]) {
    setFormState((current) => ({ ...current, [key]: value }));
  }

  function openEditModal(ticket: DevTicket) {
    setFormState({
      title: ticket.title,
      category: ticket.category,
      devType: ticket.devType,
      devStatus: ticket.devStatus,
      resp: ticket.resp,
      sprintId: ticket.sprintId ?? '',
      parentId: ticket.parentId ? String(ticket.parentId) : '',
      clientName: ticket.clientName ?? '',
      protoExt: ticket.protoExt ?? '',
      instance: ticket.instance ?? '',
      cnpj: ticket.cnpj ?? '',
      clientPhone: ticket.clientPhone ?? '',
      startDate: ticket.startDate ?? '',
      deadline: ticket.deadline ?? '',
      imp: String(ticket.criteria.imp),
      ris: String(ticket.criteria.ris),
      fre: String(ticket.criteria.fre),
      esf: String(ticket.criteria.esf),
      deb: String(ticket.criteria.deb),
      description: ticket.description,
    });
    setEditingTicketId(ticket.id);
    setFormMode('edit');
  }

  function closeFormModal() {
    setFormMode(null);
    setEditingTicketId(null);
  }

  function appendHistory(ticket: DevTicket, message: string) {
    return [
      ...ticket.history,
      {
        id: buildHistoryId(ticket.id),
        user: currentUser?.name ?? 'Sistema',
        message,
        createdAt: formatDateTime(),
      },
    ];
  }

  function updateTicket(ticketId: number, updater: (ticket: DevTicket) => DevTicket) {
    setTickets((current) =>
      current.map((ticket) =>
        ticket.id === ticketId ? { ...updater(ticket), updatedAt: getNowTimestamp() } : ticket,
      ),
    );
  }

  function moveTicket(ticketId: number, nextStatus: DevStatus) {
    updateTicket(ticketId, (ticket) => ({
      ...ticket,
      devStatus: nextStatus,
      concludedAt: nextStatus === COMPLETED_STATUS ? getNowTimestamp() : undefined,
      history: ticket.devStatus === nextStatus ? ticket.history : appendHistory(ticket, `Status: ${ticket.devStatus} -> ${nextStatus}`),
    }));
  }

  function handleConcludeSelectedTicket() {
    if (!selectedTicket) return;
    updateTicket(selectedTicket.id, (ticket) => ({
      ...ticket,
      devStatus: COMPLETED_STATUS,
      concludedAt: getNowTimestamp(),
      history: appendHistory(ticket, 'Task concluida'),
    }));
    setSelectedTicketId(null);
  }

  function handleAddComment() {
    if (!selectedTicket || !commentDraft.trim()) return;
    updateTicket(selectedTicket.id, (ticket) => ({
      ...ticket,
      comments: [
        ...ticket.comments,
        {
          id: buildCommentId(ticket.id),
          author: currentUser?.name ?? 'Usuario',
          message: commentDraft.trim(),
          createdAt: formatDateTime(),
        },
      ],
      history: appendHistory(ticket, 'Comentou'),
    }));
    setCommentDraft('');
  }

  function toggleTag(ticketId: number, tagId: string) {
    updateTicket(ticketId, (ticket) => ({
      ...ticket,
      tags: ticket.tags.includes(tagId)
        ? ticket.tags.filter((currentTagId) => currentTagId !== tagId)
        : [...ticket.tags, tagId],
      history: appendHistory(ticket, 'Etiquetas atualizadas'),
    }));
  }

  function openDeadlineModal(ticketId: number) {
    const ticket = tickets.find((currentTicket) => currentTicket.id === ticketId);
    setDeadlineTicketId(ticketId);
    setDeadlineDraft(ticket?.deadline ?? '');
    setDeadlineReason('');
  }

  function closeDeadlineModal() {
    setDeadlineTicketId(null);
    setDeadlineDraft('');
    setDeadlineReason('');
  }

  function handleSaveDeadline() {
    if (!selectedDeadlineTicket || !deadlineDraft || !deadlineReason.trim()) return;
    const previousDeadline = selectedDeadlineTicket.deadline;
    updateTicket(selectedDeadlineTicket.id, (ticket) => ({
      ...ticket,
      deadline: deadlineDraft,
      history: appendHistory(ticket, `Prazo alterado: ${formatDate(previousDeadline)} -> ${formatDate(deadlineDraft)}. Motivo: ${deadlineReason.trim()}`),
    }));
    closeDeadlineModal();
  }

  function handleDeleteSelectedTicket() {
    if (!selectedTicket) return;
    if (!window.confirm('Remover este ticket do kanban?')) return;
    setTickets((current) => current.filter((ticket) => ticket.id !== selectedTicket.id));
    setSelectedTicketId(null);
  }

  function handleExport() {
    const rows = [
      ['Protocolo', 'Tipo', 'Título', 'Categoria', 'Status', 'Responsável', 'Score', 'Sprint'],
      ...visibleTickets.map((ticket) => [
        ticket.proto,
        ticket.devType,
        ticket.title,
        ticket.category,
        ticket.devStatus,
        usersById[ticket.resp]?.name ?? '-',
        String(ticket.score),
        ticket.sprintId ? sprintsById[ticket.sprintId]?.name ?? '-' : '-',
      ]),
    ];

    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'biblioteca-dev.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleSaveTicket() {
    if (!formState.title.trim()) return;

    if (formMode === 'edit' && editingTicketId) {
      setTickets((current) =>
        current.map((ticket) =>
          ticket.id === editingTicketId
            ? {
                ...ticket,
                title: formState.title.trim(),
                category: formState.category,
                devType: formState.devType,
                devStatus: formState.devStatus,
                resp: formState.resp,
                score: formScore,
                sprintId: formState.sprintId || undefined,
                parentId: formState.parentId ? Number(formState.parentId) : undefined,
                clientName: formState.clientName.trim() || undefined,
                protoExt: formState.protoExt.trim() || undefined,
                instance: formState.instance.trim() || undefined,
                cnpj: formState.cnpj.trim() || undefined,
                clientPhone: formState.clientPhone.trim() || undefined,
                startDate: formState.startDate || undefined,
                deadline: formState.deadline || undefined,
                description: formState.description.trim(),
                concludedAt: formState.devStatus === COMPLETED_STATUS ? getNowTimestamp() : undefined,
                criteria: formCriteria,
                history: appendHistory(ticket, 'Ticket editado'),
              }
            : ticket,
        ),
      );
    } else {
      const nextTicketId = buildTicketId();
      const nextTicket: DevTicket = {
        id: nextTicketId,
        proto: buildProtocol(),
        title: formState.title.trim(),
        category: formState.category,
        devType: formState.devType,
        devStatus: formState.devStatus,
        resp: formState.resp,
        score: formScore,
        createdAt: new Date().toISOString().slice(0, 10),
        sprintId: formState.sprintId || undefined,
        parentId: formState.parentId ? Number(formState.parentId) : undefined,
        clientName: formState.clientName.trim() || undefined,
        protoExt: formState.protoExt.trim() || undefined,
        instance: formState.instance.trim() || undefined,
        cnpj: formState.cnpj.trim() || undefined,
        clientPhone: formState.clientPhone.trim() || undefined,
        startDate: formState.startDate || undefined,
        deadline: formState.deadline || undefined,
        description: formState.description.trim(),
        concludedAt: formState.devStatus === COMPLETED_STATUS ? getNowTimestamp() : undefined,
        comments: [],
        createdBy: currentUser?.id ?? CURRENT_USER_ID,
        tags: [],
        criteria: formCriteria,
        history: [
          {
            id: buildHistoryId(nextTicketId),
            user: currentUser?.name ?? 'Sistema',
            message: 'Ticket criado',
            createdAt: formatDateTime(),
          },
        ],
      };

      setTickets((current) => [nextTicket, ...current]);
    }
    closeFormModal();
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-[20px] font-extrabold tracking-[-0.4px] text-[#0f172a]">
            Biblioteca Dev
          </h1>
          <p className="mt-0.5 text-[13px] text-[#64748b]">
            {visibleTickets.length} tasks concluídas no histórico
          </p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-[8px] border border-[#e2e8f0] bg-white px-4 text-[13px] font-semibold text-[#0f172a] shadow-sm transition-colors hover:bg-[#f8fafc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e2e8f0]"
        >
          <Download className="h-4 w-4" />
          <span>Exportar</span>
        </button>
      </div>

      <div className="mb-6 rounded-[10px] border border-[#e2e8f0] bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <div className="relative">
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                className="h-9 min-w-[150px] appearance-none rounded-[6px] border border-[#e2e8f0] bg-transparent px-3 pr-8 text-[13px] text-[#0f172a] outline-none transition-colors focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]"
              >
                <option value="">Todos os tipos</option>
                {libraryTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="h-9 min-w-[160px] appearance-none rounded-[6px] border border-[#e2e8f0] bg-transparent px-3 pr-8 text-[13px] text-[#0f172a] outline-none transition-colors focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]"
              >
                <option value="">Todas as categorias</option>
                {DEV_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <select
                value={responsibleFilter}
                onChange={(event) => setResponsibleFilter(event.target.value)}
                className="h-9 min-w-[160px] appearance-none rounded-[6px] border border-[#e2e8f0] bg-transparent px-3 pr-8 text-[13px] text-[#0f172a] outline-none transition-colors focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]"
              >
                <option value="">Todos responsáveis</option>
                {responsibleUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>

            {DEV_SPRINTS.length ? (
              <div className="relative">
                <select
                  value={sprintFilter}
                  onChange={(event) => setSprintFilter(event.target.value)}
                  className="h-9 min-w-[150px] appearance-none rounded-[6px] border border-[#e2e8f0] bg-transparent px-3 pr-8 text-[13px] text-[#0f172a] outline-none transition-colors focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]"
                >
                  <option value="">Todas as sprints</option>
                  {DEV_SPRINTS.map((sprint) => (
                    <option key={sprint.id} value={sprint.id}>
                      {sprint.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {hasActiveFilters ? (
              <button
                type="button"
                onClick={() => {
                  setTypeFilter('');
                  setCategoryFilter('');
                  setResponsibleFilter('');
                  setSprintFilter('');
                }}
                className="inline-flex h-9 items-center px-3 text-[13px] font-medium text-[#64748b] hover:text-[#0f172a]"
              >
                Limpar
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {sortedVisibleTickets.length ? (
        <div className="grid gap-3">
          {sortedVisibleTickets.map((ticket) => {
            const priority = getPriority(ticket.score);
            const responsible = usersById[ticket.resp];
            const epicName = ticket.parentId ? epicMap[ticket.parentId] : null;
            const concludedDate = formatLibraryDate(
              ticket.concludedAt ??
                ticket.updatedAt ??
                ticket.deadline ??
                ticket.startDate ??
                ticket.createdAt,
            );
            const totalPoints = ticket.totalPts ?? 0;

            return (
              <div
                key={ticket.id}
                onClick={() => setSelectedTicketId(ticket.id)}
                className={cn(
                  'flex cursor-pointer items-start gap-4 rounded-[14px] border border-[#e2e8f0] border-l-[4px] bg-white p-4 shadow-sm transition-all hover:-translate-y-[1px] hover:border-[#bfdbfe] hover:shadow-md',
                  priority.borderClassName,
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap gap-2">
                    <span className="rounded-full border border-[#e2e8f0] bg-[#f8fafc] px-[8px] py-[3px] font-mono text-[10px] font-bold text-[#475569]">
                      {ticket.proto}
                    </span>
                    <Badge className={getTypeBadgeClass(ticket.devType)}>{ticket.devType}</Badge>
                    <Badge className={priority.badgeClassName}>{priority.label}</Badge>
                    <Badge className="border-[#a7f3d0] bg-[#ecfdf5] text-[#059669]">
                      Concluído
                    </Badge>
                  </div>

                  {epicName ? (
                    <div className="mb-1 text-[11px] font-bold text-[#7c3aed]">{epicName}</div>
                  ) : null}

                  <div className="text-[15px] font-extrabold text-[#0f172a]">{ticket.title}</div>
                  <div className="mt-1 text-[12px] text-[#64748b]">
                    {ticket.category}
                    {ticket.clientName ? ` · ${ticket.clientName}` : ''}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-[#64748b]">
                    {responsible ? (
                      <span className="inline-flex rounded-full border border-[#e2e8f0] bg-[#f8fafc] px-[8px] py-[4px] font-medium">
                        {responsible.name}
                      </span>
                    ) : null}
                    <span className="inline-flex rounded-full border border-[#e2e8f0] bg-[#f8fafc] px-[8px] py-[4px] font-medium">
                      Concluído em: {concludedDate}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1">
                  <div className="text-[20px] font-extrabold text-[#059669]">{totalPoints}</div>
                  <div className="text-[11px] font-bold tracking-[.06em] text-[#64748b] uppercase">Pts</div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 rounded-[16px] border border-dashed border-[#cbd5e1] bg-white px-6 py-12 text-center shadow-sm">
          <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#eff6ff] text-[#2563eb]">
            📚
          </div>
          <div className="text-[16px] font-bold text-[#0f172a]">Nenhuma task concluída</div>
          <div className="mt-1 text-[13px] text-[#64748b]">
            Ajuste os filtros ou conclua uma task para vê-la no histórico.
          </div>
        </div>
      )}

      <ModalShell
        open={Boolean(selectedTicket)}
        title={selectedTicket?.title ?? 'Detalhes do ticket'}
        description={
          selectedTicket
            ? `${selectedTicket.proto} · ${selectedTicket.devType} · ${selectedTicket.devStatus} · Score ${selectedTicket.score}/15`
            : undefined
        }
        maxWidthClassName="max-w-[800px]"
        onClose={() => {
          setSelectedTicketId(null);
          setCommentDraft('');
        }}
        footer={
          selectedTicket ? (
            <div className="flex w-full items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => setSelectedTicketId(null)} className="h-9 rounded-[8px] border border-[#e2e8f0] bg-white px-4 text-[13px] font-semibold text-[#64748b] hover:bg-[#f8fafc]">Fechar</button>
                <button type="button" onClick={() => setTagPickerTicketId(selectedTicket.id)} className="h-9 rounded-[8px] border border-[#e2e8f0] bg-white px-4 text-[13px] font-semibold text-[#0f172a] hover:bg-[#f8fafc]">Etiquetas</button>
                <button type="button" onClick={() => openDeadlineModal(selectedTicket.id)} className="h-9 rounded-[8px] border border-[#e2e8f0] bg-white px-4 text-[13px] font-semibold text-[#0f172a] hover:bg-[#f8fafc]">Alterar Prazo</button>
                <button type="button" onClick={handleDeleteSelectedTicket} className="h-9 rounded-[8px] border border-[#fecaca] bg-white px-4 text-[13px] font-semibold text-[#dc2626] hover:bg-[#fef2f2]">Excluir</button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => { openEditModal(selectedTicket); setSelectedTicketId(null); }} className="h-9 rounded-[8px] border border-[#e2e8f0] bg-white px-4 text-[13px] font-semibold text-[#0f172a] hover:bg-[#f8fafc]">Editar</button>
                <select
                  value={selectedTicket.devStatus}
                  onChange={(event) => moveTicket(selectedTicket.id, event.target.value as DevStatus)}
                  className="h-9 rounded-[6px] border border-[#e2e8f0] bg-white px-3 text-[13px] font-semibold outline-none focus:border-[#2563eb]"
                >
                  {ALL_DEV_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                {selectedTicket.devStatus !== COMPLETED_STATUS ? (
                  <button type="button" onClick={handleConcludeSelectedTicket} className="h-9 rounded-[8px] bg-[#059669] px-4 text-[13px] font-semibold text-white hover:bg-[#047857]">Concluir</button>
                ) : null}
              </div>
            </div>
          ) : null
        }
      >
        {selectedTicket ? (
          <div className="grid gap-4">
            {selectedTicket.tags.length ? (
              <div className="flex flex-wrap gap-1">
                {selectedTicket.tags.map((tagId) =>
                  tagsById[tagId] ? (
                    <span
                      key={tagId}
                      className="inline-flex items-center rounded-full px-[10px] py-[4px] text-[11px] font-bold text-white"
                      style={{ backgroundColor: tagsById[tagId].color }}
                    >
                      {tagsById[tagId].name}
                    </span>
                  ) : null,
                )}
              </div>
            ) : null}

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] p-3">
                <div className="mb-1 text-[10px] font-bold tracking-[.06em] text-[#64748b] uppercase">Score</div>
                <div className={cn('text-[18px] font-extrabold', getPriority(selectedTicket.score).scoreClassName)}>
                  {selectedTicket.score}<span className="text-[12px] font-medium text-[#64748b]">/15</span>
                </div>
              </div>

              <div className="rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] p-3">
                <div className="mb-1 text-[10px] font-bold tracking-[.06em] text-[#64748b] uppercase">Categoria</div>
                <div className="text-[13px] font-semibold text-[#0f172a]">{selectedTicket.category}</div>
              </div>

              <div className="rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] p-3">
                <div className="mb-1 text-[10px] font-bold tracking-[.06em] text-[#64748b] uppercase">Responsável</div>
                <div className="text-[13px] font-semibold text-[#0f172a]">
                  {usersById[selectedTicket.resp]?.name ?? '-'}
                </div>
              </div>

              <div className="rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] p-3">
                <div className="mb-1 text-[10px] font-bold tracking-[.06em] text-[#64748b] uppercase">Início / Entrega</div>
                <div className="text-[13px] font-semibold text-[#0f172a]">
                  {formatDate(selectedTicket.startDate)} → {formatDate(selectedTicket.deadline)}
                </div>
              </div>

              {selectedTicket.protoExt ? (
                <div className="rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] p-3">
                  <div className="mb-1 text-[10px] font-bold tracking-[.06em] text-[#64748b] uppercase">Protocolo Externo</div>
                  <div className="font-mono text-[13px] font-semibold text-[#92400e]">{selectedTicket.protoExt}</div>
                </div>
              ) : null}

              {selectedTicket.instance ? (
                <div className="rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] p-3">
                  <div className="mb-1 text-[10px] font-bold tracking-[.06em] text-[#64748b] uppercase">Instância</div>
                  <div className="text-[13px] font-semibold text-[#0f172a]">{selectedTicket.instance}</div>
                </div>
              ) : null}

              <div className="rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] p-3 md:col-span-2">
                <div className="mb-1 text-[10px] font-bold tracking-[.06em] text-[#64748b] uppercase">Descrição</div>
                <p className="whitespace-pre-wrap text-[13px] leading-6 text-[#475569]">
                  {selectedTicket.description || 'Sem descrição.'}
                </p>
              </div>
            </div>
            
            <div>
              <div className="mb-2 border-b border-[#e2e8f0] pb-2 text-[14px] font-bold text-[#0f172a]">Histórico</div>
              {selectedTicket.history.length ? (
                <div className="space-y-3">
                  {[...selectedTicket.history].reverse().map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <span className="mt-[7px] h-2 w-2 shrink-0 rounded-full bg-[#2563eb]" />
                      <div className="min-w-0">
                        <div className="text-[13px] text-[#0f172a]"><span className="font-semibold">{item.user}</span> {item.message}</div>
                        <div className="text-[12px] text-[#64748b]">{item.createdAt}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[10px] border border-dashed border-[#cbd5e1] bg-[#f8fafc] px-4 py-6 text-center text-[13px] text-[#64748b]">Nenhum histórico registrado.</div>
              )}
            </div>

            <div className="rounded-[12px] border border-[#e2e8f0] bg-white p-4 shadow-sm">
              <div className="mb-3 inline-flex items-center gap-2 text-[12px] font-bold text-[#0f172a]">
                <MessageSquareText className="size-4" /> Comentários
                <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-[#eff6ff] px-1.5 py-[2px] text-[10px] font-bold text-[#2563eb]">{selectedTicket.comments.length}</span>
              </div>
              {selectedTicket.comments.length ? (
                <div className="space-y-2">
                  {selectedTicket.comments.map((comment) => (
                    <div key={comment.id} className="rounded-[10px] border border-[#e2e8f0] bg-[#f8fafc] p-3">
                      <div className="flex justify-between gap-2">
                        <div className="text-[13px] font-semibold text-[#0f172a]">{comment.author}</div>
                        <div className="text-[11px] text-[#64748b]">{comment.createdAt}</div>
                      </div>
                      <div className="mt-1 whitespace-pre-wrap text-[13px] text-[#475569]">{comment.message}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[10px] border border-dashed border-[#cbd5e1] bg-[#f8fafc] px-4 py-6 text-center text-[13px] text-[#64748b]">Nenhum comentário.</div>
              )}
              <div className="mt-4 flex items-center gap-3">
                <div className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[#2563eb] text-[12px] font-bold text-white">{getInitials(currentUser?.name ?? 'Usuário')}</div>
                <input value={commentDraft} onChange={(e) => setCommentDraft(e.target.value)} placeholder="Adicionar comentário..." className="h-[42px] flex-1 rounded-[8px] border border-[#d7dfeb] bg-[#f8fafc] px-3 text-[13px] text-[#0f172a] outline-none focus:border-[#2563eb]" />
                <button type="button" onClick={handleAddComment} className="h-[42px] rounded-[8px] bg-[#2563eb] px-4 text-[13px] font-semibold text-white hover:bg-[#1d4ed8]">Enviar</button>
              </div>
            </div>
          </div>
        ) : null}
      </ModalShell>

      <ModalShell
        open={Boolean(selectedTagTicket)}
        title="Etiquetas"
        maxWidthClassName="max-w-[520px]"
        onClose={() => setTagPickerTicketId(null)}
        footer={<button type="button" onClick={() => setTagPickerTicketId(null)} className="h-9 rounded-[8px] border border-[#e2e8f0] bg-white px-4 text-[13px] font-semibold text-[#64748b] hover:bg-[#f8fafc]">Fechar</button>}
      >
        {selectedTagTicket ? (
          <div className="grid gap-3">
            {DEV_TAGS.map((tag) => {
              const active = selectedTagTicket.tags.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(selectedTagTicket.id, tag.id)}
                  className={cn('flex items-center justify-between rounded-[10px] border px-4 py-3 text-left transition-colors', active ? 'border-[#2563eb] bg-[#eff6ff]' : 'border-[#e2e8f0] bg-[#f8fafc] hover:border-[#bfdbfe]')}
                >
                  <div className="flex items-center gap-3">
                    <span className="size-3 rounded-full" style={{ backgroundColor: tag.color }} />
                    <span className="text-[13px] font-semibold text-[#0f172a]">{tag.name}</span>
                  </div>
                  <span className="text-[12px] font-semibold text-[#2563eb]">{active ? 'Selecionada' : 'Adicionar'}</span>
                </button>
              );
            })}
          </div>
        ) : null}
      </ModalShell>

      <ModalShell
        open={Boolean(selectedDeadlineTicket)}
        title="Alterar Prazo"
        maxWidthClassName="max-w-[560px]"
        onClose={closeDeadlineModal}
        footer={
          <div className="flex justify-end gap-2 w-full">
            <button type="button" onClick={closeDeadlineModal} className="h-9 rounded-[8px] border border-[#e2e8f0] bg-white px-4 text-[13px] font-semibold text-[#64748b] hover:bg-[#f8fafc]">Cancelar</button>
            <button type="button" onClick={handleSaveDeadline} className="h-9 rounded-[8px] bg-[#2563eb] px-4 text-[13px] font-semibold text-white hover:bg-[#1d4ed8]">Salvar prazo</button>
          </div>
        }
      >
        <div className="grid gap-4">
          <div className="flex flex-col gap-[5px]">
            <FormLabel>Nova entrega</FormLabel>
            <input type="date" value={deadlineDraft} onChange={(e) => setDeadlineDraft(e.target.value)} className="w-full rounded-[7px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-[9px] text-[13px] outline-none focus:border-[#2563eb]" />
          </div>
          <div className="flex flex-col gap-[5px]">
            <FormLabel>Motivo</FormLabel>
            <textarea value={deadlineReason} onChange={(e) => setDeadlineReason(e.target.value)} className="min-h-[120px] w-full resize-y rounded-[7px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-[9px] text-[13px] outline-none focus:border-[#2563eb]" />
          </div>
        </div>
      </ModalShell>

      <ModalShell
        open={Boolean(formMode)}
        title={formMode === 'edit' ? 'Editar Task' : 'Nova Task'}
        maxWidthClassName="max-w-[920px]"
        onClose={closeFormModal}
        footer={
          <div className="flex justify-end gap-2 w-full">
            <button type="button" onClick={closeFormModal} className="h-9 rounded-[8px] border border-[#e2e8f0] bg-white px-4 text-[13px] font-semibold text-[#64748b] hover:bg-[#f8fafc]">Cancelar</button>
            <button type="button" onClick={handleSaveTicket} className="h-9 rounded-[8px] bg-[#2563eb] px-4 text-[13px] font-semibold text-white hover:bg-[#1d4ed8]">{formMode === 'edit' ? 'Salvar alterações' : 'Criar ticket'}</button>
          </div>
        }
      >
        <div className="grid gap-[14px] md:grid-cols-2">
          <div className="flex flex-col gap-[5px] md:col-span-2">
            <FormLabel>Título</FormLabel>
            <input value={formState.title} onChange={(e) => updateFormField('title', e.target.value)} className="w-full rounded-[7px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-[9px] text-[13px] outline-none focus:border-[#2563eb]" />
          </div>
          <div className="flex flex-col gap-[5px]">
            <FormLabel>Categoria</FormLabel>
            <select value={formState.category} onChange={(e) => updateFormField('category', e.target.value)} className="w-full rounded-[7px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-[9px] text-[13px] outline-none focus:border-[#2563eb]">
              {DEV_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-[5px]">
            <FormLabel>Tipo</FormLabel>
            <select value={formState.devType} onChange={(e) => updateFormField('devType', e.target.value as DevType)} className="w-full rounded-[7px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-[9px] text-[13px] outline-none focus:border-[#2563eb]">
              {(['Epic', 'Feature', 'Task', 'Bug'] as DevType[]).map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-[5px]">
            <FormLabel>Status</FormLabel>
            <select value={formState.devStatus} onChange={(e) => updateFormField('devStatus', e.target.value as DevStatus)} className="w-full rounded-[7px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-[9px] text-[13px] outline-none focus:border-[#2563eb]">
              {ALL_DEV_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-[5px]">
            <FormLabel>Responsável</FormLabel>
            <select value={formState.resp} onChange={(e) => updateFormField('resp', e.target.value)} className="w-full rounded-[7px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-[9px] text-[13px] outline-none focus:border-[#2563eb]">
              {DEV_USERS.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-[5px]">
            <FormLabel>Sprint</FormLabel>
            <select value={formState.sprintId} onChange={(e) => updateFormField('sprintId', e.target.value)} className="w-full rounded-[7px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-[9px] text-[13px] outline-none focus:border-[#2563eb]">
              <option value="">Sem sprint</option>
              {DEV_SPRINTS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-[5px]">
            <FormLabel>Epic pai</FormLabel>
            <select value={formState.parentId} onChange={(e) => updateFormField('parentId', e.target.value)} className="w-full rounded-[7px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-[9px] text-[13px] outline-none focus:border-[#2563eb]">
              <option value="">Item independente</option>
              {tickets.filter((t) => t.devType === 'Epic').map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-[5px]">
            <FormLabel>Cliente</FormLabel>
            <input value={formState.clientName} onChange={(e) => updateFormField('clientName', e.target.value)} className="w-full rounded-[7px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-[9px] text-[13px] outline-none focus:border-[#2563eb]" />
          </div>
          <div className="flex flex-col gap-[5px]">
            <FormLabel>Protocolo Externo</FormLabel>
            <input value={formState.protoExt} onChange={(e) => updateFormField('protoExt', e.target.value)} className="w-full rounded-[7px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-[9px] text-[13px] outline-none focus:border-[#2563eb]" />
          </div>
          <div className="flex flex-col gap-[5px]">
            <FormLabel>Instância</FormLabel>
            <input value={formState.instance} onChange={(e) => updateFormField('instance', e.target.value)} className="w-full rounded-[7px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-[9px] text-[13px] outline-none focus:border-[#2563eb]" />
          </div>
          <div className="flex flex-col gap-[5px]">
            <FormLabel>CNPJ</FormLabel>
            <input value={formState.cnpj} onChange={(e) => updateFormField('cnpj', e.target.value)} className="w-full rounded-[7px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-[9px] text-[13px] outline-none focus:border-[#2563eb]" />
          </div>
          <div className="flex flex-col gap-[5px]">
            <FormLabel>Telefone</FormLabel>
            <input value={formState.clientPhone} onChange={(e) => updateFormField('clientPhone', e.target.value)} className="w-full rounded-[7px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-[9px] text-[13px] outline-none focus:border-[#2563eb]" />
          </div>
          <div className="flex flex-col gap-[5px]">
            <FormLabel>Início</FormLabel>
            <input type="date" value={formState.startDate} onChange={(e) => updateFormField('startDate', e.target.value)} className="w-full rounded-[7px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-[9px] text-[13px] outline-none focus:border-[#2563eb]" />
          </div>
          <div className="flex flex-col gap-[5px]">
            <FormLabel>Entrega</FormLabel>
            <input type="date" value={formState.deadline} onChange={(e) => updateFormField('deadline', e.target.value)} className="w-full rounded-[7px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-[9px] text-[13px] outline-none focus:border-[#2563eb]" />
          </div>

          <div className="rounded-[10px] border border-[#d7dfeb] bg-[#f8fafc] p-4 md:col-span-2">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[12px] font-bold text-[#0f172a]">Critérios</div>
                <div className="text-[12px] text-[#64748b]">Ajuste os pesos para recalcular o score.</div>
              </div>
              <div className="rounded-[8px] border border-[#bfdbfe] bg-[#eff6ff] px-4 py-2">
                <div className="text-[10px] font-bold tracking-[.08em] text-[#2563eb] uppercase">Score</div>
                <div className="text-[22px] font-extrabold text-[#2563eb]">{formScore}/15</div>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {[
                ['imp', 'Impacto', formState.imp],
                ['ris', 'Risco', formState.ris],
                ['fre', 'Freq.', formState.fre],
                ['esf', 'Esforço', formState.esf],
                ['deb', 'Débito', formState.deb],
              ].map(([key, label, value]) => (
                <div key={key} className="flex flex-col gap-[5px]">
                  <FormLabel>{label}</FormLabel>
                  <input type="number" min="0" max="3" value={value} onChange={(e) => updateFormField(key as keyof TicketFormState, e.target.value)} className="w-full rounded-[7px] border border-[#e2e8f0] bg-white px-3 py-[9px] text-[13px] outline-none focus:border-[#2563eb]" />
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-[5px] md:col-span-2">
            <FormLabel>Descrição</FormLabel>
            <textarea value={formState.description} onChange={(e) => updateFormField('description', e.target.value)} className="min-h-[120px] w-full resize-y rounded-[7px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-[9px] text-[13px] outline-none focus:border-[#2563eb]" />
          </div>
        </div>
      </ModalShell>
    </div>
  );
}
