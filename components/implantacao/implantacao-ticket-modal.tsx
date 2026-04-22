'use client';

import { useState } from 'react';

import {
  CalendarDays,
  ExternalLink,
  FileText,
  Mail,
  Tag,
  UserRound,
  Wrench,
} from 'lucide-react';

import { formatMoney } from '@/components/utils';
import { TicketDetailsView } from '@/components/shared/ticket-details-view';

import {
  formatDatePt,
  getTechNameById,
  getTechOptions,
  IMPLANTACAO_COLUMNS,
  type ImplantacaoTicket,
  sumRecurring,
  sumSetup,
} from './implantacao-shared';

function buildJourneySteps(ticket: ImplantacaoTicket) {
  if (ticket.status === 'done') {
    return [
      { label: 'Cadastro', state: 'done' as const },
      { label: 'Pagamento', state: 'done' as const },
      { label: 'Aprovação', state: 'done' as const },
      { label: 'Implantado', state: 'done' as const },
    ];
  }

  if (ticket.csStatus === 'Go-live') {
    return [
      { label: 'Cadastro', state: 'done' as const },
      { label: 'Pagamento', state: 'done' as const },
      { label: 'Aprovação', state: 'done' as const },
      { label: 'Implantado', state: 'active' as const },
    ];
  }

  return [
    { label: 'Cadastro', state: 'done' as const },
    { label: 'Pagamento', state: 'done' as const },
    { label: 'Aprovação', state: 'active' as const },
    { label: 'Implantado', state: 'pending' as const },
  ];
}

