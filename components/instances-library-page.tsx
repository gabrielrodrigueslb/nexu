'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Copy,
  MessageSquareText,
  Search,
  Upload,
  X,
} from 'lucide-react';

import { ModalShell } from '@/components/modal-shell';
import { useCurrentAdminUser } from '@/components/admin-users-storage';
import {
  ALL_DEV_STATUSES,
  DEV_CATEGORIES,
  DEV_SPRINTS,
  DEV_USERS,
  INITIAL_DEV_TICKETS,
  type DevStatus,
  type DevTicket as BaseDevTicket,
  type DevType,
} from '@/components/dev-kanban-data';
import { ImplantacaoTicketModal } from '@/components/implantacao/implantacao-ticket-modal';
import {
  getTechNameById,
  sumSetup,
  type ImplantacaoTicket,
  useImplantacaoTickets,
} from '@/components/implantacao/implantacao-shared';
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
type DevTag = { id: string; name: string; color: string };
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
type ImportedInstance = { id: string; name: string; cnpj: string | undefined };
type InstanceItem =
  | { kind: 'implantacao'; ticket: ImplantacaoTicket }
  | { kind: 'dev'; ticket: DevTicket };
type InstanceGroup = {
  key: string;
  name: string;
  importedInfo?: ImportedInstance;
  items: InstanceItem[];
  lastActivity: number;
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
const IMPORTED_INSTANCES_STORAGE_KEY = 'nx_inst_importadas';
let nextGeneratedTicketId =
  Math.max(...INITIAL_DEV_TICKETS.map((ticket) => ticket.id), 0) + 1;
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
    const activityDate =
      ticket.deadline ?? ticket.startDate ?? ticket.createdAt;
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
      cnpj:
        index % 2 === 0
          ? `00.000.000/000${(index % 9) + 1}-0${index % 9}`
          : undefined,
      clientPhone: index % 2 === 0 ? '(11) 99999-0000' : undefined,
      updatedAt: activityTimestamp,
      concludedAt:
        ticket.devStatus === COMPLETED_STATUS ? activityTimestamp : undefined,
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
function normalizeSearchText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}
function getInstanceGroupKey(value: string) {
  return normalizeSearchText(value).replace(/[^a-z0-9]+/g, '_');
}
function parseImportedTimestamp(value?: string | number) {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const timestamp = new Date(`${value}T00:00:00`).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}
function normalizeImportedInstance(value: unknown): ImportedInstance | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as { id?: unknown; name?: unknown; cnpj?: unknown };
  if (typeof record.id !== 'string' || typeof record.name !== 'string')
    return null;
  return {
    id: record.id,
    name: record.name,
    cnpj: typeof record.cnpj === 'string' ? record.cnpj : undefined,
  };
}
async function parseImportedInstancesFile(
  file: File,
): Promise<ImportedInstance[]> {
  const XLSX = await import('xlsx');
  const workbook = XLSX.read(await file.arrayBuffer(), {
    type: 'array',
    cellDates: true,
  });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];
  const rows = XLSX.utils.sheet_to_json<Record<string, string | number | null>>(
    workbook.Sheets[sheetName],
    { defval: null },
  );
  const parsed = rows
    .map((row, index) => {
      const entries = Object.entries(row);
      const findValue = (terms: string[]) =>
        entries.find(([key]) =>
          terms.some((term) => normalizeSearchText(key).includes(term)),
        )?.[1];
      const rawName =
        findValue(['instancia', 'instância', 'nome', 'name']) ??
        entries[0]?.[1] ??
        '';
      const rawCnpj = findValue(['cnpj']) ?? '';
      const name = String(rawName ?? '').trim();
      const cnpj = String(rawCnpj ?? '').trim();
      if (!name) return null;
      return {
        id: `imported-${getInstanceGroupKey(name)}-${index}`,
        name,
        cnpj: cnpj || undefined,
      };
    })
    .filter((item): item is ImportedInstance => Boolean(item));
  const byName = new Map<string, ImportedInstance>();
  parsed.forEach((item) => {
    byName.set(getInstanceGroupKey(item.name), item);
  });
  return [...byName.values()];
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
  if (score >= 12)
    return {
      label: 'CRÍTICO',
      badgeClassName: 'border-[#fecaca] bg-[#fef2f2] text-[#dc2626]',
      borderClassName: 'border-l-[#dc2626]',
      scoreClassName: 'text-[#dc2626]',
    };
  if (score >= 9)
    return {
      label: 'ALTO',
      badgeClassName: 'border-[#fde68a] bg-[#fffbeb] text-[#d97706]',
      borderClassName: 'border-l-[#d97706]',
      scoreClassName: 'text-[#d97706]',
    };
  if (score >= 6)
    return {
      label: 'MÉDIO',
      badgeClassName: 'border-[#fde68a] bg-[#fefce8] text-[#854d0e]',
      borderClassName: 'border-l-[#ca8a04]',
      scoreClassName: 'text-[#ca8a04]',
    };
  return {
    label: 'BAIXO',
    badgeClassName: 'border-[#a7f3d0] bg-[#ecfdf5] text-[#059669]',
    borderClassName: 'border-l-[#059669]',
    scoreClassName: 'text-[#059669]',
  };
}
function getStatusBadgeClass(status: DevStatus) {
  switch (status) {
    case 'Backlog':
      return 'border-[#e2e8f0] bg-[#f1f5f9] text-[#475569]';
    case ANALYSIS_STATUS:
      return 'border-[#fde68a] bg-[#fffbeb] text-[#d97706]';
    case 'Pronto para Desenvolver':
      return 'border-[#bfdbfe] bg-[#eff6ff] text-[#2563eb]';
    case 'Em Desenvolvimento':
      return 'border-[#ddd6fe] bg-[#f5f3ff] text-[#7c3aed]';
    case 'Testes':
      return 'border-[#fde68a] bg-[#fefce8] text-[#854d0e]';
    case 'Code Review':
      return 'border-[#f9a8d4] bg-[#fdf2f8] text-[#9d174d]';
    case COMPLETED_STATUS:
      return 'border-[#a7f3d0] bg-[#ecfdf5] text-[#059669]';
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
function FormLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1 block text-[11px] font-bold tracking-[.06em] text-[#64748b] uppercase">
      {children}
    </label>
  );
}

export function InstancesLibraryPage() {
  const { currentUser: sessionUser } = useCurrentAdminUser();
  const [tickets, setTickets] = useState<DevTicket[]>(() =>
    normalizeInitialTickets(INITIAL_DEV_TICKETS),
  );
  const [commercialTickets, setCommercialTickets] = useImplantacaoTickets();
  const [importedInstances, setImportedInstances] = useState<
    ImportedInstance[]
  >([]);
  const [query, setQuery] = useState('');
  const [expandedInstances, setExpandedInstances] = useState<
    Record<string, boolean>
  >({});
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [selectedCommercialTicketId, setSelectedCommercialTicketId] = useState<
    string | null
  >(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
  const [editingTicketId, setEditingTicketId] = useState<number | null>(null);
  const [formState, setFormState] = useState<TicketFormState>(EMPTY_FORM);
  const [commentDraft, setCommentDraft] = useState('');
  const [tagPickerTicketId, setTagPickerTicketId] = useState<number | null>(
    null,
  );
  const [deadlineTicketId, setDeadlineTicketId] = useState<number | null>(null);
  const [deadlineDraft, setDeadlineDraft] = useState('');
  const [deadlineReason, setDeadlineReason] = useState('');

  const usersById = DEV_USERS.reduce<
    Record<string, (typeof DEV_USERS)[number]>
  >((acc, user) => {
    acc[user.id] = user;
    return acc;
  }, {});
  const sprintsById = DEV_SPRINTS.reduce<
    Record<string, (typeof DEV_SPRINTS)[number]>
  >((acc, sprint) => {
    acc[sprint.id] = sprint;
    return acc;
  }, {});
  const epicMap = tickets.reduce<Record<number, string>>((acc, ticket) => {
    if (ticket.devType === 'Epic') {
      acc[ticket.id] = ticket.title;
    }
    return acc;
  }, {});

  const selectedTicket =
    tickets.find((ticket) => ticket.id === selectedTicketId) ?? null;
  const selectedCommercialTicket =
    commercialTickets.find(
      (ticket) => ticket.id === selectedCommercialTicketId,
    ) ?? null;
  const currentUser = sessionUser
    ? { id: sessionUser.id, name: sessionUser.name }
    : DEV_USERS.find((user) => user.id === CURRENT_USER_ID) ?? DEV_USERS[0];
  const selectedDeadlineTicket =
    tickets.find((ticket) => ticket.id === deadlineTicketId) ?? null;
  const selectedTagTicket =
    tickets.find((ticket) => ticket.id === tagPickerTicketId) ?? null;
  const tagsById = DEV_TAGS.reduce<Record<string, DevTag>>((acc, tag) => {
    acc[tag.id] = tag;
    return acc;
  }, {});

  const allInstanceGroups = useMemo<InstanceGroup[]>(() => {
    const groups = new Map<string, InstanceGroup>();
    importedInstances.forEach((instance) => {
      const key = getInstanceGroupKey(instance.name);
      groups.set(key, {
        key,
        name: instance.name,
        importedInfo: instance,
        items: [],
        lastActivity: 0,
      });
    });
    commercialTickets.forEach((ticket) => {
      if (!ticket.instancia.trim()) return;
      const key = getInstanceGroupKey(ticket.instancia);
      const currentGroup = groups.get(key) ?? {
        key,
        name: ticket.instancia,
        items: [],
        lastActivity: 0,
      };
      currentGroup.items.push({ kind: 'implantacao', ticket });
      currentGroup.lastActivity = Math.max(
        currentGroup.lastActivity,
        parseImportedTimestamp(ticket.updatedAt ?? ticket.createdAt),
      );
      groups.set(key, currentGroup);
    });
    tickets.forEach((ticket) => {
      if (!ticket.instance?.trim()) return;
      const key = getInstanceGroupKey(ticket.instance);
      const currentGroup = groups.get(key) ?? {
        key,
        name: ticket.instance,
        items: [],
        lastActivity: 0,
      };
      currentGroup.items.push({ kind: 'dev', ticket });
      currentGroup.lastActivity = Math.max(
        currentGroup.lastActivity,
        getLibrarySortTime(ticket),
      );
      groups.set(key, currentGroup);
    });
    return [...groups.values()].sort(
      (left, right) => right.lastActivity - left.lastActivity,
    );
  }, [commercialTickets, importedInstances, tickets]);

  const filteredInstanceGroups = useMemo(() => {
    if (!query.trim()) return allInstanceGroups;
    const normalizedQuery = normalizeSearchText(query);
    return allInstanceGroups.filter((group) =>
      normalizeSearchText(group.name).includes(normalizedQuery),
    );
  }, [allInstanceGroups, query]);

  const totalGroupedRecords = allInstanceGroups.reduce(
    (sum, group) => sum + group.items.length,
    0,
  );
  const formCriteria: DevCriteria = {
    imp: Number(formState.imp) || 0,
    ris: Number(formState.ris) || 0,
    fre: Number(formState.fre) || 0,
    esf: Number(formState.esf) || 0,
    deb: Number(formState.deb) || 0,
  };
  const formScore = calcScore(formCriteria);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(IMPORTED_INSTANCES_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setImportedInstances(
          parsed
            .map(normalizeImportedInstance)
            .filter((item): item is ImportedInstance => item !== null),
        );
      }
    } catch {
      setImportedInstances([]);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(
      IMPORTED_INSTANCES_STORAGE_KEY,
      JSON.stringify(importedInstances),
    );
  }, [importedInstances]);

  function updateFormField<Key extends keyof TicketFormState>(
    key: Key,
    value: TicketFormState[Key],
  ) {
    setFormState((current) => ({ ...current, [key]: value }));
  }
  async function handleImportInstances(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const parsed = await parseImportedInstancesFile(file);
      setImportedInstances(parsed);
    } finally {
      event.target.value = '';
    }
  }
  function toggleInstance(groupKey: string) {
    setExpandedInstances((current) => ({
      ...current,
      [groupKey]: !current[groupKey],
    }));
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
  function updateTicket(
    ticketId: number,
    updater: (ticket: DevTicket) => DevTicket,
  ) {
    setTickets((current) =>
      current.map((ticket) =>
        ticket.id === ticketId
          ? { ...updater(ticket), updatedAt: getNowTimestamp() }
          : ticket,
      ),
    );
  }
  function moveTicket(ticketId: number, nextStatus: DevStatus) {
    updateTicket(ticketId, (ticket) => ({
      ...ticket,
      devStatus: nextStatus,
      concludedAt:
        nextStatus === COMPLETED_STATUS ? getNowTimestamp() : undefined,
      history:
        ticket.devStatus === nextStatus
          ? ticket.history
          : appendHistory(
              ticket,
              `Status: ${ticket.devStatus} -> ${nextStatus}`,
            ),
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
    const ticket = tickets.find(
      (currentTicket) => currentTicket.id === ticketId,
    );
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
    if (!selectedDeadlineTicket || !deadlineDraft || !deadlineReason.trim())
      return;
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
    setTickets((current) =>
      current.filter((ticket) => ticket.id !== selectedTicket.id),
    );
    setSelectedTicketId(null);
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
                parentId: formState.parentId
                  ? Number(formState.parentId)
                  : undefined,
                clientName: formState.clientName.trim() || undefined,
                protoExt: formState.protoExt.trim() || undefined,
                instance: formState.instance.trim() || undefined,
                cnpj: formState.cnpj.trim() || undefined,
                clientPhone: formState.clientPhone.trim() || undefined,
                startDate: formState.startDate || undefined,
                deadline: formState.deadline || undefined,
                description: formState.description.trim(),
                concludedAt:
                  formState.devStatus === COMPLETED_STATUS
                    ? getNowTimestamp()
                    : undefined,
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
        concludedAt:
          formState.devStatus === COMPLETED_STATUS
            ? getNowTimestamp()
            : undefined,
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

  function handleCommercialToggleTask(ticketId: string, taskId: string) {
    const today = new Date().toISOString().slice(0, 10);
    setCommercialTickets((current) =>
      current.map((ticket) => {
        if (ticket.id !== ticketId) return ticket;
        const targetTask = ticket.tasks.find((task) => task.id === taskId);
        if (!targetTask) return ticket;
        const nextDone = !targetTask.done;
        return {
          ...ticket,
          tasks: ticket.tasks.map((task) =>
            task.id === taskId ? { ...task, done: nextDone } : task,
          ),
          updatedAt: today,
          history: [
            ...ticket.history,
            {
              id: `${ticket.id}-hist-task-${taskId}-${today}`,
              actor: getTechNameById(ticket.respTec),
              message: `Tarefa "${targetTask.title}" ${nextDone ? 'concluida' : 'reaberta'}.`,
              createdAt: today,
            },
          ],
        };
      }),
    );
  }
  function handleCommercialAddComment(ticketId: string, message: string) {
    const today = new Date().toISOString().slice(0, 10);
    const commentAuthor = currentUser?.name?.trim() || 'Usuário';
    setCommercialTickets((current) =>
      current.map((ticket) =>
        ticket.id === ticketId
          ? {
              ...ticket,
              updatedAt: today,
              comments: [
                ...ticket.comments,
                {
                  id: `${ticket.id}-comment-${today}-${ticket.comments.length + 1}`,
                  author: commentAuthor,
                  message,
                  createdAt: today,
                },
              ],
            }
          : ticket,
      ),
    );
  }
  function handleCommercialAddAttachments(ticketId: string, files: File[]) {
    setCommercialTickets((current) =>
      current.map((ticket) =>
        ticket.id === ticketId
          ? {
              ...ticket,
              attachments: [
                ...ticket.attachments,
                ...files.map((file, index) => ({
                  id: `${ticket.id}-attachment-${ticket.attachments.length + index + 1}`,
                  name: file.name,
                  subtitle: `${Math.max(1, Math.round(file.size / 1024))} KB`,
                })),
              ],
            }
          : ticket,
      ),
    );
  }
  function handleCommercialChangeTech(ticketId: string, techId: string) {
    const today = new Date().toISOString().slice(0, 10);
    setCommercialTickets((current) =>
      current.map((ticket) =>
        ticket.id === ticketId
          ? {
              ...ticket,
              respTec: techId,
              updatedAt: today,
              history: [
                ...ticket.history,
                {
                  id: `${ticket.id}-hist-tech-${today}`,
                  actor: ticket.respSolicitacao || getTechNameById(techId),
                  message: `Resp. técnico atribuído: ${getTechNameById(techId)}.`,
                  createdAt: today,
                },
              ],
            }
          : ticket,
      ),
    );
  }
  function handleCommercialChangeLabel(
    ticketId: string,
    label: ImplantacaoTicket['csStatus'],
  ) {
    const today = new Date().toISOString().slice(0, 10);
    setCommercialTickets((current) =>
      current.map((ticket) =>
        ticket.id === ticketId && ticket.csStatus !== label
          ? {
              ...ticket,
              csStatus: label,
              status: label === 'Concluído' ? 'done' : 'active',
              updatedAt: today,
              history: [
                ...ticket.history,
                {
                  id: `${ticket.id}-hist-label-${today}`,
                  actor:
                    ticket.respSolicitacao || getTechNameById(ticket.respTec),
                  message: `Etiqueta alterada para ${label}.`,
                  createdAt: today,
                },
              ],
            }
          : ticket,
      ),
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-[20px] font-extrabold tracking-[-0.4px] text-[#0f172a]">
            Biblioteca de Instâncias
          </h1>
          <p className="mt-0.5 text-[13px] text-[#64748b]">
            {allInstanceGroups.length} instância(s) · {totalGroupedRecords}{' '}
            registros totais
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-[8px] border border-[#e2e8f0] bg-white px-4 text-[13px] font-semibold text-[#0f172a] shadow-sm transition-colors hover:bg-[#f8fafc] focus:outline-none">
            <Upload className="size-4" />
            Importar Lista
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleImportInstances}
              className="hidden"
            />
          </label>
          {importedInstances.length ? (
            <span className="rounded-[6px] bg-[#ecfdf5] px-3 py-[6px] text-[11px] font-semibold text-[#059669]">
              {importedInstances.length} instâncias importadas
            </span>
          ) : null}
          {importedInstances.length ? (
            <button
              type="button"
              onClick={() => setImportedInstances([])}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-[8px] border border-[#fecaca] bg-white px-4 text-[13px] font-semibold text-[#dc2626] shadow-sm transition-colors hover:bg-[#fef2f2]"
            >
              <X className="size-4" /> Limpar
            </button>
          ) : null}
        </div>
      </div>

      <div className="mb-6 rounded-[10px] border border-[#e2e8f0] bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full max-w-[380px]">
            <Search className="absolute left-3 top-1/2 size-[14px] -translate-y-1/2 text-[#64748b]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nome de instância..."
              className="h-9 w-full rounded-[6px] border border-[#e2e8f0] bg-transparent pl-[34px] pr-3 text-[13px] text-[#0f172a] outline-none transition-colors focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]"
            />
          </div>
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="inline-flex h-9 items-center px-3 text-[13px] font-medium text-[#64748b] hover:text-[#0f172a]"
            >
              Limpar Busca
            </button>
          ) : null}
        </div>
      </div>

      {filteredInstanceGroups.length ? (
        <div className="flex flex-col gap-3">
          {filteredInstanceGroups.map((group) => {
            const isOpen = Boolean(expandedInstances[group.key]);
            const commercialItems = group.items.filter(
              (item): item is Extract<InstanceItem, { kind: 'implantacao' }> =>
                item.kind === 'implantacao',
            );
            const devItems = group.items.filter(
              (item): item is Extract<InstanceItem, { kind: 'dev' }> =>
                item.kind === 'dev',
            );
            const totalSetup = commercialItems.reduce(
              (sum, item) => sum + sumSetup(item.ticket),
              0,
            );
            const devOpen = devItems.filter(
              (item) => item.ticket.devStatus !== COMPLETED_STATUS,
            ).length;
            const devDone = devItems.length - devOpen;
            const commercialActive = commercialItems.filter(
              (item) => item.ticket.status === 'active',
            ).length;
            const commercialDone = commercialItems.filter(
              (item) => item.ticket.status === 'done',
            ).length;
            const sortedItems = [...group.items].sort((left, right) => {
              const leftTime =
                left.kind === 'dev'
                  ? getLibrarySortTime(left.ticket)
                  : parseImportedTimestamp(
                      left.ticket.updatedAt ?? left.ticket.createdAt,
                    );
              const rightTime =
                right.kind === 'dev'
                  ? getLibrarySortTime(right.ticket)
                  : parseImportedTimestamp(
                      right.ticket.updatedAt ?? right.ticket.createdAt,
                    );
              return rightTime - leftTime;
            });

            return (
              <div
                key={group.key}
                className="overflow-hidden rounded-[12px] border border-[#e2e8f0] bg-white shadow-sm transition-all hover:shadow-md"
              >
                <button
                  type="button"
                  onClick={() => toggleInstance(group.key)}
                  className="flex w-full items-center gap-[14px] px-4 py-3 text-left hover:bg-[#f8fafc]"
                >
                  <div className="flex size-[42px] shrink-0 items-center justify-center rounded-[10px] bg-[#eff6ff] text-[#2563eb] border border-[#bfdbfe]">
                    <Building2 className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 text-[14px] font-bold text-[#0f172a]">
                      {group.name}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-[#64748b]">
                      {commercialItems.length ? (
                        <span>
                          {commercialItems.length} comercial ({commercialActive}{' '}
                          ativo · {commercialDone} concluído)
                        </span>
                      ) : null}
                      {devItems.length ? (
                        <span>
                          {devItems.length} dev ({devOpen} aberto · {devDone}{' '}
                          concluído)
                        </span>
                      ) : null}
                      {!group.items.length && group.importedInfo?.cnpj ? (
                        <span>CNPJ: {group.importedInfo.cnpj}</span>
                      ) : null}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    {commercialItems.length ? (
                      <div className="text-[12px] text-[#64748b]">
                        Setup:{' '}
                        <strong className="text-[#0f172a]">
                          R$ {totalSetup.toLocaleString('pt-BR')}
                        </strong>
                      </div>
                    ) : null}
                  </div>
                  <span className="ml-2 text-[18px] text-[#94a3b8]">
                    {isOpen ? '⌄' : '›'}
                  </span>
                </button>

                {isOpen ? (
                  <div className="border-t border-[#e2e8f0] px-4 py-2 bg-[#f8fafc]">
                    {sortedItems.length ? (
                      sortedItems.map((item) => {
                        if (item.kind === 'dev') {
                          const ticket = item.ticket;
                          const responsible = usersById[ticket.resp];
                          return (
                            <button
                              key={`dev-${ticket.id}`}
                              type="button"
                              onClick={() => setSelectedTicketId(ticket.id)}
                              className="group flex w-full items-start gap-3 border-b border-[#e2e8f0] py-3 text-left last:border-b-0 hover:bg-white rounded-md px-2 -mx-2 transition-colors"
                            >
                              <div
                                className={cn(
                                  'mt-1 min-h-[36px] w-[3px] shrink-0 rounded-full',
                                  ticket.devStatus === COMPLETED_STATUS
                                    ? 'bg-[#16a34a]'
                                    : ticket.devType === 'Bug'
                                      ? 'bg-[#dc2626]'
                                      : 'bg-[#7c3aed]',
                                )}
                              />
                              <div className="min-w-0 flex-1">
                                <div className="mb-1 flex flex-wrap items-center gap-1.5">
                                  <span className="font-mono text-[11px] font-bold text-[#7c3aed]">
                                    {ticket.proto}
                                  </span>
                                  <Badge className="border-[#ddd6fe] bg-[#f5f3ff] text-[#7c3aed]">
                                    Dev
                                  </Badge>
                                  <Badge
                                    className={getTypeBadgeClass(
                                      ticket.devType,
                                    )}
                                  >
                                    {ticket.devType}
                                  </Badge>
                                  <Badge
                                    className={getStatusBadgeClass(
                                      ticket.devStatus,
                                    )}
                                  >
                                    {ticket.devStatus}
                                  </Badge>
                                </div>
                                <div className="mb-0.5 text-[13px] font-semibold text-[#0f172a] group-hover:text-[#2563eb]">
                                  {ticket.title}
                                </div>
                                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[#64748b]">
                                  <span>
                                    {formatLibraryDate(
                                      ticket.updatedAt ?? ticket.createdAt,
                                    )}
                                  </span>
                                  {responsible ? (
                                    <span>{responsible.name}</span>
                                  ) : null}
                                  {ticket.deadline ? (
                                    <span>
                                      Prazo: {formatDate(ticket.deadline)}
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                              <span className="shrink-0 pt-0.5 text-[13px] font-semibold text-[#7c3aed] opacity-0 group-hover:opacity-100 transition-opacity">
                                ver →
                              </span>
                            </button>
                          );
                        }
                        const ticket = item.ticket;
                        return (
                          <button
                            key={`implantacao-${ticket.id}`}
                            type="button"
                            onClick={() =>
                              setSelectedCommercialTicketId(ticket.id)
                            }
                            className="group flex w-full items-start gap-3 border-b border-[#e2e8f0] py-3 text-left last:border-b-0 hover:bg-white rounded-md px-2 -mx-2 transition-colors"
                          >
                            <div
                              className={cn(
                                'mt-1 min-h-[36px] w-[3px] shrink-0 rounded-full',
                                ticket.status === 'done'
                                  ? 'bg-[#16a34a]'
                                  : 'bg-[#2563eb]',
                              )}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="mb-1 flex flex-wrap items-center gap-1.5">
                                <span className="font-mono text-[11px] font-bold text-[#2563eb]">
                                  {ticket.proto}
                                </span>
                                <Badge className="border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]">
                                  Comercial
                                </Badge>
                                <Badge
                                  className={
                                    ticket.status === 'done'
                                      ? 'border-[#a7f3d0] bg-[#ecfdf5] text-[#059669]'
                                      : 'border-[#ddd6fe] bg-[#f5f3ff] text-[#7c3aed]'
                                  }
                                >
                                  {ticket.status === 'done'
                                    ? 'Concluído'
                                    : 'Em implantação'}
                                </Badge>
                              </div>
                              <div className="mb-0.5 text-[13px] font-semibold text-[#0f172a] group-hover:text-[#2563eb]">
                                {ticket.nome}
                              </div>
                              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[#64748b]">
                                <span>
                                  {formatDate(
                                    ticket.updatedAt ?? ticket.createdAt,
                                  )}
                                </span>
                                <span>{ticket.respSolicitacao}</span>
                                <span>{getTechNameById(ticket.respTec)}</span>
                              </div>
                            </div>
                            <span className="shrink-0 pt-0.5 text-[13px] font-semibold text-[#2563eb] opacity-0 group-hover:opacity-100 transition-opacity">
                              ver →
                            </span>
                          </button>
                        );
                      })
                    ) : (
                      <div className="py-4 text-[13px] text-[#64748b]">
                        Instância importada sem registros vinculados no momento.
                        {group.importedInfo?.cnpj
                          ? ` CNPJ: ${group.importedInfo.cnpj}`
                          : ''}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-[12px] border border-dashed border-[#cbd5e1] bg-white px-6 py-12 text-center shadow-sm">
          <div className="inline-flex size-14 items-center justify-center rounded-full bg-[#eff6ff] text-[#2563eb]">
            <Building2 className="size-7" />
          </div>
          <div className="mt-3 text-[15px] font-bold text-[#0f172a]">
            Nenhuma instância encontrada
          </div>
          <div className="mt-1 text-[13px] text-[#64748b]">
            {query
              ? 'Tente outro termo de busca.'
              : 'Crie tickets ou importe uma lista de instâncias.'}
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
        maxWidthClassName="max-w-[760px]"
        onClose={() => {
          setSelectedTicketId(null);
          setCommentDraft('');
        }}
        footer={
          selectedTicket ? (
            <div className="flex w-full items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTicketId(null)}
                  className="h-9 rounded-[8px] border border-[#e2e8f0] bg-white px-4 text-[13px] font-semibold text-[#64748b] hover:bg-[#f8fafc]"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={() => setTagPickerTicketId(selectedTicket.id)}
                  className="h-9 rounded-[8px] border border-[#e2e8f0] bg-white px-4 text-[13px] font-semibold text-[#0f172a] hover:bg-[#f8fafc]"
                >
                  Etiquetas
                </button>
                <button
                  type="button"
                  onClick={() => openDeadlineModal(selectedTicket.id)}
                  className="h-9 rounded-[8px] border border-[#e2e8f0] bg-white px-4 text-[13px] font-semibold text-[#0f172a] hover:bg-[#f8fafc]"
                >
                  Alterar Prazo
                </button>
                <button
                  type="button"
                  onClick={handleDeleteSelectedTicket}
                  className="h-9 rounded-[8px] border border-[#fecaca] bg-white px-4 text-[13px] font-semibold text-[#dc2626] hover:bg-[#fef2f2]"
                >
                  Excluir
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    openEditModal(selectedTicket);
                    setSelectedTicketId(null);
                  }}
                  className="h-9 rounded-[8px] border border-[#e2e8f0] bg-white px-4 text-[13px] font-semibold text-[#0f172a] hover:bg-[#f8fafc]"
                >
                  Editar
                </button>
                <select
                  value={selectedTicket.devStatus}
                  onChange={(event) =>
                    moveTicket(
                      selectedTicket.id,
                      event.target.value as DevStatus,
                    )
                  }
                  className="h-9 rounded-[6px] border border-[#e2e8f0] bg-white px-3 text-[13px] font-semibold text-[#0f172a] outline-none focus:border-[#2563eb]"
                >
                  {ALL_DEV_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                {selectedTicket.devStatus !== COMPLETED_STATUS ? (
                  <button
                    type="button"
                    onClick={handleConcludeSelectedTicket}
                    className="h-9 rounded-[8px] bg-[#10b981] px-4 text-[13px] font-semibold text-white hover:bg-[#059669]"
                  >
                    Concluir
                  </button>
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
                      className="inline-flex items-center rounded-full px-[9px] py-[3px] text-[11px] font-bold text-white"
                      style={{ backgroundColor: tagsById[tagId].color }}
                    >
                      {tagsById[tagId].name}
                    </span>
                  ) : null,
                )}
              </div>
            ) : null}

            <div className="rounded-[10px] border border-[#e2e8f0] bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-bold tracking-[.12em] text-[#64748b] uppercase">
                    Protocolo
                  </span>
                  <span className="font-mono text-[14px] font-extrabold tracking-[.04em] text-[#2563eb]">
                    {selectedTicket.proto}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      navigator.clipboard?.writeText(selectedTicket.proto)
                    }
                    className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] text-[#64748b] hover:bg-[#f1f5f9]"
                  >
                    <Copy className="size-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge className={getTypeBadgeClass(selectedTicket.devType)}>
                    {selectedTicket.devType}
                  </Badge>
                  <Badge
                    className={getPriority(selectedTicket.score).badgeClassName}
                  >
                    {getPriority(selectedTicket.score).label}
                  </Badge>
                  <Badge
                    className={getStatusBadgeClass(selectedTicket.devStatus)}
                  >
                    {selectedTicket.devStatus}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid gap-[9px] md:grid-cols-2">
              <div className="rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] p-3">
                <FormLabel>Score</FormLabel>
                <div
                  className={cn(
                    'text-[16px] font-extrabold',
                    getPriority(selectedTicket.score).scoreClassName,
                  )}
                >
                  {selectedTicket.score}
                  <span className="ml-1 text-[11px] font-normal text-[#64748b]">
                    /15
                  </span>
                </div>
              </div>
              <div className="rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] p-3">
                <FormLabel>Categoria</FormLabel>
                <div className="text-[13px] font-semibold text-[#0f172a]">
                  {selectedTicket.category}
                </div>
              </div>
              <div className="rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] p-3">
                <FormLabel>Responsável</FormLabel>
                <div className="text-[13px] font-semibold text-[#0f172a]">
                  {usersById[selectedTicket.resp]?.name ?? '-'}
                </div>
              </div>
              <div className="rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] p-3">
                <FormLabel>Início / Entrega</FormLabel>
                <div className="text-[13px] font-semibold text-[#0f172a]">
                  {formatDate(selectedTicket.startDate)} →{' '}
                  {formatDate(selectedTicket.deadline)}
                </div>
              </div>
              <div className="rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] p-3">
                <FormLabel>Cliente</FormLabel>
                <div className="text-[13px] font-semibold text-[#0f172a]">
                  {selectedTicket.clientName || '-'}
                </div>
              </div>
              {selectedTicket.protoExt && (
                <div className="rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] p-3">
                  <FormLabel>Ext.</FormLabel>
                  <div className="font-mono text-[13px] font-semibold text-[#92400e]">
                    {selectedTicket.protoExt}
                  </div>
                </div>
              )}
              {selectedTicket.instance && (
                <div className="rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] p-3">
                  <FormLabel>Instância</FormLabel>
                  <div className="text-[13px] font-semibold text-[#0f172a]">
                    {selectedTicket.instance}
                  </div>
                </div>
              )}
              {selectedTicket.sprintId && (
                <div className="rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] p-3">
                  <FormLabel>Sprint</FormLabel>
                  <div className="text-[13px] font-semibold text-[#0f172a]">
                    {sprintsById[selectedTicket.sprintId]?.name ?? '-'}
                  </div>
                </div>
              )}
            </div>

            {selectedTicket.parentId && epicMap[selectedTicket.parentId] ? (
              <div className="rounded-[8px] border border-[#ddd6fe] bg-[#f5f3ff] p-3">
                <FormLabel>Epic vinculada</FormLabel>
                <div className="text-[13px] font-semibold text-[#5b21b6]">
                  {epicMap[selectedTicket.parentId]}
                </div>
              </div>
            ) : null}

            <div className="rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] p-3">
              <FormLabel>Descrição</FormLabel>
              <p className="whitespace-pre-wrap text-[13px] leading-6 text-[#475569]">
                {selectedTicket.description || 'Sem descrição informada.'}
              </p>
            </div>

            <div className="rounded-[10px] border border-[#e2e8f0] bg-white p-4 shadow-sm">
              <div className="mb-3 inline-flex items-center gap-2 text-[12px] font-bold text-[#0f172a]">
                <MessageSquareText className="size-4" /> Comentários
              </div>
              {selectedTicket.comments.length ? (
                <div className="space-y-3 mb-4">
                  {selectedTicket.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="rounded-[8px] border border-[#f1f5f9] bg-[#f8fafc] p-3"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[13px] font-semibold text-[#0f172a]">
                          {comment.author}
                        </span>
                        <span className="text-[11px] text-[#64748b]">
                          {comment.createdAt}
                        </span>
                      </div>
                      <div className="whitespace-pre-wrap text-[13px] leading-6 text-[#475569]">
                        {comment.message}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mb-4 rounded-[8px] border border-dashed border-[#cbd5e1] py-6 text-center text-[13px] text-[#64748b]">
                  Nenhum comentário registrado.
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  value={commentDraft}
                  onChange={(e) => setCommentDraft(e.target.value)}
                  placeholder="Adicione um comentário..."
                  className="h-9 flex-1 rounded-[6px] border border-[#e2e8f0] bg-[#f8fafc] px-3 text-[13px] outline-none focus:border-[#2563eb] focus:bg-white"
                />
                <button
                  type="button"
                  onClick={handleAddComment}
                  className="h-9 rounded-[8px] bg-[#2563eb] px-4 text-[13px] font-semibold text-white hover:bg-[#1d4ed8]"
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
        maxWidthClassName="max-w-[420px]"
        onClose={() => setTagPickerTicketId(null)}
        footer={
          <button
            type="button"
            onClick={() => setTagPickerTicketId(null)}
            className="h-9 rounded-[8px] border border-[#e2e8f0] bg-white px-4 text-[13px] font-semibold text-[#64748b] hover:bg-[#f8fafc]"
          >
            Fechar
          </button>
        }
      >
        {selectedTagTicket ? (
          <div className="grid gap-2">
            {DEV_TAGS.map((tag) => {
              const active = selectedTagTicket.tags.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(selectedTagTicket.id, tag.id)}
                  className={cn(
                    'flex items-center justify-between rounded-[8px] border p-3 transition-colors',
                    active
                      ? 'border-[#2563eb] bg-[#eff6ff]'
                      : 'border-[#e2e8f0] bg-white hover:border-[#bfdbfe]',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="size-3 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="text-[13px] font-semibold text-[#0f172a]">
                      {tag.name}
                    </span>
                  </div>
                  {active && (
                    <span className="text-[12px] font-semibold text-[#2563eb]">
                      Selecionada
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ) : null}
      </ModalShell>

      <ModalShell
        open={Boolean(selectedDeadlineTicket)}
        title="Alterar Prazo"
        maxWidthClassName="max-w-[480px]"
        onClose={closeDeadlineModal}
        footer={
          <div className="flex w-full justify-end gap-2">
            <button
              type="button"
              onClick={closeDeadlineModal}
              className="h-9 rounded-[8px] border border-[#e2e8f0] bg-white px-4 text-[13px] font-semibold text-[#64748b] hover:bg-[#f8fafc]"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveDeadline}
              className="h-9 rounded-[8px] bg-[#2563eb] px-4 text-[13px] font-semibold text-white hover:bg-[#1d4ed8]"
            >
              Salvar
            </button>
          </div>
        }
      >
        <div className="grid gap-4">
          <div>
            <FormLabel>Nova entrega</FormLabel>
            <input
              type="date"
              value={deadlineDraft}
              onChange={(e) => setDeadlineDraft(e.target.value)}
              className="h-9 w-full rounded-[6px] border border-[#e2e8f0] bg-[#f8fafc] px-3 text-[13px] outline-none focus:border-[#2563eb] focus:bg-white"
            />
          </div>
          <div>
            <FormLabel>Motivo</FormLabel>
            <textarea
              value={deadlineReason}
              onChange={(e) => setDeadlineReason(e.target.value)}
              className="min-h-[100px] w-full resize-y rounded-[6px] border border-[#e2e8f0] bg-[#f8fafc] p-3 text-[13px] outline-none focus:border-[#2563eb] focus:bg-white"
            />
          </div>
        </div>
      </ModalShell>

      <ModalShell
        open={Boolean(formMode)}
        title={formMode === 'edit' ? 'Editar Task' : 'Nova Task'}
        maxWidthClassName="max-w-[800px]"
        onClose={closeFormModal}
        footer={
          <div className="flex w-full justify-end gap-2">
            <button
              type="button"
              onClick={closeFormModal}
              className="h-9 rounded-[8px] border border-[#e2e8f0] bg-white px-4 text-[13px] font-semibold text-[#64748b] hover:bg-[#f8fafc]"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveTicket}
              className="h-9 rounded-[8px] bg-[#2563eb] px-4 text-[13px] font-semibold text-white hover:bg-[#1d4ed8]"
            >
              Salvar
            </button>
          </div>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <FormLabel>Título</FormLabel>
            <input
              value={formState.title}
              onChange={(e) => updateFormField('title', e.target.value)}
              className="h-9 w-full rounded-[6px] border border-[#e2e8f0] bg-[#f8fafc] px-3 text-[13px] outline-none focus:border-[#2563eb] focus:bg-white"
            />
          </div>
          <div>
            <FormLabel>Categoria</FormLabel>
            <select
              value={formState.category}
              onChange={(e) => updateFormField('category', e.target.value)}
              className="h-9 w-full rounded-[6px] border border-[#e2e8f0] bg-[#f8fafc] px-3 text-[13px] outline-none focus:border-[#2563eb] focus:bg-white"
            >
              {DEV_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <FormLabel>Tipo</FormLabel>
            <select
              value={formState.devType}
              onChange={(e) =>
                updateFormField('devType', e.target.value as DevType)
              }
              className="h-9 w-full rounded-[6px] border border-[#e2e8f0] bg-[#f8fafc] px-3 text-[13px] outline-none focus:border-[#2563eb] focus:bg-white"
            >
              {['Epic', 'Feature', 'Task', 'Bug'].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <FormLabel>Status</FormLabel>
            <select
              value={formState.devStatus}
              onChange={(e) =>
                updateFormField('devStatus', e.target.value as DevStatus)
              }
              className="h-9 w-full rounded-[6px] border border-[#e2e8f0] bg-[#f8fafc] px-3 text-[13px] outline-none focus:border-[#2563eb] focus:bg-white"
            >
              {ALL_DEV_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <FormLabel>Responsável</FormLabel>
            <select
              value={formState.resp}
              onChange={(e) => updateFormField('resp', e.target.value)}
              className="h-9 w-full rounded-[6px] border border-[#e2e8f0] bg-[#f8fafc] px-3 text-[13px] outline-none focus:border-[#2563eb] focus:bg-white"
            >
              {DEV_USERS.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <FormLabel>Sprint</FormLabel>
            <select
              value={formState.sprintId}
              onChange={(e) => updateFormField('sprintId', e.target.value)}
              className="h-9 w-full rounded-[6px] border border-[#e2e8f0] bg-[#f8fafc] px-3 text-[13px] outline-none focus:border-[#2563eb] focus:bg-white"
            >
              <option value="">Sem sprint</option>
              {DEV_SPRINTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <FormLabel>Instância</FormLabel>
            <input
              value={formState.instance}
              onChange={(e) => updateFormField('instance', e.target.value)}
              className="h-9 w-full rounded-[6px] border border-[#e2e8f0] bg-[#f8fafc] px-3 text-[13px] outline-none focus:border-[#2563eb] focus:bg-white"
            />
          </div>
          <div>
            <FormLabel>Data Início</FormLabel>
            <input
              type="date"
              value={formState.startDate}
              onChange={(e) => updateFormField('startDate', e.target.value)}
              className="h-9 w-full rounded-[6px] border border-[#e2e8f0] bg-[#f8fafc] px-3 text-[13px] outline-none focus:border-[#2563eb] focus:bg-white"
            />
          </div>
          <div>
            <FormLabel>Data Entrega</FormLabel>
            <input
              type="date"
              value={formState.deadline}
              onChange={(e) => updateFormField('deadline', e.target.value)}
              className="h-9 w-full rounded-[6px] border border-[#e2e8f0] bg-[#f8fafc] px-3 text-[13px] outline-none focus:border-[#2563eb] focus:bg-white"
            />
          </div>

          <div className="md:col-span-2 rounded-[10px] border border-[#d7dfeb] bg-[#f8fafc] p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-[12px] font-bold text-[#0f172a]">
                Critérios
              </div>
              <div className="rounded-[6px] bg-[#eff6ff] border border-[#bfdbfe] px-3 py-1 text-[14px] font-extrabold text-[#2563eb]">
                {formScore}/15
              </div>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {[
                ['imp', 'Imp.', formState.imp],
                ['ris', 'Risco', formState.ris],
                ['fre', 'Freq.', formState.fre],
                ['esf', 'Esf.', formState.esf],
                ['deb', 'Déb.', formState.deb],
              ].map(([key, label, value]) => (
                <div key={key}>
                  <FormLabel>{label}</FormLabel>
                  <input
                    type="number"
                    min="0"
                    max="3"
                    value={value}
                    onChange={(e) =>
                      updateFormField(
                        key as keyof TicketFormState,
                        e.target.value,
                      )
                    }
                    className="h-9 w-full rounded-[6px] border border-[#e2e8f0] bg-white px-2 text-center text-[13px] outline-none focus:border-[#2563eb]"
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="md:col-span-2">
            <FormLabel>Descrição</FormLabel>
            <textarea
              value={formState.description}
              onChange={(e) => updateFormField('description', e.target.value)}
              className="min-h-[100px] w-full resize-y rounded-[6px] border border-[#e2e8f0] bg-[#f8fafc] p-3 text-[13px] outline-none focus:border-[#2563eb] focus:bg-white"
            />
          </div>
        </div>
      </ModalShell>

      <ImplantacaoTicketModal
        open={Boolean(selectedCommercialTicket)}
        ticket={selectedCommercialTicket}
        onClose={() => setSelectedCommercialTicketId(null)}
        onToggleTask={handleCommercialToggleTask}
        onAddComment={handleCommercialAddComment}
        onAddAttachments={handleCommercialAddAttachments}
        onChangeTech={handleCommercialChangeTech}
        onChangeLabel={handleCommercialChangeLabel}
      />
    </div>
  );
}
