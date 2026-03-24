'use client';

import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Copy,
  ExternalLink,
  FileText,
  Mail,
  UserRound,
  Wrench,
} from 'lucide-react';

import { ModalShell } from '@/components/modal-shell';
import { formatMoney } from '@/components/utils';

import {
  formatDatePt,
  getTechNameById,
  getTicketProgress,
  type ImplantacaoTicket,
  sumRecurring,
  sumSetup,
} from './implantacao-shared';

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[10px] border border-[#e2e8f0] bg-[#f8fafc] p-3">
      <div className="mb-1 text-[10px] font-bold tracking-[.06em] text-[#64748b] uppercase">
        {label}
      </div>
      <div className="text-[13px] font-medium text-[#0f172a]">{value || '-'}</div>
    </div>
  );
}

function ValueTable({
  title,
  rows,
  icon,
}: {
  title: string;
  rows: ImplantacaoTicket['products'];
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-[12px] border border-[#e2e8f0] bg-white p-4">
      <div className="mb-3 flex items-center gap-2 text-[12px] font-bold tracking-[.06em] text-[#64748b] uppercase">
        {icon}
        {title}
      </div>
      <div className="overflow-hidden rounded-[10px] border border-[#e2e8f0]">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#f8fafc]">
              <th className="px-3 py-2 text-left text-[10px] font-bold tracking-[.06em] text-[#64748b] uppercase">
                Item
              </th>
              <th className="px-3 py-2 text-right text-[10px] font-bold tracking-[.06em] text-[#64748b] uppercase">
                Setup
              </th>
              <th className="px-3 py-2 text-right text-[10px] font-bold tracking-[.06em] text-[#64748b] uppercase">
                Recorrencia
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-[#e2e8f0]">
                <td className="px-3 py-3 text-[13px] font-semibold text-[#0f172a]">{row.name}</td>
                <td className="px-3 py-3 text-right text-[13px] text-[#0f172a]">
                  {formatMoney(row.setup)}
                </td>
                <td className="px-3 py-3 text-right text-[13px] text-[#0f172a]">
                  {formatMoney(row.recurring)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ImplantacaoTicketModal({
  ticket,
  open,
  onClose,
  onToggleTask,
}: {
  ticket: ImplantacaoTicket | null;
  open: boolean;
  onClose: () => void;
  onToggleTask: (ticketId: string, taskId: string) => void;
}) {
  if (!ticket) return null;

  const completedTasks = ticket.tasks.filter((task) => task.done).length;
  const progressPercent = getTicketProgress(ticket);
  const techName = getTechNameById(ticket.respTec);

  return (
    <ModalShell
      open={open}
      title={ticket.nome}
      description={`${ticket.cnpj || '-'} - ${ticket.status === 'done' ? 'Concluido' : 'Em Implantacao'}`}
      maxWidthClassName="max-w-[980px]"
      onClose={onClose}
      footer={
        <button
          type="button"
          onClick={onClose}
          className="rounded-[8px] border border-[#e2e8f0] bg-white px-4 py-[9px] text-[13px] font-semibold text-[#64748b]"
        >
          Fechar
        </button>
      }
    >
      <div className="grid gap-4">
        <div className="flex flex-col gap-3 rounded-[12px] border border-[#d7dfeb] bg-[#f8fafc] p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[11px] font-bold tracking-[.12em] text-[#0f172a] uppercase">
              Protocolo
            </span>
            <span className="font-mono text-[15px] font-extrabold tracking-[.04em] text-[#1d4ed8]">
              {ticket.proto}
            </span>
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(ticket.proto)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] border border-[#d7dfeb] bg-white text-[#64748b]"
            >
              <Copy className="size-4" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 md:justify-end">
            <span className="inline-flex rounded-full border border-[#ddd6fe] bg-[#f5f3ff] px-[10px] py-[4px] text-[11px] font-bold text-[#7c3aed]">
              {ticket.status === 'done' ? 'Concluido' : 'Em Implantacao'}
            </span>
            <span className="inline-flex rounded-full border border-[#a7f3d0] bg-[#ecfdf5] px-[10px] py-[4px] text-[11px] font-bold text-[#059669]">
              {ticket.tipo === 'inclusao' ? 'Upsell' : 'Novo'}
            </span>
            <span className="inline-flex rounded-full border border-[#e2e8f0] bg-white px-[10px] py-[4px] text-[11px] font-bold text-[#475569]">
              {ticket.csStatus}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e2e8f0] bg-white px-3 py-1.5 text-[11px] font-medium text-[#475569]">
            <CalendarDays className="size-3.5 text-[#64748b]" />
            Criado em {formatDatePt(ticket.createdAt)}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e2e8f0] bg-white px-3 py-1.5 text-[11px] font-medium text-[#475569]">
            <UserRound className="size-3.5 text-[#64748b]" />
            Resp. solicitacao: {ticket.respSolicitacao}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e2e8f0] bg-white px-3 py-1.5 text-[11px] font-medium text-[#475569]">
            <Wrench className="size-3.5 text-[#64748b]" />
            Resp. tecnico: {techName}
          </span>
          {ticket.updatedAt ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e2e8f0] bg-white px-3 py-1.5 text-[11px] font-medium text-[#475569]">
              <ClipboardList className="size-3.5 text-[#64748b]" />
              Atualizado em {formatDatePt(ticket.updatedAt)}
            </span>
          ) : null}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-[12px] border border-[#bfdbfe] bg-[#eff6ff] p-4">
            <div className="text-[10px] font-bold tracking-[.06em] text-[#2563eb] uppercase">
              Total Setup
            </div>
            <div className="mt-1 text-[24px] font-extrabold text-[#2563eb]">
              {formatMoney(sumSetup(ticket))}
            </div>
          </div>
          <div className="rounded-[12px] border border-[#ddd6fe] bg-[#f5f3ff] p-4">
            <div className="text-[10px] font-bold tracking-[.06em] text-[#7c3aed] uppercase">
              Total Recorrencia
            </div>
            <div className="mt-1 text-[24px] font-extrabold text-[#7c3aed]">
              {formatMoney(sumRecurring(ticket))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.2fr_.8fr]">
          <div className="grid gap-4">
            <div className="rounded-[12px] border border-[#e2e8f0] bg-white p-4">
              <div className="mb-3 text-[12px] font-bold tracking-[.06em] text-[#64748b] uppercase">
                Dados do ticket
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <InfoField label="Nome" value={ticket.nome} />
                <InfoField label="CNPJ" value={ticket.cnpj} />
                <InfoField label="Telefone" value={ticket.telefone} />
                <InfoField label="Instancia" value={ticket.instancia} />
                <InfoField label="Plano" value={ticket.plano} />
                <InfoField label="Resp. solicitacao" value={ticket.respSolicitacao} />
                <InfoField label="Pagamento" value={ticket.formaPagamento} />
                <InfoField label="Etapa" value={ticket.csStatus} />
              </div>
            </div>

            <div className="rounded-[12px] border border-[#e2e8f0] bg-white p-4">
              <div className="mb-3 text-[12px] font-bold tracking-[.06em] text-[#64748b] uppercase">
                Canais e observacao
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-[10px] border border-[#e2e8f0] bg-[#f8fafc] p-3">
                  <div className="mb-1 text-[11px] font-bold tracking-[.06em] text-[#64748b] uppercase">
                    E-mail
                  </div>
                  <div className="inline-flex items-center gap-2 text-[13px] font-medium text-[#0f172a]">
                    <Mail className="size-4 text-[#64748b]" />
                    {ticket.email || '-'}
                  </div>
                </div>

                <div className="rounded-[10px] border border-[#e2e8f0] bg-[#f8fafc] p-3">
                  <div className="mb-1 text-[11px] font-bold tracking-[.06em] text-[#64748b] uppercase">
                    Site
                  </div>
                  <div className="inline-flex items-center gap-2 text-[13px] font-medium text-[#0f172a]">
                    <ExternalLink className="size-4 text-[#64748b]" />
                    {ticket.site || '-'}
                  </div>
                </div>

                <div className="rounded-[10px] border border-[#e2e8f0] bg-[#f8fafc] p-3 md:col-span-2">
                  <div className="mb-1 text-[11px] font-bold tracking-[.06em] text-[#64748b] uppercase">
                    Observacao
                  </div>
                  <p className="text-[13px] leading-6 text-[#475569]">
                    {ticket.observacao || 'Sem observacoes registradas para este ticket.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[12px] border border-[#e2e8f0] bg-white p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="text-[12px] font-bold tracking-[.06em] text-[#64748b] uppercase">
                Tarefas
              </div>
              <div className="text-[12px] font-semibold text-[#475569]">
                {completedTasks}/{ticket.tasks.length} ({progressPercent}%)
              </div>
            </div>

            {ticket.tasks.length ? (
              <div className="space-y-2">
                <div className="mb-3 h-2 overflow-hidden rounded-full bg-[#e2e8f0]">
                  <div
                    className="h-full rounded-full bg-[#2563eb] transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                {ticket.tasks.map((task) => (
                  <button
                    type="button"
                    key={task.id}
                    onClick={() => onToggleTask(ticket.id, task.id)}
                    className={`flex w-full items-start gap-3 rounded-[10px] border px-3 py-3 text-left ${
                      task.done
                        ? 'border-[#a7f3d0] bg-[#ecfdf5]'
                        : 'border-[#e2e8f0] bg-[#f8fafc]'
                    }`}
                  >
                    <span
                      className={`mt-[1px] inline-flex h-5 w-5 items-center justify-center rounded-full border text-[11px] ${
                        task.done
                          ? 'border-[#059669] bg-[#059669] text-white'
                          : 'border-[#cbd5e1] bg-white text-[#64748b]'
                      }`}
                    >
                      {task.done ? <CheckCircle2 className="size-3.5" /> : null}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold text-[#0f172a]">{task.title}</div>
                      <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-[#64748b]">
                        <span className="inline-flex items-center gap-1">
                          <Wrench className="size-3.5" />
                          {getTechNameById(task.assigneeId)}
                        </span>
                        {task.endDate ? (
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays className="size-3.5" />
                            {formatDatePt(task.endDate)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-[10px] border border-dashed border-[#cbd5e1] bg-[#f8fafc] px-4 py-6 text-center text-[13px] text-[#64748b]">
                Nenhuma tarefa cadastrada para este ticket.
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <ValueTable
            title="Produtos"
            icon={<FileText className="size-4 text-[#2563eb]" />}
            rows={ticket.products}
          />
          <ValueTable
            title="Integracoes"
            icon={<ExternalLink className="size-4 text-[#7c3aed]" />}
            rows={ticket.integrations}
          />
        </div>

        <div className="rounded-[12px] border border-[#e2e8f0] bg-white p-4">
          <div className="mb-3 text-[12px] font-bold tracking-[.06em] text-[#64748b] uppercase">
            Historico
          </div>
          {ticket.history.length ? (
            <div className="space-y-2">
              {[...ticket.history].reverse().map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 rounded-[10px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-3"
                >
                  <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[#2563eb]" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold text-[#0f172a]">{item.message}</div>
                    <div className="mt-1 text-[11px] text-[#64748b]">
                      {formatDatePt(item.createdAt)}
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
      </div>
    </ModalShell>
  );
}