export function ImplantacaoTicketModal({
  ticket,
  open,
  onClose,
  onToggleTask,
  onAddComment,
  onAddAttachments,
  onChangeTech,
  onChangeLabel,
}: {
  ticket: ImplantacaoTicket | null;
  open: boolean;
  onClose: () => void;
  onToggleTask: (ticketId: string, taskId: string) => void;
  onAddComment: (ticketId: string, message: string) => void;
  onAddAttachments: (ticketId: string, files: File[]) => void;
  onChangeTech: (ticketId: string, techId: string) => void;
  onChangeLabel: (ticketId: string, label: ImplantacaoTicket['csStatus']) => void;
}) {
  const [editingTicketId, setEditingTicketId] = useState<string | null>(null);
  const isEditing = Boolean(open && ticket?.id && editingTicketId === ticket.id);

  if (!ticket) return null;

  const labelOptions: ImplantacaoTicket['csStatus'][] = [...IMPLANTACAO_COLUMNS, 'Concluído'];
  const techOptions = getTechOptions();

  return (
    <TicketDetailsView
      open={open}
      onClose={onClose}
      title={ticket.nome}
      description={`${ticket.cnpj || '-'} - ${ticket.status === 'done' ? 'Conclu\u00EDdo' : 'Em Implanta\u00E7\u00E3o'}`}
      protocol={ticket.proto}
      badges={[
        <span
          key="status"
          className="inline-flex rounded-full border border-[#ddd6fe] bg-[#f5f3ff] px-[10px] py-[4px] text-[11px] font-bold text-[#7c3aed]"
        >
          {ticket.status === 'done' ? 'Conclu\u00EDdo' : 'Em Implanta\u00E7\u00E3o'}
        </span>,
        <span
          key="type"
          className="inline-flex rounded-full border border-[#a7f3d0] bg-[#ecfdf5] px-[10px] py-[4px] text-[11px] font-bold text-[#059669]"
        >
          {ticket.tipo === 'inclusao' ? 'Upsell' : 'Novo'}
        </span>,
        <span
          key="stage"
          className="inline-flex rounded-full border border-[#e2e8f0] bg-white px-[10px] py-[4px] text-[11px] font-bold text-[#475569]"
        >
          {ticket.csStatus}
        </span>,
      ]}
      metaItems={[
        <span
          key="created"
          className="inline-flex items-center gap-1.5 rounded-full border border-[#e2e8f0] bg-white px-3 py-1.5 text-[11px] font-medium text-[#475569]"
        >
          <CalendarDays className="size-3.5 text-[#64748b]" />
          Criado em {formatDatePt(ticket.createdAt)}
        </span>,
        <span
          key="requester"
          className="inline-flex items-center gap-1.5 rounded-full border border-[#e2e8f0] bg-white px-3 py-1.5 text-[11px] font-medium text-[#475569]"
        >
          <UserRound className="size-3.5 text-[#64748b]" />
          Resp. solicitação: {ticket.respSolicitacao}
        </span>,
        <span
          key="tech"
          className="inline-flex items-center gap-2 rounded-full border border-[#e2e8f0] bg-white px-3 py-1.5 text-[11px] font-medium text-[#475569]"
        >
          <Wrench className="size-3.5 text-[#64748b]" />
          <span>Resp. técnico:</span>
          <select
            value={ticket.respTec}
            onChange={(event) => onChangeTech(ticket.id, event.target.value)}
            disabled={!isEditing}
            className="min-w-[150px] bg-transparent text-[11px] font-semibold text-[#0f172a] outline-none disabled:cursor-default"
          >
            {techOptions.map((tech) => (
              <option key={tech.id} value={tech.id}>
                {tech.name}
              </option>
            ))}
          </select>
        </span>,
        <span
          key="label"
          className="inline-flex items-center gap-2 rounded-full border border-[#e2e8f0] bg-white px-3 py-1.5 text-[11px] font-medium text-[#475569]"
        >
          <Tag className="size-3.5 text-[#64748b]" />
          <span>Etiqueta:</span>
          <select
            value={ticket.csStatus}
            onChange={(event) =>
              onChangeLabel(ticket.id, event.target.value as ImplantacaoTicket['csStatus'])
            }
            disabled={!isEditing}
            className="min-w-[150px] bg-transparent text-[11px] font-semibold text-[#0f172a] outline-none disabled:cursor-default"
          >
            {labelOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </span>,
        ...(ticket.updatedAt
          ? [
              <span
                key="updated"
                className="inline-flex items-center gap-1.5 rounded-full border border-[#e2e8f0] bg-white px-3 py-1.5 text-[11px] font-medium text-[#475569]"
              >
                <CalendarDays className="size-3.5 text-[#64748b]" />
                Atualizado em {formatDatePt(ticket.updatedAt)}
              </span>,
            ]
          : []),
      ]}
      journeySteps={buildJourneySteps(ticket)}
      setupTotal={formatMoney(sumSetup(ticket))}
      recurringTotal={formatMoney(sumRecurring(ticket))}
      infoTitle="Dados do cliente"
      infoFields={[
        { label: 'Nome', value: ticket.nome },
        { label: 'CNPJ', value: ticket.cnpj || '-' },
        { label: 'Telefone', value: ticket.telefone || '-' },
        { label: 'Instância', value: ticket.instancia || '-' },
        {
          label: 'E-mail',
          value: ticket.email || '-',
          icon: <Mail className="size-4 text-[#64748b]" />,
        },
        {
          label: 'Site',
          value: ticket.site || '-',
          icon: <ExternalLink className="size-4 text-[#64748b]" />,
        },
        { label: 'Plano', value: ticket.plano || '-' },
        { label: 'Resp. solicitação', value: ticket.respSolicitacao || '-' },
        { label: 'Pagamento', value: ticket.formaPagamento || '-', fullWidth: true },
        { label: 'Etapa', value: ticket.csStatus || '-' },
      ]}
      notes={ticket.observacao}
      notesLabel="Observacao"
      tasks={ticket.tasks.map((task) => ({
        id: task.id,
        label: task.title,
        done: task.done,
        assignee: getTechNameById(task.assigneeId),
        dueDate: task.endDate ? formatDatePt(task.endDate) : undefined,
        group: ticket.products.some((item) => item.name === task.title)
          ? 'Produtos'
          : ticket.integrations.some((item) => item.name === task.title)
            ? 'Integrações'
            : 'Tarefas',
      }))}
      onToggleTask={isEditing ? (taskId) => onToggleTask(ticket.id, taskId) : undefined}
      valueTables={[
        {
          title: 'Produtos',
          icon: <FileText className="size-4 text-[#2563eb]" />,
          rows: ticket.products,
        },
        {
          title: 'Integrações',
          icon: <ExternalLink className="size-4 text-[#7c3aed]" />,
          rows: ticket.integrations,
        },
      ]}
      attachments={{
        title: 'Anexos',
        helperText: '(clique para adicionar)',
        emptyText: 'Sem anexos',
        actionLabel: 'Clique para adicionar PDF, imagem ou documento',
        items: ticket.attachments,
        onAdd: isEditing ? (files) => onAddAttachments(ticket.id, files) : undefined,
      }}
      historyItems={ticket.history.map((item) => ({
        id: item.id,
        actor: item.actor,
        message: item.message,
        createdAt: formatDatePt(item.createdAt),
      }))}
      comments={{
        title: 'Comentários',
        emptyText: 'Nenhum comentário.',
        inputPlaceholder: 'Comentário...',
        submitLabel: 'Enviar',
        items: ticket.comments.map((item) => ({
          id: item.id,
          author: item.author,
          initials: item.author
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase() ?? '')
            .join(''),
          message: item.message,
          createdAt: formatDatePt(item.createdAt),
        })),
        onSubmit: (message) => onAddComment(ticket.id, message),
      }}
      footer={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[8px] border border-[#e2e8f0] bg-white px-4 py-[9px] text-[13px] font-semibold text-[#64748b]"
          >
            Fechar
          </button>
          {isEditing ? (
            <button
              type="button"
              onClick={() => setEditingTicketId(null)}
              className="rounded-[8px] bg-[#2563eb] px-4 py-[9px] text-[13px] font-semibold text-white"
            >
              Concluir edição
            </button>
          ) : null}
        </div>
      }
      headerActions={
        <button
          type="button"
          onClick={() => setEditingTicketId(ticket.id)}
          disabled={isEditing}
          className="rounded-[8px] border-[1.5px] border-[#e2e8f0] px-4 py-2 text-[13px] font-bold text-[#0f172a] hover:bg-[#f8fafc] disabled:cursor-default disabled:opacity-60"
        >
          Editar
        </button>
      }
    />
  );
}
