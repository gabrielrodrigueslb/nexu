'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  CircleOff,
  ClipboardList,
  Copy,
  FilePenLine,
  Download,
  ExternalLink,
  FileText,
  Filter,
  Globe,
  Hammer,
  Mail,
  Plus,
  Search,
  Tag,
  User,
  WalletCards,
  X,
} from 'lucide-react';

import { leads as initialLeads, tickets as initialTickets, users } from '@/components/data';
import {
  getActiveCatalogNames,
  syncCatalogRows,
  useAdminIntegrations,
  useAdminProducts,
} from '@/components/admin-catalogs';
import { ModalShell } from '@/components/modal-shell';
import { TicketDetailsView } from '@/components/shared/ticket-details-view';
import type { TicketStatus } from '@/components/types';
import { formatMoney } from '@/components/utils';

import {
  createEmptyPriceRows,
  type CommercialPriceRow,
} from './types';

type ClosedClientTicketType = 'novo' | 'inclusao';

type ClosedClientTask = {
  id: string;
  label: string;
  done: boolean;
  assigneeId?: string;
  dueDate?: string;
};

type ClosedClientAttachment = {
  id: string;
  name: string;
  subtitle?: string;
};

type ClosedClientComment = {
  id: string;
  author: string;
  message: string;
  createdAt: string;
};

type ClosedClientLog = {
  id: string;
  actor?: string;
  message: string;
  createdAt: string;
};

type ClosedClientTicketRecord = {
  id: string;
  proto: string;
  leadId?: string;
  type: ClosedClientTicketType;
  company: string;
  cnpj: string;
  contact: string;
  phone: string;
  email: string;
  website: string;
  instance: string;
  plan: string;
  paymentMethod: string;
  installment: string;
  assigneeId?: string;
  technicalAssigneeId?: string;
  status: TicketStatus;
  csStatus: string;
  createdAt: string;
  updatedAt?: string;
  notes: string;
  products: CommercialPriceRow[];
  integrations: CommercialPriceRow[];
  tasks: ClosedClientTask[];
  attachments: ClosedClientAttachment[];
  comments: ClosedClientComment[];
  logs: ClosedClientLog[];
};

type TicketFilterValue =
  | 'all'
  | 'historico'
  | TicketStatus
  | ClosedClientTicketType;

const PLAN_OPTIONS = ['Lite', 'Basico', 'Profissional', 'Unico'];
const PAYMENT_OPTIONS = ['Boleto Bancario', 'Pix', 'Cartao de Credito', 'Transferencia'];
const INSTALLMENT_OPTIONS = ['A vista', '2x', '3x', '4x', '5x', '6x', '10x', '12x'];
const COMMERCIAL_LABEL_OPTIONS = [
  'Novo Ticket',
  'Reuniao Agendada',
  'Site',
  'Portfolio',
  'Implantacao',
  'Reuniao de Alinhamento',
  'Migracao de API',
  'Em configuracao',
  'Bercario',
] as const;

function ClockStatusIcon(props: React.ComponentProps<typeof ClipboardList>) {
  return <ClipboardList {...props} />;
}

const STATUS_META: Record<
  TicketStatus,
  { label: string; badge: string; icon: React.ComponentType<{ className?: string }>; step: number }
> = {
  pendente_financeiro: {
    label: 'Ag. Pagamento',
    badge: 'border-[#fde68a] bg-[#fffbeb] text-[#d97706]',
    icon: ClockStatusIcon,
    step: 0,
  },
  pagamento_confirmado: {
    label: 'Pagamento Confirmado',
    badge: 'border-[#ddd6fe] bg-[#f5f3ff] text-[#7c3aed]',
    icon: CheckCircle2,
    step: 1,
  },
  em_implantacao: {
    label: 'Em Implantacao',
    badge: 'border-[#bfdbfe] bg-[#eff6ff] text-[#2563eb]',
    icon: Hammer,
    step: 2,
  },
  concluido: {
    label: 'Concluido',
    badge: 'border-[#a7f3d0] bg-[#ecfdf5] text-[#059669]',
    icon: CheckCircle2,
    step: 3,
  },
  cancelado: {
    label: 'Cancelado',
    badge: 'border-[#fecaca] bg-[#fef2f2] text-[#dc2626]',
    icon: CircleOff,
    step: 0,
  },
};

