'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { CalendarDays, Search, WalletCards, X, Plus, Filter } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { leads as initialLeads, users } from '@/components/data';
import {
  useAdminIndicators,
  useAdminOrigins,
  useAdminSdrs,
} from '@/components/admin-settings-storage';
import { KanbanBoard } from '@/components/kanban-board';
import { CRM_COLS, type LeadStatus } from '@/components/types';
import { formatMoney } from '@/components/utils';

import { CrmLeadCard } from './crm-lead-card';
import { CrmWonLeads } from './crm-won-leads';
import { LeadLossModal } from './lead-loss-modal';
import { LeadModal } from './lead-modal';
import {
  makeCommercialTicketCode,
  makeLeadId,
  toCommercialLeadRecord,
  type CommercialLeadRecord,
} from './types';

function inDateRange(date: string, from: string, to: string) {
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

export function CommercialCrmVenda() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { items: originItems } = useAdminOrigins();
  const { items: sdrItems } = useAdminSdrs();
  const { items: indicatorItems } = useAdminIndicators();
  const [crmLeads, setCrmLeads] = useState<CommercialLeadRecord[]>(() =>
    initialLeads.map(toCommercialLeadRecord),
  );
  const [query, setQuery] = useState('');
  const [sellerFilter, setSellerFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showWon, setShowWon] = useState(false);
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [creatingStatus, setCreatingStatus] = useState<LeadStatus | undefined>();
  const [lossLead, setLossLead] = useState<CommercialLeadRecord | null>(null);

  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const requestedLeadId = searchParams.get('lead');

  const getSellerName = (sellerId?: string) =>
    users.find((user) => user.id === sellerId)?.name;

  const originOptions = useMemo(
    () => originItems.filter((item) => item.active).map(({ id, name }) => ({ id, name })),
    [originItems],
  );

  const sdrOptions = useMemo(
    () => sdrItems.filter((item) => item.active).map(({ id, name }) => ({ id, name })),
    [sdrItems],
  );

  const indicatorOptions = useMemo(
    () => indicatorItems.map(({ id, name }) => ({ id, name })),
    [indicatorItems],
  );

  const representativeOptions = useMemo(
    () =>
      indicatorItems.map(({ id, name, percentSetup }) => ({
        id,
        name,
        percent: percentSetup,
      })),
    [indicatorItems],
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

  const filteredLeads = useMemo(() => {
    return crmLeads.filter((lead) => {
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
      ]
        .join(' ')
        .toLowerCase();
      const matchesQuery = normalizedQuery ? searchable.includes(normalizedQuery) : true;
      const matchesDate = inDateRange(lead.createdAt, dateFrom, dateTo);

      return matchesSeller && matchesQuery && matchesDate;
    });
  }, [crmLeads, dateFrom, dateTo, normalizedQuery, sellerFilter]);

  const activeLeads = filteredLeads.filter(
    (lead) => lead.status !== 'Ganho' && lead.status !== 'Perdido',
  );
  const wonLeads = filteredLeads.filter((lead) => lead.status === 'Ganho');

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

  const hasFilter = Boolean(query || sellerFilter || dateFrom || dateTo);
  const totalWonValue = wonLeads.reduce((sum, lead) => sum + lead.value, 0);

  function closeLeadModal() {
    setEditingLeadId(null);
    setCreatingStatus(undefined);
  }

  function handleMoveLead(leadId: string, targetColumn: (typeof CRM_COLS)[number]) {
    setCrmLeads((current) =>
      current.map((lead) =>
        lead.id === leadId ? { ...lead, status: targetColumn as LeadStatus } : lead,
      ),
    );
  }

  function handleOpenCreate(defaultStatus?: (typeof CRM_COLS)[number]) {
    setEditingLeadId(null);
    setCreatingStatus(defaultStatus ?? 'Leads');
  }

  function handleOpenEdit(leadId: string) {
    setCreatingStatus(undefined);
    setEditingLeadId(leadId);
  }

  function handleSaveLead(lead: CommercialLeadRecord) {
    setCrmLeads((current) => {
      const existingIndex = current.findIndex((item) => item.id === lead.id);

      if (existingIndex >= 0) {
        return current.map((item) => (item.id === lead.id ? lead : item));
      }

      return [{ ...lead, id: makeLeadId(current) }, ...current];
    });

    closeLeadModal();
  }

  function handleMarkWon(lead: CommercialLeadRecord) {
    setCrmLeads((current) =>
      current.map((item) =>
        item.id === lead.id
          ? {
              ...lead,
              status: 'Ganho',
              wonAt: new Date().toLocaleDateString('pt-BR'),
              generatedTicketId: lead.generatedTicketId ?? makeCommercialTicketCode(),
            }
          : item,
      ),
    );

    closeLeadModal();
  }

  function handleRequestLoss(lead: CommercialLeadRecord) {
    setLossLead(lead);
  }

  function handleConfirmLoss(reason: string) {
    if (!lossLead) return;

    setCrmLeads((current) =>
      current.map((item) =>
        item.id === lossLead.id
          ? {
              ...item,
              status: 'Perdido',
              lossReason: reason,
            }
          : item,
      ),
    );

    setLossLead(null);
    closeLeadModal();
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
      {/* Header e Ação Principal */}
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-[20px] font-extrabold tracking-[-0.4px] text-[#0f172a]">
            CRM de Venda
          </h1>
          <p className="mt-0.5 text-[13px] text-[#64748b]">
            Pipeline comercial - Kanban de Leads
          </p>
        </div>
        
        <button
          type="button"
          onClick={() => handleOpenCreate()}
          className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-[8px] bg-[#2563eb] px-4 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-[#1d4ed8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb] focus-visible:ring-offset-2"
        >
          <Plus className="h-4 w-4" />
          Novo Lead
        </button>
      </div>

      {/* Toolbar de Filtros */}
      <div className="mb-6 rounded-[10px] border border-[#e2e8f0] bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          
          {/* Grupo Esquerdo: Filtros Principais */}
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            
            {/* Busca */}
            <div className="relative min-w-[220px] flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]">
                <Search className="h-[14px] w-[14px]" />
              </span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Nome ou CNPJ..."
                className="h-9 w-full rounded-[6px] border border-[#e2e8f0] bg-transparent pl-[34px] pr-3 text-[13px] text-[#0f172a] outline-none transition-colors focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]"
              />
            </div>

            {/* Vendedor */}
            <div className="relative">
              <select
                value={sellerFilter}
                onChange={(event) => setSellerFilter(event.target.value)}
                className="h-9 w-full min-w-[160px] appearance-none rounded-[6px] border border-[#e2e8f0] bg-transparent pl-8 pr-8 text-[13px] text-[#0f172a] outline-none transition-colors focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] sm:w-auto"
              >
                <option value="">Todos os vendedores</option>
                <option value="sem">- Sem responsável</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
              <Filter className="pointer-events-none absolute left-2.5 top-1/2 h-[14px] w-[14px] -translate-y-1/2 text-[#64748b]" />
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
            )}
          </div>

          {/* Divisor Visuais em telas grandes */}
          <div className="hidden h-6 w-px bg-[#e2e8f0] lg:block" />

          {/* Grupo Direito: Toggle e Métricas */}
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

            {wonLeads.length > 0 && (
              <div className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#059669] bg-[#ecfdf5] px-3 h-9 rounded-[6px] border border-[#d1fae5]">
                <WalletCards className="h-[14px] w-[14px]" />
                {formatMoney(totalWonValue)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      {showWon ? (
        <CrmWonLeads
          leads={wonLeads}
          getSellerName={getSellerName}
          onOpenLead={handleOpenEdit}
        />
      ) : null}

      <KanbanBoard
        columns={columns}
        getItemId={(lead) => lead.id}
        onMoveItem={handleMoveLead}
        onAddItem={(columnId) => handleOpenCreate(columnId)}
        renderCard={(lead) => (
          <CrmLeadCard
            lead={lead}
            sellerName={getSellerName(lead.sellerId)}
            originName={originOptions.find((origin) => origin.id === lead.originId)?.name}
            sdrName={sdrOptions.find((sdr) => sdr.id === lead.sdrId)?.name}
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
        sellerOptions={users}
        originOptions={originOptions}
        sdrOptions={sdrOptions}
        indicatorOptions={indicatorOptions}
        representativeOptions={representativeOptions}
        onClose={closeLeadModal}
        onSave={handleSaveLead}
        onMarkWon={handleMarkWon}
        onRequestLoss={handleRequestLoss}
      />

      <LeadLossModal
        key={lossLead?.id ?? 'lead-loss'}
        open={Boolean(lossLead)}
        leadName={lossLead?.company ?? ''}
        onClose={() => setLossLead(null)}
        onConfirm={handleConfirmLoss}
      />
    </div>
  );
}