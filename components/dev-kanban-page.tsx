'use client';

import Link from 'next/link';
import {
  useState,
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { CalendarDays, Copy, MessageSquareText, Plus } from 'lucide-react';

import { ModalShell } from '@/components/modal-shell';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ALL_DEV_STATUSES,
  DEV_CATEGORIES,
  DEV_COLUMNS,
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
  return (
    value.toLocaleDateString('pt-BR') +
    ' ' +
    value.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  );
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

// Utiliza transparência e cores semânticas nativas do Tailwind para suportar Dark Mode
function getPriority(score: number) {
  if (score >= 12) {
    return {
      label: 'CRÍTICO',
      badgeClassName: 'border-destructive/20 bg-destructive/10 text-destructive',
      borderClassName: 'border-l-destructive',
      scoreClassName: 'text-destructive',
    };
  }

  if (score >= 9) {
    return {
      label: 'ALTO',
      badgeClassName: 'border-orange-500/20 bg-orange-500/10 text-orange-600 dark:text-orange-400',
      borderClassName: 'border-l-orange-500',
      scoreClassName: 'text-orange-600 dark:text-orange-400',
    };
  }

  if (score >= 6) {
    return {
      label: 'MÉDIO',
      badgeClassName: 'border-yellow-500/20 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
      borderClassName: 'border-l-yellow-500',
      scoreClassName: 'text-yellow-600 dark:text-yellow-400',
    };
  }

  return {
    label: 'BAIXO',
    badgeClassName: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    borderClassName: 'border-l-emerald-500',
    scoreClassName: 'text-emerald-600 dark:text-emerald-400',
  };
}

function getStatusBadgeClass(status: DevStatus) {
  const styles: Record<DevStatus, string> = {
    Backlog: 'border-border bg-muted/50 text-muted-foreground',
    Análise: 'border-orange-500/20 bg-orange-500/10 text-orange-600 dark:text-orange-400',
    'Pronto para Desenvolver': 'border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400',
    'Em Desenvolvimento': 'border-purple-500/20 bg-purple-500/10 text-purple-600 dark:text-purple-400',
    Testes: 'border-yellow-500/20 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
    'Code Review': 'border-pink-500/20 bg-pink-500/10 text-pink-600 dark:text-pink-400',
    Concluído: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  };

  return styles[status];
}

function getTypeBadgeClass(type: DevType) {
  const styles: Record<DevType, string> = {
    Epic: 'border-purple-500/20 bg-purple-500/10 text-purple-600 dark:text-purple-400',
    Feature: 'border-primary/20 bg-primary/10 text-primary',
    Task: 'border-border bg-muted/50 text-muted-foreground',
    Bug: 'border-destructive/20 bg-destructive/10 text-destructive',
  };

  return styles[type];
}

function Badge({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap',
        className,
      )}
      style={style}
    >
      {children}
    </span>
  );
}

// Componente utilitário interno para estilizar selects nativos combinando com o Input
function NativeSelect({ className, ...props }: ComponentProps<'select'>) {
  return (
    <select
      className={cn(
        "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30",
        className
      )}
      {...props}
    />
  );
}

