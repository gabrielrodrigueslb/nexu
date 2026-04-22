'use client';

import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { CalendarDays, Filter, Plus, Search, WalletCards, X } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { KanbanBoard } from '@/components/kanban-board';
import { CRM_COLS, type LeadStatus } from '@/components/types';
import { formatMoney } from '@/components/utils';

import {
  createLeadComment,
  fetchCommercialLeads,
  fetchCommercialLookups,
  mapBackendLeadToCommercialLead,
  saveCommercialLead,
  updateLeadStatus,
  type CommercialLookups,
} from './backend';
import { CrmLeadCard } from './crm-lead-card';
import { LeadLossModal } from './lead-loss-modal';
import { LeadModal } from './lead-modal';
import { type CommercialLeadRecord } from './types';
import { CrmWonLeads } from './crm-won-leads';

function inDateRange(date: string, from: string, to: string) {
  const value = date.slice(0, 10);
  if (from && value < from) return false;
  if (to && value > to) return false;
  return true;
}

function formatCommentDateTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('pt-BR') + ' ' + parsed.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function CommercialCrmVenda() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requestedLeadId = searchParams.get('lead');
  const [lookups, setLookups] = useState<CommercialLookups | null>(null);
  const [crmLeads, setCrmLeads] = useState<CommercialLeadRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [sellerFilter, setSellerFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showWon, setShowWon] = useState(false);
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [creatingStatus, setCreatingStatus] = useState<LeadStatus | undefined>();
  const [lossLead, setLossLead] = useState<CommercialLeadRecord | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const nextLookups = await fetchCommercialLookups();
      const leadItems = await fetchCommercialLeads();

      setLookups(nextLookups);
      setCrmLeads(
        leadItems.map((lead) => mapBackendLeadToCommercialLead(lead, nextLookups)),
      );
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Falha ao carregar CRM.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();

  const getSellerName = useCallback(
    (sellerId?: string) => lookups?.users.find((user) => user.id === sellerId)?.name,
    [lookups],
  );

  const editingLead = useMemo(
    () =>
      crmLeads.find(
        (lead) => lead.id === (editingLeadId ?? requestedLeadId ?? '__missing__'),
      ) ?? null,
    [crmLeads, editingLeadId, requestedLeadId],
  );

  useEffect(() => {
    if (!requestedLeadId) return;

    const leadExists = crmLeads.some((lead) => lead.id === requestedLeadId);
    if (!leadExists) return;

    router.replace(pathname, { scroll: false });
  }, [crmLeads, pathname, requestedLeadId, router]);

  const filteredLeads = useMemo(
    () =>
      crmLeads.filter((lead) => {
        const matchesSeller =
          sellerFilter === 'sem'
            ? !lead.sellerId
            : sellerFilter
              ? lead.sellerId === sellerFilter
              : true;
        const searchable = [
          lead.id,
          lead.company,
          lead.contact ?? '',
          lead.cnpj ?? '',
          lead.phone ?? '',
          lead.lossReason ?? '',
        ]
          .join(' ')
          .toLowerCase();
        const matchesQuery = normalizedQuery ? searchable.includes(normalizedQuery) : true;
        const matchesDate = inDateRange(lead.createdAt, dateFrom, dateTo);

        return matchesSeller && matchesQuery && matchesDate;
      }),
    [crmLeads, dateFrom, dateTo, normalizedQuery, sellerFilter],
  );

  const activeLeads = filteredLeads.filter(
    (lead) => lead.status !== 'Ganho' && lead.status !== 'Perdido',
  );
  const wonLeads = filteredLeads.filter((lead) => lead.status === 'Ganho');
  const totalWonValue = wonLeads.reduce((sum, lead) => sum + lead.value, 0);
  const hasFilter = Boolean(query || sellerFilter || dateFrom || dateTo);

  const columns = CRM_COLS.map((column) => {
    const items = activeLeads.filter((lead) => lead.status === column);
    const totalValue = items.reduce((sum, lead) => sum + lead.value, 0);

    return {
      id: column,
      title: column,
      items,
      valueLabel: totalValue ? formatMoney(totalValue) : undefined,
      accentClassName: 'text-[#2563eb]',
    };
  });

  function closeLeadModal() {
    setEditingLeadId(null);
    setCreatingStatus(undefined);
  }

  async function upsertLead(nextLead: CommercialLeadRecord) {
    if (!lookups) return;

    const saved = await saveCommercialLead(nextLead, lookups);
    const mapped = mapBackendLeadToCommercialLead(saved, lookups);

    setCrmLeads((current) => {
      const exists = current.some((item) => item.id === mapped.id);
      if (!exists) return [mapped, ...current];
      return current.map((item) => (item.id === mapped.id ? mapped : item));
    });

    return mapped;
  }

  async function handleMoveLead(leadId: string, targetColumn: (typeof CRM_COLS)[number]) {
    if (!lookups) return;
    const currentLead = crmLeads.find((lead) => lead.id === leadId);
    if (!currentLead) return;

    const saved = await updateLeadStatus(currentLead, lookups, { status: targetColumn });
    const mapped = mapBackendLeadToCommercialLead(saved, lookups);
    setCrmLeads((current) => current.map((lead) => (lead.id === leadId ? mapped : lead)));
  }

  function handleOpenCreate(defaultStatus?: (typeof CRM_COLS)[number]) {
    setEditingLeadId(null);
    setCreatingStatus(defaultStatus ?? 'Leads');
  }

  function handleOpenEdit(leadId: string) {
    setCreatingStatus(undefined);
    setEditingLeadId(leadId);
  }

  async function handleSaveLead(lead: CommercialLeadRecord) {
    await upsertLead(lead);
    closeLeadModal();
  }

  async function handleMarkWon(lead: CommercialLeadRecord) {
    if (!lookups || !lead.id) return;

    const saved = await updateLeadStatus(lead, lookups, {
      status: 'Ganho',
      wonAt: new Date().toISOString(),
    });
    const mapped = mapBackendLeadToCommercialLead(saved, lookups);
    setCrmLeads((current) => current.map((item) => (item.id === lead.id ? mapped : item)));
    closeLeadModal();
  }

  function handleRequestLoss(lead: CommercialLeadRecord) {
    setLossLead(lead);
  }

  async function handleConfirmLoss(reason: string) {
    if (!lookups || !lossLead?.id) return;

    const saved = await updateLeadStatus(lossLead, lookups, {
      status: 'Perdido',
      lossReason: reason,
    });
    const mapped = mapBackendLeadToCommercialLead(saved, lookups);

    setCrmLeads((current) =>
      current.map((item) => (item.id === lossLead.id ? mapped : item)),
    );

    setLossLead(null);
    closeLeadModal();
  }

  async function handleSubmitComment(message: string) {
    if (!editingLead?.id) return;

    setIsSubmittingComment(true);

    try {
      const createdComment = await createLeadComment(editingLead.id, message);
      setCrmLeads((current) =>
        current.map((lead) =>
          lead.id === editingLead.id
            ? {
                ...lead,
                comments: [
                  {
                    id: createdComment.id,
                    author: createdComment.author?.name || 'Usuário',
                    message: createdComment.message,
                    createdAt: formatCommentDateTime(createdComment.createdAt),
                  },
                  ...lead.comments,
                ],
              }
            : lead,
        ),
      );
    } finally {
      setIsSubmittingComment(false);
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-[12px] border border-[#e2e8f0] bg-white px-5 py-8 text-[14px] text-[#64748b] shadow-sm">
        Carregando CRM...
      </div>
    );
  }

  if (!lookups) {
    return (
      <div className="rounded-[12px] border border-[#fecaca] bg-[#fff5f5] px-5 py-8 text-[14px] text-[#b91c1c] shadow-sm">
        {error || 'Não foi possível carregar os dados do CRM.'}
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-[20px] font-extrabold tracking-[-0.4px] text-[#0f172a]">
            CRM de Venda
          </h1>
          <p className="mt-0.5 text-[13px] text-[#64748b]">
            Pipeline comercial com dados vivos da API.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleOpenCreate()}
          className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-[8px] bg-[#2563eb] px-4 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-[#1d4ed8]"
        >
          <Plus className="h-4 w-4" />
          Novo Lead
        </button>
      </div>

      <div className="mb-6 rounded-[10px] border border-[#e2e8f0] bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-[220px] flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]">
                <Search className="h-[14px] w-[14px]" />
              </span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Nome, CNPJ ou motivo..."
                className="h-9 w-full rounded-[6px] border border-[#e2e8f0] bg-transparent pl-[34px] pr-3 text-[13px] text-[#0f172a] outline-none transition-colors focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]"
              />
            </div>

            <div className="relative">
              <select
                value={sellerFilter}
                onChange={(event) => setSellerFilter(event.target.value)}
                className="h-9 w-full min-w-[160px] appearance-none rounded-[6px] border border-[#e2e8f0] bg-transparent pl-8 pr-8 text-[13px] text-[#0f172a] outline-none transition-colors focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] sm:w-auto"
              >
                <option value="">Todos os vendedores</option>
                <option value="sem">- Sem responsável</option>
                {lookups.users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
              <Filter className="pointer-events-none absolute left-2.5 top-1/2 h-[14px] w-[14px] -translate-y-1/2 text-[#64748b]" />
            </div>

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

            {hasFilter ? (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setSellerFilter('');
                  setDateFrom('');
                  setDateTo('');
                }}
                className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-[6px] px-3 text-[13px] font-medium text-[#64748b] transition-colors hover:bg-[#f1f5f9] hover:text-[#0f172a]"
              >
                <X className="h-[14px] w-[14px]" />
                Limpar
              </button>
            ) : null}
          </div>

          <div className="hidden h-6 w-px bg-[#e2e8f0] lg:block" />

          <div className="flex items-center justify-between gap-4 border-t border-[#e2e8f0] pt-3 lg:border-none lg:pt-0">
            <button
              type="button"
              onClick={() => setShowWon((value) => !value)}
              className={`inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-[6px] border px-3 text-[13px] font-semibold transition-colors ${
                showWon
                  ? 'border-[#059669] bg-[#059669] text-white shadow-sm'
                  : 'border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f8fafc]'
              }`}
            >
              Ganhos
              <span
                className={`flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1.5 text-[11px] ${
                  showWon ? 'bg-white/25 text-white' : 'bg-[#ecfdf5] text-[#059669]'
                }`}
              >
                {wonLeads.length}
              </span>
            </button>

            {wonLeads.length > 0 ? (
              <div className="inline-flex h-9 items-center gap-1.5 rounded-[6px] border border-[#d1fae5] bg-[#ecfdf5] px-3 text-[13px] font-bold text-[#059669]">
                <WalletCards className="h-[14px] w-[14px]" />
                {formatMoney(totalWonValue)}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-[10px] border border-[#fecaca] bg-[#fff5f5] px-4 py-3 text-[13px] text-[#b91c1c]">
          {error}
        </div>
      ) : null}

      {showWon ? (
        <CrmWonLeads leads={wonLeads} getSellerName={getSellerName} onOpenLead={handleOpenEdit} />
      ) : null}

      <KanbanBoard
        columns={columns}
        getItemId={(lead) => lead.id}
        onMoveItem={(leadId, columnId) => {
          void handleMoveLead(leadId, columnId);
        }}
        onAddItem={(columnId) => handleOpenCreate(columnId)}
        renderCard={(lead) => (
          <CrmLeadCard
            lead={lead}
            sellerName={getSellerName(lead.sellerId)}
            originName={lookups.origins.find((origin) => origin.id === lead.originId)?.name}
            sdrName={lookups.sdrs.find((sdr) => sdr.id === lead.sdrId)?.name}
            pendingTasks={lead.tasks.filter((task) => !task.done).length}
            onClick={() => handleOpenEdit(lead.id)}
          />
        )}
      />

      <LeadModal
        key={editingLeadId ?? `new-${creatingStatus ?? 'Leads'}`}
        open={Boolean(editingLeadId || creatingStatus)}
        lead={editingLead}
        initialStatus={creatingStatus}
        sellerOptions={lookups.users}
        originOptions={lookups.origins}
        sdrOptions={lookups.sdrs}
        productOptions={lookups.products}
        integrationOptions={lookups.integrations}
        indicatorOptions={lookups.indicators}
        representativeOptions={lookups.indicators.map((item) => ({
          id: item.id,
          name: item.name,
          percent: item.percentSetup,
        }))}
        isSubmittingComment={isSubmittingComment}
        onClose={closeLeadModal}
        onSave={(lead) => {
          void handleSaveLead(lead);
        }}
        onSubmitComment={(message) => handleSubmitComment(message)}
        onMarkWon={(lead) => {
          void handleMarkWon(lead);
        }}
        onRequestLoss={handleRequestLoss}
      />

      <LeadLossModal
        key={lossLead?.id ?? 'lead-loss'}
        open={Boolean(lossLead)}
        leadName={lossLead?.company ?? ''}
        onClose={() => setLossLead(null)}
        onConfirm={(reason) => {
          void handleConfirmLoss(reason);
        }}
      />
    </div>
  );
}
