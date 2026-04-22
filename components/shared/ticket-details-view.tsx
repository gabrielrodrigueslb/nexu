'use client';

import { useId, useState } from 'react';

import {
  CalendarDays,
  Check,
  ClipboardList,
  Copy,
  ListChecks,
  MessageSquareText,
  Paperclip,
  Send,
  Tag,
} from 'lucide-react';

import { ModalShell } from '@/components/modal-shell';
import { formatMoney } from '@/components/utils';

type TicketDetailsValueRow = {
  id: string;
  name: string;
  setup: number;
  recurring: number;
};

type TicketDetailsTask = {
  id: string;
  label: string;
  done: boolean;
  assignee?: string;
  dueDate?: string;
  group?: string;
};

type TicketDetailsHistoryItem = {
  id: string;
  actor?: string;
  message: string;
  createdAt: string;
};

type TicketDetailsAttachment = {
  id: string;
  name: string;
  subtitle?: string;
};

type TicketDetailsComment = {
  id: string;
  author: string;
  initials?: string;
  message: string;
  createdAt: string;
};

type TicketDetailsStatusChip = {
  id: string;
  label: string;
  active?: boolean;
};

type TicketDetailsField = {
  label: string;
  value: string;
  icon?: React.ReactNode;
  fullWidth?: boolean;
};

type TicketDetailsTable = {
  title: string;
  icon: React.ReactNode;
  rows: TicketDetailsValueRow[];
};

type TicketDetailsJourneyStep = {
  label: string;
  state: 'done' | 'active' | 'pending';
};

function CommentComposer({
  composerKey,
  placeholder,
  submitLabel,
  onSubmit,
}: {
  composerKey: string;
  placeholder: string;
  submitLabel: string;
  onSubmit: (value: string) => void;
}) {
  const [value, setValue] = useState('');

  return (
    <div className="mt-4 flex items-end gap-2">
      <textarea
        key={composerKey}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        className="min-h-[44px] flex-1 resize-none rounded-[10px] border border-[#dbe4f0] bg-white px-3 py-3 text-[13px] text-[#0f172a] outline-none"
      />
      <button
        type="button"
        onClick={() => {
          const trimmed = value.trim();
          if (!trimmed) return;
          onSubmit(trimmed);
          setValue('');
        }}
        className="inline-flex items-center gap-2 rounded-[8px] bg-[#2563eb] px-4 py-[10px] text-[13px] font-semibold text-white"
      >
        <Send className="size-4" />
        {submitLabel}
      </button>
    </div>
  );
}

function InfoField({ label, value, icon, fullWidth }: TicketDetailsField) {
  return (
    <div
      className={`rounded-[10px] border border-[#e2e8f0] bg-[#f8fafc] p-3 ${
        fullWidth ? 'md:col-span-2' : ''
      }`}
    >
      <div className="mb-1 text-[10px] font-bold tracking-[.06em] text-[#64748b] uppercase">
        {label}
      </div>
      <div className="inline-flex items-center gap-2 text-[13px] font-medium text-[#0f172a]">
        {icon}
        {value || '-'}
      </div>
    </div>
  );
}

