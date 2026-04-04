'use client';

import Link from 'next/link';
import { useState } from 'react';

import {
  DEV_USERS,
  INITIAL_DEV_TICKETS,
  type DevTicket,
  type DevType,
} from '@/components/dev-kanban-data';
import { cn } from '@/lib/utils';

type SprintRecord = {
  id: string;
  name: string;
  goal?: string;
  start: string;
  end: string;
  closed: boolean;
  createdAt: string;
  closedAt?: string;
};

type SprintFormState = {
  name: string;
  goal: string;
  start: string;
  end: string;
};

const INITIAL_SPRINTS: SprintRecord[] = [
  {
    id: 'sp-27',
    name: 'Sprint 27',
    goal: 'Padronizar os componentes do fluxo de desenvolvimento.',
    start: '2026-03-22',
    end: '2026-03-31',
    closed: true,
    createdAt: '2026-03-20',
    closedAt: '2026-03-31',
  },
  {
    id: 'sp-28',
    name: 'Sprint 28',
    goal: 'Entregar ajustes de Habilis, performance e modal de task.',
    start: '2026-04-01',
    end: '2026-04-08',
    closed: false,
    createdAt: '2026-03-31',
  },
  {
    id: 'sp-29',
    name: 'Sprint 29',
    goal: 'Preparar a timeline compartilhada entre CRM e desenvolvimento.',
    start: '2026-04-09',
    end: '2026-04-16',
    closed: false,
    createdAt: '2026-04-02',
  },
];

const EMPTY_FORM: SprintFormState = {
  name: '',
  goal: '',
  start: '',
  end: '',
};

let nextSprintSequence = 30;

