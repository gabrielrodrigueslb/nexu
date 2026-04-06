'use client';

import { useState } from 'react';
import { Copy, MessageSquareText } from 'lucide-react';

import {
  AppFormLabel as FormLabel,
  AppToolbarButton as ToolbarButton,
} from '@/components/app-ui-kit';
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
  return value.toLocaleDateString('pt-BR') +
    ' ' +
    value.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function getInitials(name: string) {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase())
      .join('') || '?'
  );
}

function calcScore(criteria: DevCriteria) {
  return Math.round(
    criteria.imp * 0.3 * 5 +
      criteria.ris * 0.25 * 5 +
      criteria.fre * 0.2 * 5 +
      criteria.deb * 0.15 * 5 +
      criteria.esf * 0.1 * 5,
  );
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
    const activityTimestamp = activityDate
      ? new Date(`${activityDate}T18:00:00`).getTime()
      : undefined;
    const primaryTag =
      ticket.category === 'Habilis'
        ? 'tag-habilis'
        : ticket.category === 'Meta'
          ? 'tag-meta'
          : ticket.devType === 'Bug'
            ? 'tag-hotfix'
            : ticket.category === 'UX / Interface'
              ? 'tag-ux'
              : 'tag-prioridade';

    return {
      ...ticket,
      createdBy: DEV_USERS[index % DEV_USERS.length]?.id ?? CURRENT_USER_ID,
      protoExt:
        ticket.category === 'Habilis' || ticket.category === 'Meta'
          ? `EXT-${String(240 + index).padStart(3, '0')}`
          : undefined,
      instance: ticket.clientName ? ticket.clientName.toUpperCase() : undefined,
      cnpj: index % 2 === 0 ? `00.000.000/000${(index % 9) + 1}-0${index % 9}` : undefined,
      clientPhone: index % 2 === 0 ? '(11) 99999-0000' : undefined,
      updatedAt: activityTimestamp,
      concludedAt: ticket.devStatus === 'ConcluÃ­do' ? activityTimestamp : undefined,
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
  if (score >= 12) {
    return {
      label: 'CRÃTICO',
      badgeClassName: 'border-[#fecaca] bg-[#fef2f2] text-[#dc2626]',
      borderClassName: 'border-l-[#dc2626]',
      scoreClassName: 'text-[#dc2626]',
    };
  }

  if (score >= 9) {
    return {
      label: 'ALTO',
      badgeClassName: 'border-[#fde68a] bg-[#fffbeb] text-[#d97706]',
      borderClassName: 'border-l-[#d97706]',
      scoreClassName: 'text-[#d97706]',
    };
  }

  if (score >= 6) {
    return {
      label: 'MÃ‰DIO',
      badgeClassName: 'border-[#fde68a] bg-[#fefce8] text-[#854d0e]',
      borderClassName: 'border-l-[#ca8a04]',
      scoreClassName: 'text-[#ca8a04]',
    };
  }

  return {
    label: 'BAIXO',
    badgeClassName: 'border-[#a7f3d0] bg-[#ecfdf5] text-[#059669]',
    borderClassName: 'border-l-[#059669]',
    scoreClassName: 'text-[#059669]',
  };
}

function getStatusBadgeClass(status: DevStatus) {
  const styles: Record<DevStatus, string> = {
    Backlog: 'border-[#e2e8f0] bg-[#f1f5f9] text-[#475569]',
    'AnÃ¡lise': 'border-[#fde68a] bg-[#fffbeb] text-[#d97706]',
    'Pronto para Desenvolver': 'border-[#bfdbfe] bg-[#eff6ff] text-[#2563eb]',
    'Em Desenvolvimento': 'border-[#ddd6fe] bg-[#f5f3ff] text-[#7c3aed]',
    Testes: 'border-[#fde68a] bg-[#fefce8] text-[#854d0e]',
    'Code Review': 'border-[#f9a8d4] bg-[#fdf2f8] text-[#9d174d]',
    'ConcluÃ­do': 'border-[#a7f3d0] bg-[#ecfdf5] text-[#059669]',
  };

  return styles[status];
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

function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-[9px] py-[3px] text-[11px] font-bold whitespace-nowrap',
        className,
      )}
    >
      {children}
    </span>
  );
}