export function DevKanbanPage() {
  const [tickets, setTickets] = useState<DevTicket[]>(() => normalizeInitialTickets(INITIAL_DEV_TICKETS));
  const [statusFilter, setStatusFilter] = useState<'all' | DevStatus>('all');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [responsibleFilter, setResponsibleFilter] = useState('');
  const [sprintFilter, setSprintFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
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

  const filteredOpenTickets = tickets
    .filter((ticket) => ticket.devStatus !== 'Concluído')
    .filter((ticket) => {
      if (!dateFrom && !dateTo) return true;
      const createdAt = new Date(ticket.createdAt);

      if (dateFrom && createdAt < new Date(dateFrom)) return false;
      if (dateTo && createdAt > new Date(`${dateTo}T23:59:59`)) return false;

      return true;
    })
    .filter((ticket) => (typeFilter ? ticket.devType === typeFilter : true))
    .filter((ticket) => (categoryFilter ? ticket.category === categoryFilter : true))
    .filter((ticket) => (responsibleFilter ? ticket.resp === responsibleFilter : true))
    .filter((ticket) => (sprintFilter ? ticket.sprintId === sprintFilter : true));

  const visibleTickets =
    statusFilter === 'all'
      ? filteredOpenTickets
      : filteredOpenTickets.filter((ticket) => ticket.devStatus === statusFilter);

  const responsibleUsers = DEV_USERS.filter((user) =>
    tickets.some((ticket) => ticket.resp === user.id),
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

  function openCreateModal(type: DevType) {
    setFormState({ ...EMPTY_FORM, devType: type });
    setEditingTicketId(null);
    setFormMode('create');
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
      current.map((ticket) => (ticket.id === ticketId ? updater(ticket) : ticket)),
    );
  }

  function moveTicket(ticketId: number, nextStatus: DevStatus) {
    updateTicket(ticketId, (ticket) => ({
      ...ticket,
      devStatus: nextStatus,
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
      devStatus: 'Concluído',
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
    link.download = 'kanban-dev.csv';
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
      <div className="-mx-4 -my-6 flex flex-col md:-mx-6 lg:-mx-8 lg:-my-8">
        {/* Cabeçalho Fixo (Toolbar) */}
        <header className="sticky top-0 z-20 flex min-h-14 items-center justify-between gap-4 border-b bg-background/95 px-6 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex flex-col">
            <h1 className="text-lg font-bold tracking-tight text-foreground">Kanban Dev</h1>
            <p className="text-xs text-muted-foreground">Desenvolvimento & Sprints</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              Exportar
            </Button>
            <Link
              href="/desenvolvimento/sprints"
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              Nova Sprint
            </Link>
            <Button variant="outline" size="sm" onClick={() => openCreateModal('Task')}>
              <Plus className="mr-1 size-4" /> Task
            </Button>
            <Button variant="destructive" size="sm" onClick={() => openCreateModal('Bug')}>
              Bug
            </Button>
          </div>
        </header>

        {/* Área Principal (Filtros e Kanban) */}
        <main className="flex-1 bg-muted/30 px-6 py-6">
          {/* Barra de Filtros */}
          <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border bg-card p-3 shadow-sm">
            <div className="flex items-center gap-2 border-r pr-3">
              <CalendarDays className="size-4 text-muted-foreground" />
              <div className="flex items-center gap-1">
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="h-8 w-[130px] text-xs"
                />
                <span className="text-xs text-muted-foreground">até</span>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-8 w-[130px] text-xs"
                />
              </div>
            </div>

            <NativeSelect
              className="h-8 w-auto text-xs"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | DevStatus)}
            >
              <option value="all">Todos os status</option>
              {DEV_COLUMNS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </NativeSelect>

            <NativeSelect
              className="h-8 w-auto text-xs"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">Todos os tipos</option>
              {DEV_FILTER_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </NativeSelect>

            <NativeSelect
              className="h-8 w-auto text-xs"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">Categorias</option>
              {DEV_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </NativeSelect>

            <NativeSelect
              className="h-8 w-auto text-xs"
              value={responsibleFilter}
              onChange={(e) => setResponsibleFilter(e.target.value)}
            >
              <option value="">Responsáveis</option>
              {responsibleUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </NativeSelect>

            <NativeSelect
              className="h-8 w-auto text-xs"
              value={sprintFilter}
              onChange={(e) => setSprintFilter(e.target.value)}
            >
              <option value="">Todas as sprints</option>
              {DEV_SPRINTS.map((sprint) => (
                <option key={sprint.id} value={sprint.id}>
                  {sprint.name}
                </option>
              ))}
            </NativeSelect>

            <Link
              href="/desenvolvimento/sprints"
              className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'ml-auto')}
            >
              Ver Sprints
            </Link>

            {(typeFilter || categoryFilter || responsibleFilter || sprintFilter || dateFrom || dateTo) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setTypeFilter('');
                  setCategoryFilter('');
                  setResponsibleFilter('');
                  setSprintFilter('');
                  setDateFrom('');
                  setDateTo('');
                }}
                className="text-muted-foreground"
              >
                Limpar Filtros
              </Button>
            )}
          </div>

          {/* Kanban Board */}
          {statusFilter === 'all' ? (
            <div className="scrollbar-minimal flex min-h-[calc(100svh-250px)] gap-4 overflow-x-auto pb-4">
              {DEV_COLUMNS.map((column) => {
                const columnTickets = visibleTickets.filter((t) => t.devStatus === column);

                return (
                  <div
                    key={column}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const ticketId = Number(e.dataTransfer.getData('application/kanban-item-id'));
                      if (ticketId) moveTicket(ticketId, column);
                    }}
                    className="flex min-w-[280px] max-w-[280px] shrink-0 flex-col rounded-xl border bg-muted/40"
                  >
                    <div className="flex items-center justify-between border-b px-4 py-3">
                      <span className="text-sm font-semibold text-foreground">{column}</span>
                      <span className="flex size-5 items-center justify-center rounded-full bg-background text-xs font-medium text-muted-foreground shadow-sm">
                        {columnTickets.length}
                      </span>
                    </div>

                    <div className="scrollbar-minimal flex min-h-[100px] flex-1 flex-col gap-3 overflow-y-auto p-3">
                      {columnTickets.length ? (
                        columnTickets.map((ticket) => {
                          const priority = getPriority(ticket.score);
                          const responsible = usersById[ticket.resp];
                          const epicName = ticket.parentId ? epicMap[ticket.parentId] : null;

                          return (
                            <div
                              key={ticket.id}
                              draggable
                              onDragStart={(e) => e.dataTransfer.setData('application/kanban-item-id', String(ticket.id))}
                              onClick={() => setSelectedTicketId(ticket.id)}
                              className={cn(
                                'group relative cursor-pointer rounded-lg border border-l-4 bg-card p-3 shadow-sm transition-all hover:border-primary/50 hover:shadow-md',
                                priority.borderClassName
                              )}
                            >
                              <div className="mb-2 flex flex-wrap gap-1.5">
                                <Badge className={getTypeBadgeClass(ticket.devType)}>{ticket.devType}</Badge>
                                <Badge className={priority.badgeClassName}>{priority.label}</Badge>
                                <span className="ml-auto font-mono text-[10px] text-muted-foreground">{ticket.proto}</span>
                              </div>

                              {epicName && <div className="mb-1 text-[11px] font-medium text-purple-600 dark:text-purple-400">{epicName}</div>}
                              
                              <h4 className="mb-1.5 text-sm font-semibold leading-tight text-card-foreground group-hover:text-primary transition-colors">
                                {ticket.title}
                              </h4>

                              <div className="mb-3 text-xs text-muted-foreground">
                                {ticket.category} {ticket.clientName && <span className="opacity-70">· {ticket.clientName}</span>}
                              </div>

                              <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-2">
                                <div className="flex items-center gap-2">
                                  {responsible && (
                                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-foreground" title={responsible.name}>
                                      {getInitials(responsible.name)}
                                    </div>
                                  )}
                                  <Badge className="border-border bg-background font-medium text-muted-foreground">
                                    {ticket.score} pts
                                  </Badge>
                                </div>
                                {ticket.comments.length > 0 && (
                                   <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                     <MessageSquareText className="size-3" />
                                     <span>{ticket.comments.length}</span>
                                   </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="flex h-full items-center justify-center py-8 text-sm text-muted-foreground">
                          Nenhum ticket
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : visibleTickets.length ? (
            /* Visualização em Lista quando filtrado por Status */
            <div className="flex flex-col gap-3">
              {visibleTickets.map((ticket) => {
                const priority = getPriority(ticket.score);
                const responsible = usersById[ticket.resp];
                const epicName = ticket.parentId ? epicMap[ticket.parentId] : null;

                return (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className={cn(
                      'flex cursor-pointer items-start gap-4 rounded-xl border border-l-4 bg-card px-5 py-4 shadow-sm transition-all hover:border-primary/50 hover:shadow-md',
                      priority.borderClassName,
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap gap-2">
                        <Badge className={getTypeBadgeClass(ticket.devType)}>{ticket.devType}</Badge>
                        <Badge className={priority.badgeClassName}>{priority.label}</Badge>
                        <Badge className={getStatusBadgeClass(ticket.devStatus)}>
                          {ticket.devStatus}
                        </Badge>
                        <span className="font-mono text-xs text-muted-foreground">
                          {ticket.proto}
                        </span>
                      </div>

                      {epicName && <div className="mb-1 text-xs font-medium text-purple-600 dark:text-purple-400">{epicName}</div>}

                      <h3 className="mb-1 text-base font-semibold text-card-foreground">{ticket.title}</h3>
                      <div className="mb-3 text-sm text-muted-foreground">
                        {ticket.category}
                        {ticket.clientName ? ` · ${ticket.clientName}` : ''}
                      </div>

                      <div className="flex items-center gap-2">
                        {responsible && (
                          <Badge className="border-border bg-muted text-muted-foreground">
                            {responsible.name}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <div className={cn('text-2xl font-bold', priority.scoreClassName)}>
                        {ticket.score}
                      </div>
                      <div className="text-xs text-muted-foreground">Score / 15</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed bg-card px-6 py-10 text-center">
              <p className="text-base font-semibold text-foreground">Nenhum ticket encontrado</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Tente ajustar ou limpar os filtros para ver mais resultados.
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Modal de Detalhes do Ticket */}
      <ModalShell
        open={Boolean(selectedTicket)}
        title={selectedTicket?.title ?? 'Detalhes do ticket'}
        description={
          selectedTicket
            ? `${selectedTicket.proto} · ${selectedTicket.devType} · ${selectedTicket.devStatus}`
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
              <div className="flex items-center gap-2">
                 <Button variant="ghost" onClick={() => setSelectedTicketId(null)}>Fechar</Button>
                 <Button variant="outline" onClick={() => setTagPickerTicketId(selectedTicket.id)}>
                   Etiquetas
                 </Button>
                 <Button variant="outline" onClick={() => openDeadlineModal(selectedTicket.id)}>
                   Alterar Prazo
                 </Button>
                 <Button variant="destructive" onClick={handleDeleteSelectedTicket}>
                   Excluir
                 </Button>
              </div>
              <div className="flex items-center gap-2">
                 <Button
                  variant="outline"
                  onClick={() => {
                    openEditModal(selectedTicket);
                    setSelectedTicketId(null);
                  }}
                >
                  Editar
                </Button>
                <NativeSelect
                  value={selectedTicket.devStatus}
                  onChange={(event) => moveTicket(selectedTicket.id, event.target.value as DevStatus)}
                  className="w-auto"
                >
                  {ALL_DEV_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </NativeSelect>
                {selectedTicket.devStatus !== 'Concluído' && (
                  <Button onClick={handleConcludeSelectedTicket} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    Concluir
                  </Button>
                )}
              </div>
            </div>
          ) : null
        }
      >
        {selectedTicket ? (
          <div className="grid gap-6">
            {/* Etiquetas Superiores */}
            {selectedTicket.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedTicket.tags.map((tagId) =>
                  tagsById[tagId] ? (
                    <Badge
                      key={tagId}
                      className="border-transparent text-white"
                      style={{ backgroundColor: tagsById[tagId].color }}
                    >
                      {tagsById[tagId].name}
                    </Badge>
                  ) : null,
                )}
              </div>
            )}

            {/* Cabeçalho de Protocolo */}
            <div className="rounded-xl border bg-muted/40 p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Protocolo
                  </span>
                  <span className="font-mono text-lg font-bold text-primary">
                    {selectedTicket.proto}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => navigator.clipboard?.writeText(selectedTicket.proto)}
                    title="Copiar Protocolo"
                  >
                    <Copy className="size-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={getTypeBadgeClass(selectedTicket.devType)}>
                    {selectedTicket.devType}
                  </Badge>
                  <Badge className={getPriority(selectedTicket.score).badgeClassName}>
                    {getPriority(selectedTicket.score).label}
                  </Badge>
                  <Badge className={getStatusBadgeClass(selectedTicket.devStatus)}>
                    {selectedTicket.devStatus}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Grid de Informações Rápidas */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-lg border bg-card p-3 shadow-sm">
                <Label className="mb-1 text-[10px] text-muted-foreground uppercase tracking-wider">Score</Label>
                <div className={cn('text-xl font-bold', getPriority(selectedTicket.score).scoreClassName)}>
                  {selectedTicket.score} <span className="text-xs font-normal text-muted-foreground">/15</span>
                </div>
              </div>
              <div className="rounded-lg border bg-card p-3 shadow-sm">
                <Label className="mb-1 text-[10px] text-muted-foreground uppercase tracking-wider">Categoria</Label>
                <div className="text-sm font-medium text-foreground">{selectedTicket.category}</div>
              </div>
              <div className="rounded-lg border bg-card p-3 shadow-sm">
                <Label className="mb-1 text-[10px] text-muted-foreground uppercase tracking-wider">Responsável</Label>
                <div className="text-sm font-medium text-foreground">{usersById[selectedTicket.resp]?.name ?? '-'}</div>
              </div>
              <div className="rounded-lg border bg-card p-3 shadow-sm">
                <Label className="mb-1 text-[10px] text-muted-foreground uppercase tracking-wider">Período</Label>
                <div className="text-sm font-medium text-foreground">
                  {formatDate(selectedTicket.startDate)} → {formatDate(selectedTicket.deadline)}
                </div>
              </div>
              <div className="rounded-lg border bg-card p-3 shadow-sm">
                <Label className="mb-1 text-[10px] text-muted-foreground uppercase tracking-wider">Cliente</Label>
                <div className="text-sm font-medium text-foreground">{selectedTicket.clientName || '-'}</div>
              </div>
              <div className="rounded-lg border bg-card p-3 shadow-sm">
                <Label className="mb-1 text-[10px] text-muted-foreground uppercase tracking-wider">Sprint</Label>
                <div className="text-sm font-medium text-foreground">{sprintsById[selectedTicket.sprintId ?? '']?.name ?? '-'}</div>
              </div>
            </div>

            {/* Descrição */}
            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <Label className="mb-2 text-xs text-muted-foreground uppercase tracking-wider">Descrição</Label>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {selectedTicket.description || 'Sem descrição informada.'}
              </p>
            </div>

            {/* Histórico */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-foreground border-b pb-2">Histórico</h3>
              {selectedTicket.history.length > 0 ? (
                 <div className="space-y-4">
                  {[...selectedTicket.history].reverse().map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                      <div className="flex-1">
                        <p className="text-sm text-foreground">
                          <span className="font-semibold">{item.user}</span> {item.message}
                        </p>
                        <p className="text-xs text-muted-foreground">{item.createdAt}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum histórico registrado.</p>
              )}
            </div>

             {/* Comentários */}
             <div className="rounded-xl border bg-muted/20 p-4">
              <div className="mb-4 flex items-center gap-2">
                <MessageSquareText className="size-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">Comentários</h3>
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  {selectedTicket.comments.length}
                </Badge>
              </div>

              {selectedTicket.comments.length > 0 ? (
                <div className="space-y-3 mb-4">
                  {selectedTicket.comments.map((comment) => (
                    <div key={comment.id} className="rounded-lg border bg-card p-3 shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-foreground">{comment.author}</span>
                        <span className="text-xs text-muted-foreground">{comment.createdAt}</span>
                      </div>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{comment.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mb-4 text-sm text-muted-foreground text-center py-4 border border-dashed rounded-lg">
                  Nenhum comentário.
                </div>
              )}

              <div className="flex items-center gap-3">
                <Input
                  value={commentDraft}
                  onChange={(e) => setCommentDraft(e.target.value)}
                  placeholder="Escreva um comentário..."
                  className="flex-1"
                />
                <Button onClick={handleAddComment}>Enviar</Button>
              </div>
            </div>
          </div>
        ) : null}
      </ModalShell>

      {/* Modal de Etiquetas */}
      <ModalShell
        open={Boolean(selectedTagTicket)}
        title="Gerenciar Etiquetas"
        maxWidthClassName="max-w-[400px]"
        onClose={() => setTagPickerTicketId(null)}
        footer={<Button variant="outline" onClick={() => setTagPickerTicketId(null)} className="w-full">Fechar</Button>}
      >
        {selectedTagTicket && (
          <div className="flex flex-col gap-2">
            {DEV_TAGS.map((tag) => {
              const active = selectedTagTicket.tags.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(selectedTagTicket.id, tag.id)}
                  className={cn(
                    'flex items-center justify-between rounded-lg border p-3 transition-colors',
                    active ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="size-3 rounded-full" style={{ backgroundColor: tag.color }} />
                    <span className="text-sm font-medium text-foreground">{tag.name}</span>
                  </div>
                  {active && <span className="text-xs font-semibold text-primary">Selecionada</span>}
                </button>
              );
            })}
          </div>
        )}
      </ModalShell>

      {/* Modal de Alteração de Prazo */}
      <ModalShell
        open={Boolean(selectedDeadlineTicket)}
        title="Alterar Prazo"
        maxWidthClassName="max-w-[400px]"
        onClose={closeDeadlineModal}
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="ghost" onClick={closeDeadlineModal}>Cancelar</Button>
            <Button onClick={handleSaveDeadline}>Salvar Prazo</Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="grid gap-1.5">
            <Label>Nova data de entrega</Label>
            <Input
              type="date"
              value={deadlineDraft}
              onChange={(e) => setDeadlineDraft(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Motivo da alteração</Label>
            <textarea
              value={deadlineReason}
              onChange={(e) => setDeadlineReason(e.target.value)}
              className="min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              placeholder="Explique por que o prazo está sendo alterado..."
            />
          </div>
        </div>
      </ModalShell>

      {/* Modal de Criação / Edição */}
      <ModalShell
        open={Boolean(formMode)}
        title={formMode === 'edit' ? 'Editar Ticket' : 'Novo Ticket'}
        maxWidthClassName="max-w-[700px]"
        onClose={closeFormModal}
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="ghost" onClick={closeFormModal}>Cancelar</Button>
            <Button onClick={handleSaveTicket}>
              {formMode === 'edit' ? 'Salvar Alterações' : 'Criar Ticket'}
            </Button>
          </div>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5 sm:col-span-2">
            <Label>Título do Ticket</Label>
            <Input
              value={formState.title}
              onChange={(e) => updateFormField('title', e.target.value)}
              placeholder="Descreva a atividade de forma breve"
            />
          </div>

          <div className="grid gap-1.5">
            <Label>Tipo</Label>
            <NativeSelect
              value={formState.devType}
              onChange={(e) => updateFormField('devType', e.target.value as DevType)}
            >
              {(['Epic', 'Feature', 'Task', 'Bug'] as DevType[]).map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </NativeSelect>
          </div>

          <div className="grid gap-1.5">
            <Label>Categoria</Label>
            <NativeSelect
              value={formState.category}
              onChange={(e) => updateFormField('category', e.target.value)}
            >
              {DEV_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </NativeSelect>
          </div>

          <div className="grid gap-1.5">
            <Label>Status</Label>
            <NativeSelect
              value={formState.devStatus}
              onChange={(e) => updateFormField('devStatus', e.target.value as DevStatus)}
            >
               {ALL_DEV_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </NativeSelect>
          </div>

          <div className="grid gap-1.5">
            <Label>Responsável</Label>
            <NativeSelect
              value={formState.resp}
              onChange={(e) => updateFormField('resp', e.target.value)}
            >
               {DEV_USERS.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </NativeSelect>
          </div>

          <div className="grid gap-1.5">
            <Label>Data de Início</Label>
            <Input
              type="date"
              value={formState.startDate}
              onChange={(e) => updateFormField('startDate', e.target.value)}
            />
          </div>

          <div className="grid gap-1.5">
            <Label>Data de Entrega</Label>
            <Input
              type="date"
              value={formState.deadline}
              onChange={(e) => updateFormField('deadline', e.target.value)}
            />
          </div>

           <div className="grid gap-1.5 sm:col-span-2">
            <Label>Sprint Vinculada</Label>
            <NativeSelect
              value={formState.sprintId}
              onChange={(e) => updateFormField('sprintId', e.target.value)}
            >
              <option value="">Nenhuma / Backlog</option>
              {DEV_SPRINTS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </NativeSelect>
          </div>

          {/* Seção de Score */}
          <div className="rounded-lg border bg-muted/30 p-4 sm:col-span-2">
             <div className="mb-4 flex items-center justify-between">
                <div>
                   <h4 className="text-sm font-semibold text-foreground">Score & Critérios</h4>
                   <p className="text-xs text-muted-foreground">Ajuste de 0 a 3 para priorizar a tarefa.</p>
                </div>
                <div className="flex h-10 w-16 items-center justify-center rounded-md bg-primary/10 text-lg font-bold text-primary border border-primary/20">
                  {formScore}
                </div>
             </div>
             <div className="grid grid-cols-5 gap-2">
                {[
                  ['imp', 'Impacto', formState.imp],
                  ['ris', 'Risco', formState.ris],
                  ['fre', 'Freq.', formState.fre],
                  ['esf', 'Esforço', formState.esf],
                  ['deb', 'Débito', formState.deb],
                ].map(([key, label, value]) => (
                  <div key={key} className="grid gap-1.5">
                    <Label className="text-center text-xs">{label}</Label>
                    <Input
                      type="number"
                      min="0"
                      max="3"
                      value={value}
                      className="text-center"
                      onChange={(e) => updateFormField(key as keyof TicketFormState, e.target.value)}
                    />
                  </div>
                ))}
             </div>
          </div>

          <div className="grid gap-1.5 sm:col-span-2">
            <Label>Descrição Completa</Label>
            <textarea
              value={formState.description}
              onChange={(e) => updateFormField('description', e.target.value)}
              className="min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              placeholder="Descreva os requisitos, regras de negócio e links de referência..."
            />
          </div>
        </div>
      </ModalShell>
    </>
  );
}