function ValueTable({ title, icon, rows }: TicketDetailsTable) {
  return (
    <div className="rounded-[12px] border border-[#e2e8f0] bg-white p-4">
      <div className="mb-3 flex items-center gap-2 text-[12px] font-bold tracking-[.06em] text-[#0f172a]">
        {icon}
        <span>{title}</span>
      </div>
      <div className="overflow-hidden rounded-[10px] border border-[#e2e8f0]">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#f8fafc]">
              <th className="px-3 py-2 text-left text-[10px] font-bold tracking-[.06em] text-[#64748b] uppercase">
                {title.slice(0, -1)}
              </th>
              <th className="px-3 py-2 text-right text-[10px] font-bold tracking-[.06em] text-[#64748b] uppercase">
                Setup
              </th>
              <th className="px-3 py-2 text-right text-[10px] font-bold tracking-[.06em] text-[#64748b] uppercase">
                Recorrência
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row) => (
                <tr key={row.id} className="border-t border-[#e2e8f0]">
                  <td className="px-3 py-3 text-[13px] font-semibold text-[#0f172a]">{row.name}</td>
                  <td className="px-3 py-3 text-right text-[13px] text-[#0f172a]">
                    {formatMoney(row.setup)}
                  </td>
                  <td className="px-3 py-3 text-right text-[13px] text-[#0f172a]">
                    {formatMoney(row.recurring)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-[13px] text-[#64748b]">
                  Nenhum item selecionado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function TicketDetailsView({
  open,
  onClose,
  title,
  description,
  protocol,
  badges,
  metaItems,
  journeySteps,
  setupTotal,
  recurringTotal,
  infoFields,
  notes,
  notesLabel = 'Observacao',
  tasks,
  onToggleTask,
  valueTables,
  attachments,
  historyItems,
  comments,
  statusChips,
  techAssignment,
  footer,
  banner,
  headerActions,
  maxWidthClassName = 'max-w-[760px]',
  journeyTitle = 'Jornada do ticket',
  infoTitle = 'Dados do cliente',
  tasksTitle = 'Tarefas',
  historyTitle = 'Histórico',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  protocol: string;
  badges: React.ReactNode[];
  metaItems: React.ReactNode[];
  journeySteps?: TicketDetailsJourneyStep[];
  setupTotal: string;
  recurringTotal: string;
  infoFields: TicketDetailsField[];
  notes: string;
  notesLabel?: string;
  tasks: TicketDetailsTask[];
  onToggleTask?: (taskId: string) => void;
  valueTables: TicketDetailsTable[];
  attachments?: {
    title?: string;
    helperText?: string;
    emptyText?: string;
    actionLabel?: string;
    items: TicketDetailsAttachment[];
    onAdd?: (files: File[]) => void;
  };
  historyItems: TicketDetailsHistoryItem[];
  comments?: {
    title?: string;
    emptyText?: string;
    inputPlaceholder?: string;
    submitLabel?: string;
    items: TicketDetailsComment[];
    onSubmit?: (value: string) => void;
  };
  statusChips?: {
    title?: string;
    items: TicketDetailsStatusChip[];
  };
  techAssignment?: {
    label?: string;
    control: React.ReactNode;
  };
  footer?: React.ReactNode;
  banner?: React.ReactNode;
  headerActions?: React.ReactNode;
  maxWidthClassName?: string;
  journeyTitle?: string;
  infoTitle?: string;
  tasksTitle?: string;
  historyTitle?: string;
}) {
  const completedTasks = tasks.filter((task) => task.done).length;
  const progressPercent = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0;
  const attachmentInputId = useId();
  const groupedTasks = tasks.reduce<Record<string, TicketDetailsTask[]>>((acc, task) => {
    const key = task.group || 'Tarefas';
    acc[key] = acc[key] || [];
    acc[key].push(task);
    return acc;
  }, {});

  return (
    <ModalShell
      open={open}
      title={title}
      description={description}
      maxWidthClassName={maxWidthClassName}
      onClose={onClose}
      headerActions={headerActions}
      footer={footer}
    >
      <div className="grid gap-4">
        {banner}

        <div className="flex flex-col gap-3 rounded-[12px] border border-[#d7dfeb] bg-[#f8fafc] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[11px] font-bold tracking-[.12em] text-[#64748b] uppercase">
                Protocolo
              </span>
              <span className="font-mono text-[15px] font-extrabold tracking-[.04em] text-[#1d4ed8]">
                {protocol}
              </span>
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(protocol)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] border border-[#d7dfeb] bg-white text-[#64748b]"
              >
                <Copy className="size-4" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">{badges}</div>
          </div>

          {journeySteps?.length ? (
            <div>
              <div className="mb-3 text-[11px] font-bold tracking-[.06em] text-[#64748b] uppercase">
                {journeyTitle}
              </div>
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                {journeySteps.map((step, index) => (
                  <div key={`${step.label}-${index}`} className="flex min-w-0 flex-1 items-center gap-3">
                    <div
                      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[13px] font-bold ${
                        step.state === 'active'
                          ? 'border-[#2563eb] bg-[#2563eb] text-white'
                          : step.state === 'done'
                            ? 'border-[#10b981] bg-[#10b981] text-white'
                            : 'border-[#cbd5e1] bg-white text-[#94a3b8]'
                      }`}
                    >
                      {step.state === 'done' ? <Check className="size-4" /> : index + 1}
                    </div>
                    <div className="min-w-0 text-[12px] font-semibold text-[#0f172a]">{step.label}</div>
                    {index < journeySteps.length - 1 ? (
                      <div
                        className={`hidden h-[2px] flex-1 rounded-full md:block ${
                          step.state === 'done' ? 'bg-[#10b981]' : 'bg-[#d7dfeb]'
                        }`}
                      />
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">{metaItems}</div>
        </div>

        <div className="rounded-[12px] border border-[#e2e8f0] bg-white p-4">
          <div className="mb-3 text-[12px] font-bold tracking-[.06em] text-[#64748b] uppercase">
            {infoTitle}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {infoFields.map((field) => (
              <InfoField key={`${field.label}-${field.value}`} {...field} />
            ))}
            <div className="rounded-[10px] border border-[#e2e8f0] bg-[#f8fafc] p-3 md:col-span-2">
              <div className="mb-1 text-[10px] font-bold tracking-[.06em] text-[#64748b] uppercase">
                {notesLabel}
              </div>
              <p className="whitespace-pre-wrap text-[13px] leading-6 text-[#475569]">
                {notes || 'Sem observacoes registradas para este ticket.'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          {valueTables.map((table) => (
            <ValueTable key={table.title} {...table} />
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-6 rounded-[10px] bg-[#0f172a] px-4 py-3 text-white">
          <div>
            <div className="mb-[2px] text-[11px] font-semibold text-[#94a3b8]">Total Setup</div>
            <div className="text-[18px] font-extrabold">{setupTotal}</div>
          </div>
          <div>
            <div className="mb-[2px] text-[11px] font-semibold text-[#94a3b8]">
              Total Recorrência
            </div>
            <div className="text-[18px] font-extrabold">{recurringTotal}</div>
          </div>
        </div>

        <div className="rounded-[12px] border border-[#e2e8f0] bg-white p-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 text-[12px] font-bold text-[#0f172a]">
              <ListChecks className="size-4 text-[#16a34a]" />
              {tasksTitle}
              <span className="text-[11px] font-medium text-[#64748b]">
                {completedTasks}/{tasks.length} ({progressPercent}%)
              </span>
            </div>
          </div>

          <div className="mb-4 h-[3px] overflow-hidden rounded-full bg-[#e2e8f0]">
            <div
              className="h-full rounded-full bg-[#10b981] transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {tasks.length ? (
            <div className="space-y-4">
              {Object.entries(groupedTasks).map(([group, items]) => (
                <div key={group}>
                  {group !== 'Tarefas' ? (
                    <div className="mb-2 text-[11px] font-bold tracking-[.06em] text-[#64748b] uppercase">
                      {group}
                    </div>
                  ) : null}
                  <div className="space-y-2">
                    {items.map((task) => {
                      const Wrapper = onToggleTask ? 'button' : 'div';

                      return (
                        <Wrapper
                          key={task.id}
                          {...(onToggleTask
                            ? {
                                type: 'button' as const,
                                onClick: () => onToggleTask(task.id),
                              }
                            : {})}
                          className={`flex w-full items-center gap-3 rounded-[10px] border px-3 py-3 text-left ${
                            task.done
                              ? 'border-[#a7f3d0] bg-[#f0fdf4]'
                              : 'border-[#e2e8f0] bg-[#f8fafc]'
                          }`}
                        >
                          <span
                            className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] border text-[11px] ${
                              task.done
                                ? 'border-[#10b981] bg-[#10b981] text-white'
                                : 'border-[#cbd5e1] bg-white text-transparent'
                            }`}
                          >
                            <Check className="size-3.5" />
                          </span>

                          <div className="min-w-0 flex-1 text-[13px] font-medium text-[#0f172a]">
                            <div className={task.done ? 'text-[#64748b] line-through' : ''}>
                              {task.label}
                            </div>
                          </div>

                          {task.assignee ? (
                            <div className="rounded-[8px] border border-[#e2e8f0] bg-white px-3 py-[6px] text-[11px] font-medium text-[#475569]">
                              {task.assignee}
                            </div>
                          ) : null}

                          <div className="inline-flex items-center gap-1 rounded-[8px] border border-[#e2e8f0] bg-white px-3 py-[6px] text-[11px] font-medium text-[#475569]">
                            <CalendarDays className="size-3.5" />
                            {task.dueDate || '--/--/----'}
                          </div>
                        </Wrapper>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[10px] border border-dashed border-[#cbd5e1] bg-[#f8fafc] px-4 py-6 text-center text-[13px] text-[#64748b]">
              Nenhuma tarefa cadastrada para este ticket.
            </div>
          )}
        </div>

        {attachments ? (
          <div className="rounded-[12px] border border-[#e2e8f0] bg-white p-4">
            <div className="mb-3 inline-flex items-center gap-2 text-[12px] font-bold text-[#0f172a]">
              <Paperclip className="size-4" />
              {attachments.title ?? 'Anexos'}
              {attachments.helperText ? (
                <span className="text-[11px] font-medium text-[#64748b]">{attachments.helperText}</span>
              ) : null}
            </div>

            {attachments.items.length ? (
              <div className="space-y-2">
                {attachments.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-[10px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-3"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-semibold text-[#0f172a]">{item.name}</div>
                      {item.subtitle ? (
                        <div className="mt-1 text-[11px] text-[#64748b]">{item.subtitle}</div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mb-3 text-[13px] text-[#64748b]">
                {attachments.emptyText ?? 'Sem anexos'}
              </div>
            )}

            <div>
              <input
                id={attachmentInputId}
                type="file"
                multiple
                className="hidden"
                onChange={(event) => {
                  const files = event.target.files ? Array.from(event.target.files) : [];
                  if (files.length && attachments.onAdd) attachments.onAdd(files);
                  event.target.value = '';
                }}
              />
              <label
                htmlFor={attachmentInputId}
                className={`flex min-h-[48px] items-center justify-center rounded-[10px] border border-dashed px-4 py-3 text-center text-[13px] ${
                  attachments.onAdd
                    ? 'cursor-pointer border-[#bfdbfe] bg-[#f8fbff] font-medium text-[#2563eb]'
                    : 'cursor-not-allowed border-[#dbe4f0] bg-[#f8fafc] text-[#94a3b8]'
                }`}
              >
                {attachments.actionLabel ?? 'Clique para adicionar PDF, imagem ou documento'}
              </label>
            </div>
          </div>
        ) : null}

        <div className="rounded-[12px] border border-[#e2e8f0] bg-white p-4">
          <div className="mb-3 inline-flex items-center gap-2 text-[12px] font-bold text-[#0f172a]">
            <ClipboardList className="size-4" />
            {historyTitle}
          </div>
          {historyItems.length ? (
            <div className="space-y-2">
              {historyItems.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 rounded-[10px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-3"
                >
                  <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[#10b981]" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold text-[#0f172a]">
                      {item.actor ? (
                        <>
                          <span>{item.actor}</span>{' '}
                          <span className="font-medium text-[#334155]">{item.message}</span>
                        </>
                      ) : (
                        item.message
                      )}
                    </div>
                    <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-[#64748b]">
                      <CalendarDays className="size-3.5" />
                      {item.createdAt}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[10px] border border-dashed border-[#cbd5e1] bg-[#f8fafc] px-4 py-6 text-center text-[13px] text-[#64748b]">
              Sem historico registrado.
            </div>
          )}
        </div>

        {comments ? (
          <div className="rounded-[12px] border border-[#e2e8f0] bg-white p-4">
            <div className="mb-3 inline-flex items-center gap-2 text-[12px] font-bold text-[#0f172a]">
              <MessageSquareText className="size-4" />
              {comments.title ?? 'Comentários'}
              <span className="inline-flex min-w-6 items-center justify-center rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-1.5 py-[2px] text-[10px] font-bold text-[#2563eb]">
                {comments.items.length}
              </span>
            </div>

            {comments.items.length ? (
              <div className="space-y-2">
                {comments.items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[10px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2563eb] text-[11px] font-bold text-white">
                        {item.initials || item.author.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-[13px] font-semibold text-[#0f172a]">{item.author}</div>
                          <div className="text-[11px] text-[#64748b]">{item.createdAt}</div>
                        </div>
                        <div className="mt-1 whitespace-pre-wrap text-[13px] leading-6 text-[#475569]">
                          {item.message}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[10px] border border-dashed border-[#cbd5e1] bg-[#f8fafc] px-4 py-6 text-center text-[13px] text-[#64748b]">
                {comments.emptyText ?? 'Nenhum comentario.'}
              </div>
            )}

            {comments.onSubmit ? (
              <CommentComposer
                composerKey={`${protocol}-${open ? 'open' : 'closed'}`}
                placeholder={comments.inputPlaceholder ?? 'Comentario...'}
                submitLabel={comments.submitLabel ?? 'Enviar'}
                onSubmit={comments.onSubmit}
              />
            ) : null}
          </div>
        ) : null}

        {statusChips || techAssignment ? (
          <div className="rounded-[12px] border border-[#e2e8f0] bg-white p-4">
            {statusChips ? (
              <div>
                <div className="mb-3 inline-flex items-center gap-2 text-[12px] font-bold text-[#0f172a]">
                  <Tag className="size-4" />
                  {statusChips.title ?? 'Status Kanban'}
                </div>
                <div className="flex flex-wrap gap-2">
                  {statusChips.items.map((item) => (
                    <span
                      key={item.id}
                      className={`inline-flex rounded-full border px-3 py-[6px] text-[12px] font-semibold ${
                        item.active
                          ? 'border-[#2563eb] bg-[#2563eb] text-white'
                          : 'border-[#dbe4f0] bg-white text-[#475569]'
                      }`}
                    >
                      {item.label}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {techAssignment ? (
              <div className={statusChips ? 'mt-4' : ''}>
                <div className="mb-2 text-[11px] font-bold tracking-[.06em] text-[#64748b] uppercase">
                  {techAssignment.label ?? 'Resp. técnico'}
                </div>
                {techAssignment.control}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </ModalShell>
  );
}
