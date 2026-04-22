'use client';

import { useMemo, useState } from 'react';
import {
  Archive,
  CalendarDays,
  CheckCircle2,
  CircleDashed,
  Download,
  LayoutGrid,
  ListFilter,
  Package2,
  UserRound,
  Wrench,
  X,
} from 'lucide-react';

import { KanbanBoard } from '@/components/kanban-board';
import type { SupportTicketType } from '@/components/dashboard-support/types';
import { cn } from '@/lib/utils';

import { ImplantacaoTicketModal } from './implantacao-ticket-modal';
import {
  useCurrentAdminUser,
} from '@/components/admin-users-storage';
import {
  formatDatePt,
  getTechNameById,
  getTicketProgress,
  IMPLANTACAO_COLUMNS,
  inDateRange,
  type ImplantacaoColumn,
  type ImplantacaoTicket,
  useImplantacaoTickets,
} from './implantacao-shared';

type ColumnFilter = 'all' | 'finalizados' | ImplantacaoColumn;

function downloadCsv(rows: ImplantacaoTicket[]) {
  const header = [
    'Empresa',
    'Tipo',
    'Status',
    'Etapa CS',
    'Produto',
    'Responsável Técnico',
    'Criado em',
    'Atualizado em',
    'Progresso',
  ];

  const lines = rows.map((ticket) =>
    [
      ticket.nome,
      ticket.tipo,
      ticket.status,
      ticket.csStatus,
      ticket.produto,
      getTechNameById(ticket.respTec),
      ticket.createdAt,
      ticket.updatedAt ?? '',
      `${getTicketProgress(ticket)}%`,
    ]
      .map((value) => `"${String(value).replaceAll('"', '""')}"`)
      .join(';'),
  );

  const csv = [header.join(';'), ...lines].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'implantacao-cs.csv';
  link.click();
  URL.revokeObjectURL(url);
}

function TypeBadge({ type }: { type: SupportTicketType }) {
  const label = type === 'inclusao' ? 'Upsell' : 'Novo';
  const className =
    type === 'inclusao'
      ? 'border-[#ddd6fe] bg-[#f5f3ff] text-[#7c3aed]'
      : 'border-[#bfdbfe] bg-[#eff6ff] text-[#2563eb]';

  return (
    <span className={cn('rounded-full border px-2 py-1 text-[10px] font-bold', className)}>
      {label}
    </span>
  );
}

