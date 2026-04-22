'use client';

import { useEffect, useMemo, useState } from 'react';

import { appFieldClassName } from '@/components/app-ui-kit';
import { ModalShell } from '@/components/modal-shell';
import { CRM_COLS } from '@/components/types';
import { formatMoney } from '@/components/utils';
import { syncCatalogRows } from '@/components/admin-catalogs';

import { openProposalPdfWindow } from './proposal-generator';
import { formatBackendDate } from './backend';
import {
  cloneLeadRecord,
  COMMERCIAL_TASK_TYPES,
  computeLeadTotals,
  createEmptyPriceRows,
  todayIsoDate,
  type CommercialComment,
  type CommercialLeadRecord,
  type CommercialLeadTask,
  type CommercialPriceRow,
} from './types';

function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}

function formatCnpjInput(value: string) {
  const digits = onlyDigits(value).slice(0, 14);

  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  }
  if (digits.length <= 12) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  }

  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

function formatPhoneInput(value: string) {
  const digits = onlyDigits(value).slice(0, 11);

  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function numericInputValue(value?: number | null) {
  return value && value !== 0 ? String(value) : '';
}

function parseCurrencyInput(value: string) {
  const digits = onlyDigits(value);
  return digits ? Number(digits) / 100 : 0;
}

function currencyInputValue(value?: number | null) {
  if (!value) return '';

  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function syncPriceRowsWithCatalog(rows: CommercialPriceRow[], catalogNames: string[]) {
  return syncCatalogRows(rows, catalogNames, (name) => ({
    id: name.toLowerCase().replace(/\s+/g, '-'),
    name,
    enabled: false,
    setup: 0,
    recurring: 0,
  }));
}

function sectionTitle(title: string) {
  return (
    <div className="mb-[10px] border-b border-[#e2e8f0] pb-2 text-[13px] font-bold text-[#0f172a]">
      {title}
    </div>
  );
}

function label(text: string, required = false) {
  return (
    <label className="mb-[5px] block text-[11px] font-bold tracking-[.06em] text-[#64748b] uppercase">
      {text}
      {required ? <span className="ml-0.5 text-[#dc2626]">*</span> : null}
    </label>
  );
}

function PriceRowsEditor({
  rows,
  onChange,
  totalsLabelSetup,
  totalsLabelRecurring,
}: {
  rows: CommercialPriceRow[];
  onChange: (rows: CommercialPriceRow[]) => void;
  totalsLabelSetup: string;
  totalsLabelRecurring: string;
}) {
  const totals = rows.filter((row) => row.enabled).reduce(
    (sum, row) => ({
      setup: sum.setup + row.setup,
      recurring: sum.recurring + row.recurring,
    }),
    { setup: 0, recurring: 0 },
  );

  return (
    <>
      <div className="mb-[6px] text-[12px] text-[#64748b]">
        Selecione os itens e informe setup e recorrência individuais:
      </div>
      <div className="mb-[14px]">
        {rows.map((row) => (
          <div
            key={row.id}
            className="mb-[6px] grid grid-cols-[2fr_1fr_1fr] items-center gap-2 rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2"
          >
            <button
              type="button"
              onClick={() =>
                onChange(
                  rows.map((item) =>
                    item.id === row.id ? { ...item, enabled: !item.enabled } : item,
                  ),
                )
              }
              className={`flex items-center gap-2 rounded-[7px] border-[1.5px] px-[11px] py-2 text-left text-[13px] font-medium transition-all ${
                row.enabled
                  ? 'border-[#bfdbfe] bg-[#eff6ff] font-bold text-[#2563eb]'
                  : 'border-[#e2e8f0] bg-[#f8fafc] text-[#0f172a]'
              }`}
            >
              <span
                className={`h-4 w-4 rounded-[4px] border-2 ${
                  row.enabled
                    ? 'border-[#2563eb] bg-[#2563eb] text-white'
                    : 'border-[#cbd5e1] bg-white'
                }`}
              >
                {row.enabled ? (
                  <span className="flex h-full items-center justify-center text-[10px]">✓</span>
                ) : null}
              </span>
              <span>{row.name}</span>
            </button>
            <input
              type="text"
              inputMode="numeric"
              value={currencyInputValue(row.setup)}
              disabled={!row.enabled}
              onChange={(event) =>
                onChange(
                  rows.map((item) =>
                    item.id === row.id
                      ? { ...item, setup: parseCurrencyInput(event.target.value) }
                      : item,
                  ),
                )
              }
              className="rounded-[6px] border-[1.5px] border-[#e2e8f0] bg-white px-[10px] py-[7px] text-[13px] outline-none disabled:opacity-50"
              placeholder="0,00"
            />
            <input
              type="text"
              inputMode="numeric"
              value={currencyInputValue(row.recurring)}
              disabled={!row.enabled}
              onChange={(event) =>
                onChange(
                  rows.map((item) =>
                    item.id === row.id
                      ? { ...item, recurring: parseCurrencyInput(event.target.value) }
                      : item,
                  ),
                )
              }
              className="rounded-[6px] border-[1.5px] border-[#e2e8f0] bg-white px-[10px] py-[7px] text-[13px] outline-none disabled:opacity-50"
              placeholder="0,00"
            />
          </div>
        ))}
      </div>
      <div className="mb-[14px] flex flex-wrap items-center gap-6 rounded-[8px] bg-[#0f172a] px-4 py-3 text-white">
        <div>
          <div className="mb-[2px] text-[11px] font-semibold text-[#94a3b8]">
            {totalsLabelSetup}
          </div>
          <div className="text-[18px] font-extrabold">{formatMoney(totals.setup)}</div>
        </div>
        <div>
          <div className="mb-[2px] text-[11px] font-semibold text-[#94a3b8]">
            {totalsLabelRecurring}
          </div>
          <div className="text-[18px] font-extrabold">{formatMoney(totals.recurring)}</div>
        </div>
      </div>
    </>
  );
}

function TaskEditor({
  tasks,
  onChange,
}: {
  tasks: CommercialLeadTask[];
  onChange: (tasks: CommercialLeadTask[]) => void;
}) {
  return (
    <>
      <div className="mb-2 flex flex-col gap-[6px]">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`rounded-[7px] border px-3 py-[9px] text-[13px] transition-all ${
              task.done
                ? 'border-[#a7f3d0] bg-[#f0fdf4]'
                : 'border-[#e2e8f0] bg-[#f8fafc]'
            }`}
          >
            <div className="mb-2 flex items-center gap-[10px]">
              <button
                type="button"
                onClick={() =>
                  onChange(
                    tasks.map((item) =>
                      item.id === task.id ? { ...item, done: !item.done } : item,
                    ),
                  )
                }
                className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[4px] border-2 text-[10px] ${
                  task.done
                    ? 'border-[#059669] bg-[#059669] text-white'
                    : 'border-[#cbd5e1] bg-white text-transparent'
                }`}
              >
                ✓
              </button>
              <input
                value={task.title}
                onChange={(event) =>
                  onChange(
                    tasks.map((item) =>
                      item.id === task.id ? { ...item, title: event.target.value } : item,
                    ),
                  )
                }
                placeholder="Titulo da tarefa"
                className={`flex-1 rounded-[6px] border border-transparent bg-transparent px-[6px] py-[3px] text-[13px] outline-none hover:border-[#e2e8f0] hover:bg-white focus:border-[#2563eb] focus:bg-[#f1f5f9] ${
                  task.done ? 'text-[#64748b] line-through' : 'text-[#0f172a]'
                }`}
              />
            </div>
            <div className="grid gap-2 md:grid-cols-[1fr_170px_auto]">
              <select
                value={task.type}
                onChange={(event) =>
                  onChange(
                    tasks.map((item) =>
                      item.id === task.id
                        ? { ...item, type: event.target.value as CommercialLeadTask['type'] }
                        : item,
                    ),
                  )
                }
                className={appFieldClassName}
              >
                {COMMERCIAL_TASK_TYPES.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.label}
                  </option>
                ))}
              </select>
              <input
                type="datetime-local"
                value={task.date ?? ''}
                onChange={(event) =>
                  onChange(
                    tasks.map((item) =>
                      item.id === task.id ? { ...item, date: event.target.value } : item,
                    ),
                  )
                }
                className={appFieldClassName}
              />
              <button
                type="button"
                onClick={() => onChange(tasks.filter((item) => item.id !== task.id))}
                className="rounded-[6px] border border-[#fecaca] bg-white px-3 py-2 text-[12px] font-semibold text-[#dc2626]"
              >
                Remover
              </button>
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() =>
          onChange([
            ...tasks,
            {
              id: `task-${Date.now()}`,
              title: '',
              type: 'reuniao',
              done: false,
              date: '',
              notes: '',
            },
          ])
        }
        className="flex w-full items-center justify-center rounded-[6px] border border-[#e2e8f0] bg-white px-3 py-[6px] text-[12px] font-semibold text-[#64748b]"
      >
        + Adicionar Tarefa
      </button>
    </>
  );
}

function CommentsEditor({
  comments,
  canComment,
  isSubmitting,
  onSubmit,
}: {
  comments: CommercialComment[];
  canComment: boolean;
  isSubmitting?: boolean;
  onSubmit: (message: string) => void | Promise<void>;
}) {
  const [draft, setDraft] = useState('');

  return (
    <>
      <div className="mb-[10px] max-h-[200px] overflow-y-auto">
        {comments.map((comment) => (
          <div key={comment.id} className="mb-3 flex gap-[10px]">
            <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-[#2563eb] text-[11px] font-bold text-white">
              {comment.author
                .split(' ')
                .map((part) => part[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div className="flex-1 rounded-[0_10px_10px_10px] border border-[#e2e8f0] bg-[#f8fafc] px-[13px] py-[10px]">
              <div className="mb-1 text-[11px] text-[#64748b]">
                <strong className="font-semibold text-[#0f172a]">{comment.author}</strong>{' '}
                {comment.createdAt}
              </div>
              <div className="whitespace-pre-wrap text-[13px] leading-[1.5] text-[#0f172a]">
                {comment.message}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mb-1 flex gap-2">
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={2}
          placeholder="Adicionar comentário..."
          className="min-h-[80px] flex-1 rounded-[8px] border-[1.5px] border-[#e2e8f0] bg-[#f8fafc] px-3 py-[9px] text-[13px] outline-none"
        />
        <button
          type="button"
          disabled={!canComment || isSubmitting}
          onClick={async () => {
            if (!draft.trim()) return;
            await onSubmit(draft.trim());
            setDraft('');
          }}
          className="self-end rounded-[8px] bg-[#2563eb] px-[12px] py-[6px] text-[12px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Enviando...' : 'Comentar'}
        </button>
      </div>
      {!canComment ? (
        <div className="text-[11px] text-[#64748b]">
          Salve o lead primeiro para comentar com autoria real do usuário.
        </div>
      ) : null}
    </>
  );
}

export function LeadModal({
  open,
  lead,
  initialStatus,
  sellerOptions,
  originOptions,
  sdrOptions,
  productOptions,
  integrationOptions,
  indicatorOptions = [],
  representativeOptions = [],
  isSubmittingComment = false,
  onClose,
  onSave,
  onSubmitComment,
  onMarkWon,
  onRequestLoss,
}: {
  open: boolean;
  lead: CommercialLeadRecord | null;
  initialStatus?: CommercialLeadRecord['status'];
  sellerOptions: Array<{ id: string; name: string }>;
  originOptions: Array<{ id: string; name: string }>;
  sdrOptions: Array<{ id: string; name: string }>;
  productOptions: Array<{ id: string; name: string }>;
  integrationOptions: Array<{ id: string; name: string }>;
  indicatorOptions?: Array<{ id: string; name: string }>;
  representativeOptions?: Array<{ id: string; name: string; percent?: number }>;
  isSubmittingComment?: boolean;
  onClose: () => void;
  onSave: (lead: CommercialLeadRecord) => void;
  onSubmitComment: (message: string) => void | Promise<void>;
  onMarkWon: (lead: CommercialLeadRecord) => void;
  onRequestLoss: (lead: CommercialLeadRecord) => void;
}) {
  const productCatalog = useMemo(() => productOptions.map((item) => item.name), [productOptions]);
  const integrationCatalog = useMemo(
    () => integrationOptions.map((item) => item.name),
    [integrationOptions],
  );
  const [draft, setDraft] = useState<CommercialLeadRecord | null>(() =>
    lead
      ? {
          ...cloneLeadRecord(lead),
          products: syncPriceRowsWithCatalog(cloneLeadRecord(lead).products, productCatalog),
          integrations: syncPriceRowsWithCatalog(
            cloneLeadRecord(lead).integrations,
            integrationCatalog,
          ),
        }
      : {
          id: '',
          company: '',
          cnpj: '',
          contact: '',
          phone: '',
          createdAt: todayIsoDate(),
          status: initialStatus ?? 'Leads',
          value: 0,
          paymentMethod: '',
          installment: '',
          sellerId: '',
          sdrId: '',
          originId: '',
          consultant: '',
          validUntil: '',
          isLite: false,
          agents: 0,
          supervisors: 0,
          admins: 0,
          observations: '',
          representativeId: '',
          representativeCommission: 0,
          indicatorId: '',
          passThroughAmount: 0,
          products: createEmptyPriceRows(productCatalog),
          integrations: createEmptyPriceRows(integrationCatalog),
          comments: [],
          tasks: [],
        },
  );

  useEffect(() => {
    setDraft(
      lead
        ? {
            ...cloneLeadRecord(lead),
            products: syncPriceRowsWithCatalog(cloneLeadRecord(lead).products, productCatalog),
            integrations: syncPriceRowsWithCatalog(
              cloneLeadRecord(lead).integrations,
              integrationCatalog,
            ),
          }
        : {
            id: '',
            company: '',
            cnpj: '',
            contact: '',
            phone: '',
            createdAt: todayIsoDate(),
            status: initialStatus ?? 'Leads',
            value: 0,
            paymentMethod: '',
            installment: '',
            sellerId: '',
            sdrId: '',
            originId: '',
            consultant: '',
            validUntil: '',
            isLite: false,
            agents: 0,
            supervisors: 0,
            admins: 0,
            observations: '',
            representativeId: '',
            representativeCommission: 0,
            indicatorId: '',
            passThroughAmount: 0,
            products: createEmptyPriceRows(productCatalog),
            integrations: createEmptyPriceRows(integrationCatalog),
            comments: [],
            tasks: [],
          },
    );
  }, [initialStatus, integrationCatalog, lead, productCatalog]);

  const totals = useMemo(
    () =>
      draft
        ? computeLeadTotals({
            products: draft.products,
            integrations: draft.integrations,
          })
        : null,
    [draft],
  );

  if (!draft) return null;

  const updateDraft = (patch: Partial<CommercialLeadRecord>) =>
    setDraft((current) => (current ? { ...current, ...patch } : current));

  const builtLead = () => ({
    ...draft,
    sellerId: draft.sellerId || undefined,
    sdrId: draft.sdrId || undefined,
    originId: draft.originId || undefined,
    representativeId: draft.representativeId || undefined,
    indicatorId: draft.indicatorId || undefined,
    value: totals?.grandTotal ?? 0,
  });

  const representativePercent =
    representativeOptions.find((option) => option.id === draft.representativeId)?.percent ?? 0;
  const representativeCommission = Number(
    ((totals?.totalSetup ?? 0) * representativePercent / 100).toFixed(2),
  );
  const sellerName = sellerOptions.find((option) => option.id === draft.sellerId)?.name ?? '';
  const proposalItems = draft.products
    .filter((item) => item.enabled)
    .map((item) => ({
      name: item.name,
      setup: item.setup,
      recurring: item.recurring,
    }));
  const proposalIntegrations = draft.integrations
    .filter((item) => item.enabled)
    .map((item) => ({
      name: item.name,
      setup: item.setup,
      recurring: item.recurring,
    }));

  const handleGenerateProposal = () => {
    const opened = openProposalPdfWindow({
      company: draft.company,
      cnpj: draft.cnpj,
      contact: draft.contact,
      phone: draft.phone,
      observations: draft.observations,
      isLite: draft.isLite,
      agents: draft.agents,
      supervisors: draft.supervisors,
      admins: draft.admins,
      consultant: draft.consultant,
      sellerName,
      validUntil: draft.validUntil,
      products: proposalItems,
      integrations: proposalIntegrations,
      totalSetup: totals?.totalSetup ?? 0,
      totalRecurring: totals?.totalRecurring ?? 0,
      grandTotal: totals?.grandTotal ?? 0,
      branding: {
        logoUrl: '/logounico_branca.svg',
        brandName: 'Único Contato',
        website: 'grupounicocontato.com.br',
        email: 'contato@grupounicocontato.com.br',
        phone: '(31) 99603-9524 · WhatsApp',
      },
    });

    if (!opened) {
      window.alert('Permita pop-ups para gerar o orçamento.');
    }
  };

  return (
    <ModalShell
      open={open}
      title={lead?.id ? 'Editar Lead' : 'Novo Lead'}
      maxWidthClassName="max-w-[720px]"
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[8px] border border-[#e2e8f0] bg-white px-[18px] py-[9px] text-[13px] font-semibold text-[#64748b]"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={handleGenerateProposal}
            className="rounded-[8px] border-[1.5px] border-[#00B37E] bg-white px-3 py-[6px] text-[12px] font-semibold text-[#00B37E]"
          >
            Orçamento PDF
          </button>
          {lead?.id && draft.status !== 'Ganho' && draft.status !== 'Perdido' ? (
            <>
              <button
                type="button"
                onClick={() => onMarkWon(builtLead())}
                className="rounded-[8px] bg-[#059669] px-3 py-[6px] text-[12px] font-semibold text-white"
              >
                Dar Ganho
              </button>
              <button
                type="button"
                onClick={() => onRequestLoss(builtLead())}
                className="rounded-[8px] border-[1.5px] border-[#dc2626] bg-white px-3 py-[6px] text-[12px] font-semibold text-[#dc2626]"
              >
                Dar Perda
              </button>
            </>
          ) : null}
          <button
            type="button"
            onClick={() => {
              if (!draft.company.trim()) return;
              onSave({
                ...builtLead(),
                representativeCommission,
              });
            }}
            className="rounded-[8px] bg-[#2563eb] px-[18px] py-[9px] text-[13px] font-semibold text-white"
          >
            Salvar
          </button>
        </>
      }
    >
      <div className="pb-0">
        {sectionTitle('Dados do Lead')}
        <div className="mb-[10px] grid gap-[14px] md:grid-cols-2">
          <div>
            {label('Loja', true)}
            <input
              value={draft.company}
              onChange={(event) => updateDraft({ company: event.target.value })}
              className={appFieldClassName}
            />
          </div>
          <div>
            {label('CNPJ')}
            <input
              value={draft.cnpj ?? ''}
              onChange={(event) =>
                updateDraft({ cnpj: formatCnpjInput(event.target.value) })
              }
              inputMode="numeric"
              className={appFieldClassName}
              placeholder="00.000.000/0000-00"
            />
          </div>
        </div>

        <div className="mb-[10px] grid gap-[14px] md:grid-cols-2 xl:grid-cols-4">
          <div>
            {label('Contato')}
            <input
              value={draft.contact ?? ''}
              onChange={(event) => updateDraft({ contact: event.target.value })}
              className={appFieldClassName}
            />
          </div>
          <div>
            {label('Telefone')}
            <input
              value={draft.phone ?? ''}
              onChange={(event) =>
                updateDraft({ phone: formatPhoneInput(event.target.value) })
              }
              inputMode="numeric"
              type="tel"
              className={appFieldClassName}
              placeholder="(00) 00000-0000"
            />
          </div>
          <div>
            {label('Forma de Pagamento')}
            <select
              value={draft.paymentMethod ?? ''}
              onChange={(event) => updateDraft({ paymentMethod: event.target.value })}
              className={appFieldClassName}
            >
              <option value="">Selecione...</option>
              <option value="Boleto Bancario">Boleto Bancário</option>
              <option value="Pix">Pix</option>
              <option value="Cartao de Credito">Cartão de Crédito</option>
              <option value="Transferencia">Transferência</option>
            </select>
          </div>
          <div>
            {label('Parcelamento')}
            <select
              value={draft.installment ?? ''}
              onChange={(event) => updateDraft({ installment: event.target.value })}
              className={appFieldClassName}
            >
              <option value="">Selecione...</option>
              <option value="A vista">À vista</option>
              <option value="2x">2x</option>
              <option value="3x">3x</option>
              <option value="6x">6x</option>
              <option value="12x">12x</option>
            </select>
          </div>
        </div>

        <div className="mb-[10px] grid gap-[14px] md:grid-cols-2">
          <div>
            {label('Origem')}
            <select
              value={draft.originId ?? ''}
              onChange={(event) => updateDraft({ originId: event.target.value })}
              className={appFieldClassName}
            >
              <option value="">Selecione...</option>
              {originOptions.map((origin) => (
                <option key={origin.id} value={origin.id}>
                  {origin.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            {label('Status')}
            <select
              value={draft.status}
              onChange={(event) =>
                updateDraft({
                  status: event.target.value as CommercialLeadRecord['status'],
                })
              }
              className={appFieldClassName}
            >
              {CRM_COLS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
              <option value="Ganho">Ganho</option>
              <option value="Perdido">Perdido</option>
            </select>
          </div>
        </div>

        {sectionTitle('Responsáveis')}
        <div className="mb-[10px] grid gap-[14px] md:grid-cols-2">
          <div>
            {label('SDR (captação)')}
            <select
              value={draft.sdrId ?? ''}
              onChange={(event) => updateDraft({ sdrId: event.target.value })}
              className={appFieldClassName}
            >
              <option value="">Selecione...</option>
              {sdrOptions.map((sdr) => (
                <option key={sdr.id} value={sdr.id}>
                  {sdr.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            {label('Vendedor responsável')}
            <select
              value={draft.sellerId ?? ''}
              onChange={(event) => updateDraft({ sellerId: event.target.value })}
              className={appFieldClassName}
            >
              <option value="">Selecione...</option>
              {sellerOptions.map((seller) => (
                <option key={seller.id} value={seller.id}>
                  {seller.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-[10px] grid gap-[14px] md:grid-cols-2">
          <div>
            {label('Indicador')}
            <select
              value={draft.representativeId ?? ''}
              onChange={(event) => updateDraft({ representativeId: event.target.value })}
              className={appFieldClassName}
            >
              <option value="">Nenhum</option>
              {representativeOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            {label('Comissão rep. (R$)')}
            <input
              value={currencyInputValue(representativeCommission)}
              readOnly
              className="w-full cursor-default rounded-[7px] border-[1.5px] border-[#e2e8f0] bg-[#f8fafc] px-3 py-[9px] text-[13px] font-bold text-[#2563eb] outline-none"
              placeholder="Calculado sobre Setup"
            />
          </div>
        </div>

        {sectionTitle('Tarefas')}
        <div className="mb-[10px]">
          <TaskEditor
            tasks={draft.tasks}
            onChange={(tasks) => updateDraft({ tasks })}
          />
        </div>

        {sectionTitle('Proposta Comercial')}
        <div className="mb-[10px] grid gap-[14px] md:grid-cols-2">
          <div>
            {label('Consultora Responsável')}
            <input
              value={draft.consultant ?? ''}
              onChange={(event) => updateDraft({ consultant: event.target.value })}
              className={appFieldClassName}
              placeholder="Nome da consultora"
            />
          </div>
          <div>
            {label('Validade da Proposta')}
            <input
              type="date"
              value={draft.validUntil ?? ''}
              onChange={(event) => updateDraft({ validUntil: event.target.value })}
              className={appFieldClassName}
            />
          </div>
        </div>

        <div className="mb-[10px] flex items-center gap-[10px] rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-[10px]">
          <input
            type="checkbox"
            checked={draft.isLite ?? false}
            onChange={(event) => updateDraft({ isLite: event.target.checked })}
            className="h-4 w-4 cursor-pointer accent-[#2563eb]"
          />
          <label className="cursor-pointer text-[13px] text-[#0f172a]">
            Plano <strong>Lite</strong>{' '}
            <span className="text-[11px] text-[#64748b]">
              (versão simplificada do sistema)
            </span>
          </label>
        </div>

        <div className="mb-[10px] grid gap-[14px] md:grid-cols-3">
          <div>
            {label('Agentes')}
            <input
              type="number"
              min="0"
              value={numericInputValue(draft.agents)}
              onChange={(event) => updateDraft({ agents: Number(event.target.value) || 0 })}
              className={appFieldClassName}
              placeholder="Ex: 5"
            />
          </div>
          <div>
            {label('Supervisores')}
            <input
              type="number"
              min="0"
              value={numericInputValue(draft.supervisors)}
              onChange={(event) =>
                updateDraft({ supervisors: Number(event.target.value) || 0 })
              }
              className={appFieldClassName}
              placeholder="Ex: 2"
            />
          </div>
          <div>
            {label('Admins')}
            <input
              type="number"
              min="0"
              value={numericInputValue(draft.admins)}
              onChange={(event) => updateDraft({ admins: Number(event.target.value) || 0 })}
              className={appFieldClassName}
              placeholder="Ex: 1"
            />
          </div>
        </div>

        {sectionTitle('Produtos & Valores')}
        <PriceRowsEditor
          rows={draft.products}
          onChange={(products) => updateDraft({ products })}
          totalsLabelSetup="Setup Produtos"
          totalsLabelRecurring="Recorrência Produtos"
        />

        {sectionTitle('Integrações & Valores')}
        <PriceRowsEditor
          rows={draft.integrations}
          onChange={(integrations) => updateDraft({ integrations })}
          totalsLabelSetup="Setup Integrações"
          totalsLabelRecurring="Recorrência Integrações"
        />

        <div className="mb-[14px] flex flex-wrap items-center gap-6 rounded-[8px] bg-[#0f172a] px-4 py-3 text-white">
          <div>
            <div className="mb-[2px] text-[11px] font-semibold text-[#94a3b8]">
              Total Setup
            </div>
            <div className="text-[18px] font-extrabold">
              {formatMoney(totals?.totalSetup ?? 0)}
            </div>
          </div>
          <div>
            <div className="mb-[2px] text-[11px] font-semibold text-[#94a3b8]">
              Total Recorrência
            </div>
            <div className="text-[18px] font-extrabold">
              {formatMoney(totals?.totalRecurring ?? 0)}
            </div>
          </div>
          <div className="ml-auto">
            <div className="mb-[2px] text-[11px] font-semibold text-[#94a3b8]">
              Total Geral
            </div>
            <div className="text-[17px] font-extrabold text-[#86efac]">
              {formatMoney(totals?.grandTotal ?? 0)}
            </div>
          </div>
        </div>

        <div className="mb-[10px]">
          {label('Observações')}
          <textarea
            value={draft.observations ?? ''}
            onChange={(event) => updateDraft({ observations: event.target.value })}
            rows={2}
            className={appFieldClassName}
            placeholder="Notas sobre a negociacao..."
          />
        </div>

        {sectionTitle('Comentários')}
        <CommentsEditor
          comments={draft.comments}
          canComment={Boolean(lead?.id)}
          isSubmitting={isSubmittingComment}
          onSubmit={onSubmitComment}
        />

        {draft.status === 'Ganho' ? (
          <div className="mt-4 flex items-center gap-[6px] border-t border-[#86efac] bg-[#ecfdf5] px-6 py-[10px] text-[13px] font-semibold text-[#166534]">
            Lead ganho
            {draft.wonAt ? ` em ${formatBackendDate(draft.wonAt)}` : ''}
            {draft.generatedTicketId ? (
              <strong className="font-mono text-[#2563eb]">{draft.generatedTicketId}</strong>
            ) : null}
          </div>
        ) : null}
      </div>
    </ModalShell>
  );
}