const TYPE_META: Record<ClosedClientTicketType, { label: string; badge: string }> = {
  novo: {
    label: 'Novo',
    badge: 'border-[#bfdbfe] bg-[#eff6ff] text-[#2563eb]',
  },
  inclusao: {
    label: 'Inclusao',
    badge: 'border-[#ddd6fe] bg-[#f5f3ff] text-[#7c3aed]',
  },
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const JOURNEY_STEPS = ['Cadastro', 'Pagamento', 'Implantacao', 'Concluido'];

function syncPriceRowsWithCatalog(rows: CommercialPriceRow[], catalogNames: string[]) {
  return syncCatalogRows(rows, catalogNames, (name) => ({
    id: name.toLowerCase().replace(/\s+/g, '-'),
    name,
    enabled: false,
    setup: 0,
    recurring: 0,
  }));
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}

function formatCnpjInput(value: string) {
  const digits = onlyDigits(value).slice(0, 14);

  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  }

  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

function formatPhoneInput(value: string) {
  const digits = onlyDigits(value).slice(0, 11);

  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function normalizeWebsiteInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function inDateRange(date: string, from: string, to: string) {
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function formatDate(value?: string) {
  if (!value) return '-';
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function resolveUserName(userId?: string) {
  return users.find((user) => user.id === userId)?.name;
}

function resolveCommercialActor(ticket: Pick<ClosedClientTicketRecord, 'assigneeId' | 'technicalAssigneeId'>) {
  return (
    resolveUserName(ticket.assigneeId) ??
    resolveUserName(ticket.technicalAssigneeId) ??
    'Equipe Comercial'
  );
}

function resolveTechnicalActor(ticket: Pick<ClosedClientTicketRecord, 'assigneeId' | 'technicalAssigneeId'>) {
  return (
    resolveUserName(ticket.technicalAssigneeId) ??
    resolveUserName(ticket.assigneeId) ??
    'Equipe Comercial'
  );
}

function copyText(value: string) {
  if (!value) return;
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(value).catch(() => undefined);
  }
}

function sumSetupValue(ticket: Pick<ClosedClientTicketRecord, 'products' | 'integrations'>) {
  return [...ticket.products, ...ticket.integrations]
    .filter((item) => item.enabled)
    .reduce((sum, item) => sum + item.setup, 0);
}

function sumRecurringValue(ticket: Pick<ClosedClientTicketRecord, 'products' | 'integrations'>) {
  return [...ticket.products, ...ticket.integrations]
    .filter((item) => item.enabled)
    .reduce((sum, item) => sum + item.recurring, 0);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function buildKanbanChipItems(ticket: Pick<ClosedClientTicketRecord, 'type' | 'csStatus' | 'products' | 'integrations'>) {
  const labels = [
    ticket.type === 'inclusao' ? 'Upsell' : 'Novo Ticket',
    ...ticket.products.filter((item) => item.enabled).map((item) => item.name),
    ...ticket.integrations.filter((item) => item.enabled).map((item) => item.name),
    ticket.csStatus,
  ].filter(Boolean);

  return [...new Set(labels)].map((label) => ({
    id: label.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    label,
    active: label === ticket.csStatus,
  }));
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[10px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-3">
      <div className="text-[10px] font-bold tracking-[.06em] text-[#64748b] uppercase">
        {label}
      </div>
      <div className="mt-1 text-[13px] font-semibold text-[#0f172a]">{value}</div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function TicketValueTable({
  title,
  icon,
  rows,
}: {
  title: string;
  icon: React.ReactNode;
  rows: CommercialPriceRow[];
}) {
  return (
    <div className="rounded-[12px] border border-[#e2e8f0] bg-white p-4">
      <div className="mb-3 inline-flex items-center gap-2 text-[12px] font-bold tracking-[.06em] text-[#64748b] uppercase">
        {icon}
        <span>{title}</span>
      </div>
      {rows.length ? (
        <div className="overflow-hidden rounded-[10px] border border-[#e2e8f0]">
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr className="bg-[#f8fafc]">
                <th className="px-3 py-2 text-left text-[10px] font-bold uppercase text-[#64748b]">
                  Item
                </th>
                <th className="px-3 py-2 text-right text-[10px] font-bold uppercase text-[#64748b]">
                  Setup
                </th>
                <th className="px-3 py-2 text-right text-[10px] font-bold uppercase text-[#64748b]">
                  Recorrencia
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-[#e2e8f0]">
                  <td className="px-3 py-[10px] font-semibold text-[#0f172a]">{row.name}</td>
                  <td className="px-3 py-[10px] text-right text-[#2563eb]">
                    {formatMoney(row.setup)}
                  </td>
                  <td className="px-3 py-[10px] text-right text-[#7c3aed]">
                    {formatMoney(row.recurring)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-[10px] border border-dashed border-[#cbd5e1] bg-[#f8fafc] px-4 py-6 text-center text-[13px] text-[#64748b]">
          Nenhum item selecionado.
        </div>
      )}
    </div>
  );
}

function buildSeedTickets(productCatalog: string[], integrationCatalog: string[]): ClosedClientTicketRecord[] {
  return initialTickets.map((ticket, index) => {
    const linkedLead =
      initialLeads.find((lead) => lead.generatedTicketId === ticket.id) ??
      initialLeads.find((lead) => lead.status === 'Ganho' && index % 2 === 0);
    const plan = linkedLead?.isLite ? 'Lite' : 'Profissional';
    const defaultProducts = createEmptyPriceRows(productCatalog).map((item, itemIndex) =>
      itemIndex === 0
        ? {
            ...item,
            name: `Plataforma ${plan}`,
            enabled: true,
            setup: ticket.setupAmount,
            recurring: ticket.recurringAmount,
          }
        : item,
    );
    const defaultIntegrations = createEmptyPriceRows(integrationCatalog).map((item, itemIndex) =>
      itemIndex === 0 && linkedLead?.paymentMethod === 'Cartao'
        ? { ...item, enabled: true, setup: 0, recurring: 0 }
        : item,
    );

    const tasks: ClosedClientTask[] =
      ticket.status === 'em_implantacao' || ticket.status === 'concluido'
        ? [
            {
              id: makeId('task'),
              label: 'Configuracao inicial da plataforma',
              done: ticket.status === 'concluido',
              assigneeId: ticket.assignee,
              dueDate: ticket.createdAt,
            },
            {
              id: makeId('task'),
              label: 'Validacao final com o cliente',
              done: ticket.status === 'concluido',
              assigneeId: ticket.assignee,
              dueDate: linkedLead?.wonAt ?? ticket.createdAt,
            },
          ]
        : [];

    return {
      id: ticket.id,
      proto: ticket.id,
      leadId: linkedLead?.id,
      type: index % 3 === 0 ? 'inclusao' : 'novo',
      company: linkedLead?.company ?? `Cliente ${ticket.id}`,
      cnpj: linkedLead?.cnpj ?? '-',
      contact: linkedLead?.contact ?? '',
      phone: '',
      email: linkedLead ? `${slugify(linkedLead.company)}@cliente.com.br` : '',
      website: linkedLead ? `https://www.${slugify(linkedLead.company)}.com.br` : '',
      instance: linkedLead ? slugify(linkedLead.company) : slugify(ticket.id),
      plan,
      paymentMethod: linkedLead?.paymentMethod ?? 'Boleto Bancario',
      installment: 'A vista',
      assigneeId: ticket.assignee,
      technicalAssigneeId:
        ticket.status === 'em_implantacao' || ticket.status === 'concluido'
          ? ticket.assignee
          : undefined,
      status: ticket.status,
      csStatus:
        ticket.status === 'concluido'
          ? 'Bercario'
          : ticket.status === 'em_implantacao'
            ? 'Em configuracao'
            : 'Novo Ticket',
      createdAt: ticket.createdAt,
      updatedAt: linkedLead?.wonAt ?? ticket.createdAt,
      notes:
        ticket.status === 'cancelado'
          ? 'Ticket cancelado apos revisao comercial.'
          : 'Cliente fechado aguardando acompanhamento operacional.',
      products: defaultProducts,
      integrations: defaultIntegrations,
      tasks,
      attachments: [],
      comments: [],
      logs: [
        {
          id: makeId('log'),
          actor: resolveCommercialActor({
            assigneeId: ticket.assignee,
            technicalAssigneeId:
              ticket.status === 'em_implantacao' || ticket.status === 'concluido'
                ? ticket.assignee
                : undefined,
          }),
          message: 'Ticket criado',
          createdAt: ticket.createdAt,
        },
        {
          id: makeId('log'),
          actor: resolveCommercialActor({
            assigneeId: ticket.assignee,
            technicalAssigneeId:
              ticket.status === 'em_implantacao' || ticket.status === 'concluido'
                ? ticket.assignee
                : undefined,
          }),
          message: `Status atualizado para ${STATUS_META[ticket.status].label}`,
          createdAt: linkedLead?.wonAt ?? ticket.createdAt,
        },
      ],
    };
  });
}

function emptyDraft(productCatalog: string[], integrationCatalog: string[]): ClosedClientTicketRecord {
  return {
    id: makeId('ticket'),
    proto: `COM-${Date.now().toString().slice(-6)}`,
    type: 'novo',
    company: '',
    cnpj: '',
    contact: '',
    phone: '',
    email: '',
    website: '',
    instance: '',
    plan: '',
    paymentMethod: '',
    installment: 'A vista',
    assigneeId: undefined,
    technicalAssigneeId: undefined,
    status: 'pendente_financeiro',
    csStatus: 'Novo Ticket',
    createdAt: todayIsoDate(),
    updatedAt: todayIsoDate(),
    notes: '',
    products: createEmptyPriceRows(productCatalog),
    integrations: createEmptyPriceRows(integrationCatalog),
    tasks: [],
    attachments: [],
    comments: [],
    logs: [],
  };
}

function cloneRows(rows: CommercialPriceRow[]) {
  return rows.map((row) => ({ ...row }));
}

function cloneTicket(ticket: ClosedClientTicketRecord): ClosedClientTicketRecord {
  return {
    ...ticket,
    products: cloneRows(ticket.products),
    integrations: cloneRows(ticket.integrations),
    tasks: ticket.tasks.map((task) => ({ ...task })),
    attachments: ticket.attachments.map((attachment) => ({ ...attachment })),
    comments: ticket.comments.map((comment) => ({ ...comment })),
    logs: ticket.logs.map((log) => ({ ...log })),
  };
}

function csvEscape(value: string | number) {
  const normalized = String(value ?? '');
  return `"${normalized.replaceAll('"', '""')}"`;
}

function exportTicketsCsv(tickets: ClosedClientTicketRecord[]) {
  const header = [
    'Protocolo',
    'Empresa',
    'CNPJ',
    'Tipo',
    'Status',
    'Responsavel',
    'Plano',
    'Setup',
    'Recorrencia',
    'Criado em',
  ];
  const rows = tickets.map((ticket) => [
    ticket.proto,
    ticket.company,
    ticket.cnpj,
    TYPE_META[ticket.type].label,
    STATUS_META[ticket.status].label,
    users.find((user) => user.id === ticket.assigneeId)?.name ?? '',
    ticket.plan,
    sumSetupValue(ticket),
    sumRecurringValue(ticket),
    ticket.createdAt,
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map(csvEscape).join(';'))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `clientes-fechados-${todayIsoDate()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function statusOptions(): Array<{ value: TicketFilterValue; label: string }> {
  return [
    { value: 'all', label: 'Todos ativos' },
    { value: 'pendente_financeiro', label: 'Ag. Pagamento' },
    { value: 'pagamento_confirmado', label: 'Pagamento confirmado' },
    { value: 'em_implantacao', label: 'Em implantacao' },
    { value: 'cancelado', label: 'Cancelados' },
    { value: 'novo', label: 'Novos' },
    { value: 'inclusao', label: 'Upsell' },
    { value: 'historico', label: 'Historico' },
  ];
}

function PriceRowsEditor({
  title,
  subtitle,
  rows,
  onChange,
}: {
  title: string;
  subtitle: string;
  rows: CommercialPriceRow[];
  onChange: (rows: CommercialPriceRow[]) => void;
}) {
  const totals = rows
    .filter((row) => row.enabled)
    .reduce(
      (sum, row) => ({
        setup: sum.setup + row.setup,
        recurring: sum.recurring + row.recurring,
      }),
      { setup: 0, recurring: 0 },
    );

  return (
    <div className="mb-4">
      <div className="mb-[10px] border-b border-[#e2e8f0] pb-2 text-[13px] font-bold text-[#0f172a]">
        {title}
      </div>
      <div className="mb-[6px] text-[12px] text-[#64748b]">{subtitle}</div>

      <div className="space-y-2">
        {rows.map((row, index) => (
          <div
            key={row.id}
            className="grid gap-2 rounded-[10px] border border-[#e2e8f0] bg-[#f8fafc] p-3 md:grid-cols-[1.4fr_.8fr_.8fr]"
          >
            <label className="flex items-center gap-2 text-[13px] font-semibold text-[#0f172a]">
              <input
                type="checkbox"
                checked={row.enabled}
                onChange={(event) =>
                  onChange(
                    rows.map((item, itemIndex) =>
                      itemIndex === index
                        ? { ...item, enabled: event.target.checked }
                        : item,
                    ),
                  )
                }
                className="size-4 rounded border-[#cbd5e1]"
              />
              <span>{row.name}</span>
            </label>

            <input
              type="number"
              min={0}
              step="0.01"
              value={row.setup || ''}
              disabled={!row.enabled}
              onChange={(event) =>
                onChange(
                  rows.map((item, itemIndex) =>
                    itemIndex === index
                      ? { ...item, setup: Number(event.target.value) || 0 }
                      : item,
                  ),
                )
              }
              placeholder="Setup"
              className="rounded-[8px] border border-[#e2e8f0] bg-white px-3 py-[7px] text-[13px] text-[#0f172a] outline-none disabled:cursor-not-allowed disabled:bg-[#f1f5f9]"
            />

            <input
              type="number"
              min={0}
              step="0.01"
              value={row.recurring || ''}
              disabled={!row.enabled}
              onChange={(event) =>
                onChange(
                  rows.map((item, itemIndex) =>
                    itemIndex === index
                      ? { ...item, recurring: Number(event.target.value) || 0 }
                      : item,
                  ),
                )
              }
              placeholder="Recorrencia"
              className="rounded-[8px] border border-[#e2e8f0] bg-white px-3 py-[7px] text-[13px] text-[#0f172a] outline-none disabled:cursor-not-allowed disabled:bg-[#f1f5f9]"
            />
          </div>
        ))}
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="rounded-[10px] border border-[#bfdbfe] bg-[#eff6ff] p-3">
          <div className="text-[10px] font-bold tracking-[.06em] text-[#2563eb] uppercase">
            Total Setup
          </div>
          <div className="mt-1 text-[18px] font-extrabold text-[#2563eb]">
            {formatMoney(totals.setup)}
          </div>
        </div>
        <div className="rounded-[10px] border border-[#ddd6fe] bg-[#f5f3ff] p-3">
          <div className="text-[10px] font-bold tracking-[.06em] text-[#7c3aed] uppercase">
            Total Recorrencia
          </div>
          <div className="mt-1 text-[18px] font-extrabold text-[#7c3aed]">
            {formatMoney(totals.recurring)}
          </div>
        </div>
      </div>
    </div>
  );
}

function TicketFormModal({
  open,
  ticket,
  productCatalog,
  integrationCatalog,
  onClose,
  onSave,
}: {
  open: boolean;
  ticket: ClosedClientTicketRecord | null;
  productCatalog: string[];
  integrationCatalog: string[];
  onClose: () => void;
  onSave: (ticket: ClosedClientTicketRecord) => void;
}) {
  const [draft, setDraft] = useState<ClosedClientTicketRecord>(
    ticket
      ? {
          ...cloneTicket(ticket),
          products: syncPriceRowsWithCatalog(ticket.products, productCatalog),
          integrations: syncPriceRowsWithCatalog(ticket.integrations, integrationCatalog),
        }
      : emptyDraft(productCatalog, integrationCatalog),
  );

  function update<K extends keyof ClosedClientTicketRecord>(
    key: K,
    value: ClosedClientTicketRecord[K],
  ) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function handleSave() {
    if (!draft.company.trim()) return;
    if (!draft.cnpj.trim()) return;
    if (!draft.instance.trim()) return;
    if (!draft.plan.trim()) return;
    if (!draft.paymentMethod.trim()) return;

    onSave({
      ...draft,
      updatedAt: todayIsoDate(),
      logs: draft.logs.length
        ? [
            ...draft.logs,
            {
              id: makeId('log'),
              actor: resolveCommercialActor(draft),
              message: ticket ? 'Ticket atualizado' : 'Ticket criado',
              createdAt: todayIsoDate(),
            },
          ]
        : [
            {
              id: makeId('log'),
              actor: resolveCommercialActor(draft),
              message: 'Ticket criado',
              createdAt: todayIsoDate(),
            },
          ],
    });
  }

  return (
    <ModalShell
      open={open}
      title={ticket ? 'Editar Ticket' : 'Novo Ticket - Comercial'}
      description="Migracao do fluxo de Cliente Fechado para React com a mesma estrutura principal do legado."
      maxWidthClassName="max-w-[920px]"
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[8px] border border-[#e2e8f0] bg-white px-4 py-[9px] text-[13px] font-semibold text-[#64748b]"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-[8px] bg-[#2563eb] px-4 py-[9px] text-[13px] font-semibold text-white"
          >
            Salvar ticket
          </button>
        </>
      }
    >
      <div className="grid gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-[5px] block text-[11px] font-bold tracking-[.06em] text-[#64748b] uppercase">
              Tipo do ticket
            </label>
            <select
              value={draft.type}
              onChange={(event) => update('type', event.target.value as ClosedClientTicketType)}
              className="w-full rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-[9px] text-[13px] text-[#0f172a] outline-none"
            >
              <option value="novo">Cliente Novo</option>
              <option value="inclusao">Inclusao (Upsell)</option>
            </select>
          </div>

          <div>
            <label className="mb-[5px] block text-[11px] font-bold tracking-[.06em] text-[#64748b] uppercase">
              Responsavel pela solicitacao
            </label>
            <select
              value={draft.assigneeId ?? ''}
              onChange={(event) => update('assigneeId', event.target.value || undefined)}
              className="w-full rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-[9px] text-[13px] text-[#0f172a] outline-none"
            >
              <option value="">- Sem responsavel -</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="border-b border-[#e2e8f0] pb-2 text-[13px] font-bold text-[#0f172a]">
          Dados do cliente
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-[5px] block text-[11px] font-bold tracking-[.06em] text-[#64748b] uppercase">
              Nome da empresa
            </label>
            <input
              value={draft.company}
              onChange={(event) => update('company', event.target.value)}
              className="w-full rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-[9px] text-[13px] text-[#0f172a] outline-none"
              placeholder="Ex: Farmacia Sao Joao"
            />
          </div>

          <div>
            <label className="mb-[5px] block text-[11px] font-bold tracking-[.06em] text-[#64748b] uppercase">
              CNPJ
            </label>
            <input
              value={draft.cnpj}
              onChange={(event) => update('cnpj', formatCnpjInput(event.target.value))}
              inputMode="numeric"
              maxLength={18}
              className="w-full rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-[9px] text-[13px] text-[#0f172a] outline-none"
              placeholder="00.000.000/0001-00"
            />
          </div>

          <div>
            <label className="mb-[5px] block text-[11px] font-bold tracking-[.06em] text-[#64748b] uppercase">
              Contato
            </label>
            <input
              value={draft.contact}
              onChange={(event) => update('contact', event.target.value)}
              className="w-full rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-[9px] text-[13px] text-[#0f172a] outline-none"
              placeholder="Nome do contato"
            />
          </div>

          <div>
            <label className="mb-[5px] block text-[11px] font-bold tracking-[.06em] text-[#64748b] uppercase">
              Telefone
            </label>
            <input
              value={draft.phone}
              onChange={(event) => update('phone', formatPhoneInput(event.target.value))}
              inputMode="tel"
              maxLength={15}
              className="w-full rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-[9px] text-[13px] text-[#0f172a] outline-none"
              placeholder="(11) 99999-9999"
            />
          </div>

          <div>
            <label className="mb-[5px] block text-[11px] font-bold tracking-[.06em] text-[#64748b] uppercase">
              E-mail do cliente
            </label>
            <input
              value={draft.email}
              onChange={(event) => update('email', event.target.value.trim().toLowerCase())}
              type="email"
              inputMode="email"
              className="w-full rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-[9px] text-[13px] text-[#0f172a] outline-none"
              placeholder="cliente@empresa.com.br"
            />
          </div>

          <div>
            <label className="mb-[5px] block text-[11px] font-bold tracking-[.06em] text-[#64748b] uppercase">
              Site
            </label>
            <input
              value={draft.website}
              onChange={(event) => update('website', event.target.value.trim())}
              onBlur={(event) => update('website', normalizeWebsiteInput(event.target.value))}
              inputMode="url"
              className="w-full rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-[9px] text-[13px] text-[#0f172a] outline-none"
              placeholder="https://www.empresa.com.br"
            />
          </div>

          <div>
            <label className="mb-[5px] block text-[11px] font-bold tracking-[.06em] text-[#64748b] uppercase">
              Instancia
            </label>
            <input
              value={draft.instance}
              onChange={(event) => update('instance', slugify(event.target.value))}
              className="w-full rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-[9px] text-[13px] text-[#0f172a] outline-none"
              placeholder="empresa-unidade"
            />
          </div>
        </div>

        <div className="border-b border-[#e2e8f0] pb-2 text-[13px] font-bold text-[#0f172a]">
          Plano e pagamento
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-[5px] block text-[11px] font-bold tracking-[.06em] text-[#64748b] uppercase">
              Plano
            </label>
            <select
              value={draft.plan}
              onChange={(event) => update('plan', event.target.value)}
              className="w-full rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-[9px] text-[13px] text-[#0f172a] outline-none"
            >
              <option value="">Selecione...</option>
              {PLAN_OPTIONS.map((plan) => (
                <option key={plan} value={plan}>
                  {plan}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-[5px] block text-[11px] font-bold tracking-[.06em] text-[#64748b] uppercase">
              Forma de pagamento
            </label>
            <select
              value={draft.paymentMethod}
              onChange={(event) => update('paymentMethod', event.target.value)}
              className="w-full rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-[9px] text-[13px] text-[#0f172a] outline-none"
            >
              <option value="">Selecione...</option>
              {PAYMENT_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-[5px] block text-[11px] font-bold tracking-[.06em] text-[#64748b] uppercase">
              Parcelamento
            </label>
            <select
              value={draft.installment}
              onChange={(event) => update('installment', event.target.value)}
              className="w-full rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-[9px] text-[13px] text-[#0f172a] outline-none"
            >
              {INSTALLMENT_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>

        <PriceRowsEditor
          title="Produtos e valores"
          subtitle="Selecione os produtos e informe setup e recorrencia."
          rows={draft.products}
          onChange={(rows) => update('products', rows)}
        />

        <PriceRowsEditor
          title="Integracoes e valores"
          subtitle="Selecione as integracoes contratadas."
          rows={draft.integrations}
          onChange={(rows) => update('integrations', rows)}
        />

        <div>
          <label className="mb-[5px] block text-[11px] font-bold tracking-[.06em] text-[#64748b] uppercase">
            Observacoes
          </label>
          <textarea
            value={draft.notes}
            onChange={(event) => update('notes', event.target.value)}
            rows={4}
            className="w-full rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-[9px] text-[13px] text-[#0f172a] outline-none"
            placeholder="Anotacoes livres sobre este ticket..."
          />
        </div>
      </div>
    </ModalShell>
  );
}

function TicketDetailsModal({
  open,
  ticket,
  onClose,
  onEdit,
  onAdvanceStatus,
  onToggleTask,
  onAddComment,
  onAddAttachments,
  onChangeTechnicalAssignee,
  onChangeLabel,
}: {
  open: boolean;
  ticket: ClosedClientTicketRecord | null;
  onClose: () => void;
  onEdit: () => void;
  onAdvanceStatus: () => void;
  onToggleTask: (taskId: string) => void;
  onAddComment: (message: string) => void;
  onAddAttachments: (files: File[]) => void;
  onChangeTechnicalAssignee: (technicalAssigneeId: string) => void;
  onChangeLabel: (label: string) => void;
}) {
  if (!ticket) return null;

  const statusMeta = STATUS_META[ticket.status];
  const typeMeta = TYPE_META[ticket.type];
  const StatusIcon = statusMeta.icon;
  const canAdvance = ticket.status !== 'concluido' && ticket.status !== 'cancelado';
  const assigneeName = users.find((user) => user.id === ticket.assigneeId)?.name ?? '-';
  const technicalName =
    users.find((user) => user.id === ticket.technicalAssigneeId)?.name ?? '-';
  const completedTasks = ticket.tasks.filter((task) => task.done).length;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const progressPercent = ticket.tasks.length
    ? Math.round((completedTasks / ticket.tasks.length) * 100)
    : 0;
  const visibleProducts = ticket.products.filter((item) => item.enabled);
  const visibleIntegrations = ticket.integrations.filter((item) => item.enabled);
  const historyItems = [...ticket.logs].reverse();
  const labelOptions = [...new Set([...COMMERCIAL_LABEL_OPTIONS, ticket.csStatus])];
  const advanceLabel =
    ticket.status === 'pendente_financeiro'
      ? 'Marcar cobranca gerada'
      : ticket.status === 'pagamento_confirmado'
        ? 'Enviar para implantacao'
        : 'Concluir implantacao';
  const journeyLabels = ['Cadastro', 'Pagamento', 'Implantacao', 'Concluido'];
  const journeySteps =
    ticket.status === 'concluido'
      ? journeyLabels.map((label) => ({ label, state: 'done' as const }))
      : journeyLabels.map((label, index) => ({
          label,
          state:
            index < statusMeta.step
              ? ('done' as const)
              : index === statusMeta.step
                ? ('active' as const)
                : ('pending' as const),
        }));

  return (
    <TicketDetailsView
      open={open}
      onClose={onClose}
      title={ticket.company}
      description={`${ticket.cnpj || '-'} - ${statusMeta.label}`}
      maxWidthClassName="max-w-[980px]"
      protocol={ticket.proto}
      badges={[
        <span
          key="status"
          className={`inline-flex items-center gap-1 rounded-full border px-[10px] py-[4px] text-[11px] font-bold ${statusMeta.badge}`}
        >
          <StatusIcon className="size-3.5" />
          {statusMeta.label}
        </span>,
        <span
          key="type"
          className={`inline-flex rounded-full border px-[10px] py-[4px] text-[11px] font-bold ${typeMeta.badge}`}
        >
          {typeMeta.label}
        </span>,
        ...(ticket.csStatus
          ? [
              <span
                key="stage"
                className="inline-flex rounded-full border border-[#e2e8f0] bg-white px-[10px] py-[4px] text-[11px] font-bold text-[#475569]"
              >
                {ticket.csStatus}
              </span>,
            ]
          : []),
      ]}
      metaItems={[
        <span
          key="created"
          className="inline-flex items-center gap-1.5 rounded-full border border-[#e2e8f0] bg-white px-3 py-1.5 text-[11px] font-medium text-[#475569]"
        >
          <CalendarDays className="size-3.5 text-[#64748b]" />
          Criado em {formatDate(ticket.createdAt)}
        </span>,
        <span
          key="requester"
          className="inline-flex items-center gap-1.5 rounded-full border border-[#e2e8f0] bg-white px-3 py-1.5 text-[11px] font-medium text-[#475569]"
        >
          <User className="size-3.5 text-[#64748b]" />
          Resp. solicitacao: {assigneeName}
        </span>,
        <span
          key="tech"
          className="inline-flex items-center gap-2 rounded-full border border-[#e2e8f0] bg-white px-3 py-1.5 text-[11px] font-medium text-[#475569]"
        >
          <Hammer className="size-3.5 text-[#64748b]" />
          <span>Resp. tecnico:</span>
          <select
            value={ticket.technicalAssigneeId ?? ''}
            onChange={(event) => onChangeTechnicalAssignee(event.target.value)}
            className="min-w-[150px] bg-transparent text-[11px] font-semibold text-[#0f172a] outline-none"
          >
            <option value="">Sem responsavel</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
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
            onChange={(event) => onChangeLabel(event.target.value)}
            className="min-w-[170px] bg-transparent text-[11px] font-semibold text-[#0f172a] outline-none"
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
                <ClipboardList className="size-3.5 text-[#64748b]" />
                Atualizado em {formatDate(ticket.updatedAt)}
              </span>,
            ]
          : []),
      ]}
      journeySteps={journeySteps}
      setupTotal={formatMoney(sumSetupValue(ticket))}
      recurringTotal={formatMoney(sumRecurringValue(ticket))}
      infoFields={[
        { label: 'Empresa', value: ticket.company },
        { label: 'CNPJ', value: ticket.cnpj || '-' },
        { label: 'Contato', value: ticket.contact || '-' },
        { label: 'Telefone', value: ticket.phone || '-' },
        { label: 'Instancia', value: ticket.instance || '-' },
        {
          label: 'E-mail',
          value: ticket.email || '-',
          icon: <Mail className="size-4 text-[#64748b]" />,
        },
        {
          label: 'Site',
          value: ticket.website || '-',
          icon: <Globe className="size-4 text-[#64748b]" />,
        },
        { label: 'Plano', value: ticket.plan || '-' },
        { label: 'Pagamento', value: ticket.paymentMethod || '-' },
        { label: 'Parcelamento', value: ticket.installment || '-', fullWidth: true },
        { label: 'Responsavel', value: assigneeName },
        { label: 'Resp. tecnico', value: technicalName },
        { label: 'Criado em', value: formatDate(ticket.createdAt) },
        { label: 'Atualizado em', value: formatDate(ticket.updatedAt) },
      ]}
      notes={ticket.notes}
      notesLabel="Observacao"
      tasks={ticket.tasks.map((task) => ({
        id: task.id,
        label: task.label,
        done: task.done,
        assignee: task.assigneeId
          ? users.find((user) => user.id === task.assigneeId)?.name ?? '-'
          : undefined,
        dueDate: task.dueDate ? formatDate(task.dueDate) : undefined,
      }))}
      onToggleTask={onToggleTask}
      valueTables={[
        {
          title: 'Produtos',
          icon: <FileText className="size-4 text-[#2563eb]" />,
          rows: visibleProducts.map((row) => ({
            id: row.id,
            name: row.name,
            setup: row.setup,
            recurring: row.recurring,
          })),
        },
        {
          title: 'Integracoes',
          icon: <ExternalLink className="size-4 text-[#7c3aed]" />,
          rows: visibleIntegrations.map((row) => ({
            id: row.id,
            name: row.name,
            setup: row.setup,
            recurring: row.recurring,
          })),
        },
      ]}
      attachments={{
        title: 'Anexos',
        helperText: '(clique para adicionar)',
        emptyText: 'Sem anexos',
        actionLabel: 'Clique para adicionar PDF, imagem ou documento',
        items: ticket.attachments,
        onAdd: onAddAttachments,
      }}
      historyItems={historyItems.map((item) => ({
        id: item.id,
        actor: item.actor ?? resolveCommercialActor(ticket),
        message: item.message,
        createdAt: formatDate(item.createdAt),
      }))}
      comments={{
        title: 'Comentarios',
        emptyText: 'Nenhum comentario.',
        inputPlaceholder: 'Comentario...',
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
          createdAt: formatDate(item.createdAt),
        })),
        onSubmit: onAddComment,
      }}
      banner={
        ticket.status === 'concluido' ? (
          <div className="flex flex-wrap items-center gap-3 rounded-[12px] border border-[#86efac] bg-[#f0fdf4] px-4 py-3">
            <span className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[.06em] text-[#15803d] uppercase">
              <CheckCircle2 className="size-4" />
              Somente leitura
            </span>
            <span className="text-[12px] text-[#166534]">
              Ticket finalizado. Visualizacao ajustada para seguir o mesmo padrao da
              modal principal.
            </span>
          </div>
        ) : null
      }
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[8px] border border-[#e2e8f0] bg-white px-4 py-[9px] text-[13px] font-semibold text-[#64748b]"
          >
            Fechar
          </button>
          {ticket.status !== 'concluido' ? (
            <button
              type="button"
              onClick={onEdit}
              className="rounded-[8px] border border-[#e2e8f0] bg-white px-4 py-[9px] text-[13px] font-semibold text-[#0f172a]"
            >
              Editar ticket
            </button>
          ) : null}
          {canAdvance ? (
            <button
              type="button"
              onClick={onAdvanceStatus}
              className="rounded-[8px] bg-[#2563eb] px-4 py-[9px] text-[13px] font-semibold text-white"
            >
              {advanceLabel}
            </button>
          ) : null}
        </>
      }
      headerActions={
        ticket.status !== 'concluido' ? (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-2 rounded-[8px] border border-[#e2e8f0] bg-white px-3 py-[7px] text-[13px] font-semibold text-[#0f172a]"
          >
            <FilePenLine className="size-4" />
            Editar
          </button>
        ) : null
      }
    />
  );
}

export function CommercialClosedClients() {
  const { items: productItems } = useAdminProducts();
  const { items: integrationItems } = useAdminIntegrations();
  const productCatalog = getActiveCatalogNames(productItems);
  const integrationCatalog = getActiveCatalogNames(integrationItems);
  const [tickets, setTickets] = useState<ClosedClientTicketRecord[]>(() =>
    buildSeedTickets(productCatalog, integrationCatalog),
  );
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<TicketFilterValue>('all');
  const [responsibleFilter, setResponsibleFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [editingTicketId, setEditingTicketId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [viewingTicketId, setViewingTicketId] = useState<string | null>(null);

  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = normalizeText(deferredQuery);

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const matchesDate = inDateRange(ticket.createdAt, dateFrom, dateTo);
      const searchable = normalizeText(
        [
          ticket.proto,
          ticket.company,
          ticket.cnpj,
          ticket.contact,
          ticket.instance,
          ticket.email,
        ].join(' '),
      );
      const matchesQuery = normalizedQuery ? searchable.includes(normalizedQuery) : true;
      const matchesFilter =
        filter === 'all'
          ? ticket.status !== 'concluido'
          : filter === 'historico'
            ? ticket.status === 'concluido'
            : filter === 'novo' || filter === 'inclusao'
              ? ticket.type === filter
              : ticket.status === filter;
      const matchesResponsible = responsibleFilter
        ? ticket.assigneeId === responsibleFilter
        : true;

      return matchesDate && matchesQuery && matchesFilter && matchesResponsible;
    });
  }, [dateFrom, dateTo, filter, normalizedQuery, responsibleFilter, tickets]);

  const activeTickets = tickets.filter((ticket) => ticket.status !== 'concluido');
  const responsibleOptions = users.filter((user) =>
    activeTickets.some((ticket) => ticket.assigneeId === user.id),
  );
  const hasFilter = Boolean(query || filter !== 'all' || responsibleFilter || dateFrom || dateTo);
  const totalSetup = filteredTickets.reduce((sum, ticket) => sum + sumSetupValue(ticket), 0);
  const totalRecurring = filteredTickets.reduce(
    (sum, ticket) => sum + sumRecurringValue(ticket),
    0,
  );

  const editingTicket = useMemo(
    () => tickets.find((ticket) => ticket.id === editingTicketId) ?? null,
    [editingTicketId, tickets],
  );
  const viewingTicket = useMemo(
    () => tickets.find((ticket) => ticket.id === viewingTicketId) ?? null,
    [tickets, viewingTicketId],
  );

  function resetFilters() {
    setQuery('');
    setFilter('all');
    setResponsibleFilter('');
    setDateFrom('');
    setDateTo('');
  }

  function handleSave(ticket: ClosedClientTicketRecord) {
    setTickets((current) => {
      const exists = current.some((item) => item.id === ticket.id);
      if (!exists) return [ticket, ...current];
      return current.map((item) => (item.id === ticket.id ? ticket : item));
    });
    setCreating(false);
    setEditingTicketId(null);
  }

  function handleAdvanceStatus(ticketId: string) {
    setTickets((current) =>
      current.map((ticket) => {
        if (ticket.id !== ticketId) return ticket;

        const nextStatus: TicketStatus =
          ticket.status === 'pendente_financeiro'
            ? 'pagamento_confirmado'
            : ticket.status === 'pagamento_confirmado'
              ? 'em_implantacao'
              : 'concluido';

        const nextTasks =
          nextStatus === 'em_implantacao' && !ticket.tasks.length
            ? [
                {
                  id: makeId('task'),
                  label: 'Configuracao inicial da plataforma',
                  done: false,
                  assigneeId: ticket.technicalAssigneeId ?? ticket.assigneeId,
                  dueDate: todayIsoDate(),
                },
                {
                  id: makeId('task'),
                  label: 'Validacao final com o cliente',
                  done: false,
                  assigneeId: ticket.technicalAssigneeId ?? ticket.assigneeId,
                  dueDate: todayIsoDate(),
                },
              ]
            : nextStatus === 'concluido'
              ? ticket.tasks.map((task) => ({ ...task, done: true }))
              : ticket.tasks;

        return {
          ...ticket,
          status: nextStatus,
          csStatus: nextStatus === 'concluido' ? 'Bercario' : 'Em configuracao',
          tasks: nextTasks,
          updatedAt: todayIsoDate(),
          logs: [
            ...ticket.logs,
            {
              id: makeId('log'),
              actor:
                nextStatus === 'concluido'
                  ? resolveTechnicalActor(ticket)
                  : resolveCommercialActor(ticket),
              message: `Status atualizado para ${STATUS_META[nextStatus].label}`,
              createdAt: todayIsoDate(),
            },
          ],
        };
      }),
    );
  }

  function handleToggleTask(ticketId: string, taskId: string) {
    setTickets((current) =>
      current.map((ticket) => {
        if (ticket.id !== ticketId) return ticket;

        const tasks = ticket.tasks.map((task) =>
          task.id === taskId ? { ...task, done: !task.done } : task,
        );

        return {
          ...ticket,
          tasks,
          updatedAt: todayIsoDate(),
          logs: [
            ...ticket.logs,
            {
              id: makeId('log'),
              actor: resolveTechnicalActor(ticket),
              message: `Tarefa atualizada: ${
                tasks.find((task) => task.id === taskId)?.label ?? 'Tarefa'
              }`,
              createdAt: todayIsoDate(),
            },
          ],
        };
      }),
    );
  }

  function handleAddComment(ticketId: string, message: string) {
    setTickets((current) =>
      current.map((ticket) =>
        ticket.id === ticketId
          ? {
              ...ticket,
              updatedAt: todayIsoDate(),
              comments: [
                ...ticket.comments,
                {
                  id: makeId('comment'),
                  author: resolveCommercialActor(ticket),
                  message,
                  createdAt: todayIsoDate(),
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
                  id: makeId('attachment'),
                  name: file.name,
                  subtitle: `${Math.max(1, Math.round(file.size / 1024))} KB`,
                })),
              ],
            }
          : ticket,
      ),
    );
  }

  function handleChangeTechnicalAssignee(ticketId: string, technicalAssigneeId: string) {
    setTickets((current) =>
      current.map((ticket) =>
        ticket.id === ticketId
          ? {
              ...ticket,
              technicalAssigneeId: technicalAssigneeId || undefined,
              updatedAt: todayIsoDate(),
              logs: [
                ...ticket.logs,
                {
                  id: makeId('log'),
                  actor: resolveCommercialActor(ticket),
                  message: `Resp. tecnico atribuido: ${
                    resolveUserName(technicalAssigneeId) ?? 'Sem responsavel'
                  }`,
                  createdAt: todayIsoDate(),
                },
              ],
            }
          : ticket,
      ),
    );
  }

  function handleChangeLabel(ticketId: string, label: string) {
    setTickets((current) =>
      current.map((ticket) =>
        ticket.id === ticketId && ticket.csStatus !== label
          ? {
              ...ticket,
              csStatus: label,
              updatedAt: todayIsoDate(),
              logs: [
                ...ticket.logs,
                {
                  id: makeId('log'),
                  actor: resolveCommercialActor(ticket),
                  message: `Etiqueta alterada para ${label}`,
                  createdAt: todayIsoDate(),
                },
              ],
            }
          : ticket,
      ),
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
      {/* Header e Ação Principal */}
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-[20px] font-extrabold tracking-[-0.4px] text-[#0f172a]">
            Cliente Fechado
          </h1>
          <p className="mt-0.5 text-[13px] text-[#64748b]">
            Jornada dos tickets comerciais, valores contratados e acompanhamento pos-venda.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => exportTicketsCsv(filteredTickets)}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-[8px] border border-[#e2e8f0] bg-white px-4 text-[13px] font-semibold text-[#0f172a] shadow-sm transition-colors hover:bg-[#f8fafc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e2e8f0]"
          >
            <Download className="h-4 w-4" />
            <span>Exportar</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setCreating(true);
              setEditingTicketId(null);
            }}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-[8px] bg-[#2563eb] px-4 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-[#1d4ed8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb] focus-visible:ring-offset-2"
          >
            <Plus className="h-4 w-4" />
            <span>Novo Ticket</span>
          </button>
        </div>
      </div>

      {/* Toolbar de Filtros */}
      <div className="mb-6 rounded-[10px] border border-[#e2e8f0] bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          
          {/* Grupo Esquerdo: Filtros Principais */}
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
            
            {/* Busca */}
            <div className="relative min-w-[220px] flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]">
                <Search className="h-[14px] w-[14px]" />
              </span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por empresa, protocolo, CNPJ..."
                className="h-9 w-full rounded-[6px] border border-[#e2e8f0] bg-transparent pl-[34px] pr-3 text-[13px] text-[#0f172a] outline-none transition-colors focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]"
              />
            </div>

            {/* Status */}
            <div className="relative">
              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value as TicketFilterValue)}
                className="h-9 w-full min-w-[160px] appearance-none rounded-[6px] border border-[#e2e8f0] bg-transparent pl-8 pr-8 text-[13px] text-[#0f172a] outline-none transition-colors focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] sm:w-auto"
              >
                {statusOptions().map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Filter className="pointer-events-none absolute left-2.5 top-1/2 h-[14px] w-[14px] -translate-y-1/2 text-[#64748b]" />
            </div>

            {/* Responsável */}
            <div className="relative">
              <select
                value={responsibleFilter}
                onChange={(event) => setResponsibleFilter(event.target.value)}
                className="h-9 w-full min-w-[170px] appearance-none rounded-[6px] border border-[#e2e8f0] bg-transparent pl-8 pr-8 text-[13px] text-[#0f172a] outline-none transition-colors focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] sm:w-auto"
              >
                <option value="">Todos os responsáveis</option>
                {responsibleOptions.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
              <User className="pointer-events-none absolute left-2.5 top-1/2 h-[14px] w-[14px] -translate-y-1/2 text-[#64748b]" />
            </div>

            {/* Data */}
            <div className="flex h-9 items-center gap-2 rounded-[6px] border border-[#e2e8f0] bg-[#f8fafc] px-3 text-[13px]">
              <CalendarDays className="h-[14px] w-[14px] text-[#64748b]" />
              <input
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
                className="cursor-pointer bg-transparent text-[#0f172a] outline-none"
              />
              <span className="text-[#94a3b8]">até</span>
              <input
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
                className="cursor-pointer bg-transparent text-[#0f172a] outline-none"
              />
            </div>

            {/* Limpar Filtros */}
            {hasFilter && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-[6px] px-3 text-[13px] font-medium text-[#64748b] transition-colors hover:bg-[#f1f5f9] hover:text-[#0f172a]"
              >
                <X className="h-[14px] w-[14px]" />
                Limpar
              </button>
            )}
          </div>

          {/* Divisor Visual em telas grandes */}
          <div className="hidden h-6 w-px bg-[#e2e8f0] xl:block" />

          {/* Grupo Direito: Totais */}
          <div className="flex flex-wrap items-center gap-3 border-t border-[#e2e8f0] pt-3 xl:border-none xl:pt-0">
            <div className="inline-flex h-9 items-center gap-2 rounded-[6px] border border-[#bfdbfe] bg-[#eff6ff] px-3 text-[12px] font-bold text-[#2563eb]">
              <WalletCards className="size-[14px]" />
              <span>Setup: {formatMoney(totalSetup)}</span>
            </div>
            <div className="inline-flex h-9 items-center gap-2 rounded-[6px] border border-[#ddd6fe] bg-[#f5f3ff] px-3 text-[12px] font-bold text-[#7c3aed]">
              <FileText className="size-[14px]" />
              <span>Recorrência: {formatMoney(totalRecurring)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
        {filteredTickets.map((ticket) => {
          const status = STATUS_META[ticket.status];
          const type = TYPE_META[ticket.type];
          const StatusIcon = status.icon;
          const assignee = users.find((user) => user.id === ticket.assigneeId);
          const techAssignee = users.find((user) => user.id === ticket.technicalAssigneeId);

          return (
            <div
              key={ticket.id}
              onClick={() => setViewingTicketId(ticket.id)}
              className="rounded-[14px] border border-[#e2e8f0] bg-white p-4 text-left shadow-[0_8px_24px_rgba(15,23,42,.04)] transition-all hover:-translate-y-[1px] hover:border-[#bfdbfe] hover:shadow-[0_12px_28px_rgba(37,99,235,.08)] cursor-pointer"
            >
              <div className="mb-3 flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-[#e2e8f0] bg-[#f8fafc] px-[8px] py-[3px] font-mono text-[10px] font-bold text-[#475569]">
                      {ticket.proto}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-[8px] py-[3px] text-[10px] font-bold ${status.badge}`}
                    >
                      <StatusIcon className="size-3.5" />
                      {status.label}
                    </span>
                    <span
                      className={`inline-flex rounded-full border px-[8px] py-[3px] text-[10px] font-bold ${type.badge}`}
                    >
                      {type.label}
                    </span>
                  </div>
                  <div className="text-[15px] font-extrabold text-[#0f172a]">{ticket.company}</div>
                  <div className="mt-1 text-[12px] text-[#64748b]">
                    CNPJ: {ticket.cnpj || '-'}
                    {ticket.instance ? ` / ${ticket.instance}` : ''}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    copyText(ticket.proto);
                  }}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] border border-[#e2e8f0] bg-white text-[#64748b] transition-colors hover:bg-[#f8fafc]"
                >
                  <Copy className="size-4" />
                </button>
              </div>

              <div className="mb-3 flex flex-wrap gap-2 text-[12px] text-[#64748b]">
                <span>
                  Setup: <strong className="text-[#0f172a]">{formatMoney(sumSetupValue(ticket))}</strong>
                </span>
                <span>
                  Recorrencia:{' '}
                  <strong className="text-[#0f172a]">{formatMoney(sumRecurringValue(ticket))}</strong>
                </span>
              </div>

              <div className="mb-3 text-[12px] text-[#64748b]">
                {[...ticket.products, ...ticket.integrations]
                  .filter((item) => item.enabled)
                  .map((item) => item.name)
                  .join(', ') || 'Sem itens selecionados'}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#64748b]">
                <span className="inline-flex items-center gap-1 rounded-full border border-[#e2e8f0] bg-[#f8fafc] px-[8px] py-[4px]">
                  <CalendarDays className="size-3.5" />
                  {formatDate(ticket.createdAt)}
                </span>
                {assignee ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#e2e8f0] bg-[#f8fafc] px-[8px] py-[4px]">
                    <User className="size-3.5" />
                    {assignee.name}
                  </span>
                ) : null}
                {techAssignee ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#ddd6fe] bg-[#f5f3ff] px-[8px] py-[4px] text-[#7c3aed]">
                    <Hammer className="size-3.5" />
                    {techAssignee.name.split(' ')[0]}
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {!filteredTickets.length ? (
        <div className="mt-4 rounded-[16px] border border-dashed border-[#cbd5e1] bg-white px-6 py-12 text-center shadow-[0_8px_24px_rgba(15,23,42,.03)]">
          <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#eff6ff] text-[#2563eb]">
            <FileText className="size-5" />
          </div>
          <div className="text-[16px] font-bold text-[#0f172a]">Nenhum ticket encontrado</div>
          <div className="mt-1 text-[13px] text-[#64748b]">
            Ajuste os filtros ou crie um novo ticket para iniciar a jornada de Cliente Fechado.
          </div>
        </div>
      ) : null}

      <TicketFormModal
        key={`${editingTicket?.id ?? 'create'}-${productCatalog.join('|')}-${integrationCatalog.join('|')}`}
        open={creating || Boolean(editingTicket)}
        ticket={editingTicket}
        productCatalog={productCatalog}
        integrationCatalog={integrationCatalog}
        onClose={() => {
          setCreating(false);
          setEditingTicketId(null);
        }}
        onSave={handleSave}
      />

      <TicketDetailsModal
        open={Boolean(viewingTicket)}
        ticket={viewingTicket}
        onClose={() => setViewingTicketId(null)}
        onEdit={() => {
          if (!viewingTicket) return;
          setViewingTicketId(null);
          setEditingTicketId(viewingTicket.id);
        }}
        onAdvanceStatus={() => {
          if (!viewingTicket) return;
          handleAdvanceStatus(viewingTicket.id);
        }}
        onToggleTask={(taskId) => {
          if (!viewingTicket) return;
          handleToggleTask(viewingTicket.id, taskId);
        }}
        onAddComment={(message) => {
          if (!viewingTicket) return;
          handleAddComment(viewingTicket.id, message);
        }}
        onAddAttachments={(files) => {
          if (!viewingTicket) return;
          handleAddAttachments(viewingTicket.id, files);
        }}
        onChangeTechnicalAssignee={(technicalAssigneeId) => {
          if (!viewingTicket) return;
          handleChangeTechnicalAssignee(viewingTicket.id, technicalAssigneeId);
        }}
        onChangeLabel={(label) => {
          if (!viewingTicket) return;
          handleChangeLabel(viewingTicket.id, label);
        }}
      />
    </div>
  );
}