function TicketCard({
  ticket,
  onOpen,
}: {
  ticket: ImplantacaoTicket;
  onOpen: () => void;
}) {
  const progress = getTicketProgress(ticket);
  const techName = getTechNameById(ticket.respTec);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full cursor-pointer rounded-[10px] border border-[#dbe4f0] bg-white p-3 text-left shadow-[0_8px_20px_rgba(15,23,42,0.05)] transition-transform hover:-translate-y-0.5"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-[14px] font-bold text-[#0f172a]">{ticket.nome}</div>
          <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-[#64748b]">
            <Package2 className="size-3.5" />
            <span>{ticket.produto}</span>
          </div>
        </div>
        <TypeBadge type={ticket.tipo} />
      </div>

      <div className="mb-3 rounded-[8px] bg-[#f8fafc] px-3 py-2 text-[11px] text-[#64748b]">
        <span className="inline-flex items-center gap-1.5">
          <LayoutGrid className="size-3.5 text-[#2563eb]" />
          <span>
            Etapa atual: <span className="font-semibold text-[#2563eb]">{ticket.csStatus}</span>
          </span>
        </span>
      </div>

      {ticket.tasks.length ? (
        <div className="mb-3">
          <div className="mb-1.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.05em] text-[#64748b]">
            <span>Progresso</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-[#e2e8f0]">
            <div
              className="h-2 rounded-full bg-[#2563eb] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-1 text-[11px] text-[#64748b]">
            {ticket.tasks.filter((task) => task.done).length}/{ticket.tasks.length} tarefas
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2 text-[10px] font-semibold text-[#64748b]">
        <span className="inline-flex items-center gap-1 rounded-full border border-[#e2e8f0] bg-[#f8fafc] px-2 py-1">
          <CalendarDays className="size-3.5" />
          {formatDatePt(ticket.createdAt)}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-[#dbeafe] bg-[#eff6ff] px-2 py-1 text-[#2563eb]">
          <Wrench className="size-3.5" />
          {techName.split(' ')[0]}
        </span>
      </div>
    </button>
  );
}

function CompletedTicketCard({
  ticket,
  onOpen,
}: {
  ticket: ImplantacaoTicket;
  onOpen: () => void;
}) {
  const techName = getTechNameById(ticket.respTec);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full rounded-[10px] border border-[#dbe4f0] bg-white p-4 text-left shadow-[0_10px_24px_rgba(15,23,42,0.06)]"
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full border border-[#bbf7d0] bg-[#f0fdf4] px-2 py-1 text-[10px] font-bold text-[#15803d]">
          <CheckCircle2 className="size-3.5" />
          Finalizado
        </span>
        <TypeBadge type={ticket.tipo} />
      </div>

      <div className="text-[15px] font-bold text-[#0f172a]">{ticket.nome}</div>
      <div className="mt-1 inline-flex items-center gap-1 text-[12px] text-[#64748b]">
        <Package2 className="size-3.5" />
        <span>{ticket.produto}</span>
      </div>

      <div className="mt-3 grid gap-2 text-[11px] text-[#64748b]">
        <div className="inline-flex items-center gap-1.5">
          <CalendarDays className="size-3.5" />
          <span>
            Criado em <span className="font-semibold text-[#0f172a]">{formatDatePt(ticket.createdAt)}</span>
          </span>
        </div>
        <div className="inline-flex items-center gap-1.5">
          <Archive className="size-3.5" />
          <span>
            Finalizado em{' '}
            <span className="font-semibold text-[#0f172a]">{formatDatePt(ticket.updatedAt)}</span>
          </span>
        </div>
        <div className="inline-flex items-center gap-1.5">
          <Wrench className="size-3.5" />
          <span>
            Resp. técnico <span className="font-semibold text-[#2563eb]">{techName}</span>
          </span>
        </div>
      </div>
    </button>
  );
}

export function ImplantacaoKanban() {
  const { currentUser } = useCurrentAdminUser();
  const [tickets, setTickets] = useImplantacaoTickets();
  const [columnFilter, setColumnFilter] = useState<ColumnFilter>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | SupportTicketType>('all');
  const [techFilter, setTechFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [viewingTicketId, setViewingTicketId] = useState<string | null>(null);

  const activeTickets = useMemo(
    () =>
      tickets.filter(
        (ticket) =>
          ticket.status === 'active' && inDateRange(ticket.createdAt, dateFrom, dateTo),
      ),
    [dateFrom, dateTo, tickets],
  );

  const completedTickets = useMemo(
    () =>
      tickets.filter(
        (ticket) =>
          ticket.status === 'done' &&
          inDateRange(ticket.updatedAt ?? ticket.createdAt, dateFrom, dateTo),
      ),
    [dateFrom, dateTo, tickets],
  );

  const filteredActiveTickets = useMemo(() => {
    return activeTickets.filter((ticket) => {
      if (typeFilter !== 'all' && ticket.tipo !== typeFilter) return false;
      if (techFilter && ticket.respTec !== techFilter) return false;
      return true;
    });
  }, [activeTickets, techFilter, typeFilter]);

  const filteredCompletedTickets = useMemo(() => {
    return completedTickets.filter((ticket) => {
      if (typeFilter !== 'all' && ticket.tipo !== typeFilter) return false;
      if (techFilter && ticket.respTec !== techFilter) return false;
      return true;
    });
  }, [completedTickets, techFilter, typeFilter]);

  const filteredTicketsForExport =
    columnFilter === 'finalizados'
      ? filteredCompletedTickets
      : columnFilter === 'all'
        ? filteredActiveTickets
        : filteredActiveTickets.filter((ticket) => ticket.csStatus === columnFilter);

  const activeCount = filteredActiveTickets.length;
  const doneCount = filteredCompletedTickets.length;
  const techsInScope = useMemo(
    () =>
      [...new Set(tickets.map((ticket) => ticket.respTec))]
        .filter(Boolean)
        .map((id) => ({ id, name: getTechNameById(id) })),
    [tickets],
  );

  const kanbanColumns = useMemo(
    () =>
      IMPLANTACAO_COLUMNS.map((column) => ({
        id: column,
        title: column,
        items: filteredActiveTickets.filter((ticket) => ticket.csStatus === column),
      })),
    [filteredActiveTickets],
  );

  const viewingTicket = tickets.find((ticket) => ticket.id === viewingTicketId) ?? null;

  function moveTicket(ticketId: string, targetColumn: ImplantacaoColumn) {
    setTickets((current) =>
      current.map((ticket) =>
        ticket.id === ticketId && ticket.status === 'active'
          ? {
              ...ticket,
              csStatus: targetColumn,
              updatedAt: new Date().toISOString().slice(0, 10),
              history: [
                ...ticket.history,
                {
                  id: `${ticket.id}-hist-move-${Date.now()}`,
                  actor: ticket.respSolicitacao || getTechNameById(ticket.respTec),
                  message: `Ticket movido para a etapa ${targetColumn}.`,
                  createdAt: new Date().toISOString().slice(0, 10),
                },
              ],
            }
          : ticket,
      ),
    );
  }

  function toggleTask(ticketId: string, taskId: string) {
    setTickets((current) =>
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
          updatedAt: new Date().toISOString().slice(0, 10),
          history: [
            ...ticket.history,
            {
              id: `${ticket.id}-hist-task-${taskId}-${Date.now()}`,
              actor: getTechNameById(ticket.respTec),
              message: `Tarefa "${targetTask.title}" ${nextDone ? 'concluida' : 'reaberta'}.`,
              createdAt: new Date().toISOString().slice(0, 10),
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
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="mb-[18px] flex items-start justify-between gap-3">
        <div>
          <div className="text-[19px] font-extrabold tracking-[-0.4px] text-[#0f172a]">
            Implantação / CS
          </div>
          <div className="mt-0.5 text-[13px] text-[#64748b]">
            Kanban operacional de implantações em andamento e finalizadas
          </div>
          <div className="mt-1 text-[11px] font-semibold text-[#2563eb]">
            {activeCount} ativo(s) | {doneCount} finalizado(s) no período
          </div>
        </div>

        <button
          type="button"
          onClick={() => downloadCsv(filteredTicketsForExport)}
          className="rounded-[6px] border border-[#e2e8f0] bg-white px-3 py-[7px] text-[12px] font-semibold text-[#64748b] transition-colors hover:bg-[#f8fafc] hover:text-[#0f172a]"
        >
          <span className="inline-flex items-center gap-1.5">
            <Download className="size-[14px]" />
            <span>Exportar</span>
          </span>
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-[10px] rounded-[10px] border border-[#e2e8f0] bg-white px-4 py-3">
        <div className="flex flex-wrap items-center gap-[10px]">
          <label className="inline-flex items-center gap-2 rounded-[8px] border border-[#e2e8f0] bg-white px-[10px] py-[7px] text-[13px] text-[#64748b]">
            <LayoutGrid className="size-[14px]" />
            <select
              value={columnFilter}
              onChange={(event) => setColumnFilter(event.target.value as ColumnFilter)}
              className="bg-transparent font-semibold text-[#0f172a] outline-none"
            >
              <option value="all">Kanban (todos)</option>
              <option value="finalizados">Finalizados</option>
              {IMPLANTACAO_COLUMNS.map((column) => (
                <option key={column} value={column}>
                  {column}
                </option>
              ))}
            </select>
          </label>

          <label className="inline-flex items-center gap-2 rounded-[8px] border border-[#e2e8f0] bg-white px-[10px] py-[7px] text-[13px] text-[#64748b]">
            <ListFilter className="size-[14px]" />
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as 'all' | SupportTicketType)}
              className="bg-transparent font-semibold text-[#0f172a] outline-none"
            >
              <option value="all">Todos os tipos</option>
              <option value="novo">Novos</option>
              <option value="inclusao">Upsell</option>
            </select>
          </label>

          <label className="inline-flex items-center gap-2 rounded-[8px] border border-[#e2e8f0] bg-white px-[10px] py-[7px] text-[13px] text-[#64748b]">
            <UserRound className="size-[14px]" />
            <select
              value={techFilter}
              onChange={(event) => setTechFilter(event.target.value)}
              className="bg-transparent font-semibold text-[#0f172a] outline-none"
            >
              <option value="">Todos os resp. tecnicos</option>
              {techsInScope.map((tech) => (
                <option key={tech.id} value={tech.id}>
                  {tech.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-[10px]">
          <span className="inline-flex items-center gap-2 text-[13px] font-bold text-[#64748b]">
            <CalendarDays className="size-4" />
            Período (por data de criação)
          </span>
          <label className="text-[12px] text-[#64748b]">De:</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
            className="rounded-[6px] border border-[#e2e8f0] bg-[#f1f5f9] px-2 py-[5px] text-[12px] text-[#0f172a] outline-none"
          />
          <label className="text-[12px] text-[#64748b]">Até:</label>
          <input
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
            className="rounded-[6px] border border-[#e2e8f0] bg-[#f1f5f9] px-2 py-[5px] text-[12px] text-[#0f172a] outline-none"
          />
          {dateFrom || dateTo ? (
            <button
              type="button"
              onClick={() => {
                setDateFrom('');
                setDateTo('');
              }}
              className="inline-flex items-center gap-1 rounded-[7px] border border-[#e2e8f0] bg-white px-3 py-[5px] text-[12px] font-semibold text-[#64748b]"
            >
              <X className="size-3.5" />
              Limpar
            </button>
          ) : null}
        </div>
      </div>

      {columnFilter === 'finalizados' ? (
        filteredCompletedTickets.length ? (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredCompletedTickets.map((ticket) => (
              <CompletedTicketCard
                key={ticket.id}
                ticket={ticket}
                onOpen={() => setViewingTicketId(ticket.id)}
              />
            ))}
          </section>
        ) : (
          <section className="rounded-[24px] border border-dashed border-[#cbd5e1] bg-white/80 px-6 py-14 text-center text-[#64748b] shadow-sm">
            Nenhum ticket finalizado no filtro selecionado.
          </section>
        )
      ) : columnFilter === 'all' ? (
        <section>
          <KanbanBoard
            columns={kanbanColumns}
            getItemId={(ticket) => ticket.id}
            onMoveItem={(ticketId, targetColumnId) => moveTicket(ticketId, targetColumnId)}
            canDragItem={(ticket) => ticket.status === 'active'}
            renderCard={(ticket) => (
              <TicketCard ticket={ticket} onOpen={() => setViewingTicketId(ticket.id)} />
            )}
          />
        </section>
      ) : filteredActiveTickets.filter((ticket) => ticket.csStatus === columnFilter).length ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredActiveTickets
            .filter((ticket) => ticket.csStatus === columnFilter)
            .map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onOpen={() => setViewingTicketId(ticket.id)}
              />
            ))}
        </section>
      ) : (
        <section className="rounded-[24px] border border-dashed border-[#cbd5e1] bg-white/80 px-6 py-14 text-center text-[#64748b] shadow-sm">
          <div className="flex flex-col items-center gap-3">
            <CircleDashed className="size-8 text-[#94a3b8]" />
            <div className="text-[14px] font-semibold text-[#64748b]">Nenhum ticket nesta etapa.</div>
          </div>
        </section>
      )}

      <ImplantacaoTicketModal
        open={Boolean(viewingTicket)}
        ticket={viewingTicket}
        onClose={() => setViewingTicketId(null)}
        onToggleTask={toggleTask}
        onAddComment={handleAddComment}
        onAddAttachments={handleAddAttachments}
        onChangeTech={handleChangeTech}
        onChangeLabel={handleChangeLabel}
      />
    </div>
  );
}
