'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Plus } from 'lucide-react';

import { ModalShell } from '@/components/modal-shell';
import {
  createDevSprint,
  fetchDevLookups,
  fetchDevTickets,
  updateDevSprint,
  updateDevTicket,
  type DevApiSprint,
  type DevApiTicket,
} from '@/components/dev/api';

type SprintFormState = {
  name: string;
  goal: string;
  start: string;
  end: string;
};

const EMPTY_FORM: SprintFormState = { name: '', goal: '', start: '', end: '' };

export function DevSprintsPage() {
  const [sprints, setSprints] = useState<DevApiSprint[]>([]);
  const [tickets, setTickets] = useState<DevApiTicket[]>([]);
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
  const [editingSprintId, setEditingSprintId] = useState<string | null>(null);
  const [formState, setFormState] = useState<SprintFormState>(EMPTY_FORM);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [lookups, devTickets] = await Promise.all([fetchDevLookups(), fetchDevTickets()]);
        if (!active) return;
        setSprints(lookups.sprints || []);
        setTickets(devTickets);
      } catch {
        if (!active) return;
        setSprints([]);
        setTickets([]);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  const openSprints = useMemo(() => sprints.filter((sprint) => !sprint.closed), [sprints]);
  const closedSprints = useMemo(() => sprints.filter((sprint) => sprint.closed), [sprints]);

  function openSprintModal(sprint?: DevApiSprint) {
    setEditingSprintId(sprint?.id ?? null);
    setFormState(
      sprint
        ? { name: sprint.name, goal: sprint.goal || '', start: sprint.start, end: sprint.end }
        : EMPTY_FORM,
    );
    setFormMode(sprint ? 'edit' : 'create');
  }

  async function saveSprint() {
    if (!formState.name.trim() || !formState.start || !formState.end) return;

    if (formMode === 'edit' && editingSprintId) {
      const updated = await updateDevSprint(editingSprintId, {
        name: formState.name.trim(),
        goal: formState.goal.trim(),
        start: formState.start,
        end: formState.end,
      });
      setSprints((current) => current.map((sprint) => (sprint.id === updated.id ? updated : sprint)));
    } else {
      const created = await createDevSprint({
        name: formState.name.trim(),
        goal: formState.goal.trim(),
        start: formState.start,
        end: formState.end,
      });
      setSprints((current) => [...current, created]);
    }

    setFormMode(null);
  }

  async function closeSprint(sprint: DevApiSprint) {
    const updated = await updateDevSprint(sprint.id, {
      closed: true,
      closedAt: new Date().toISOString().slice(0, 10),
    });
    setSprints((current) => current.map((item) => (item.id === updated.id ? updated : item)));

    const related = tickets.filter((ticket) => ticket.sprintId === sprint.id && ticket.devStatus !== 'Concluído');
    const updatedTickets = await Promise.all(
      related.map((ticket) =>
        updateDevTicket(ticket.id, {
          devStatus: 'Backlog',
          sprintId: undefined,
        }),
      ),
    );
    setTickets((current) =>
      current.map((ticket) => updatedTickets.find((item) => item.id === ticket.id) ?? ticket),
    );
  }

  async function removeFromSprint(ticketId: number) {
    const updated = await updateDevTicket(ticketId, { sprintId: undefined });
    setTickets((current) => current.map((ticket) => (ticket.id === updated.id ? updated : ticket)));
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-[20px] font-extrabold tracking-[-0.4px] text-[#0f172a]">Sprints</h1>
          <p className="mt-0.5 text-[13px] text-[#64748b]">
            {openSprints.length} aberta(s) · {closedSprints.length} fechada(s)
          </p>
        </div>
        <button
          type="button"
          onClick={() => openSprintModal()}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-[8px] bg-[#2563eb] px-4 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-[#1d4ed8]"
        >
          <Plus className="h-4 w-4" />
          Nova Sprint
        </button>
      </div>

      <div className="grid gap-6">
        {[...openSprints, ...closedSprints].map((sprint) => {
          const sprintTickets = tickets.filter((ticket) => ticket.sprintId === sprint.id);
          const doneCount = sprintTickets.filter((ticket) => ticket.devStatus === 'Concluído').length;
          const totalCount = sprintTickets.length;
          const progress = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;

          return (
            <div key={sprint.id} className="rounded-[14px] border border-[#e2e8f0] bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="truncate text-[16px] font-extrabold text-[#0f172a]">{sprint.name}</div>
                  <div className="mt-1 text-[12px] font-medium text-[#64748b]">
                    Início: {sprint.start} · Fim: {sprint.end}
                  </div>
                  <div className="mt-2 text-[13px] text-[#475569]">{sprint.goal || 'Sem objetivo definido.'}</div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#eff6ff] px-[10px] py-[4px] text-[11px] font-bold text-[#2563eb]">
                    {sprint.closed ? 'Fechada' : 'Aberta'}
                  </span>
                  <button onClick={() => openSprintModal(sprint)} className="h-8 rounded-[6px] border border-[#e2e8f0] bg-white px-3 text-[12px] font-bold text-[#0f172a]">
                    Editar
                  </button>
                  {!sprint.closed ? (
                    <button onClick={() => closeSprint(sprint)} className="h-8 rounded-[6px] border border-[#fecaca] bg-[#fef2f2] px-3 text-[12px] font-bold text-[#dc2626]">
                      Fechar
                    </button>
                  ) : null}
                  <Link href="/desenvolvimento/kanban" className="inline-flex h-8 items-center rounded-[6px] border border-[#e2e8f0] px-3 text-[12px] font-bold text-[#0f172a]">
                    Ir para kanban
                  </Link>
                </div>
              </div>

              <div className="mb-4 flex items-center gap-3">
                <div className="h-[8px] flex-1 overflow-hidden rounded-full bg-[#f1f5f9]">
                  <div className="h-full rounded-full bg-[#2563eb]" style={{ width: `${progress}%` }} />
                </div>
                <span className="text-[13px] font-extrabold text-[#2563eb]">
                  {doneCount}/{totalCount} ({progress}%)
                </span>
              </div>

              {sprintTickets.length ? (
                <div className="rounded-[10px] border border-[#e2e8f0] bg-[#f8fafc] p-3">
                  <div className="mb-2 flex items-center gap-2 text-[12px] font-bold text-[#0f172a]">
                    <CalendarDays className="size-4 text-[#64748b]" />
                    Tickets da sprint
                  </div>
                  <div className="grid gap-2">
                    {sprintTickets.map((ticket) => (
                      <div key={ticket.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[8px] bg-white px-3 py-2">
                        <div>
                          <div className="text-[13px] font-semibold text-[#0f172a]">{ticket.title}</div>
                          <div className="text-[11px] text-[#64748b]">{ticket.devStatus}</div>
                        </div>
                        {!sprint.closed ? (
                          <button onClick={() => removeFromSprint(ticket.id)} className="rounded-[6px] border border-[#e2e8f0] px-3 py-1.5 text-[11px] font-semibold text-[#475569]">
                            Remover
                          </button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-[10px] border border-dashed border-[#cbd5e1] bg-[#f8fafc] px-4 py-6 text-center text-[13px] text-[#64748b]">
                  Nenhum ticket vinculado.
                </div>
              )}
            </div>
          );
        })}
      </div>

      <ModalShell open={formMode !== null} onClose={() => setFormMode(null)} title="" maxWidthClassName="max-w-[620px]">
        <div className="space-y-4">
          <div className="text-[18px] font-extrabold text-[#0f172a]">
            {formMode === 'edit' ? 'Editar sprint' : 'Nova sprint'}
          </div>
          <input value={formState.name} onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))} placeholder="Nome" className="w-full rounded-[8px] border border-[#e2e8f0] px-3 py-2 text-[13px] outline-none" />
          <textarea value={formState.goal} onChange={(event) => setFormState((current) => ({ ...current, goal: event.target.value }))} placeholder="Objetivo" className="min-h-[110px] w-full rounded-[8px] border border-[#e2e8f0] px-3 py-2 text-[13px] outline-none" />
          <div className="grid gap-3 md:grid-cols-2">
            <input value={formState.start} onChange={(event) => setFormState((current) => ({ ...current, start: event.target.value }))} type="date" className="rounded-[8px] border border-[#e2e8f0] px-3 py-2 text-[13px] outline-none" />
            <input value={formState.end} onChange={(event) => setFormState((current) => ({ ...current, end: event.target.value }))} type="date" className="rounded-[8px] border border-[#e2e8f0] px-3 py-2 text-[13px] outline-none" />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setFormMode(null)} className="rounded-[8px] border border-[#e2e8f0] px-4 py-2 text-[13px] font-semibold text-[#475569]">
              Cancelar
            </button>
            <button onClick={saveSprint} className="rounded-[8px] bg-[#2563eb] px-4 py-2 text-[13px] font-semibold text-white">
              Salvar
            </button>
          </div>
        </div>
      </ModalShell>
    </div>
  );
}