function buildSprintId() {
  const id = `sp-${nextSprintSequence}`;
  nextSprintSequence += 1;
  return id;
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value: string | undefined) {
  if (!value) return '--';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

function getPriority(score: number) {
  if (score >= 12) {
    return {
      label: 'CRITICO',
      badgeClassName: 'border-[#fecaca] bg-[#fef2f2] text-[#dc2626]',
    };
  }

  if (score >= 9) {
    return {
      label: 'ALTO',
      badgeClassName: 'border-[#fde68a] bg-[#fffbeb] text-[#d97706]',
    };
  }

  if (score >= 6) {
    return {
      label: 'MEDIO',
      badgeClassName: 'border-[#fde68a] bg-[#fefce8] text-[#854d0e]',
    };
  }

  return {
    label: 'BAIXO',
    badgeClassName: 'border-[#a7f3d0] bg-[#ecfdf5] text-[#059669]',
  };
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

function CenteredModal({
  open,
  title,
  maxWidthClassName = 'max-w-[480px]',
  description,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  maxWidthClassName?: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,.52)] px-4 py-8">
      <div
        className={cn(
          'flex max-h-[calc(100vh-32px)] w-full flex-col overflow-hidden rounded-[16px] border border-[#d7dfeb] bg-white shadow-[0_30px_90px_rgba(15,23,42,.22)]',
          maxWidthClassName,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#e2e8f0] px-5 py-4">
          <div>
            <div className="text-[18px] font-extrabold text-[#0f172a]">{title}</div>
            {description ? (
              <div className="mt-1 text-[12px] text-[#64748b]">{description}</div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-9 items-center justify-center rounded-[8px] border border-[#e2e8f0] text-[20px] leading-none text-[#64748b] transition-colors hover:bg-[#f8fafc] hover:text-[#0f172a]"
          >
            ×
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer ? (
          <div className="flex flex-wrap justify-end gap-2 border-t border-[#e2e8f0] px-5 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ActionButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        'rounded-[8px] border px-3 py-[7px] text-[12px] font-semibold transition-colors',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[11px] font-bold tracking-[.06em] text-[#64748b] uppercase">
      {children}
    </label>
  );
}

export function DevSprintsPage() {
  const [tickets, setTickets] = useState<DevTicket[]>(() =>
    INITIAL_DEV_TICKETS.map((ticket) => ({ ...ticket })),
  );
  const [sprints, setSprints] = useState<SprintRecord[]>(() =>
    INITIAL_SPRINTS.map((sprint) => ({ ...sprint })),
  );
  const [showClosed, setShowClosed] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
  const [editingSprintId, setEditingSprintId] = useState<string | null>(null);
  const [formState, setFormState] = useState<SprintFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [addTasksSprintId, setAddTasksSprintId] = useState<string | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>([]);
  const [addTasksError, setAddTasksError] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);

  const usersById = DEV_USERS.reduce<Record<string, (typeof DEV_USERS)[number]>>((acc, user) => {
    acc[user.id] = user;
    return acc;
  }, {});

  const epicMap = tickets.reduce<Record<number, string>>((acc, ticket) => {
    if (ticket.devType === 'Epic') {
      acc[ticket.id] = ticket.title;
    }
    return acc;
  }, {});

  const openSprints = sprints.filter((sprint) => !sprint.closed);
  const closedSprints = sprints.filter((sprint) => sprint.closed);
  const selectedSprintForTasks =
    sprints.find((sprint) => sprint.id === addTasksSprintId) ?? null;
  const selectedTicket = tickets.find((ticket) => ticket.id === selectedTicketId) ?? null;

  function updateFormField<Key extends keyof SprintFormState>(
    key: Key,
    value: SprintFormState[Key],
  ) {
    setFormState((current) => ({ ...current, [key]: value }));
  }

  function openSprintModal(sprintId: string | null) {
    const sprint = sprintId ? sprints.find((current) => current.id === sprintId) : null;

    setEditingSprintId(sprintId);
    setFormMode(sprintId ? 'edit' : 'create');
    setFormError('');
    setFormState(
      sprint
        ? {
            name: sprint.name,
            goal: sprint.goal ?? '',
            start: sprint.start,
            end: sprint.end,
          }
        : EMPTY_FORM,
    );
  }

  function closeSprintModal() {
    setFormMode(null);
    setEditingSprintId(null);
    setFormError('');
    setFormState(EMPTY_FORM);
  }

  function saveSprint() {
    if (!formState.name.trim() || !formState.start || !formState.end) {
      setFormError('Preencha nome, inicio e fim.');
      return;
    }

    if (formState.end < formState.start) {
      setFormError('A data final precisa ser maior ou igual a data inicial.');
      return;
    }

    if (formMode === 'edit' && editingSprintId) {
      setSprints((current) =>
        current.map((sprint) =>
          sprint.id === editingSprintId
            ? {
                ...sprint,
                name: formState.name.trim(),
                goal: formState.goal.trim() || undefined,
                start: formState.start,
                end: formState.end,
              }
            : sprint,
        ),
      );
    } else {
      setSprints((current) => [
        ...current,
        {
          id: buildSprintId(),
          name: formState.name.trim(),
          goal: formState.goal.trim() || undefined,
          start: formState.start,
          end: formState.end,
          closed: false,
          createdAt: getTodayDate(),
        },
      ]);
    }

    closeSprintModal();
  }

  function closeSprint(sprintId: string) {
    if (!window.confirm('Fechar sprint e mover pendencias para o Backlog?')) return;

    setSprints((current) =>
      current.map((sprint) =>
        sprint.id === sprintId
          ? {
              ...sprint,
              closed: true,
              closedAt: getTodayDate(),
            }
          : sprint,
      ),
    );

    setTickets((current) =>
      current.map((ticket) =>
        ticket.sprintId === sprintId && ticket.devStatus !== 'Concluído'
          ? { ...ticket, devStatus: 'Backlog' }
          : ticket,
      ),
    );
  }

  function openAddTasksModal(sprintId: string) {
    setAddTasksSprintId(sprintId);
    setSelectedTaskIds([]);
    setAddTasksError('');
  }

  function closeAddTasksModal() {
    setAddTasksSprintId(null);
    setSelectedTaskIds([]);
    setAddTasksError('');
  }

  function toggleTaskSelection(ticketId: number) {
    setSelectedTaskIds((current) =>
      current.includes(ticketId)
        ? current.filter((id) => id !== ticketId)
        : [...current, ticketId],
    );
  }

  function saveAddToSprint() {
    if (!addTasksSprintId) return;

    if (!selectedTaskIds.length) {
      setAddTasksError('Selecione ao menos um ticket.');
      return;
    }

    setTickets((current) =>
      current.map((ticket) =>
        selectedTaskIds.includes(ticket.id) ? { ...ticket, sprintId: addTasksSprintId } : ticket,
      ),
    );

    closeAddTasksModal();
  }

  function removeFromSprint(ticketId: number) {
    setTickets((current) =>
      current.map((ticket) =>
        ticket.id === ticketId ? { ...ticket, sprintId: undefined } : ticket,
      ),
    );
  }

  const availableTickets = selectedSprintForTasks
    ? tickets.filter(
        (ticket) =>
          ticket.devStatus !== 'Concluído' && ticket.sprintId !== selectedSprintForTasks.id,
      )
    : [];

  return (
    <>
      <div className="-mx-4 -my-6 md:-mx-6 lg:-mx-8 lg:-my-8">
        <div className="min-h-screen bg-[#f8fafc]">
          <div className="sticky top-0 z-10 border-b border-[#e2e8f0] bg-white/95 backdrop-blur">
            <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div>
                <div className="text-[24px] font-extrabold tracking-[-0.03em] text-[#0f172a]">
                  Sprints
                </div>
                <div className="mt-1 text-[13px] text-[#64748b]">
                  {openSprints.length} aberta{openSprints.length !== 1 ? 's' : ''} ·{' '}
                  {closedSprints.length} fechada{closedSprints.length !== 1 ? 's' : ''}
                </div>
              </div>

              <ActionButton
                onClick={() => openSprintModal(null)}
                className="border-[#dbeafe] bg-[#eff6ff] text-[#2563eb] hover:border-[#93c5fd] hover:bg-[#dbeafe]"
              >
                + Nova Sprint
              </ActionButton>
            </div>
          </div>

          <div className="mx-auto max-w-[1180px] px-4 py-6 sm:px-6 lg:px-8">
            {openSprints.length === 0 ? (
              <div className="rounded-[14px] border border-dashed border-[#cbd5e1] bg-white px-6 py-12 text-center shadow-[0_12px_32px_rgba(15,23,42,.05)]">
                <div className="text-[42px]">🏁</div>
                <div className="mt-3 text-[18px] font-bold text-[#0f172a]">
                  Nenhuma sprint aberta
                </div>
                <div className="mt-2 text-[13px] text-[#64748b]">
                  Clique em &quot;+ Nova Sprint&quot; para criar.
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-[14px]">
                {openSprints.map((sprint) => {
                  const sprintTickets = tickets.filter((ticket) => ticket.sprintId === sprint.id);
                  const doneCount = sprintTickets.filter(
                    (ticket) => ticket.devStatus === 'Concluído',
                  ).length;
                  const totalCount = sprintTickets.length;
                  const progress = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;
                  const progressColor =
                    progress >= 80 ? '#059669' : progress >= 50 ? '#d97706' : '#2563eb';
                  const bugCount = sprintTickets.filter((ticket) => ticket.devType === 'Bug').length;
                  const epicCount = sprintTickets.filter(
                    (ticket) => ticket.devType === 'Epic',
                  ).length;
                  const byStatus = sprintTickets.reduce<Record<string, number>>((acc, ticket) => {
                    acc[ticket.devStatus] = (acc[ticket.devStatus] ?? 0) + 1;
                    return acc;
                  }, {});

                  return (
                    <div
                      key={sprint.id}
                      className="rounded-[10px] border border-[rgba(37,99,235,.25)] border-t-[4px] border-t-[#2563eb] bg-white px-[18px] py-4 shadow-[0_8px_20px_rgba(15,23,42,.04)]"
                    >
                      <div className="mb-[10px] flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-[14px] font-extrabold text-[#0f172a]">
                            {sprint.name || 'Sprint sem nome'}
                          </div>
                          <div className="mt-[2px] text-[11px] text-[#64748b]">
                            Início: {formatDate(sprint.start)} · Fim: {formatDate(sprint.end)}
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-wrap items-center gap-[6px]">
                          <span className="rounded-full bg-[#dbeafe] px-[10px] py-[3px] text-[11px] font-bold text-[#2563eb]">
                            Aberta
                          </span>
                          <ActionButton
                            onClick={() => openAddTasksModal(sprint.id)}
                            className="border-[#dbeafe] bg-[#eff6ff] text-[#2563eb] hover:bg-[#dbeafe]"
                          >
                            + Add Tasks
                          </ActionButton>
                          <ActionButton
                            onClick={() => openSprintModal(sprint.id)}
                            className="border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f8fafc]"
                          >
                            Editar
                          </ActionButton>
                          <ActionButton
                            onClick={() => closeSprint(sprint.id)}
                            className="border-[#fecaca] bg-[#fef2f2] text-[#dc2626] hover:bg-[#fee2e2]"
                          >
                            Fechar Sprint
                          </ActionButton>
                        </div>
                      </div>

                      <div className="mb-[10px] flex items-center gap-[10px]">
                        <div className="h-[10px] flex-1 overflow-hidden rounded-full bg-[#e2e8f0]">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${progress}%`, backgroundColor: progressColor }}
                          />
                        </div>
                        <span
                          className="text-[13px] font-extrabold whitespace-nowrap"
                          style={{ color: progressColor }}
                        >
                          {doneCount}/{totalCount} ({progress}%)
                        </span>
                      </div>

                      <div className="mb-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-[#f1f5f9] px-[9px] py-[2px] text-[11px] font-bold text-[#0f172a]">
                          {totalCount} tarefa{totalCount !== 1 ? 's' : ''}
                        </span>
                        {bugCount > 0 ? (
                          <span className="rounded-full bg-[#fef2f2] px-[9px] py-[2px] text-[11px] font-bold text-[#dc2626]">
                            {bugCount} bug{bugCount !== 1 ? 's' : ''}
                          </span>
                        ) : null}
                        {epicCount > 0 ? (
                          <span className="rounded-full bg-[#f5f3ff] px-[9px] py-[2px] text-[11px] font-bold text-[#7c3aed]">
                            {epicCount} epic{epicCount !== 1 ? 's' : ''}
                          </span>
                        ) : null}
                      </div>

                      {totalCount > 0 ? (
                        <div className="flex flex-col gap-[5px]">
                          {Object.entries(byStatus)
                            .sort((a, b) => b[1] - a[1])
                            .map(([status, count]) => {
                              const width = Math.round((count / totalCount) * 100);
                              const isDone = status === 'Concluído';

                              return (
                                <div key={status}>
                                  <div className="mb-[2px] flex items-center justify-between text-[11px]">
                                    <span className="text-[#64748b]">{status}</span>
                                    <span
                                      className="font-bold"
                                      style={{ color: isDone ? '#059669' : '#64748b' }}
                                    >
                                      {count}
                                    </span>
                                  </div>
                                  <div className="h-[5px] overflow-hidden rounded-full bg-[#e2e8f0]">
                                    <div
                                      className="h-full rounded-full"
                                      style={{
                                        width: `${width}%`,
                                        backgroundColor: isDone ? '#059669' : '#2563eb',
                                        opacity: 0.7,
                                      }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      ) : null}

                      {totalCount > 0 ? (
                        <div className="mt-3 border-t border-[#e2e8f0] pt-[10px]">
                          {sprintTickets.slice(0, 50).map((ticket) => {
                            const responsible = usersById[ticket.resp];
                            const priority = getPriority(ticket.score);
                            const isDone = ticket.devStatus === 'Concluído';

                            return (
                              <div
                                key={ticket.id}
                                role="button"
                                tabIndex={0}
                                onClick={() => setSelectedTicketId(ticket.id)}
                                onKeyDown={(event) => {
                                  if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault();
                                    setSelectedTicketId(ticket.id);
                                  }
                                }}
                                className="mb-[5px] flex cursor-pointer items-center gap-2 rounded-[7px] bg-[#f8fafc] px-[10px] py-[7px] transition-colors hover:bg-[#eff6ff]"
                              >
                                <Badge className={getTypeBadgeClass(ticket.devType)}>
                                  {ticket.devType}
                                </Badge>
                                <div className="min-w-0 flex-1">
                                  <div
                                    className={cn(
                                      'truncate text-[12px] font-semibold',
                                      isDone ? 'text-[#94a3b8] line-through' : 'text-[#0f172a]',
                                    )}
                                  >
                                    {ticket.title}
                                  </div>
                                  {ticket.parentId && epicMap[ticket.parentId] ? (
                                    <div className="mt-[2px] text-[10px] text-[#7c3aed]">
                                      {epicMap[ticket.parentId]}
                                    </div>
                                  ) : null}
                                </div>
                                {responsible ? (
                                  <span className="rounded-full border border-[#e2e8f0] bg-white px-[7px] py-[2px] text-[10px] font-semibold text-[#64748b]">
                                    {responsible.name}
                                  </span>
                                ) : null}
                                {ticket.deadline ? (
                                  <span
                                    className="text-[10px]"
                                    style={{
                                      color:
                                        ticket.deadline < getTodayDate() && !isDone
                                          ? '#dc2626'
                                          : '#64748b',
                                    }}
                                  >
                                    {formatDate(ticket.deadline)}
                                  </span>
                                ) : null}
                                <Badge className={priority.badgeClassName}>
                                  {priority.label}
                                </Badge>
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    removeFromSprint(ticket.id);
                                  }}
                                  className="rounded-[6px] border border-[#e2e8f0] px-2 py-[5px] text-[10px] font-semibold text-[#64748b] transition-colors hover:border-[#cbd5e1] hover:bg-white"
                                >
                                  Remover
                                </button>
                              </div>
                            );
                          })}

                          {sprintTickets.length > 50 ? (
                            <div className="pt-2 text-center text-[12px] text-[#64748b]">
                              +{sprintTickets.length - 50} tarefas
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <div className="pt-3 text-center text-[12px] text-[#64748b]">
                          Nenhuma task adicionada a esta sprint.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {closedSprints.length > 0 ? (
              <div className="mt-5">
                <button
                  type="button"
                  onClick={() => setShowClosed((current) => !current)}
                  className="rounded-[8px] border border-[#e2e8f0] bg-white px-[14px] py-[7px] text-[12px] font-semibold text-[#64748b] transition-colors hover:bg-[#f8fafc]"
                >
                  {showClosed ? 'Ocultar' : 'Ver'} sprints fechadas ({closedSprints.length})
                </button>

                {showClosed ? (
                  <div className="mt-3 flex flex-col gap-3 opacity-75">
                    {closedSprints.map((sprint) => {
                      const sprintTickets = tickets.filter((ticket) => ticket.sprintId === sprint.id);
                      const doneCount = sprintTickets.filter(
                        (ticket) => ticket.devStatus === 'Concluído',
                      ).length;
                      const totalCount = sprintTickets.length;
                      const progress = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;

                      return (
                        <div
                          key={sprint.id}
                          className="rounded-[10px] border border-[#e2e8f0] border-t-[4px] border-t-[#cbd5e1] bg-white px-[18px] py-4 shadow-[0_8px_20px_rgba(15,23,42,.03)]"
                        >
                          <div className="mb-[10px] flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="truncate text-[14px] font-extrabold text-[#0f172a]">
                                {sprint.name}
                              </div>
                              <div className="mt-[2px] text-[11px] text-[#64748b]">
                                Início: {formatDate(sprint.start)} · Fim: {formatDate(sprint.end)}
                              </div>
                            </div>

                            <span className="rounded-full bg-[#f1f5f9] px-[10px] py-[3px] text-[11px] font-bold text-[#64748b]">
                              Fechada
                            </span>
                          </div>

                          <div className="mb-[10px] flex items-center gap-[10px]">
                            <div className="h-[10px] flex-1 overflow-hidden rounded-full bg-[#e2e8f0]">
                              <div
                                className="h-full rounded-full bg-[#94a3b8]"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-[13px] font-extrabold text-[#64748b]">
                              {doneCount}/{totalCount} ({progress}%)
                            </span>
                          </div>

                          <div className="text-[12px] text-[#64748b]">
                            {totalCount} tarefa{totalCount !== 1 ? 's' : ''} vinculada
                            {totalCount !== 1 ? 's' : ''}{' '}
                            {sprint.closedAt ? `· fechada em ${formatDate(sprint.closedAt)}` : ''}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <CenteredModal
        open={Boolean(formMode)}
        title={formMode === 'edit' ? 'Editar Sprint' : 'Nova Sprint'}
        maxWidthClassName="max-w-[480px]"
        onClose={closeSprintModal}
        footer={
          <>
            <ActionButton
              onClick={closeSprintModal}
              className="border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f8fafc]"
            >
              Cancelar
            </ActionButton>
            <ActionButton
              onClick={saveSprint}
              className="border-[#dbeafe] bg-[#eff6ff] text-[#2563eb] hover:bg-[#dbeafe]"
            >
              Salvar Sprint
            </ActionButton>
          </>
        }
      >
        <div className="grid gap-3">
          <div className="flex flex-col gap-[5px]">
            <FieldLabel>Nome da Sprint</FieldLabel>
            <input
              value={formState.name}
              onChange={(event) => updateFormField('name', event.target.value)}
              placeholder="Ex: Sprint 1 - Modulo Financeiro"
              className="w-full rounded-[8px] border border-[#d7dfeb] bg-[#f8fafc] px-3 py-[10px] text-[13px] text-[#0f172a] outline-none transition-colors focus:border-[#2563eb]"
            />
          </div>

          <div className="flex flex-col gap-[5px]">
            <FieldLabel>Objetivo (Goal)</FieldLabel>
            <textarea
              rows={2}
              value={formState.goal}
              onChange={(event) => updateFormField('goal', event.target.value)}
              placeholder="O que queremos entregar nesta sprint?"
              className="w-full resize-none rounded-[8px] border border-[#d7dfeb] bg-[#f8fafc] px-3 py-[10px] text-[13px] text-[#0f172a] outline-none transition-colors focus:border-[#2563eb]"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-[5px]">
              <FieldLabel>Inicio</FieldLabel>
              <input
                type="date"
                value={formState.start}
                onChange={(event) => updateFormField('start', event.target.value)}
                className="w-full rounded-[8px] border border-[#d7dfeb] bg-[#f8fafc] px-3 py-[10px] text-[13px] text-[#0f172a] outline-none transition-colors focus:border-[#2563eb]"
              />
            </div>

            <div className="flex flex-col gap-[5px]">
              <FieldLabel>Fim</FieldLabel>
              <input
                type="date"
                value={formState.end}
                onChange={(event) => updateFormField('end', event.target.value)}
                className="w-full rounded-[8px] border border-[#d7dfeb] bg-[#f8fafc] px-3 py-[10px] text-[13px] text-[#0f172a] outline-none transition-colors focus:border-[#2563eb]"
              />
            </div>
          </div>

          {formError ? (
            <div className="rounded-[8px] border border-[#fecaca] bg-[#fef2f2] px-3 py-[10px] text-[12px] font-semibold text-[#dc2626]">
              {formError}
            </div>
          ) : null}
        </div>
      </CenteredModal>

      <CenteredModal
        open={Boolean(selectedSprintForTasks)}
        title={
          selectedSprintForTasks
            ? `Adicionar Tasks - ${selectedSprintForTasks.name}`
            : 'Adicionar Tasks'
        }
        maxWidthClassName="max-w-[520px]"
        onClose={closeAddTasksModal}
        footer={
          <>
            <ActionButton
              onClick={closeAddTasksModal}
              className="border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f8fafc]"
            >
              Cancelar
            </ActionButton>
            <ActionButton
              onClick={saveAddToSprint}
              className="border-[#dbeafe] bg-[#eff6ff] text-[#2563eb] hover:bg-[#dbeafe]"
            >
              Adicionar Selecionadas
            </ActionButton>
          </>
        }
      >
        {selectedSprintForTasks ? (
          <div className="max-h-[400px] overflow-y-auto">
            {availableTickets.length ? (
              <>
                <div className="mb-3 text-[12px] text-[#64748b]">
                  Selecione os tickets para adicionar a esta sprint:
                </div>
                <div className="grid gap-[6px]">
                  {availableTickets.map((ticket) => {
                    const epicName = ticket.parentId ? epicMap[ticket.parentId] : undefined;
                    const checked = selectedTaskIds.includes(ticket.id);

                    return (
                      <label
                        key={ticket.id}
                        className={cn(
                          'flex cursor-pointer items-start gap-3 rounded-[8px] border px-3 py-[10px] transition-colors',
                          checked
                            ? 'border-[#93c5fd] bg-[#eff6ff]'
                            : 'border-[#e2e8f0] bg-white hover:bg-[#f8fafc]',
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleTaskSelection(ticket.id)}
                          className="mt-[2px]"
                        />
                        <div className="min-w-0">
                          <div className="truncate text-[13px] font-semibold text-[#0f172a]">
                            {ticket.title}
                          </div>
                          <div className="mt-1 text-[11px] text-[#64748b]">
                            {ticket.devType} · {ticket.devStatus}
                            {epicName ? ` · ${epicName}` : ''}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="py-6 text-center text-[13px] text-[#64748b]">
                Todos os tickets já estão nesta sprint ou não há tickets disponíveis.
              </div>
            )}

            {addTasksError ? (
              <div className="mt-3 rounded-[8px] border border-[#fecaca] bg-[#fef2f2] px-3 py-[10px] text-[12px] font-semibold text-[#dc2626]">
                {addTasksError}
              </div>
            ) : null}
          </div>
        ) : null}
      </CenteredModal>

      <CenteredModal
        open={Boolean(selectedTicket)}
        title={selectedTicket?.title ?? 'Task'}
        maxWidthClassName="max-w-[640px]"
        description={
          selectedTicket
            ? `${selectedTicket.proto} · ${selectedTicket.devType} · ${selectedTicket.devStatus}`
            : undefined
        }
        onClose={() => setSelectedTicketId(null)}
        footer={
          <>
            <ActionButton
              onClick={() => setSelectedTicketId(null)}
              className="border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f8fafc]"
            >
              Fechar
            </ActionButton>
            <Link
              href="/desenvolvimento/kanban-dev"
              className="rounded-[8px] border border-[#dbeafe] bg-[#eff6ff] px-3 py-[7px] text-[12px] font-semibold text-[#2563eb] transition-colors hover:bg-[#dbeafe]"
            >
              Ir para Kanban Dev
            </Link>
          </>
        }
      >
        {selectedTicket ? (
          <div className="grid gap-3">
            <div className="flex flex-wrap gap-2">
              <Badge className={getTypeBadgeClass(selectedTicket.devType)}>
                {selectedTicket.devType}
              </Badge>
              <Badge className={getPriority(selectedTicket.score).badgeClassName}>
                {getPriority(selectedTicket.score).label}
              </Badge>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-[10px]">
                <div className="text-[10px] font-bold tracking-[.07em] text-[#64748b] uppercase">
                  Protocolo
                </div>
                <div className="mt-1 font-mono text-[13px] font-semibold text-[#2563eb]">
                  {selectedTicket.proto}
                </div>
              </div>

              <div className="rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-[10px]">
                <div className="text-[10px] font-bold tracking-[.07em] text-[#64748b] uppercase">
                  Responsavel
                </div>
                <div className="mt-1 text-[13px] font-semibold text-[#0f172a]">
                  {usersById[selectedTicket.resp]?.name ?? '-'}
                </div>
              </div>

              <div className="rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-[10px]">
                <div className="text-[10px] font-bold tracking-[.07em] text-[#64748b] uppercase">
                  Score
                </div>
                <div className="mt-1 text-[13px] font-semibold text-[#0f172a]">
                  {selectedTicket.score}/15
                </div>
              </div>

              <div className="rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-[10px]">
                <div className="text-[10px] font-bold tracking-[.07em] text-[#64748b] uppercase">
                  Entrega
                </div>
                <div className="mt-1 text-[13px] font-semibold text-[#0f172a]">
                  {formatDate(selectedTicket.deadline)}
                </div>
              </div>
            </div>

            <div className="rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-[10px]">
              <div className="text-[10px] font-bold tracking-[.07em] text-[#64748b] uppercase">
                Descricao
              </div>
              <div className="mt-1 whitespace-pre-wrap text-[13px] leading-6 text-[#475569]">
                {selectedTicket.description}
              </div>
            </div>
          </div>
        ) : null}
      </CenteredModal>
    </>
  );
}
