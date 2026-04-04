'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { CalendarDays, Search, WalletCards, X } from 'lucide-react';
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
  const [originItems] = useAdminOrigins();
  const [sdrItems] = useAdminSdrs();
  const [indicatorItems] = useAdminIndicators();
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
      <div className="mb-[18px] flex items-start justify-between gap-3">
        <div>
          <div className="text-[19px] font-extrabold tracking-[-0.4px] text-[#0f172a]">
            CRM de Venda
          </div>
          <div className="mt-0.5 text-[13px] text-[#64748b]">
            Pipeline comercial - Kanban de Leads
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 py-1">
        <button
          type="button"
          onClick={() => handleOpenCreate()}
          className="whitespace-nowrap rounded-[6px] bg-[#2563eb] px-[14px] py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[#1d4ed8]"
        >
          + Novo Lead
        </button>

        <div className="relative min-w-[160px] max-w-[260px] flex-1">
          <span className="pointer-events-none absolute left-[9px] top-1/2 -translate-y-1/2 text-[#64748b]">
            <Search className="h-[14px] w-[14px]" />
          </span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nome ou CNPJ..."
            className="w-full rounded-[8px] border border-[#e2e8f0] bg-white py-[7px] pr-[10px] pl-[30px] text-[13px] text-[#0f172a] outline-none"
          />
        </div>

        <select
          value={sellerFilter}
          onChange={(event) => setSellerFilter(event.target.value)}
          className="min-w-[160px] rounded-[8px] border border-[#e2e8f0] bg-white px-[10px] py-[7px] text-[13px] text-[#0f172a] outline-none"
        >
          <option value="">Todos os vendedores</option>
          <option value="sem">- Sem responsavel</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1">
          <span className="inline-flex items-center gap-1 whitespace-nowrap text-[12px] text-[#64748b]">
            <CalendarDays className="h-[13px] w-[13px]" />
            <span>De</span>
          </span>
          <input
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
            className="cursor-pointer rounded-[8px] border border-[#e2e8f0] bg-white px-2 py-[6px] text-[13px] text-[#0f172a] outline-none"
          />
          <span className="text-[12px] text-[#64748b]">ate</span>
          <input
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
            className="cursor-pointer rounded-[8px] border border-[#e2e8f0] bg-white px-2 py-[6px] text-[13px] text-[#0f172a] outline-none"
          />
        </div>

        <button
          type="button"
          onClick={() => setShowWon((value) => !value)}
          className={`whitespace-nowrap rounded-[8px] border-[1.5px] px-3 py-[7px] text-[12px] font-bold transition-colors ${
            showWon
              ? 'border-[#059669] bg-[#059669] text-white'
              : 'border-[#e2e8f0] bg-white text-[#64748b]'
          }`}
        >
          <span className="inline-flex items-center gap-2">
            Ganhos
            <span
              className={`rounded-full px-2 py-[1px] text-[11px] ${
                showWon ? 'bg-white/20 text-white' : 'bg-[#ecfdf5] text-[#059669]'
              }`}
            >
              {wonLeads.length}
            </span>
          </span>
        </button>

        {wonLeads.length ? (
          <div className="inline-flex items-center gap-1 text-[11px] font-bold text-[#059669]">
            <WalletCards className="h-[13px] w-[13px]" />
            <span>{formatMoney(totalWonValue)}</span>
          </div>
        ) : null}

        {hasFilter ? (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setSellerFilter('');
              setDateFrom('');
              setDateTo('');
            }}
            className="whitespace-nowrap rounded-[6px] border border-[#e2e8f0] bg-white px-3 py-[6px] text-[12px] font-semibold text-[#64748b] transition-colors hover:bg-[#f8fafc] hover:text-[#0f172a]"
          >
            <span className="inline-flex items-center gap-1">
              <X className="h-[13px] w-[13px]" />
              <span>Limpar filtros</span>
            </span>
          </button>
        ) : null}
      </div>

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
