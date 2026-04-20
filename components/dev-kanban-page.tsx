'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CalendarDays, Copy, MessageSquareText, Plus } from 'lucide-react';

import { ModalShell } from '@/components/modal-shell';
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
    const primaryTag = ticket.category === 'Habilis' ? 'tag-habilis' : ticket.category === 'Meta' ? 'tag-meta' : ticket.devType === 'Bug' ? 'tag-hotfix' : ticket.category === 'UX / Interface' ? 'tag-ux' : 'tag-prioridade';

    return {
      ...ticket,
      createdBy: DEV_USERS[index % DEV_USERS.length]?.id ?? CURRENT_USER_ID,
      protoExt: ticket.category === 'Habilis' || ticket.category === 'Meta' ? `EXT-${String(240 + index).padStart(3, '0')}` : undefined,
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

function buildTicketId() { const id = nextGeneratedTicketId; nextGeneratedTicketId += 1; return id; }
function buildHistoryId(ticketId: number) { const id = `history-${ticketId}-${nextGeneratedHistoryId}`; nextGeneratedHistoryId += 1; return id; }
function buildCommentId(ticketId: number) { const id = `comment-${ticketId}-${nextGeneratedCommentId}`; nextGeneratedCommentId += 1; return id; }

function getPriority(score: number) {
  if (score >= 12) return { label: 'CRÍTICO', badgeClassName: 'border-[#fecaca] bg-[#fef2f2] text-[#dc2626]', borderClassName: 'border-l-[#dc2626]', scoreClassName: 'text-[#dc2626]' };
  if (score >= 9) return { label: 'ALTO', badgeClassName: 'border-[#fde68a] bg-[#fffbeb] text-[#d97706]', borderClassName: 'border-l-[#d97706]', scoreClassName: 'text-[#d97706]' };
  if (score >= 6) return { label: 'MÉDIO', badgeClassName: 'border-[#fde68a] bg-[#fefce8] text-[#854d0e]', borderClassName: 'border-l-[#ca8a04]', scoreClassName: 'text-[#ca8a04]' };
  return { label: 'BAIXO', badgeClassName: 'border-[#a7f3d0] bg-[#ecfdf5] text-[#059669]', borderClassName: 'border-l-[#059669]', scoreClassName: 'text-[#059669]' };
}

function getStatusBadgeClass(status: DevStatus) {
  const styles: Record<DevStatus, string> = {
    Backlog: 'border-[#e2e8f0] bg-[#f1f5f9] text-[#475569]',
    Análise: 'border-[#fde68a] bg-[#fffbeb] text-[#d97706]',
    'Pronto para Desenvolver': 'border-[#bfdbfe] bg-[#eff6ff] text-[#2563eb]',
    'Em Desenvolvimento': 'border-[#ddd6fe] bg-[#f5f3ff] text-[#7c3aed]',
    Testes: 'border-[#fde68a] bg-[#fefce8] text-[#854d0e]',
    'Code Review': 'border-[#f9a8d4] bg-[#fdf2f8] text-[#9d174d]',
    Concluído: 'border-[#a7f3d0] bg-[#ecfdf5] text-[#059669]',
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

function Badge({ children, className }: { children: React.ReactNode; className?: string; }) {
  return <span className={cn('inline-flex items-center rounded-[6px] border px-2 py-[2px] text-[10px] font-bold whitespace-nowrap', className)}>{children}</span>;
}

function FormLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-[11px] font-bold tracking-[.06em] text-[#64748b] uppercase">{children}</label>;
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

  const usersById = DEV_USERS.reduce<Record<string, (typeof DEV_USERS)[number]>>((acc, user) => { acc[user.id] = user; return acc; }, {});
  const sprintsById = DEV_SPRINTS.reduce<Record<string, (typeof DEV_SPRINTS)[number]>>((acc, sprint) => { acc[sprint.id] = sprint; return acc; }, {});
  const epicMap = tickets.reduce<Record<number, string>>((acc, ticket) => { if (ticket.devType === 'Epic') { acc[ticket.id] = ticket.title; } return acc; }, {});

  const selectedTicket = tickets.find((ticket) => ticket.id === selectedTicketId) ?? null;
  const currentUser = DEV_USERS.find((user) => user.id === CURRENT_USER_ID) ?? DEV_USERS[0];
  const selectedDeadlineTicket = tickets.find((ticket) => ticket.id === deadlineTicketId) ?? null;
  const selectedTagTicket = tickets.find((ticket) => ticket.id === tagPickerTicketId) ?? null;
  const tagsById = DEV_TAGS.reduce<Record<string, DevTag>>((acc, tag) => { acc[tag.id] = tag; return acc; }, {});

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

  const visibleTickets = statusFilter === 'all' ? filteredOpenTickets : filteredOpenTickets.filter((ticket) => ticket.devStatus === statusFilter);
  const responsibleUsers = DEV_USERS.filter((user) => tickets.some((ticket) => ticket.resp === user.id));

  const formCriteria: DevCriteria = { imp: Number(formState.imp) || 0, ris: Number(formState.ris) || 0, fre: Number(formState.fre) || 0, esf: Number(formState.esf) || 0, deb: Number(formState.deb) || 0 };
  const formScore = calcScore(formCriteria);

  function updateFormField<Key extends keyof TicketFormState>(key: Key, value: TicketFormState[Key]) { setFormState((current) => ({ ...current, [key]: value })); }
  function openCreateModal(type: DevType) { setFormState({ ...EMPTY_FORM, devType: type }); setEditingTicketId(null); setFormMode('create'); }
  
  function openEditModal(ticket: DevTicket) {
    setFormState({ title: ticket.title, category: ticket.category, devType: ticket.devType, devStatus: ticket.devStatus, resp: ticket.resp, sprintId: ticket.sprintId ?? '', parentId: ticket.parentId ? String(ticket.parentId) : '', clientName: ticket.clientName ?? '', protoExt: ticket.protoExt ?? '', instance: ticket.instance ?? '', cnpj: ticket.cnpj ?? '', clientPhone: ticket.clientPhone ?? '', startDate: ticket.startDate ?? '', deadline: ticket.deadline ?? '', imp: String(ticket.criteria.imp), ris: String(ticket.criteria.ris), fre: String(ticket.criteria.fre), esf: String(ticket.criteria.esf), deb: String(ticket.criteria.deb), description: ticket.description });
    setEditingTicketId(ticket.id); setFormMode('edit');
  }

  function closeFormModal() { setFormMode(null); setEditingTicketId(null); }
  function appendHistory(ticket: DevTicket, message: string) { return [...ticket.history, { id: buildHistoryId(ticket.id), user: currentUser?.name ?? 'Sistema', message, createdAt: formatDateTime() }]; }
  function updateTicket(ticketId: number, updater: (ticket: DevTicket) => DevTicket) { setTickets((current) => current.map((ticket) => (ticket.id === ticketId ? updater(ticket) : ticket))); }
  function moveTicket(ticketId: number, nextStatus: DevStatus) { updateTicket(ticketId, (ticket) => ({ ...ticket, devStatus: nextStatus, history: ticket.devStatus === nextStatus ? ticket.history : appendHistory(ticket, `Status: ${ticket.devStatus} -> ${nextStatus}`) })); }
  function handleConcludeSelectedTicket() { if (!selectedTicket) return; updateTicket(selectedTicket.id, (ticket) => ({ ...ticket, devStatus: 'Concluído', history: appendHistory(ticket, 'Task concluida') })); setSelectedTicketId(null); }
  function handleAddComment() { if (!selectedTicket || !commentDraft.trim()) return; updateTicket(selectedTicket.id, (ticket) => ({ ...ticket, comments: [...ticket.comments, { id: buildCommentId(ticket.id), author: currentUser?.name ?? 'Usuario', message: commentDraft.trim(), createdAt: formatDateTime() }], history: appendHistory(ticket, 'Comentou') })); setCommentDraft(''); }
  function toggleTag(ticketId: number, tagId: string) { updateTicket(ticketId, (ticket) => ({ ...ticket, tags: ticket.tags.includes(tagId) ? ticket.tags.filter((currentTagId) => currentTagId !== tagId) : [...ticket.tags, tagId], history: appendHistory(ticket, 'Etiquetas atualizadas') })); }
  function openDeadlineModal(ticketId: number) { const ticket = tickets.find((currentTicket) => currentTicket.id === ticketId); setDeadlineTicketId(ticketId); setDeadlineDraft(ticket?.deadline ?? ''); setDeadlineReason(''); }
  function closeDeadlineModal() { setDeadlineTicketId(null); setDeadlineDraft(''); setDeadlineReason(''); }
  function handleSaveDeadline() { if (!selectedDeadlineTicket || !deadlineDraft || !deadlineReason.trim()) return; const previousDeadline = selectedDeadlineTicket.deadline; updateTicket(selectedDeadlineTicket.id, (ticket) => ({ ...ticket, deadline: deadlineDraft, history: appendHistory(ticket, `Prazo alterado: ${formatDate(previousDeadline)} -> ${formatDate(deadlineDraft)}. Motivo: ${deadlineReason.trim()}`) })); closeDeadlineModal(); }
  function handleDeleteSelectedTicket() { if (!selectedTicket) return; if (!window.confirm('Remover este ticket do kanban?')) return; setTickets((current) => current.filter((ticket) => ticket.id !== selectedTicket.id)); setSelectedTicketId(null); }
  function handleExport() { const rows = [['Protocolo', 'Tipo', 'Titulo', 'Categoria', 'Status', 'Responsavel', 'Score', 'Sprint'], ...visibleTickets.map((ticket) => [ticket.proto, ticket.devType, ticket.title, ticket.category, ticket.devStatus, usersById[ticket.resp]?.name ?? '-', String(ticket.score), ticket.sprintId ? sprintsById[ticket.sprintId]?.name ?? '-' : '-'])]; const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n'); const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'kanban-dev.csv'; link.click(); URL.revokeObjectURL(url); }
  
  function handleSaveTicket() {
    if (!formState.title.trim()) return;
    if (formMode === 'edit' && editingTicketId) {
      setTickets((current) => current.map((ticket) => ticket.id === editingTicketId ? { ...ticket, title: formState.title.trim(), category: formState.category, devType: formState.devType, devStatus: formState.devStatus, resp: formState.resp, score: formScore, sprintId: formState.sprintId || undefined, parentId: formState.parentId ? Number(formState.parentId) : undefined, clientName: formState.clientName.trim() || undefined, protoExt: formState.protoExt.trim() || undefined, instance: formState.instance.trim() || undefined, cnpj: formState.cnpj.trim() || undefined, clientPhone: formState.clientPhone.trim() || undefined, startDate: formState.startDate || undefined, deadline: formState.deadline || undefined, description: formState.description.trim(), criteria: formCriteria, history: appendHistory(ticket, 'Ticket editado') } : ticket));
    } else {
      const nextTicketId = buildTicketId();
      const nextTicket: DevTicket = { id: nextTicketId, proto: buildProtocol(), title: formState.title.trim(), category: formState.category, devType: formState.devType, devStatus: formState.devStatus, resp: formState.resp, score: formScore, createdAt: new Date().toISOString().slice(0, 10), sprintId: formState.sprintId || undefined, parentId: formState.parentId ? Number(formState.parentId) : undefined, clientName: formState.clientName.trim() || undefined, protoExt: formState.protoExt.trim() || undefined, instance: formState.instance.trim() || undefined, cnpj: formState.cnpj.trim() || undefined, clientPhone: formState.clientPhone.trim() || undefined, startDate: formState.startDate || undefined, deadline: formState.deadline || undefined, description: formState.description.trim(), comments: [], createdBy: currentUser?.id ?? CURRENT_USER_ID, tags: [], criteria: formCriteria, history: [{ id: buildHistoryId(nextTicketId), user: currentUser?.name ?? 'Sistema', message: 'Ticket criado', createdAt: formatDateTime() }] };
      setTickets((current) => [nextTicket, ...current]);
    }
    closeFormModal();
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-[20px] font-extrabold tracking-[-0.4px] text-[#0f172a]">
            Kanban Dev
          </h1>
          <p className="mt-0.5 text-[13px] text-[#64748b]">
            Fluxo de desenvolvimento e priorização
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
           <button onClick={handleExport} className="h-9 rounded-[8px] border border-[#e2e8f0] bg-white px-4 text-[13px] font-semibold text-[#0f172a] shadow-sm transition-colors hover:bg-[#f8fafc]">
             Exportar
           </button>
           <Link href="/desenvolvimento/sprints" className="inline-flex h-9 items-center justify-center rounded-[8px] border border-[#e2e8f0] bg-white px-4 text-[13px] font-semibold text-[#0f172a] shadow-sm transition-colors hover:bg-[#f8fafc]">
             Sprints
           </Link>
           <button onClick={() => openCreateModal('Task')} className="inline-flex h-9 items-center gap-2 rounded-[8px] bg-[#2563eb] px-4 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-[#1d4ed8]">
             <Plus className="size-4"/> Task
           </button>
           <button onClick={() => openCreateModal('Bug')} className="h-9 rounded-[8px] bg-[#dc2626] px-4 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-[#b91c1c]">
             Bug
           </button>
        </div>
      </div>

      <div className="mb-6 rounded-[10px] border border-[#e2e8f0] bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="flex flex-1 flex-wrap items-center gap-3">
             <div className="flex h-9 items-center gap-2 rounded-[6px] border border-[#e2e8f0] bg-[#f8fafc] px-3 text-[13px]">
               <CalendarDays className="h-[14px] w-[14px] text-[#64748b]" />
               <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="bg-transparent text-[#0f172a] outline-none" />
               <span className="text-[#94a3b8]">até</span>
               <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="bg-transparent text-[#0f172a] outline-none" />
             </div>

             <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'all' | DevStatus)} className="h-9 min-w-[150px] rounded-[6px] border border-[#e2e8f0] bg-transparent px-3 text-[13px] text-[#0f172a] outline-none focus:border-[#2563eb]">
                <option value="all">Todos os status</option>
                {DEV_COLUMNS.map((s) => <option key={s} value={s}>{s}</option>)}
             </select>

             <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="h-9 min-w-[140px] rounded-[6px] border border-[#e2e8f0] bg-transparent px-3 text-[13px] text-[#0f172a] outline-none focus:border-[#2563eb]">
                <option value="">Todos os tipos</option>
                {DEV_FILTER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
             </select>

             <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="h-9 min-w-[140px] rounded-[6px] border border-[#e2e8f0] bg-transparent px-3 text-[13px] text-[#0f172a] outline-none focus:border-[#2563eb]">
                <option value="">Todas as categorias</option>
                {DEV_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
             </select>

             <select value={responsibleFilter} onChange={(e) => setResponsibleFilter(e.target.value)} className="h-9 min-w-[150px] rounded-[6px] border border-[#e2e8f0] bg-transparent px-3 text-[13px] text-[#0f172a] outline-none focus:border-[#2563eb]">
                <option value="">Todos responsáveis</option>
                {responsibleUsers.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
             </select>

             {DEV_SPRINTS.length > 0 && (
               <select value={sprintFilter} onChange={(e) => setSprintFilter(e.target.value)} className="h-9 min-w-[140px] rounded-[6px] border border-[#e2e8f0] bg-transparent px-3 text-[13px] text-[#0f172a] outline-none focus:border-[#2563eb]">
                  <option value="">Todas as sprints</option>
                  {DEV_SPRINTS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
               </select>
             )}

             {(typeFilter || categoryFilter || responsibleFilter || sprintFilter || dateFrom || dateTo) && (
               <button onClick={() => { setTypeFilter(''); setCategoryFilter(''); setResponsibleFilter(''); setSprintFilter(''); setDateFrom(''); setDateTo(''); }} className="h-9 px-3 text-[13px] font-medium text-[#64748b] hover:text-[#0f172a]">
                 Limpar Filtros
               </button>
             )}
          </div>
        </div>
      </div>

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
                className="flex min-w-[300px] max-w-[300px] shrink-0 flex-col rounded-[12px] bg-[#f8fafc] border border-[#e2e8f0] p-2 shadow-sm"
              >
                <div className="mb-3 flex items-center justify-between px-2 pt-2">
                  <span className="text-[14px] font-bold text-[#0f172a]">{column}</span>
                  <span className="flex h-[22px] items-center justify-center rounded-full bg-white border border-[#e2e8f0] px-2 text-[11px] font-extrabold text-[#64748b] shadow-sm">
                    {columnTickets.length}
                  </span>
                </div>

                <div className="flex flex-col gap-3 min-h-[100px]">
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
                          className={cn('group cursor-pointer rounded-[10px] border border-[#e2e8f0] border-l-[3px] bg-white p-3 shadow-[0_2px_8px_rgba(15,23,42,.03)] transition-all hover:border-[#bfdbfe] hover:shadow-md', priority.borderClassName)}
                        >
                          <div className="mb-2 flex flex-wrap gap-1.5">
                            <Badge className={getTypeBadgeClass(ticket.devType)}>{ticket.devType}</Badge>
                            <Badge className={priority.badgeClassName}>{priority.label}</Badge>
                            <span className="ml-auto font-mono text-[10px] font-semibold text-[#94a3b8]">{ticket.proto}</span>
                          </div>
                          {epicName && <div className="mb-1 text-[11px] font-bold text-[#7c3aed]">{epicName}</div>}
                          <h4 className="mb-1.5 text-[13px] font-semibold leading-tight text-[#0f172a]">
                            {ticket.title}
                          </h4>
                          <div className="mb-3 text-[11px] text-[#64748b]">
                            {ticket.category} {ticket.clientName && `· ${ticket.clientName}`}
                          </div>
                          <div className="flex items-center justify-between border-t border-[#f1f5f9] pt-2">
                            <div className="flex items-center gap-2">
                              {responsible && <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#f1f5f9] text-[9px] font-bold text-[#475569]">{getInitials(responsible.name)}</div>}
                              <span className="rounded-[4px] bg-[#f8fafc] border border-[#e2e8f0] px-1.5 py-0.5 text-[10px] font-bold text-[#64748b]">{ticket.score} pts</span>
                            </div>
                            {ticket.comments.length > 0 && (
                              <div className="flex items-center gap-1 text-[11px] text-[#64748b]">
                                <MessageSquareText className="size-3.5" /> {ticket.comments.length}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-6 text-center text-[12px] font-medium text-[#94a3b8]">Nenhum ticket</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : visibleTickets.length ? (
        <div className="flex flex-col gap-3">
          {visibleTickets.map((ticket) => {
            const priority = getPriority(ticket.score);
            const responsible = usersById[ticket.resp];
            const epicName = ticket.parentId ? epicMap[ticket.parentId] : null;

            return (
              <div key={ticket.id} onClick={() => setSelectedTicketId(ticket.id)} className={cn('flex cursor-pointer items-start gap-4 rounded-[12px] border border-[#e2e8f0] border-l-[4px] bg-white p-4 shadow-sm transition-all hover:border-[#bfdbfe] hover:shadow-md', priority.borderClassName)}>
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap gap-2">
                    <Badge className={getTypeBadgeClass(ticket.devType)}>{ticket.devType}</Badge>
                    <Badge className={priority.badgeClassName}>{priority.label}</Badge>
                    <Badge className={getStatusBadgeClass(ticket.devStatus)}>{ticket.devStatus}</Badge>
                    <span className="font-mono text-[11px] font-semibold text-[#94a3b8]">{ticket.proto}</span>
                  </div>
                  {epicName && <div className="mb-1 text-[11px] font-bold text-[#7c3aed]">{epicName}</div>}
                  <h3 className="mb-1 text-[15px] font-extrabold text-[#0f172a]">{ticket.title}</h3>
                  <div className="mb-3 text-[12px] text-[#64748b]">{ticket.category} {ticket.clientName ? ` · ${ticket.clientName}` : ''}</div>
                  <div className="flex items-center gap-2">
                    {responsible && <span className="rounded-full border border-[#e2e8f0] bg-[#f8fafc] px-2 py-1 text-[10px] font-bold text-[#64748b]">{responsible.name}</span>}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <div className={cn('text-[20px] font-extrabold', priority.scoreClassName)}>{ticket.score}</div>
                  <div className="text-[11px] font-bold tracking-[.06em] text-[#64748b] uppercase">Pts</div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 rounded-[16px] border border-dashed border-[#cbd5e1] bg-white px-6 py-12 text-center shadow-sm">
          <div className="text-[16px] font-bold text-[#0f172a]">Nenhum ticket encontrado</div>
          <div className="mt-1 text-[13px] text-[#64748b]">Tente ajustar ou limpar os filtros.</div>
        </div>
      )}

      <ModalShell
        open={Boolean(selectedTicket)}
        title={selectedTicket?.title ?? 'Detalhes do ticket'}
        description={selectedTicket ? `${selectedTicket.proto} · ${selectedTicket.devType} · ${selectedTicket.devStatus}` : undefined}
        maxWidthClassName="max-w-[800px]"
        onClose={() => { setSelectedTicketId(null); setCommentDraft(''); }}
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
                 <select value={selectedTicket.devStatus} onChange={(event) => moveTicket(selectedTicket.id, event.target.value as DevStatus)} className="h-9 rounded-[6px] border border-[#e2e8f0] bg-white px-3 text-[13px] font-semibold outline-none focus:border-[#2563eb]">
                  {ALL_DEV_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                 </select>
                 {selectedTicket.devStatus !== 'Concluído' && (
                  <button type="button" onClick={handleConcludeSelectedTicket} className="h-9 rounded-[8px] bg-[#059669] px-4 text-[13px] font-semibold text-white hover:bg-[#047857]">Concluir</button>
                 )}
              </div>
            </div>
          ) : null
        }
      >
        {selectedTicket && (
          <div className="grid gap-4">
            {selectedTicket.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedTicket.tags.map((tagId) => tagsById[tagId] && (
                  <span key={tagId} className="inline-flex items-center rounded-full px-[10px] py-[4px] text-[11px] font-bold text-white" style={{ backgroundColor: tagsById[tagId].color }}>{tagsById[tagId].name}</span>
                ))}
              </div>
            )}

            <div className="rounded-[10px] border border-[#e2e8f0] bg-[#f8fafc] p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold tracking-[.06em] text-[#64748b] uppercase">Protocolo</span>
                  <span className="font-mono text-[16px] font-extrabold text-[#2563eb]">{selectedTicket.proto}</span>
                  <button type="button" onClick={() => navigator.clipboard?.writeText(selectedTicket.proto)} className="flex h-8 w-8 items-center justify-center rounded-[6px] border border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f1f5f9]"><Copy className="size-4" /></button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={getTypeBadgeClass(selectedTicket.devType)}>{selectedTicket.devType}</Badge>
                  <Badge className={getPriority(selectedTicket.score).badgeClassName}>{getPriority(selectedTicket.score).label}</Badge>
                  <Badge className={getStatusBadgeClass(selectedTicket.devStatus)}>{selectedTicket.devStatus}</Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] p-3">
                <div className="mb-1 text-[10px] font-bold tracking-[.06em] text-[#64748b] uppercase">Score</div>
                <div className={cn('text-[18px] font-extrabold', getPriority(selectedTicket.score).scoreClassName)}>{selectedTicket.score} <span className="text-[12px] font-medium text-[#64748b]">/15</span></div>
              </div>
              <div className="rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] p-3">
                <div className="mb-1 text-[10px] font-bold tracking-[.06em] text-[#64748b] uppercase">Categoria</div>
                <div className="text-[13px] font-semibold text-[#0f172a]">{selectedTicket.category}</div>
              </div>
              <div className="rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] p-3">
                <div className="mb-1 text-[10px] font-bold tracking-[.06em] text-[#64748b] uppercase">Responsável</div>
                <div className="text-[13px] font-semibold text-[#0f172a]">{usersById[selectedTicket.resp]?.name ?? '-'}</div>
              </div>
              <div className="rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] p-3">
                <div className="mb-1 text-[10px] font-bold tracking-[.06em] text-[#64748b] uppercase">Período</div>
                <div className="text-[13px] font-semibold text-[#0f172a]">{formatDate(selectedTicket.startDate)} → {formatDate(selectedTicket.deadline)}</div>
              </div>
              <div className="rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] p-3">
                <div className="mb-1 text-[10px] font-bold tracking-[.06em] text-[#64748b] uppercase">Cliente</div>
                <div className="text-[13px] font-semibold text-[#0f172a]">{selectedTicket.clientName || '-'}</div>
              </div>
              <div className="rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] p-3">
                <div className="mb-1 text-[10px] font-bold tracking-[.06em] text-[#64748b] uppercase">Sprint</div>
                <div className="text-[13px] font-semibold text-[#0f172a]">{sprintsById[selectedTicket.sprintId ?? '']?.name ?? '-'}</div>
              </div>
            </div>

            <div className="rounded-[10px] border border-[#e2e8f0] bg-white p-4 shadow-sm">
              <div className="mb-2 text-[10px] font-bold tracking-[.06em] text-[#64748b] uppercase">Descrição</div>
              <p className="whitespace-pre-wrap text-[13px] leading-6 text-[#475569]">{selectedTicket.description || 'Sem descrição informada.'}</p>
            </div>

            <div>
              <h3 className="mb-3 border-b border-[#e2e8f0] pb-2 text-[14px] font-bold text-[#0f172a]">Histórico</h3>
              {selectedTicket.history.length > 0 ? (
                 <div className="space-y-3">
                  {[...selectedTicket.history].reverse().map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <span className="mt-[7px] h-2 w-2 shrink-0 rounded-full bg-[#2563eb]" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] text-[#0f172a]"><span className="font-semibold">{item.user}</span> {item.message}</p>
                        <p className="text-[12px] text-[#64748b]">{item.createdAt}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-[13px] text-[#64748b]">Nenhum histórico registrado.</p>}
            </div>

             <div className="rounded-[10px] border border-[#e2e8f0] bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <MessageSquareText className="size-4 text-[#64748b]" />
                <h3 className="text-[13px] font-bold text-[#0f172a]">Comentários</h3>
                <span className="flex h-[20px] min-w-[20px] items-center justify-center rounded-full bg-[#eff6ff] px-1.5 text-[10px] font-bold text-[#2563eb]">{selectedTicket.comments.length}</span>
              </div>
              {selectedTicket.comments.length > 0 ? (
                <div className="space-y-3 mb-4">
                  {selectedTicket.comments.map((comment) => (
                    <div key={comment.id} className="rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[13px] font-semibold text-[#0f172a]">{comment.author}</span>
                        <span className="text-[11px] text-[#64748b]">{comment.createdAt}</span>
                      </div>
                      <p className="text-[13px] text-[#475569] whitespace-pre-wrap leading-6">{comment.message}</p>
                    </div>
                  ))}
                </div>
              ) : <div className="mb-4 rounded-[8px] border border-dashed border-[#cbd5e1] bg-[#f8fafc] py-4 text-center text-[13px] text-[#64748b]">Nenhum comentário.</div>}
              <div className="flex items-center gap-3">
                <input value={commentDraft} onChange={(e) => setCommentDraft(e.target.value)} placeholder="Escreva um comentário..." className="h-9 flex-1 rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] px-3 text-[13px] outline-none focus:border-[#2563eb]" />
                <button type="button" onClick={handleAddComment} className="h-9 rounded-[8px] bg-[#2563eb] px-4 text-[13px] font-semibold text-white hover:bg-[#1d4ed8]">Enviar</button>
              </div>
            </div>
          </div>
        )}
      </ModalShell>

      <ModalShell
        open={Boolean(selectedTagTicket)}
        title="Gerenciar Etiquetas"
        maxWidthClassName="max-w-[440px]"
        onClose={() => setTagPickerTicketId(null)}
        footer={<button type="button" onClick={() => setTagPickerTicketId(null)} className="h-9 w-full rounded-[8px] border border-[#e2e8f0] bg-white text-[13px] font-semibold text-[#64748b] hover:bg-[#f8fafc]">Fechar</button>}
      >
        {selectedTagTicket && (
          <div className="flex flex-col gap-2">
            {DEV_TAGS.map((tag) => {
              const active = selectedTagTicket.tags.includes(tag.id);
              return (
                <button
                  type="button"
                  key={tag.id}
                  onClick={() => toggleTag(selectedTagTicket.id, tag.id)}
                  className={cn('flex items-center justify-between rounded-[8px] border p-3 transition-colors', active ? 'border-[#2563eb] bg-[#eff6ff]' : 'border-[#e2e8f0] bg-white hover:border-[#bfdbfe]')}
                >
                  <div className="flex items-center gap-3">
                    <span className="size-3 rounded-full" style={{ backgroundColor: tag.color }} />
                    <span className="text-[13px] font-semibold text-[#0f172a]">{tag.name}</span>
                  </div>
                  {active && <span className="text-[12px] font-semibold text-[#2563eb]">Selecionada</span>}
                </button>
              );
            })}
          </div>
        )}
      </ModalShell>

      <ModalShell
        open={Boolean(selectedDeadlineTicket)}
        title="Alterar Prazo"
        maxWidthClassName="max-w-[440px]"
        onClose={closeDeadlineModal}
        footer={
          <div className="flex justify-end gap-2 w-full">
            <button type="button" onClick={closeDeadlineModal} className="h-9 rounded-[8px] border border-[#e2e8f0] bg-white px-4 text-[13px] font-semibold text-[#64748b] hover:bg-[#f8fafc]">Cancelar</button>
            <button type="button" onClick={handleSaveDeadline} className="h-9 rounded-[8px] bg-[#2563eb] px-4 text-[13px] font-semibold text-white hover:bg-[#1d4ed8]">Salvar Prazo</button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <FormLabel>Nova data de entrega</FormLabel>
            <input type="date" value={deadlineDraft} onChange={(e) => setDeadlineDraft(e.target.value)} className="h-9 w-full rounded-[6px] border border-[#e2e8f0] px-3 text-[13px] outline-none focus:border-[#2563eb]" />
          </div>
          <div className="flex flex-col gap-1.5">
            <FormLabel>Motivo da alteração</FormLabel>
            <textarea value={deadlineReason} onChange={(e) => setDeadlineReason(e.target.value)} className="min-h-[100px] w-full resize-y rounded-[6px] border border-[#e2e8f0] p-3 text-[13px] outline-none focus:border-[#2563eb]" placeholder="Explique por que o prazo está sendo alterado..." />
          </div>
        </div>
      </ModalShell>

      <ModalShell
        open={Boolean(formMode)}
        title={formMode === 'edit' ? 'Editar Ticket' : 'Novo Ticket'}
        maxWidthClassName="max-w-[920px]"
        onClose={closeFormModal}
        footer={
          <div className="flex justify-end gap-2 w-full">
            <button type="button" onClick={closeFormModal} className="h-9 rounded-[8px] border border-[#e2e8f0] bg-white px-4 text-[13px] font-semibold text-[#64748b] hover:bg-[#f8fafc]">Cancelar</button>
            <button type="button" onClick={handleSaveTicket} className="h-9 rounded-[8px] bg-[#2563eb] px-4 text-[13px] font-semibold text-white hover:bg-[#1d4ed8]">{formMode === 'edit' ? 'Salvar Alterações' : 'Criar Ticket'}</button>
          </div>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <FormLabel>Título do Ticket</FormLabel>
            <input value={formState.title} onChange={(e) => updateFormField('title', e.target.value)} placeholder="Descreva a atividade de forma breve" className="h-9 w-full rounded-[6px] border border-[#e2e8f0] px-3 text-[13px] outline-none focus:border-[#2563eb]" />
          </div>
          <div className="flex flex-col gap-1.5">
            <FormLabel>Tipo</FormLabel>
            <select value={formState.devType} onChange={(e) => updateFormField('devType', e.target.value as DevType)} className="h-9 w-full rounded-[6px] border border-[#e2e8f0] bg-white px-3 text-[13px] outline-none focus:border-[#2563eb]">
              {(['Epic', 'Feature', 'Task', 'Bug'] as DevType[]).map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <FormLabel>Categoria</FormLabel>
            <select value={formState.category} onChange={(e) => updateFormField('category', e.target.value)} className="h-9 w-full rounded-[6px] border border-[#e2e8f0] bg-white px-3 text-[13px] outline-none focus:border-[#2563eb]">
              {DEV_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <FormLabel>Status</FormLabel>
            <select value={formState.devStatus} onChange={(e) => updateFormField('devStatus', e.target.value as DevStatus)} className="h-9 w-full rounded-[6px] border border-[#e2e8f0] bg-white px-3 text-[13px] outline-none focus:border-[#2563eb]">
               {ALL_DEV_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <FormLabel>Responsável</FormLabel>
            <select value={formState.resp} onChange={(e) => updateFormField('resp', e.target.value)} className="h-9 w-full rounded-[6px] border border-[#e2e8f0] bg-white px-3 text-[13px] outline-none focus:border-[#2563eb]">
               {DEV_USERS.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <FormLabel>Data de Início</FormLabel>
            <input type="date" value={formState.startDate} onChange={(e) => updateFormField('startDate', e.target.value)} className="h-9 w-full rounded-[6px] border border-[#e2e8f0] px-3 text-[13px] outline-none focus:border-[#2563eb]" />
          </div>
          <div className="flex flex-col gap-1.5">
            <FormLabel>Data de Entrega</FormLabel>
            <input type="date" value={formState.deadline} onChange={(e) => updateFormField('deadline', e.target.value)} className="h-9 w-full rounded-[6px] border border-[#e2e8f0] px-3 text-[13px] outline-none focus:border-[#2563eb]" />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <FormLabel>Sprint Vinculada</FormLabel>
            <select value={formState.sprintId} onChange={(e) => updateFormField('sprintId', e.target.value)} className="h-9 w-full rounded-[6px] border border-[#e2e8f0] bg-white px-3 text-[13px] outline-none focus:border-[#2563eb]">
              <option value="">Nenhuma / Backlog</option>
              {DEV_SPRINTS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div className="rounded-[10px] border border-[#e2e8f0] bg-[#f8fafc] p-4 sm:col-span-2">
             <div className="mb-4 flex items-center justify-between">
                <div>
                   <h4 className="text-[13px] font-bold text-[#0f172a]">Score & Critérios</h4>
                   <p className="text-[12px] text-[#64748b]">Ajuste de 0 a 3 para priorizar a tarefa.</p>
                </div>
                <div className="flex h-10 min-w-[3rem] px-2 items-center justify-center rounded-[6px] bg-[#eff6ff] text-[18px] font-extrabold text-[#2563eb] border border-[#bfdbfe]">
                  {formScore}
                </div>
             </div>
             <div className="grid grid-cols-5 gap-3">
                {[
                  ['imp', 'Impacto', formState.imp],
                  ['ris', 'Risco', formState.ris],
                  ['fre', 'Freq.', formState.fre],
                  ['esf', 'Esforço', formState.esf],
                  ['deb', 'Débito', formState.deb],
                ].map(([key, label, value]) => (
                  <div key={key} className="flex flex-col gap-1.5">
                    <FormLabel>{label}</FormLabel>
                    <input type="number" min="0" max="3" value={value} onChange={(e) => updateFormField(key as keyof TicketFormState, e.target.value)} className="h-9 w-full rounded-[6px] border border-[#e2e8f0] px-2 text-center text-[13px] outline-none focus:border-[#2563eb]" />
                  </div>
                ))}
             </div>
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <FormLabel>Descrição Completa</FormLabel>
            <textarea value={formState.description} onChange={(e) => updateFormField('description', e.target.value)} placeholder="Descreva os requisitos, regras de negócio e links de referência..." className="min-h-[120px] w-full resize-y rounded-[6px] border border-[#e2e8f0] p-3 text-[13px] outline-none focus:border-[#2563eb]" />
          </div>
        </div>
      </ModalShell>
    </div>
  );
}