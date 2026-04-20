'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Plus, CalendarDays } from 'lucide-react';

import { ModalShell } from '@/components/modal-shell';
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
  { id: 'sp-27', name: 'Sprint 27', goal: 'Padronizar os componentes do fluxo de desenvolvimento.', start: '2026-03-22', end: '2026-03-31', closed: true, createdAt: '2026-03-20', closedAt: '2026-03-31' },
  { id: 'sp-28', name: 'Sprint 28', goal: 'Entregar ajustes de Habilis, performance e modal de task.', start: '2026-04-01', end: '2026-04-08', closed: false, createdAt: '2026-03-31' },
  { id: 'sp-29', name: 'Sprint 29', goal: 'Preparar a timeline compartilhada entre CRM e desenvolvimento.', start: '2026-04-09', end: '2026-04-16', closed: false, createdAt: '2026-04-02' },
];

const EMPTY_FORM: SprintFormState = { name: '', goal: '', start: '', end: '' };

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
  if (score >= 12) return { label: 'CRÍTICO', badgeClassName: 'border-[#fecaca] bg-[#fef2f2] text-[#dc2626]', scoreClassName: 'text-[#dc2626]' };
  if (score >= 9) return { label: 'ALTO', badgeClassName: 'border-[#fde68a] bg-[#fffbeb] text-[#d97706]', scoreClassName: 'text-[#d97706]' };
  if (score >= 6) return { label: 'MÉDIO', badgeClassName: 'border-[#fde68a] bg-[#fefce8] text-[#854d0e]', scoreClassName: 'text-[#ca8a04]' };
  return { label: 'BAIXO', badgeClassName: 'border-[#a7f3d0] bg-[#ecfdf5] text-[#059669]', scoreClassName: 'text-[#059669]' };
}

function getTypeBadgeClass(type: DevType) {
  const styles: Record<DevType, string> = { Epic: 'border-[#ddd6fe] bg-[#f5f3ff] text-[#7c3aed]', Feature: 'border-[#bfdbfe] bg-[#eff6ff] text-[#2563eb]', Task: 'border-[#e2e8f0] bg-[#f1f5f9] text-[#475569]', Bug: 'border-[#fecaca] bg-[#fef2f2] text-[#dc2626]' };
  return styles[type];
}

