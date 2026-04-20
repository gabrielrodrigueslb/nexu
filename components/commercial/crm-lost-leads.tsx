'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Search,
  TrendingDown,
  User,
  X,
  Filter,
  WalletCards,
  Building2,
  CalendarDays,
  Target
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import { leads as initialLeads, origins, users } from '@/components/data';
import { formatMoney } from '@/components/utils';

import { toCommercialLeadRecord } from './types';
import { cn } from '@/lib/utils';

type LostLeadRecord = ReturnType<typeof toCommercialLeadRecord> & {
  lostAt: string;
  lossReasonLabel: string;
};

function formatLostDate(date: string) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function CommercialLostLeads() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [sellerFilter, setSellerFilter] = useState('');
  const [originFilter, setOriginFilter] = useState('');

  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();

  const lostLeads = useMemo<LostLeadRecord[]>(() => {
    return initialLeads
      .filter((lead) => lead.status === 'Perdido')
      .map((lead) => {
        const commercialLead = toCommercialLeadRecord(lead);
        return {
          ...commercialLead,
          lostAt: lead.createdAt, // Usando createdAt como fallback na base mockada
          lossReasonLabel: commercialLead.lossReason?.trim() || 'Sem motivo informado',
        };
      })
      .sort((left, right) => new Date(right.lostAt).getTime() - new Date(left.lostAt).getTime());
  }, []);

  const filteredLeads = useMemo(() => {
    return lostLeads.filter((lead) => {
      const matchesQuery = normalizedQuery
        ? [lead.company, lead.lossReasonLabel, lead.contact ?? '', lead.cnpj ?? '']
            .join(' ')
            .toLowerCase()
            .includes(normalizedQuery)
        : true;
      const matchesSeller = sellerFilter ? lead.sellerId === sellerFilter : true;
      const matchesOrigin = originFilter ? lead.originId === originFilter : true;

      return matchesQuery && matchesSeller && matchesOrigin;
    });
  }, [lostLeads, normalizedQuery, originFilter, sellerFilter]);

  const sellerOptions = users.filter((user) =>
    lostLeads.some((lead) => lead.sellerId === user.id),
  );
  
  const originOptions = origins.filter((origin) =>
    lostLeads.some((lead) => lead.originId === origin.id),
  );

  const reasonSummary = useMemo(() => {
    const counts = new Map<string, number>();
    filteredLeads.forEach((lead) => {
      counts.set(lead.lossReasonLabel, (counts.get(lead.lossReasonLabel) ?? 0) + 1);
    });

    return [...counts.entries()]
      .sort((left, right) => right[1] - left[1])
      .slice(0, 6);
  }, [filteredLeads]);

  const totalLostValue = filteredLeads.reduce((sum, lead) => sum + lead.value, 0);
  const hasFilter = Boolean(query || sellerFilter || originFilter);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
      {/* Header Padronizado */}
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-[20px] font-extrabold tracking-[-0.4px] text-[#0f172a]">
            Leads Perdidos
          </h1>
          <p className="mt-0.5 text-[13px] text-[#64748b]">
            Análise de pipeline perdido e motivos de churn
          </p>
        </div>
      </div>

      {/* Toolbar de Filtros (Padrão SaaS) */}
      <div className="mb-6 rounded-[10px] border border-[#e2e8f0] bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          
          {/* Grupo Esquerdo: Filtros Principais */}
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
            
            {/* Busca */}
            <div className="relative min-w-[220px] flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]">
                <Search className="size-[14px]" />
              </span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar loja, contato ou motivo..."
                className="h-9 w-full rounded-[6px] border border-[#e2e8f0] bg-transparent pl-[34px] pr-3 text-[13px] text-[#0f172a] outline-none transition-colors focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]"
              />
            </div>

            {/* Vendedor */}
            <div className="relative">
              <select
                value={sellerFilter}
                onChange={(event) => setSellerFilter(event.target.value)}
                className="h-9 w-full min-w-[170px] appearance-none rounded-[6px] border border-[#e2e8f0] bg-transparent pl-8 pr-8 text-[13px] text-[#0f172a] outline-none transition-colors focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] sm:w-auto"
              >
                <option value="">Todos os vendedores</option>
                {sellerOptions.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
              <User className="pointer-events-none absolute left-2.5 top-1/2 size-[14px] -translate-y-1/2 text-[#64748b]" />
            </div>

            {/* Origem */}
            <div className="relative">
              <select
                value={originFilter}
                onChange={(event) => setOriginFilter(event.target.value)}
                className="h-9 w-full min-w-[170px] appearance-none rounded-[6px] border border-[#e2e8f0] bg-transparent pl-8 pr-8 text-[13px] text-[#0f172a] outline-none transition-colors focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] sm:w-auto"
              >
                <option value="">Todas as origens</option>
                {originOptions.map((origin) => (
                  <option key={origin.id} value={origin.id}>
                    {origin.name}
                  </option>
                ))}
              </select>
              <Filter className="pointer-events-none absolute left-2.5 top-1/2 size-[14px] -translate-y-1/2 text-[#64748b]" />
            </div>

            {/* Limpar Filtros */}
            {hasFilter && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setSellerFilter('');
                  setOriginFilter('');
                }}
                className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-[6px] px-3 text-[13px] font-medium text-[#64748b] transition-colors hover:bg-[#f1f5f9] hover:text-[#0f172a]"
              >
                <X className="size-[14px]" />
                Limpar
              </button>
            )}
          </div>

          {/* Divisor Visual em telas grandes */}
          <div className="hidden h-6 w-px bg-[#e2e8f0] xl:block" />

          {/* Grupo Direito: Totais */}
          <div className="flex flex-wrap items-center gap-3 border-t border-[#e2e8f0] pt-3 xl:border-none xl:pt-0">
            <div className="inline-flex h-9 items-center gap-2 rounded-[6px] border border-[#e2e8f0] bg-[#f8fafc] px-3 text-[12px] font-bold text-[#475569]">
              <Target className="size-[14px] text-[#64748b]" />
              <span>{filteredLeads.length} leads</span>
            </div>
            <div className="inline-flex h-9 items-center gap-2 rounded-[6px] border border-[#fecaca] bg-[#fef2f2] px-3 text-[12px] font-bold text-[#dc2626]">
              <WalletCards className="size-[14px]" />
              <span>Pipeline: {formatMoney(totalLostValue)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Principal */}
      <div className="grid gap-6 xl:grid-cols-4 items-start">
        
        {/* Coluna Esquerda: Resumo de Motivos (Sidebar) */}
        <div className="xl:col-span-1 xl:sticky xl:top-6 space-y-4">
          <div className="rounded-[12px] border border-[#e2e8f0] bg-white p-5 shadow-sm">
            <div className="mb-4 inline-flex items-center gap-2 text-[12px] font-bold tracking-[.06em] text-[#0f172a] uppercase">
              <TrendingDown className="size-4 text-[#dc2626]" />
              Motivos da perda
            </div>

            {reasonSummary.length > 0 ? (
              <div className="space-y-4">
                {reasonSummary.map(([reason, count]) => {
                  const percentage = filteredLeads.length
                    ? Math.round((count / filteredLeads.length) * 100)
                    : 0;

                  return (
                    <div key={reason}>
                      <div className="mb-1.5 flex items-center justify-between gap-3">
                        <span className="text-[12px] font-semibold text-[#0f172a] truncate" title={reason}>
                          {reason}
                        </span>
                        <span className="text-[11px] font-bold text-[#64748b] whitespace-nowrap">
                          {count} ({percentage}%)
                        </span>
                      </div>
                      <div className="h-[6px] w-full overflow-hidden rounded-full bg-[#f1f5f9]">
                        <div
                          className="h-full rounded-full bg-[#dc2626] transition-all duration-500 ease-out"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-[12px] text-[#64748b]">Nenhum dado disponível.</div>
            )}
          </div>
        </div>

        {/* Coluna Direita: Lista de Cards */}
        <div className="xl:col-span-3">
          <div className="grid gap-3 md:grid-cols-2">
            {filteredLeads.length ? (
              filteredLeads.map((lead) => {
                const seller = users.find((user) => user.id === lead.sellerId);
                const origin = origins.find((item) => item.id === lead.originId);

                return (
                  <button
                    type="button"
                    key={lead.id}
                    onClick={() => router.push(`/comercial/crm-venda?lead=${lead.id}`)}
                    className="group flex flex-col text-left rounded-[12px] border border-[#e2e8f0] bg-white p-4 shadow-sm transition-all hover:-translate-y-[1px] hover:border-[#fca5a5] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#fca5a5]"
                  >
                    {/* Topo do Card: Info e Badges */}
                    <div className="flex w-full items-start justify-between gap-3 mb-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="rounded-full bg-[#f1f5f9] px-[8px] py-[3px] text-[10px] font-bold text-[#64748b]">
                            {origin?.name || 'Sem origem'}
                          </span>
                          {lead.value > 0 && (
                            <span className="rounded-full bg-[#fefce8] border border-[#fde68a] px-[8px] py-[3px] text-[10px] font-bold text-[#ca8a04]">
                              {formatMoney(lead.value)}
                            </span>
                          )}
                        </div>
                        <div className="text-[15px] font-extrabold text-[#0f172a] truncate group-hover:text-[#dc2626] transition-colors">
                          {lead.company}
                        </div>
                        <div className="mt-1 text-[12px] text-[#64748b] truncate">
                          {lead.cnpj || lead.contact || 'Sem dados de contato'}
                        </div>
                      </div>
                    </div>

                    {/* Metadados: Vendedor e Data */}
                    <div className="mt-auto flex flex-wrap items-center gap-2 text-[11px] text-[#64748b] mb-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e2e8f0] bg-[#f8fafc] px-2 py-1">
                        <User className="size-3" />
                        {seller?.name.split(' ')[0] || 'Sem vendedor'}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e2e8f0] bg-[#f8fafc] px-2 py-1">
                        <CalendarDays className="size-3" />
                        {formatLostDate(lead.lostAt)}
                      </span>
                    </div>

                    {/* Box do Motivo de Perda */}
                    <div className="w-full rounded-[8px] border border-[#fecaca] bg-[#fef2f2] p-3">
                      <div className="mb-0.5 text-[10px] font-bold tracking-[.06em] text-[#dc2626] uppercase">
                        Motivo da Perda
                      </div>
                      <div className="text-[12px] font-medium text-[#991b1b] line-clamp-2">
                        {lead.lossReasonLabel}
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="col-span-full mt-4 rounded-[16px] border border-dashed border-[#cbd5e1] bg-white px-6 py-12 text-center shadow-sm">
                <div className="mx-auto mb-3 inline-flex size-14 items-center justify-center rounded-full bg-[#fef2f2] text-[#dc2626]">
                  <AlertTriangle className="size-6" />
                </div>
                <div className="text-[16px] font-bold text-[#0f172a]">Nenhum lead perdido encontrado</div>
                <div className="mt-1 text-[13px] text-[#64748b]">
                  {hasFilter
                    ? 'Ajuste os filtros para encontrar o lead desejado.'
                    : 'Nenhum lead foi marcado como perdido no sistema.'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}