'use client';

import { useMemo, useState } from 'react';
import {
  CheckSquare,
  ClipboardList,
  Hourglass,
  Ticket,
  Wrench,
} from 'lucide-react';

import { MetricCard, Panel } from '@/components/ui';

import { ImplantacaoTicketModal } from './implantacao-ticket-modal';
import {
  useCurrentAdminUser,
} from '@/components/admin-users-storage';
import {
  getInitials,
  getTechNameById,
  IMPLANTACAO_COLUMNS,
  type ImplantacaoTask,
  type ImplantacaoTicket,
  useImplantacaoTickets,
} from './implantacao-shared';

type TaskRow = ImplantacaoTask & {
  ticketId: string;
  ticketProto: string;
  ticketNome: string;
  ticketInstancia: string;
  ticketCsStatus: ImplantacaoTicket['csStatus'];
  ticketRespTec: string;
};

export function ImplantacaoTarefas() {
  const { currentUser } = useCurrentAdminUser();
  const [tickets, setTickets] = useImplantacaoTickets();
  const [statusFilter, setStatusFilter] = useState<'all' | 'pend' | 'feita'>('all');
  const [techFilter, setTechFilter] = useState('');
  const [columnFilter, setColumnFilter] = useState('');
  const [viewingTicketId, setViewingTicketId] = useState<string | null>(null);

  const taskRows = useMemo<TaskRow[]>(() => {
    return tickets
      .filter((ticket) => ticket.status === 'active' || ticket.status === 'done')
      .flatMap((ticket) =>
        ticket.tasks.map((task) => ({
          ...task,
          ticketId: ticket.id,
          ticketProto: ticket.proto,
          ticketNome: ticket.nome,
          ticketInstancia: ticket.instancia,
          ticketCsStatus: ticket.csStatus,
          ticketRespTec: ticket.respTec,
        })),
      );
  }, [tickets]);

  const filteredRows = useMemo(() => {
    return taskRows.filter((task) => {
      if (statusFilter === 'pend' && task.done) return false;
      if (statusFilter === 'feita' && !task.done) return false;
      if (techFilter && task.ticketRespTec !== techFilter) return false;
      if (columnFilter && task.ticketCsStatus !== columnFilter) return false;
      return true;
    });
  }, [columnFilter, statusFilter, taskRows, techFilter]);

  const pendingRows = filteredRows.filter((task) => !task.done);
  const doneRows = filteredRows.filter((task) => task.done);

  const grouped = useMemo(() => {
    const map = new Map<string, TaskRow[]>();

    filteredRows.forEach((task) => {
      const key = task.ticketRespTec || 'sem';
      const current = map.get(key) ?? [];
      current.push(task);
      map.set(key, current);
    });

    return [...map.entries()].sort((left, right) => {
      if (left[0] === 'sem') return 1;
      if (right[0] === 'sem') return -1;
      return getTechNameById(left[0]).localeCompare(getTechNameById(right[0]));
    });
  }, [filteredRows]);

  const viewingTicket = tickets.find((ticket) => ticket.id === viewingTicketId) ?? null;
  const techOptions = useMemo(
    () =>
      [...new Set(tickets.map((ticket) => ticket.respTec))]
        .filter(Boolean)
        .map((id) => ({ id, name: getTechNameById(id) })),
    [tickets],
  );

  function handleToggleTask(ticketId: string, taskId: string) {
    setTickets((current) =>
      current.map((ticket) => {
        if (ticket.id !== ticketId) return ticket;

        const targetTask = ticket.tasks.find((task) => task.id === taskId);
        if (!targetTask) return ticket;
        const nextDone = !targetTask.done;
        const today = new Date().toISOString().slice(0, 10);

        return {
          ...ticket,
          tasks: ticket.tasks.map((task) =>
            task.id === taskId ? { ...task, done: nextDone } : task,
          ),
          updatedAt: today,
          history: [
            ...ticket.history,
            {
              id: `${ticket.id}-hist-task-${taskId}-${Date.now()}`,
              actor: getTechNameById(ticket.respTec),
              message: `Tarefa "${targetTask.title}" ${nextDone ? 'concluida' : 'reaberta'}.`,
              createdAt: today,
            },
          ],
        };
      }),
    );
  }

  function handleAddComment(ticketId: string, message: string) {
    const today = new Date().toISOString().slice(0, 10);
    const commentAuthor = currentUser?.name?.trim() || 'Usuário';
    setTickets((current) =>
      current.map((ticket) =>
        ticket.id === ticketId
          ? {
              ...ticket,
              updatedAt: today,
              comments: [
                ...ticket.comments,
                {
                  id: `${ticket.id}-comment-${Date.now()}`,
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

  function handleAddAttachments(ticketId: string, files: File[]) {
    setTickets((current) =>
      current.map((ticket) =>
        ticket.id === ticketId
          ? {
              ...ticket,
              attachments: [
                ...ticket.attachments,
                ...files.map((file) => ({
                  id: `${ticket.id}-attachment-${Date.now()}-${file.name}`,
                  name: file.name,
                  subtitle: `${Math.max(1, Math.round(file.size / 1024))} KB`,
                })),
              ],
            }
          : ticket,
      ),
    );
  }

  function handleChangeTech(ticketId: string, techId: string) {
    const today = new Date().toISOString().slice(0, 10);
    setTickets((current) =>
      current.map((ticket) =>
        ticket.id === ticketId
          ? {
              ...ticket,
              respTec: techId,
              updatedAt: today,
              history: [
                ...ticket.history,
                {
                  id: `${ticket.id}-hist-tech-${Date.now()}`,
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

  function handleChangeLabel(ticketId: string, label: ImplantacaoTicket['csStatus']) {
    const today = new Date().toISOString().slice(0, 10);
    setTickets((current) =>
      current.map((ticket) => {
        if (ticket.id !== ticketId || ticket.csStatus === label) return ticket;

        return {
          ...ticket,
          csStatus: label,
          updatedAt: today,
          history: [
            ...ticket.history,
            {
              id: `${ticket.id}-hist-label-${Date.now()}`,
              actor: ticket.respSolicitacao || getTechNameById(ticket.respTec),
              message: `Etiqueta alterada para ${label}.`,
              createdAt: today,
            },
          ],
        };
      }),
    );
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[19px] font-extrabold tracking-[-0.4px] text-[#0f172a]">
            Tarefas Implantadores
          </div>
          <div className="mt-0.5 text-[13px] text-[#64748b]">
            {filteredRows.length} tarefa(s) - {pendingRows.length} pendente(s)
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as 'all' | 'pend' | 'feita')}
            className="rounded-[8px] border border-[#e2e8f0] bg-white px-[10px] py-[7px] text-[13px] text-[#0f172a] outline-none"
          >
            <option value="all">Todas</option>
            <option value="pend">Pendentes</option>
            <option value="feita">Feitas</option>
          </select>
          <select
            value={techFilter}
            onChange={(event) => setTechFilter(event.target.value)}
            className="rounded-[8px] border border-[#e2e8f0] bg-white px-[10px] py-[7px] text-[13px] text-[#0f172a] outline-none"
          >
            <option value="">Todos os implantadores</option>
            {techOptions.map((tech) => (
              <option key={tech.id} value={tech.id}>
                {tech.name}
              </option>
            ))}
          </select>
          <select
            value={columnFilter}
            onChange={(event) => setColumnFilter(event.target.value)}
            className="rounded-[8px] border border-[#e2e8f0] bg-white px-[10px] py-[7px] text-[13px] text-[#0f172a] outline-none"
          >
            <option value="">Todas as etapas</option>
            {IMPLANTACAO_COLUMNS.map((column) => (
              <option key={column} value={column}>
                {column}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          icon={<ClipboardList className="size-5 text-[#2563eb]" />}
          title="Total Tarefas"
          value={String(filteredRows.length)}
          tone="accent"
        />
        <MetricCard
          icon={<Hourglass className="size-5 text-[#d97706]" />}
          title="Pendentes"
          value={String(pendingRows.length)}
          tone="warning"
        />
        <MetricCard
          icon={<CheckSquare className="size-5 text-[#059669]" />}
          title="Concluídas"
          value={String(doneRows.length)}
          tone="success"
        />
        <MetricCard
          icon={<Wrench className="size-5 text-[#7c3aed]" />}
          title="Implantadores"
          value={String(techOptions.length)}
          tone="purple"
        />
        <MetricCard
          icon={<Ticket className="size-5 text-[#0f172a]" />}
          title="Tickets"
          value={String(tickets.length)}
          tone="neutral"
        />
      </div>

      {grouped.length ? (
        <div className="grid gap-4">
          {grouped.map(([techId, rows]) => {
            const techName = techId === 'sem' ? 'Sem implantador' : getTechNameById(techId);
            const doneCount = rows.filter((task) => task.done).length;
            const progress = rows.length ? Math.round((doneCount / rows.length) * 100) : 0;
            const progressTone =
              progress >= 80 ? 'bg-[#059669]' : progress >= 50 ? 'bg-[#d97706]' : 'bg-[#dc2626]';

            return (
              <Panel key={techId} className="overflow-hidden">
                <div className="flex items-center gap-3 border-b border-[#e2e8f0] bg-[#f8fafc] px-4 py-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#7c3aed] text-[13px] font-bold text-white">
                    {techId === 'sem' ? '?' : getInitials(techName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-bold text-[#0f172a]">{techName}</div>
                    <div className="text-[11px] text-[#64748b]">
                      {rows.length} tarefa(s) - {rows.filter((task) => !task.done).length}{' '}
                      pendentes - {doneCount} concluidas
                    </div>
                  </div>
                  <div className="min-w-[90px] text-right">
                    <div className="text-[16px] font-extrabold text-[#ef4444]">{progress}%</div>
                    <div className="mt-1 h-[6px] overflow-hidden rounded-full bg-[#e2e8f0]">
                      <div
                        className={`h-full rounded-full ${progressTone}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-[#f8fafc]">
                        <th className="px-3 py-3 text-left text-[10px] font-bold tracking-[.06em] text-[#64748b] uppercase">
                          Tarefa
                        </th>
                        <th className="px-3 py-3 text-left text-[10px] font-bold tracking-[.06em] text-[#64748b] uppercase">
                          Ticket
                        </th>
                        <th className="px-3 py-3 text-left text-[10px] font-bold tracking-[.06em] text-[#2563eb] uppercase">
                          Instância
                        </th>
                        <th className="px-3 py-3 text-center text-[10px] font-bold tracking-[.06em] text-[#64748b] uppercase">
                          Etapa
                        </th>
                        <th className="px-3 py-3 text-center text-[10px] font-bold tracking-[.06em] text-[#64748b] uppercase">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr
                          key={row.id}
                          className="cursor-pointer border-t border-[#e2e8f0] transition-colors hover:bg-[#f8fafc]"
                          onClick={() => setViewingTicketId(row.ticketId)}
                        >
                          <td className="px-3 py-3">
                            <div
                              className={`text-[13px] font-semibold ${
                                row.done ? 'text-[#94a3b8] line-through' : 'text-[#0f172a]'
                              }`}
                            >
                              {row.title}
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="font-mono text-[11px] font-bold text-[#2563eb]">
                              {row.ticketProto}
                            </div>
                            <div className="text-[10px] text-[#64748b]">{row.ticketNome}</div>
                          </td>
                          <td className="px-3 py-3">
                            {row.ticketInstancia ? (
                              <span className="inline-flex rounded-full bg-[#eff6ff] px-2 py-1 text-[11px] font-bold text-[#2563eb]">
                                {row.ticketInstancia}
                              </span>
                            ) : (
                              <span className="text-[#cbd5e1]">-</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className="inline-flex rounded-full bg-[#eff6ff] px-2 py-1 text-[10px] font-bold text-[#2563eb]">
                              {row.ticketCsStatus}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-center">
                            {row.done ? (
                              <span className="inline-flex rounded-full bg-[#ecfdf5] px-2 py-1 text-[10px] font-bold text-[#059669]">
                                Feita
                              </span>
                            ) : (
                              <span className="inline-flex rounded-full bg-[#fffbeb] px-2 py-1 text-[10px] font-bold text-[#d97706]">
                                Pendente
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>
            );
          })}
        </div>
      ) : (
        <Panel className="px-6 py-14 text-center text-[#64748b]">
          Nenhuma tarefa encontrada.
        </Panel>
      )}

      <ImplantacaoTicketModal
        open={Boolean(viewingTicket)}
        ticket={viewingTicket}
        onClose={() => setViewingTicketId(null)}
        onToggleTask={handleToggleTask}
        onAddComment={handleAddComment}
        onAddAttachments={handleAddAttachments}
        onChangeTech={handleChangeTech}
        onChangeLabel={handleChangeLabel}
      />
    </div>
  );
}