function Badge({ children, className }: { children: React.ReactNode; className?: string; }) {
  return <span className={cn('inline-flex items-center rounded-full border px-[10px] py-[4px] text-[11px] font-bold whitespace-nowrap', className)}>{children}</span>;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-[11px] font-bold tracking-[.06em] text-[#64748b] uppercase">{children}</label>;
}

export function DevSprintsPage() {
  const [tickets, setTickets] = useState<DevTicket[]>(() => INITIAL_DEV_TICKETS.map((ticket) => ({ ...ticket })));
  const [sprints, setSprints] = useState<SprintRecord[]>(() => INITIAL_SPRINTS.map((sprint) => ({ ...sprint })));
  const [showClosed, setShowClosed] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
  const [editingSprintId, setEditingSprintId] = useState<string | null>(null);
  const [formState, setFormState] = useState<SprintFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [addTasksSprintId, setAddTasksSprintId] = useState<string | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>([]);
  const [addTasksError, setAddTasksError] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);

  const usersById = DEV_USERS.reduce<Record<string, (typeof DEV_USERS)[number]>>((acc, user) => { acc[user.id] = user; return acc; }, {});
  const epicMap = tickets.reduce<Record<number, string>>((acc, ticket) => { if (ticket.devType === 'Epic') { acc[ticket.id] = ticket.title; } return acc; }, {});

  const openSprints = sprints.filter((sprint) => !sprint.closed);
  const closedSprints = sprints.filter((sprint) => sprint.closed);
  const selectedSprintForTasks = sprints.find((sprint) => sprint.id === addTasksSprintId) ?? null;
  const selectedTicket = tickets.find((ticket) => ticket.id === selectedTicketId) ?? null;

  function updateFormField<Key extends keyof SprintFormState>(key: Key, value: SprintFormState[Key]) {
    setFormState((current) => ({ ...current, [key]: value }));
  }

  function openSprintModal(sprintId: string | null) {
    const sprint = sprintId ? sprints.find((current) => current.id === sprintId) : null;
    setEditingSprintId(sprintId);
    setFormMode(sprintId ? 'edit' : 'create');
    setFormError('');
    setFormState(sprint ? { name: sprint.name, goal: sprint.goal ?? '', start: sprint.start, end: sprint.end } : EMPTY_FORM);
  }

  function closeSprintModal() {
    setFormMode(null);
    setEditingSprintId(null);
    setFormError('');
    setFormState(EMPTY_FORM);
  }

  function saveSprint() {
    if (!formState.name.trim() || !formState.start || !formState.end) { setFormError('Preencha nome, inicio e fim.'); return; }
    if (formState.end < formState.start) { setFormError('A data final precisa ser maior ou igual a data inicial.'); return; }

    if (formMode === 'edit' && editingSprintId) {
      setSprints((current) => current.map((sprint) => sprint.id === editingSprintId ? { ...sprint, name: formState.name.trim(), goal: formState.goal.trim() || undefined, start: formState.start, end: formState.end } : sprint));
    } else {
      setSprints((current) => [ ...current, { id: buildSprintId(), name: formState.name.trim(), goal: formState.goal.trim() || undefined, start: formState.start, end: formState.end, closed: false, createdAt: getTodayDate() } ]);
    }
    closeSprintModal();
  }

  function closeSprint(sprintId: string) {
    if (!window.confirm('Fechar sprint e mover pendencias para o Backlog?')) return;
    setSprints((current) => current.map((sprint) => sprint.id === sprintId ? { ...sprint, closed: true, closedAt: getTodayDate() } : sprint));
    setTickets((current) => current.map((ticket) => ticket.sprintId === sprintId && ticket.devStatus !== 'Concluído' ? { ...ticket, devStatus: 'Backlog' } : ticket));
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
    setSelectedTaskIds((current) => current.includes(ticketId) ? current.filter((id) => id !== ticketId) : [...current, ticketId]);
  }

  function saveAddToSprint() {
    if (!addTasksSprintId) return;
    if (!selectedTaskIds.length) { setAddTasksError('Selecione ao menos um ticket.'); return; }
    setTickets((current) => current.map((ticket) => selectedTaskIds.includes(ticket.id) ? { ...ticket, sprintId: addTasksSprintId } : ticket));
    closeAddTasksModal();
  }

  function removeFromSprint(ticketId: number) {
    setTickets((current) => current.map((ticket) => ticket.id === ticketId ? { ...ticket, sprintId: undefined } : ticket));
  }

  const availableTickets = selectedSprintForTasks ? tickets.filter((ticket) => ticket.devStatus !== 'Concluído' && ticket.sprintId !== selectedSprintForTasks.id) : [];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-[20px] font-extrabold tracking-[-0.4px] text-[#0f172a]">
            Sprints
          </h1>
          <p className="mt-0.5 text-[13px] text-[#64748b]">
            {openSprints.length} aberta(s) · {closedSprints.length} fechada(s)
          </p>
        </div>
        <button
          type="button"
          onClick={() => openSprintModal(null)}
          className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-[8px] bg-[#2563eb] px-4 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-[#1d4ed8]"
        >
          <Plus className="h-4 w-4" />
          <span>Nova Sprint</span>
        </button>
      </div>

      <div className="grid gap-6">
        {openSprints.length === 0 ? (
          <div className="rounded-[16px] border border-dashed border-[#cbd5e1] bg-white px-6 py-12 text-center shadow-sm">
            <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#eff6ff] text-[#2563eb]">
              <CalendarDays className="size-5" />
            </div>
            <div className="text-[16px] font-bold text-[#0f172a]">Nenhuma sprint aberta</div>
            <div className="mt-1 text-[13px] text-[#64748b]">Clique em "Nova Sprint" para iniciar um novo ciclo.</div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {openSprints.map((sprint) => {
              const sprintTickets = tickets.filter((ticket) => ticket.sprintId === sprint.id);
              const doneCount = sprintTickets.filter((ticket) => ticket.devStatus === 'Concluído').length;
              const totalCount = sprintTickets.length;
              const progress = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;
              const progressColor = progress >= 80 ? '#059669' : progress >= 50 ? '#d97706' : '#2563eb';
              const bugCount = sprintTickets.filter((ticket) => ticket.devType === 'Bug').length;
              const epicCount = sprintTickets.filter((ticket) => ticket.devType === 'Epic').length;
              const byStatus = sprintTickets.reduce<Record<string, number>>((acc, ticket) => { acc[ticket.devStatus] = (acc[ticket.devStatus] ?? 0) + 1; return acc; }, {});

              return (
                <div key={sprint.id} className="rounded-[14px] border border-[#e2e8f0] bg-white p-5 shadow-sm transition-all hover:border-[#bfdbfe]">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="truncate text-[16px] font-extrabold text-[#0f172a]">{sprint.name || 'Sprint sem nome'}</div>
                      <div className="mt-1 text-[12px] font-medium text-[#64748b]">Início: {formatDate(sprint.start)} · Fim: {formatDate(sprint.end)}</div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#eff6ff] px-[10px] py-[4px] text-[11px] font-bold text-[#2563eb]">Aberta</span>
                      <button onClick={() => openAddTasksModal(sprint.id)} className="h-8 rounded-[6px] border border-[#bfdbfe] bg-[#eff6ff] px-3 text-[12px] font-bold text-[#2563eb] hover:bg-[#dbeafe]">+ Add Tasks</button>
                      <button onClick={() => openSprintModal(sprint.id)} className="h-8 rounded-[6px] border border-[#e2e8f0] bg-white px-3 text-[12px] font-bold text-[#0f172a] hover:bg-[#f8fafc]">Editar</button>
                      <button onClick={() => closeSprint(sprint.id)} className="h-8 rounded-[6px] border border-[#fecaca] bg-[#fef2f2] px-3 text-[12px] font-bold text-[#dc2626] hover:bg-[#fee2e2]">Fechar</button>
                    </div>
                  </div>

                  <div className="mb-4 flex items-center gap-3">
                    <div className="h-[8px] flex-1 overflow-hidden rounded-full bg-[#f1f5f9]">
                      <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: progressColor }} />
                    </div>
                    <span className="text-[13px] font-extrabold" style={{ color: progressColor }}>{doneCount}/{totalCount} ({progress}%)</span>
                  </div>

                  <div className="mb-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-[#f8fafc] border border-[#e2e8f0] px-[10px] py-[3px] text-[11px] font-bold text-[#0f172a]">{totalCount} tarefa{totalCount !== 1 ? 's' : ''}</span>
                    {bugCount > 0 && <span className="rounded-full bg-[#fef2f2] border border-[#fecaca] px-[10px] py-[3px] text-[11px] font-bold text-[#dc2626]">{bugCount} bug{bugCount !== 1 ? 's' : ''}</span>}
                    {epicCount > 0 && <span className="rounded-full bg-[#f5f3ff] border border-[#ddd6fe] px-[10px] py-[3px] text-[11px] font-bold text-[#7c3aed]">{epicCount} epic{epicCount !== 1 ? 's' : ''}</span>}
                  </div>

                  {totalCount > 0 && (
                    <div className="flex flex-col gap-1.5 mt-4">
                      {Object.entries(byStatus).sort((a, b) => b[1] - a[1]).map(([status, count]) => {
                        const width = Math.round((count / totalCount) * 100);
                        const isDone = status === 'Concluído';
                        return (
                          <div key={status}>
                            <div className="mb-[2px] flex items-center justify-between text-[11px]">
                              <span className="text-[#64748b]">{status}</span>
                              <span className="font-bold" style={{ color: isDone ? '#059669' : '#64748b' }}>{count}</span>
                            </div>
                            <div className="h-[6px] overflow-hidden rounded-full bg-[#f1f5f9]">
                              <div className="h-full rounded-full" style={{ width: `${width}%`, backgroundColor: isDone ? '#059669' : '#2563eb', opacity: 0.8 }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {totalCount > 0 ? (
                    <div className="mt-4 rounded-[10px] border border-[#e2e8f0] bg-[#f8fafc] p-2">
                      {sprintTickets.slice(0, 50).map((ticket) => {
                        const responsible = usersById[ticket.resp];
                        const isDone = ticket.devStatus === 'Concluído';
                        return (
                          <div key={ticket.id} onClick={() => setSelectedTicketId(ticket.id)} className="mb-[2px] flex cursor-pointer items-center gap-3 rounded-[8px] bg-white px-3 py-2 border border-transparent hover:border-[#bfdbfe] shadow-sm">
                            <span className={cn('size-2 shrink-0 rounded-full', isDone ? 'bg-[#059669]' : 'bg-[#2563eb]')} />
                            <Badge className={getTypeBadgeClass(ticket.devType)}>{ticket.devType}</Badge>
                            <div className="min-w-0 flex-1">
                              <div className={cn("truncate text-[13px] font-semibold", isDone ? 'text-[#94a3b8] line-through' : 'text-[#0f172a]')}>{ticket.title}</div>
                              {ticket.parentId && epicMap[ticket.parentId] && <div className="mt-[2px] text-[10px] font-medium text-[#7c3aed]">{epicMap[ticket.parentId]}</div>}
                            </div>
                            {responsible && <span className="hidden sm:inline-block rounded-full border border-[#e2e8f0] bg-[#f8fafc] px-[8px] py-[2px] text-[10px] font-semibold text-[#64748b]">{responsible.name}</span>}
                            {ticket.deadline && <span className="text-[10px] font-medium" style={{ color: ticket.deadline < getTodayDate() && !isDone ? '#dc2626' : '#64748b' }}>{formatDate(ticket.deadline)}</span>}
                            <button onClick={(e) => { e.stopPropagation(); removeFromSprint(ticket.id); }} className="rounded-[6px] border border-[#e2e8f0] px-2 py-1 text-[10px] font-semibold text-[#dc2626] hover:bg-[#fef2f2]">Remover</button>
                          </div>
                        );
                      })}
                      {sprintTickets.length > 50 && <div className="pt-2 text-center text-[12px] text-[#64748b]">+{sprintTickets.length - 50} tarefas</div>}
                    </div>
                  ) : (
                    <div className="pt-3 text-[13px] text-[#64748b]">Nenhuma task adicionada a esta sprint.</div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {closedSprints.length > 0 && (
          <div className="mt-5">
            <button type="button" onClick={() => setShowClosed((c) => !c)} className="h-9 rounded-[8px] border border-[#e2e8f0] bg-white px-4 text-[13px] font-semibold text-[#64748b] shadow-sm hover:bg-[#f8fafc]">
              {showClosed ? 'Ocultar' : 'Ver'} sprints fechadas ({closedSprints.length})
            </button>

            {showClosed && (
              <div className="mt-4 flex flex-col gap-4 opacity-75">
                {closedSprints.map((sprint) => {
                  const sprintTickets = tickets.filter((ticket) => ticket.sprintId === sprint.id);
                  const doneCount = sprintTickets.filter((ticket) => ticket.devStatus === 'Concluído').length;
                  const totalCount = sprintTickets.length;
                  const progress = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;

                  return (
                    <div key={sprint.id} className="rounded-[14px] border border-[#e2e8f0] bg-white p-5 shadow-sm">
                      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="truncate text-[16px] font-extrabold text-[#0f172a]">{sprint.name}</div>
                          <div className="mt-1 text-[12px] font-medium text-[#64748b]">Início: {formatDate(sprint.start)} · Fim: {formatDate(sprint.end)}</div>
                        </div>
                        <span className="rounded-full bg-[#f1f5f9] px-[10px] py-[4px] text-[11px] font-bold text-[#64748b]">Fechada</span>
                      </div>
                      <div className="mb-3 flex items-center gap-3">
                        <div className="h-[8px] flex-1 overflow-hidden rounded-full bg-[#e2e8f0]"><div className="h-full rounded-full bg-[#94a3b8]" style={{ width: `${progress}%` }} /></div>
                        <span className="text-[13px] font-extrabold text-[#64748b]">{doneCount}/{totalCount} ({progress}%)</span>
                      </div>
                      <div className="text-[12px] text-[#64748b]">{totalCount} tarefa{totalCount !== 1 ? 's' : ''} vinculada{totalCount !== 1 ? 's' : ''} {sprint.closedAt ? `· fechada em ${formatDate(sprint.closedAt)}` : ''}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <ModalShell
        open={Boolean(formMode)}
        title={formMode === 'edit' ? 'Editar Sprint' : 'Nova Sprint'}
        maxWidthClassName="max-w-[480px]"
        onClose={closeSprintModal}
        footer={
          <div className="flex justify-end gap-2 w-full">
            <button type="button" onClick={closeSprintModal} className="h-9 rounded-[8px] border border-[#e2e8f0] bg-white px-4 text-[13px] font-semibold text-[#64748b] hover:bg-[#f8fafc]">Cancelar</button>
            <button type="button" onClick={saveSprint} className="h-9 rounded-[8px] bg-[#2563eb] px-4 text-[13px] font-semibold text-white hover:bg-[#1d4ed8]">Salvar Sprint</button>
          </div>
        }
      >
        <div className="grid gap-4">
          <div className="flex flex-col gap-[5px]">
            <FieldLabel>Nome da Sprint</FieldLabel>
            <input value={formState.name} onChange={(e) => updateFormField('name', e.target.value)} placeholder="Ex: Sprint 1" className="w-full rounded-[7px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-[9px] text-[13px] outline-none focus:border-[#2563eb]" />
          </div>
          <div className="flex flex-col gap-[5px]">
            <FieldLabel>Objetivo (Goal)</FieldLabel>
            <textarea rows={3} value={formState.goal} onChange={(e) => updateFormField('goal', e.target.value)} placeholder="O que queremos entregar..." className="w-full resize-none rounded-[7px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-[9px] text-[13px] outline-none focus:border-[#2563eb]" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-[5px]">
              <FieldLabel>Início</FieldLabel>
              <input type="date" value={formState.start} onChange={(e) => updateFormField('start', e.target.value)} className="w-full rounded-[7px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-[9px] text-[13px] outline-none focus:border-[#2563eb]" />
            </div>
            <div className="flex flex-col gap-[5px]">
              <FieldLabel>Fim</FieldLabel>
              <input type="date" value={formState.end} onChange={(e) => updateFormField('end', e.target.value)} className="w-full rounded-[7px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-[9px] text-[13px] outline-none focus:border-[#2563eb]" />
            </div>
          </div>
          {formError && <div className="rounded-[8px] border border-[#fecaca] bg-[#fef2f2] px-3 py-[10px] text-[12px] font-semibold text-[#dc2626]">{formError}</div>}
        </div>
      </ModalShell>

      <ModalShell
        open={Boolean(selectedSprintForTasks)}
        title={selectedSprintForTasks ? `Adicionar Tasks - ${selectedSprintForTasks.name}` : 'Adicionar Tasks'}
        maxWidthClassName="max-w-[520px]"
        onClose={closeAddTasksModal}
        footer={
          <div className="flex justify-end gap-2 w-full">
            <button type="button" onClick={closeAddTasksModal} className="h-9 rounded-[8px] border border-[#e2e8f0] bg-white px-4 text-[13px] font-semibold text-[#64748b] hover:bg-[#f8fafc]">Cancelar</button>
            <button type="button" onClick={saveAddToSprint} className="h-9 rounded-[8px] bg-[#2563eb] px-4 text-[13px] font-semibold text-white hover:bg-[#1d4ed8]">Adicionar Selecionadas</button>
          </div>
        }
      >
        {selectedSprintForTasks && (
          <div className="max-h-[400px] overflow-y-auto">
            {availableTickets.length ? (
              <>
                <div className="mb-3 text-[13px] font-medium text-[#64748b]">Selecione os tickets:</div>
                <div className="grid gap-[6px]">
                  {availableTickets.map((ticket) => {
                    const epicName = ticket.parentId ? epicMap[ticket.parentId] : undefined;
                    const checked = selectedTaskIds.includes(ticket.id);
                    return (
                      <label key={ticket.id} className={cn('flex cursor-pointer items-start gap-3 rounded-[8px] border px-3 py-[10px] transition-colors', checked ? 'border-[#93c5fd] bg-[#eff6ff]' : 'border-[#e2e8f0] bg-[#f8fafc] hover:border-[#bfdbfe]')}>
                        <input type="checkbox" checked={checked} onChange={() => toggleTaskSelection(ticket.id)} className="mt-[3px] accent-[#2563eb]" />
                        <div className="min-w-0">
                          <div className="truncate text-[13px] font-semibold text-[#0f172a]">{ticket.title}</div>
                          <div className="mt-1 text-[11px] text-[#64748b]">{ticket.devType} · {ticket.devStatus}{epicName ? ` · ${epicName}` : ''}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </>
            ) : <div className="py-6 text-center text-[13px] text-[#64748b]">Todos os tickets já estão nesta sprint ou não há disponíveis.</div>}
            {addTasksError && <div className="mt-3 rounded-[8px] border border-[#fecaca] bg-[#fef2f2] px-3 py-[10px] text-[12px] font-semibold text-[#dc2626]">{addTasksError}</div>}
          </div>
        )}
      </ModalShell>

      <ModalShell
        open={Boolean(selectedTicket)}
        title={selectedTicket?.title ?? 'Task'}
        maxWidthClassName="max-w-[640px]"
        description={selectedTicket ? `${selectedTicket.proto} · ${selectedTicket.devType} · ${selectedTicket.devStatus}` : undefined}
        onClose={() => setSelectedTicketId(null)}
        footer={
          <div className="flex justify-end gap-2 w-full">
            <button type="button" onClick={() => setSelectedTicketId(null)} className="h-9 rounded-[8px] border border-[#e2e8f0] bg-white px-4 text-[13px] font-semibold text-[#64748b] hover:bg-[#f8fafc]">Fechar</button>
            <Link href="/desenvolvimento/kanban-dev" className="inline-flex h-9 items-center justify-center rounded-[8px] bg-[#eff6ff] border border-[#bfdbfe] px-4 text-[13px] font-semibold text-[#2563eb] hover:bg-[#dbeafe]">Ir para Kanban Dev</Link>
          </div>
        }
      >
        {selectedTicket && (
          <div className="grid gap-3">
            <div className="flex flex-wrap gap-2">
              <Badge className={getTypeBadgeClass(selectedTicket.devType)}>{selectedTicket.devType}</Badge>
              <Badge className={getPriority(selectedTicket.score).badgeClassName}>{getPriority(selectedTicket.score).label}</Badge>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-[10px]">
                <div className="text-[10px] font-bold tracking-[.07em] text-[#64748b] uppercase">Protocolo</div>
                <div className="mt-1 font-mono text-[13px] font-semibold text-[#2563eb]">{selectedTicket.proto}</div>
              </div>
              <div className="rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-[10px]">
                <div className="text-[10px] font-bold tracking-[.07em] text-[#64748b] uppercase">Responsável</div>
                <div className="mt-1 text-[13px] font-semibold text-[#0f172a]">{usersById[selectedTicket.resp]?.name ?? '-'}</div>
              </div>
              <div className="rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-[10px]">
                <div className="text-[10px] font-bold tracking-[.07em] text-[#64748b] uppercase">Score</div>
                <div className="mt-1 text-[13px] font-semibold text-[#0f172a]">{selectedTicket.score}/15</div>
              </div>
              <div className="rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-[10px]">
                <div className="text-[10px] font-bold tracking-[.07em] text-[#64748b] uppercase">Entrega</div>
                <div className="mt-1 text-[13px] font-semibold text-[#0f172a]">{formatDate(selectedTicket.deadline)}</div>
              </div>
            </div>
            <div className="rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-[10px]">
              <div className="text-[10px] font-bold tracking-[.07em] text-[#64748b] uppercase">Descrição</div>
              <div className="mt-1 whitespace-pre-wrap text-[13px] leading-6 text-[#475569]">{selectedTicket.description}</div>
            </div>
          </div>
        )}
      </ModalShell>
    </div>
  );
}