export function DevLibraryPage() {
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

  const sprintsById = DEV_SPRINTS.reduce<Record<string, (typeof DEV_SPRINTS)[number]>>(
    (acc, sprint) => {
      acc[sprint.id] = sprint;
      return acc;
    },
    {},
  );

  const epicMap = tickets.reduce<Record<number, string>>((acc, ticket) => {
    if (ticket.devType === 'Epic') {
      acc[ticket.id] = ticket.title;
    }
    return acc;
  }, {});

  const selectedTicket = tickets.find((ticket) => ticket.id === selectedTicketId) ?? null;
  const currentUser = DEV_USERS.find((user) => user.id === CURRENT_USER_ID) ?? DEV_USERS[0];
  const selectedDeadlineTicket = tickets.find((ticket) => ticket.id === deadlineTicketId) ?? null;
  const selectedTagTicket = tickets.find((ticket) => ticket.id === tagPickerTicketId) ?? null;
  const tagsById = DEV_TAGS.reduce<Record<string, DevTag>>((acc, tag) => {
    acc[tag.id] = tag;
    return acc;
  }, {});
  const completedTickets = tickets.filter((ticket) => ticket.devStatus === 'ConcluÃ­do');
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

  function updateFormField<Key extends keyof TicketFormState>(
    key: Key,
    value: TicketFormState[Key],
  ) {
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
        ticket.id === ticketId
          ? {
              ...updater(ticket),
              updatedAt: getNowTimestamp(),
            }
          : ticket,
      ),
    );
  }

  function moveTicket(ticketId: number, nextStatus: DevStatus) {
    updateTicket(ticketId, (ticket) => ({
      ...ticket,
      devStatus: nextStatus,
      concludedAt: nextStatus === 'ConcluÃ­do' ? getNowTimestamp() : undefined,
      history:
        ticket.devStatus === nextStatus
          ? ticket.history
          : appendHistory(ticket, `Status: ${ticket.devStatus} -> ${nextStatus}`),
    }));
  }

  function handleConcludeSelectedTicket() {
    if (!selectedTicket) return;
    updateTicket(selectedTicket.id, (ticket) => ({
      ...ticket,
      devStatus: 'ConcluÃ­do',
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
      history: appendHistory(
        ticket,
        `Prazo alterado: ${formatDate(previousDeadline)} -> ${formatDate(deadlineDraft)}. Motivo: ${deadlineReason.trim()}`,
      ),
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
      ['Protocolo', 'Tipo', 'Titulo', 'Categoria', 'Status', 'Responsavel', 'Score', 'Sprint'],
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

    const csv = rows
      .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
      .join('\n');

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
                concludedAt: formState.devStatus === 'ConcluÃ­do' ? getNowTimestamp() : undefined,
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
        concludedAt: formState.devStatus === 'ConcluÃ­do' ? getNowTimestamp() : undefined,
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
    <>
      <div className="-mx-4 -my-6 md:-mx-6 lg:-mx-8 lg:-my-8">
        <div className="sticky top-0 z-20 flex min-h-14 items-center gap-4 border-b border-[#e2e8f0] bg-white px-6">
          <strong className="text-[15px] font-bold text-[#0f172a]">Biblioteca Dev</strong>
          <div className="ml-auto flex flex-wrap items-center gap-2 py-3">
            <ToolbarButton onClick={handleExport}>Exportar</ToolbarButton>
          </div>
        </div>

        <div className="bg-[#f1f5f9] px-6 py-6">
          <div className="mb-4">
            <div className="text-[26px] font-extrabold tracking-[-0.03em] text-[#0f172a]">
              Biblioteca Dev
            </div>
            <div className="mt-2 text-[12px] text-[#64748b]">
              {visibleTickets.length} tasks concluídas
            </div>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-[8px]">
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="w-auto rounded-[7px] border-[1.5px] border-[#e2e8f0] bg-[#f8fafc] px-[10px] py-[5px] text-[12px] text-[#0f172a] outline-none focus:border-[#2563eb]"
            >
              <option value="">Todos os tipos</option>
              {libraryTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="w-auto rounded-[7px] border-[1.5px] border-[#e2e8f0] bg-[#f8fafc] px-[10px] py-[5px] text-[12px] text-[#0f172a] outline-none focus:border-[#2563eb]"
            >
              <option value="">Todas as categorias</option>
              {DEV_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <select
              value={responsibleFilter}
              onChange={(event) => setResponsibleFilter(event.target.value)}
              className="w-auto rounded-[7px] border-[1.5px] border-[#e2e8f0] bg-[#f8fafc] px-[10px] py-[5px] text-[12px] text-[#0f172a] outline-none focus:border-[#2563eb]"
            >
              <option value="">Todos responsáveis</option>
              {responsibleUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>

            {DEV_SPRINTS.length ? (
              <select
                value={sprintFilter}
                onChange={(event) => setSprintFilter(event.target.value)}
                className="w-auto rounded-[7px] border-[1.5px] border-[#e2e8f0] bg-[#f8fafc] px-[10px] py-[5px] text-[12px] text-[#0f172a] outline-none focus:border-[#2563eb]"
              >
                <option value="">Todas as sprints</option>
                {DEV_SPRINTS.map((sprint) => (
                  <option key={sprint.id} value={sprint.id}>
                    {sprint.name}
                  </option>
                ))}
              </select>
            ) : null}

            {hasActiveFilters ? (
              <ToolbarButton
                onClick={() => {
                  setTypeFilter('');
                  setCategoryFilter('');
                  setResponsibleFilter('');
                  setSprintFilter('');
                }}
              >
                Limpar
              </ToolbarButton>
            ) : null}
          </div>

          {sortedVisibleTickets.length ? (
            <div className="flex flex-col gap-2">
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
                      'flex cursor-pointer items-start gap-3 rounded-[10px] border border-[#e2e8f0] border-l-[3px] bg-white px-4 py-[14px] shadow-[0_1px_3px_rgba(0,0,0,.08)] transition-all hover:border-[#cbd5e1] hover:shadow-[0_4px_14px_rgba(0,0,0,.1)]',
                      priority.borderClassName,
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap gap-[5px]">
                        <Badge className={getTypeBadgeClass(ticket.devType)}>{ticket.devType}</Badge>
                        <Badge className={priority.badgeClassName}>{priority.label}</Badge>
                        <Badge className="border-[#bbf7d0] bg-[#f0fdf4] text-[#16a34a]">
                          Concluído
                        </Badge>
                        {ticket.totalPts ? (
                          <Badge className="border-[#fde68a] bg-[#fffbeb] text-[#a16207]">
                            {ticket.totalPts}pts
                          </Badge>
                        ) : null}
                        <Badge className="border-[#e2e8f0] bg-[#f1f5f9] font-mono text-[10px] text-[#475569]">
                          {ticket.proto}
                        </Badge>
                      </div>

                      {epicName ? (
                        <div className="mb-[3px] text-[11px] font-bold text-[#7c3aed]">{epicName}</div>
                      ) : null}

                      <div className="mb-[3px] text-[14px] font-bold text-[#0f172a]">{ticket.title}</div>
                      <div className="mb-[6px] text-[12px] leading-[1.4] text-[#64748b]">
                        {ticket.category}
                        {ticket.clientName ? ` · ${ticket.clientName}` : ''}
                      </div>

                      <div className="flex flex-wrap items-center gap-[5px]">
                        {responsible ? (
                          <Badge className="border-[#e2e8f0] bg-[#f1f5f9] text-[#475569]">
                            {responsible.name}
                          </Badge>
                        ) : null}
                        <Badge className="border-[#e2e8f0] bg-[#f1f5f9] text-[#475569]">
                          {concludedDate}
                        </Badge>
                        <Badge className="border-[#e2e8f0] bg-[#f1f5f9] text-[#475569]">
                          {ticket.score}/15
                        </Badge>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <div className="text-[18px] font-extrabold text-[#16a34a]">{totalPoints}</div>
                      <div className="text-[10px] text-[#64748b]">pts</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[10px] border border-dashed border-[#cbd5e1] bg-white px-6 py-10 text-center">
              <div className="text-[28px] leading-none">📚</div>
              <div className="mt-3 text-[14px] font-semibold text-[#0f172a]">
                Nenhuma task concluída
              </div>
              <div className="mt-1 text-[12px] text-[#64748b]">
                As tasks concluídas aparecem aqui.
              </div>
            </div>
          )}
        </div>
      </div>
      <ModalShell
        open={Boolean(selectedTicket)}
        title={selectedTicket?.title ?? 'Detalhes do ticket'}
        description={
          selectedTicket
            ? `${selectedTicket.proto} Â· ${selectedTicket.devType} Â· ${selectedTicket.devStatus} Â· Score ${selectedTicket.score}/15`
            : undefined
        }
        maxWidthClassName="max-w-[760px]"
        onClose={() => {
          setSelectedTicketId(null);
          setCommentDraft('');
        }}
        footer={
          selectedTicket ? (
            <>
              <ToolbarButton onClick={() => setSelectedTicketId(null)}>Fechar</ToolbarButton>
              <ToolbarButton onClick={() => setTagPickerTicketId(selectedTicket.id)}>
                Etiquetas
              </ToolbarButton>
              <ToolbarButton onClick={() => openDeadlineModal(selectedTicket.id)}>
                Alterar Prazo
              </ToolbarButton>
              <button
                type="button"
                onClick={handleDeleteSelectedTicket}
                className="rounded-[8px] border border-[#fecaca] px-4 py-[10px] text-[13px] font-semibold text-[#dc2626] transition-colors hover:bg-[#fef2f2]"
              >
                Excluir
              </button>
              <ToolbarButton
                onClick={() => {
                  openEditModal(selectedTicket);
                  setSelectedTicketId(null);
                }}
              >
                Editar
              </ToolbarButton>
              <select
                value={selectedTicket.devStatus}
                onChange={(event) => moveTicket(selectedTicket.id, event.target.value as DevStatus)}
                className="w-auto rounded-[7px] border-[1.5px] border-[#e2e8f0] bg-white px-[10px] py-[7px] text-[12px] text-[#0f172a] outline-none focus:border-[#2563eb]"
              >
                {ALL_DEV_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              {selectedTicket.devStatus !== 'ConcluÃ­do' ? (
                <button
                  type="button"
                  onClick={handleConcludeSelectedTicket}
                  className="rounded-[8px] bg-[#16a34a] px-4 py-[10px] text-[13px] font-semibold text-white transition-colors hover:bg-[#15803d]"
                >
                  Concluir
                </button>
              ) : null}
            </>
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
                      className="inline-flex items-center rounded-full px-[9px] py-[3px] text-[11px] font-bold text-white"
                      style={{ backgroundColor: tagsById[tagId].color }}
                    >
                      {tagsById[tagId].name}
                    </span>
                  ) : null,
                )}
              </div>
            ) : null}

            <div className="rounded-[12px] border border-[#d7dfeb] bg-[#f8fafc] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-[11px] font-bold tracking-[.12em] text-[#64748b] uppercase">
                    Protocolo
                  </span>
                  <span className="font-mono text-[15px] font-extrabold tracking-[.04em] text-[#2563eb]">
                    {selectedTicket.proto}
                  </span>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard?.writeText(selectedTicket.proto)}
                    className="inline-flex size-8 items-center justify-center rounded-[8px] border border-[#d7dfeb] bg-white text-[#64748b]"
                  >
                    <Copy className="size-4" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge className={getTypeBadgeClass(selectedTicket.devType)}>
                    {selectedTicket.devType}
                  </Badge>
                  <Badge className={getPriority(selectedTicket.score).badgeClassName}>
                    {getPriority(selectedTicket.score).label}
                  </Badge>
                  <Badge className={getStatusBadgeClass(selectedTicket.devStatus)}>
                    {selectedTicket.devStatus}
                  </Badge>
                  {selectedTicket.protoExt ? (
                    <Badge className="border-[#fde68a] bg-[#fffbeb] text-[#92400e]">
                      Ext: {selectedTicket.protoExt}
                    </Badge>
                  ) : null}
                  <Badge className="border-[#d7dfeb] bg-white text-[#334155]">
                    {selectedTicket.proto}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid gap-[9px] md:grid-cols-2">
              <div className="rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-[10px]">
                <div className="mb-1 text-[10px] font-bold tracking-[.07em] text-[#64748b] uppercase">
                  Score
                </div>
                <div className={cn('text-[20px] font-extrabold', getPriority(selectedTicket.score).scoreClassName)}>
                  {selectedTicket.score}
                  <span className="ml-1 text-[11px] font-normal text-[#64748b]">/15</span>
                </div>
              </div>

              <div className="rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-[10px]">
                <div className="mb-1 text-[10px] font-bold tracking-[.07em] text-[#64748b] uppercase">
                  Categoria
                </div>
                <div className="text-[13px] font-semibold text-[#0f172a]">{selectedTicket.category}</div>
              </div>

              <div className="rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-[10px]">
                <div className="mb-1 text-[10px] font-bold tracking-[.07em] text-[#64748b] uppercase">
                  ResponsÃ¡vel
                </div>
                <div className="text-[13px] font-semibold text-[#0f172a]">
                  {usersById[selectedTicket.resp]?.name ?? '-'}
                </div>
              </div>

              <div className="rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-[10px]">
                <div className="mb-1 text-[10px] font-bold tracking-[.07em] text-[#64748b] uppercase">
                  Criado por
                </div>
                <div className="text-[13px] font-semibold text-[#0f172a]">
                  {usersById[selectedTicket.createdBy]?.name ?? '-'}
                </div>
              </div>

              <div className="rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-[10px]">
                <div className="mb-1 text-[10px] font-bold tracking-[.07em] text-[#64748b] uppercase">
                  InÃ­cio / Entrega
                </div>
                <div className="text-[13px] font-semibold text-[#0f172a]">
                  {formatDate(selectedTicket.startDate)} â†’ {formatDate(selectedTicket.deadline)}
                </div>
              </div>

              <div className="rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-[10px]">
                <div className="mb-1 text-[10px] font-bold tracking-[.07em] text-[#64748b] uppercase">
                  Cliente
                </div>
                <div className="text-[13px] font-semibold text-[#0f172a]">
                  {selectedTicket.clientName || '-'}
                </div>
              </div>

              {selectedTicket.protoExt ? (
                <div className="rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-[10px]">
                  <div className="mb-1 text-[10px] font-bold tracking-[.07em] text-[#64748b] uppercase">
                    Protocolo Habilis/Meta
                  </div>
                  <div className="font-mono text-[13px] font-semibold text-[#92400e]">
                    {selectedTicket.protoExt}
                  </div>
                </div>
              ) : null}

              {selectedTicket.instance ? (
                <div className="rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-[10px]">
                  <div className="mb-1 text-[10px] font-bold tracking-[.07em] text-[#64748b] uppercase">
                    InstÃ¢ncia
                  </div>
                  <div className="text-[13px] font-semibold text-[#0f172a]">
                    {selectedTicket.instance}
                  </div>
                </div>
              ) : null}

              {selectedTicket.sprintId ? (
                <div className="rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-[10px]">
                  <div className="mb-1 text-[10px] font-bold tracking-[.07em] text-[#64748b] uppercase">
                    Sprint
                  </div>
                  <div className="text-[13px] font-semibold text-[#0f172a]">
                    {sprintsById[selectedTicket.sprintId]?.name ?? '-'}
                  </div>
                </div>
              ) : null}

              {selectedTicket.cnpj ? (
                <div className="rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-[10px]">
                  <div className="mb-1 text-[10px] font-bold tracking-[.07em] text-[#64748b] uppercase">
                    CNPJ
                  </div>
                  <div className="text-[13px] font-semibold text-[#0f172a]">
                    {selectedTicket.cnpj}
                  </div>
                </div>
              ) : null}

              {selectedTicket.clientPhone ? (
                <div className="rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-[10px]">
                  <div className="mb-1 text-[10px] font-bold tracking-[.07em] text-[#64748b] uppercase">
                    Tel.
                  </div>
                  <div className="text-[13px] font-semibold text-[#0f172a]">
                    {selectedTicket.clientPhone}
                  </div>
                </div>
              ) : null}
            </div>

            {selectedTicket.parentId && epicMap[selectedTicket.parentId] ? (
              <div className="rounded-[8px] border border-[#ddd6fe] bg-[#f5f3ff] px-3 py-[10px]">
                <div className="mb-1 text-[10px] font-bold tracking-[.07em] text-[#7c3aed] uppercase">
                  Epic vinculada
                </div>
                <div className="text-[13px] font-semibold text-[#5b21b6]">
                  {epicMap[selectedTicket.parentId]}
                </div>
              </div>
            ) : null}

            <div className="rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-[10px]">
              <div className="mb-1 text-[10px] font-bold tracking-[.07em] text-[#64748b] uppercase">
                DescriÃ§Ã£o
              </div>
              <p className="whitespace-pre-wrap text-[13px] leading-6 text-[#475569]">
                {selectedTicket.description || 'Sem descriÃ§Ã£o informada.'}
              </p>
            </div>

            <div>
              <div className="mb-2 text-[14px] font-bold text-[#0f172a]">CritÃ©rios</div>
              <div className="grid gap-[8px] sm:grid-cols-2 lg:grid-cols-5">
                {[
                  ['Impacto', selectedTicket.criteria.imp],
                  ['Risco', selectedTicket.criteria.ris],
                  ['Freq.', selectedTicket.criteria.fre],
                  ['EsforÃ§o', selectedTicket.criteria.esf],
                  ['DÃ©bito', selectedTicket.criteria.deb],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-[8px] border border-[#d7dfeb] bg-[#f8fafc] px-3 py-4 text-center"
                  >
                    <div className="text-[30px] font-extrabold leading-none text-[#2563eb]">
                      {value}
                    </div>
                    <div className="mt-1 text-[12px] text-[#64748b]">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 border-b border-[#e2e8f0] pb-2 text-[14px] font-bold text-[#0f172a]">
                HistÃ³rico
              </div>
              {selectedTicket.history.length ? (
                <div className="space-y-3">
                  {[...selectedTicket.history].reverse().map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <span className="mt-[7px] size-[8px] shrink-0 rounded-full bg-[#2563eb]" />
                      <div className="min-w-0">
                        <div className="text-[13px] text-[#0f172a]">
                          <span className="font-semibold">{item.user}</span> {item.message}
                        </div>
                        <div className="text-[12px] text-[#64748b]">{item.createdAt}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[10px] border border-dashed border-[#cbd5e1] bg-[#f8fafc] px-4 py-6 text-center text-[13px] text-[#64748b]">
                  Nenhum histÃ³rico registrado.
                </div>
              )}

            </div>

            <div className="rounded-[12px] border border-[#e2e8f0] bg-white p-4">
              <div className="mb-3 inline-flex items-center gap-2 text-[12px] font-bold text-[#0f172a]">
                <MessageSquareText className="size-4" />
                ComentÃ¡rios
                <span className="inline-flex min-w-6 items-center justify-center rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-1.5 py-[2px] text-[10px] font-bold text-[#2563eb]">
                  {selectedTicket.comments.length}
                </span>
              </div>

              {selectedTicket.comments.length ? (
                <div className="space-y-2">
                  {selectedTicket.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="rounded-[10px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-[13px] font-semibold text-[#0f172a]">
                          {comment.author}
                        </div>
                        <div className="text-[11px] text-[#64748b]">{comment.createdAt}</div>
                      </div>
                      <div className="mt-1 whitespace-pre-wrap text-[13px] leading-6 text-[#475569]">
                        {comment.message}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[10px] border border-dashed border-[#cbd5e1] bg-[#f8fafc] px-4 py-6 text-center text-[13px] text-[#64748b]">
                  Nenhum comentÃ¡rio registrado.
                </div>
              )}

              <div className="mt-4 flex items-center gap-3">
                <div className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[#2563eb] text-[12px] font-bold text-white">
                  {getInitials(currentUser?.name ?? 'UsuÃ¡rio')}
                </div>
                <input
                  value={commentDraft}
                  onChange={(event) => setCommentDraft(event.target.value)}
                  placeholder="ComentÃ¡rio..."
                  className="h-[42px] flex-1 rounded-[8px] border border-[#d7dfeb] bg-[#f8fafc] px-3 text-[13px] text-[#0f172a] outline-none transition-colors focus:border-[#2563eb]"
                />
                <button
                  type="button"
                  onClick={handleAddComment}
                  className="rounded-[8px] bg-[#2563eb] px-4 py-[10px] text-[13px] font-semibold text-white transition-colors hover:bg-[#1d4ed8]"
                >
                  Enviar
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </ModalShell>

      <ModalShell
        open={Boolean(selectedTagTicket)}
        title="Etiquetas"
        description={
          selectedTagTicket
            ? `Gerencie as etiquetas do ticket ${selectedTagTicket.proto}.`
            : undefined
        }
        maxWidthClassName="max-w-[520px]"
        onClose={() => setTagPickerTicketId(null)}
        footer={<ToolbarButton onClick={() => setTagPickerTicketId(null)}>Fechar</ToolbarButton>}
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
                  className={cn(
                    'flex items-center justify-between rounded-[10px] border px-4 py-3 text-left transition-colors',
                    active
                      ? 'border-[#2563eb] bg-[#eff6ff]'
                      : 'border-[#e2e8f0] bg-[#f8fafc] hover:border-[#bfdbfe]',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="size-3 rounded-full" style={{ backgroundColor: tag.color }} />
                    <span className="text-[13px] font-semibold text-[#0f172a]">{tag.name}</span>
                  </div>
                  <span className="text-[12px] font-semibold text-[#2563eb]">
                    {active ? 'Selecionada' : 'Adicionar'}
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}
      </ModalShell>

      <ModalShell
        open={Boolean(selectedDeadlineTicket)}
        title="Alterar Prazo"
        description={
          selectedDeadlineTicket
            ? `Atualize o prazo do ticket ${selectedDeadlineTicket.proto}.`
            : undefined
        }
        maxWidthClassName="max-w-[560px]"
        onClose={closeDeadlineModal}
        footer={
          <>
            <ToolbarButton onClick={closeDeadlineModal}>Cancelar</ToolbarButton>
            <button
              type="button"
              onClick={handleSaveDeadline}
              className="rounded-[8px] bg-[#2563eb] px-4 py-[10px] text-[13px] font-semibold text-white transition-colors hover:bg-[#1d4ed8]"
            >
              Salvar prazo
            </button>
          </>
        }
      >
        <div className="grid gap-4">
          <div className="flex flex-col gap-[5px]">
            <FormLabel>Nova entrega</FormLabel>
            <input
              type="date"
              value={deadlineDraft}
              onChange={(event) => setDeadlineDraft(event.target.value)}
              className="w-full rounded-[7px] border-[1.5px] border-[#e2e8f0] bg-[#f8fafc] px-3 py-[9px] text-[13px] text-[#0f172a] outline-none transition-colors focus:border-[#2563eb]"
            />
          </div>
          <div className="flex flex-col gap-[5px]">
            <FormLabel>Motivo</FormLabel>
            <textarea
              value={deadlineReason}
              onChange={(event) => setDeadlineReason(event.target.value)}
              className="min-h-[120px] w-full resize-y rounded-[7px] border-[1.5px] border-[#e2e8f0] bg-[#f8fafc] px-3 py-[9px] text-[13px] text-[#0f172a] outline-none transition-colors focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,.1)]"
            />
          </div>
        </div>
      </ModalShell>

      <ModalShell
        open={Boolean(formMode)}
        title={formMode === 'edit' ? 'Editar Task' : 'Nova Task'}
        description={
          formMode === 'edit'
            ? 'Atualize os dados do ticket de desenvolvimento.'
            : 'Cadastre um novo item no kanban de desenvolvimento.'
        }
        maxWidthClassName="max-w-[920px]"
        onClose={closeFormModal}
        footer={
          <>
            <ToolbarButton onClick={closeFormModal}>Cancelar</ToolbarButton>
            <button
              type="button"
              onClick={handleSaveTicket}
              className="rounded-[8px] bg-[#2563eb] px-4 py-[10px] text-[13px] font-semibold text-white transition-colors hover:bg-[#1d4ed8]"
            >
              {formMode === 'edit' ? 'Salvar alteraÃ§Ãµes' : 'Criar ticket'}
            </button>
          </>
        }
      >
        <div className="grid gap-[14px] md:grid-cols-2">
          <div className="flex flex-col gap-[5px] md:col-span-2">
            <FormLabel>TÃ­tulo</FormLabel>
            <input
              value={formState.title}
              onChange={(event) => updateFormField('title', event.target.value)}
              className="w-full rounded-[7px] border-[1.5px] border-[#e2e8f0] bg-[#f8fafc] px-3 py-[9px] text-[13px] text-[#0f172a] outline-none transition-colors focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,.1)]"
            />
          </div>

          <div className="flex flex-col gap-[5px]">
            <FormLabel>Categoria</FormLabel>
            <select
              value={formState.category}
              onChange={(event) => updateFormField('category', event.target.value)}
              className="w-full rounded-[7px] border-[1.5px] border-[#e2e8f0] bg-[#f8fafc] px-3 py-[9px] text-[13px] text-[#0f172a] outline-none transition-colors focus:border-[#2563eb]"
            >
              {DEV_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-[5px]">
            <FormLabel>Tipo</FormLabel>
            <select
              value={formState.devType}
              onChange={(event) => updateFormField('devType', event.target.value as DevType)}
              className="w-full rounded-[7px] border-[1.5px] border-[#e2e8f0] bg-[#f8fafc] px-3 py-[9px] text-[13px] text-[#0f172a] outline-none transition-colors focus:border-[#2563eb]"
            >
              {(['Epic', 'Feature', 'Task', 'Bug'] as DevType[]).map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-[5px]">
            <FormLabel>Status</FormLabel>
            <select
              value={formState.devStatus}
              onChange={(event) => updateFormField('devStatus', event.target.value as DevStatus)}
              className="w-full rounded-[7px] border-[1.5px] border-[#e2e8f0] bg-[#f8fafc] px-3 py-[9px] text-[13px] text-[#0f172a] outline-none transition-colors focus:border-[#2563eb]"
            >
              {ALL_DEV_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-[5px]">
            <FormLabel>ResponsÃ¡vel</FormLabel>
            <select
              value={formState.resp}
              onChange={(event) => updateFormField('resp', event.target.value)}
              className="w-full rounded-[7px] border-[1.5px] border-[#e2e8f0] bg-[#f8fafc] px-3 py-[9px] text-[13px] text-[#0f172a] outline-none transition-colors focus:border-[#2563eb]"
            >
              {DEV_USERS.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-[5px]">
            <FormLabel>Sprint</FormLabel>
            <select
              value={formState.sprintId}
              onChange={(event) => updateFormField('sprintId', event.target.value)}
              className="w-full rounded-[7px] border-[1.5px] border-[#e2e8f0] bg-[#f8fafc] px-3 py-[9px] text-[13px] text-[#0f172a] outline-none transition-colors focus:border-[#2563eb]"
            >
              <option value="">Sem sprint</option>
              {DEV_SPRINTS.map((sprint) => (
                <option key={sprint.id} value={sprint.id}>
                  {sprint.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-[5px]">
            <FormLabel>Epic pai</FormLabel>
            <select
              value={formState.parentId}
              onChange={(event) => updateFormField('parentId', event.target.value)}
              className="w-full rounded-[7px] border-[1.5px] border-[#e2e8f0] bg-[#f8fafc] px-3 py-[9px] text-[13px] text-[#0f172a] outline-none transition-colors focus:border-[#2563eb]"
            >
              <option value="">Item independente</option>
              {tickets
                .filter((ticket) => ticket.devType === 'Epic')
                .map((ticket) => (
                  <option key={ticket.id} value={ticket.id}>
                    {ticket.title}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex flex-col gap-[5px]">
            <FormLabel>Cliente</FormLabel>
            <input
              value={formState.clientName}
              onChange={(event) => updateFormField('clientName', event.target.value)}
              className="w-full rounded-[7px] border-[1.5px] border-[#e2e8f0] bg-[#f8fafc] px-3 py-[9px] text-[13px] text-[#0f172a] outline-none transition-colors focus:border-[#2563eb]"
            />
          </div>

          <div className="flex flex-col gap-[5px]">
            <FormLabel>Protocolo Habilis/Meta</FormLabel>
            <input
              value={formState.protoExt}
              onChange={(event) => updateFormField('protoExt', event.target.value)}
              className="w-full rounded-[7px] border-[1.5px] border-[#e2e8f0] bg-[#f8fafc] px-3 py-[9px] text-[13px] text-[#0f172a] outline-none transition-colors focus:border-[#2563eb]"
            />
          </div>

          <div className="flex flex-col gap-[5px]">
            <FormLabel>InstÃ¢ncia</FormLabel>
            <input
              value={formState.instance}
              onChange={(event) => updateFormField('instance', event.target.value)}
              className="w-full rounded-[7px] border-[1.5px] border-[#e2e8f0] bg-[#f8fafc] px-3 py-[9px] text-[13px] text-[#0f172a] outline-none transition-colors focus:border-[#2563eb]"
            />
          </div>

          <div className="flex flex-col gap-[5px]">
            <FormLabel>CNPJ</FormLabel>
            <input
              value={formState.cnpj}
              onChange={(event) => updateFormField('cnpj', event.target.value)}
              className="w-full rounded-[7px] border-[1.5px] border-[#e2e8f0] bg-[#f8fafc] px-3 py-[9px] text-[13px] text-[#0f172a] outline-none transition-colors focus:border-[#2563eb]"
            />
          </div>

          <div className="flex flex-col gap-[5px]">
            <FormLabel>Telefone</FormLabel>
            <input
              value={formState.clientPhone}
              onChange={(event) => updateFormField('clientPhone', event.target.value)}
              className="w-full rounded-[7px] border-[1.5px] border-[#e2e8f0] bg-[#f8fafc] px-3 py-[9px] text-[13px] text-[#0f172a] outline-none transition-colors focus:border-[#2563eb]"
            />
          </div>

          <div className="flex flex-col gap-[5px]">
            <FormLabel>InÃ­cio</FormLabel>
            <input
              type="date"
              value={formState.startDate}
              onChange={(event) => updateFormField('startDate', event.target.value)}
              className="w-full rounded-[7px] border-[1.5px] border-[#e2e8f0] bg-[#f8fafc] px-3 py-[9px] text-[13px] text-[#0f172a] outline-none transition-colors focus:border-[#2563eb]"
            />
          </div>

          <div className="flex flex-col gap-[5px]">
            <FormLabel>Entrega</FormLabel>
            <input
              type="date"
              value={formState.deadline}
              onChange={(event) => updateFormField('deadline', event.target.value)}
              className="w-full rounded-[7px] border-[1.5px] border-[#e2e8f0] bg-[#f8fafc] px-3 py-[9px] text-[13px] text-[#0f172a] outline-none transition-colors focus:border-[#2563eb]"
            />
          </div>

          <div className="rounded-[10px] border border-[#d7dfeb] bg-[#f8fafc] p-4 md:col-span-2">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[12px] font-bold text-[#0f172a]">CritÃ©rios</div>
                <div className="text-[12px] text-[#64748b]">
                  Ajuste os pesos para recalcular o score automaticamente.
                </div>
              </div>
              <div className="rounded-[8px] border border-[#bfdbfe] bg-[#eff6ff] px-4 py-2">
                <div className="text-[10px] font-bold tracking-[.08em] text-[#2563eb] uppercase">
                  Score
                </div>
                <div className="text-[22px] font-extrabold text-[#2563eb]">{formScore}/15</div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {[
                ['imp', 'Impacto', formState.imp],
                ['ris', 'Risco', formState.ris],
                ['fre', 'Freq.', formState.fre],
                ['esf', 'EsforÃ§o', formState.esf],
                ['deb', 'DÃ©bito', formState.deb],
              ].map(([key, label, value]) => (
                <div key={key} className="flex flex-col gap-[5px]">
                  <FormLabel>{label}</FormLabel>
                  <input
                    type="number"
                    min="0"
                    max="3"
                    value={value}
                    onChange={(event) =>
                      updateFormField(key as keyof TicketFormState, event.target.value)
                    }
                    className="w-full rounded-[7px] border-[1.5px] border-[#e2e8f0] bg-white px-3 py-[9px] text-[13px] text-[#0f172a] outline-none transition-colors focus:border-[#2563eb]"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-[5px] md:col-span-2">
            <FormLabel>DescriÃ§Ã£o</FormLabel>
            <textarea
              value={formState.description}
              onChange={(event) => updateFormField('description', event.target.value)}
              className="min-h-[120px] w-full resize-y rounded-[7px] border-[1.5px] border-[#e2e8f0] bg-[#f8fafc] px-3 py-[9px] text-[13px] text-[#0f172a] outline-none transition-colors focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,.1)]"
            />
          </div>
        </div>
      </ModalShell>
    </>
  );
}




