'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BadgeDollarSign,
  Search,
  TrendingDown,
  User,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import { leads as initialLeads, origins, users } from '@/components/data';
import { formatMoney } from '@/components/utils';

import { toCommercialLeadRecord } from './types';

type LostLeadRecord = ReturnType<typeof toCommercialLeadRecord> & {
  lostAt: string;
  lossReasonLabel: string;
};

function KpiCard({
  label,
  value,
  icon,
  accentClassName,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accentClassName: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className={`text-2xl font-bold ${accentClassName}`}>{value}</div>
      <div className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-500">
        {icon}
        <span>{label}</span>
      </div>
    </div>
  );
}

function formatLostDate(date: string) {
  return new Date(date).toLocaleDateString('pt-BR', {
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
          lostAt: lead.createdAt,
          lossReasonLabel:
            commercialLead.lossReason?.trim() || 'Sem motivo informado',
        };
      })
      .sort(
        (left, right) =>
          new Date(right.lostAt).getTime() - new Date(left.lostAt).getTime(),
      );
  }, []);

  const filteredLeads = useMemo(() => {
    return lostLeads.filter((lead) => {
      const matchesQuery = normalizedQuery
        ? [
            lead.company,
            lead.lossReasonLabel,
            lead.contact ?? '',
            lead.cnpj ?? '',
          ]
            .join(' ')
            .toLowerCase()
            .includes(normalizedQuery)
        : true;
      const matchesSeller = sellerFilter
        ? lead.sellerId === sellerFilter
        : true;
      const matchesOrigin = originFilter
        ? lead.originId === originFilter
        : true;

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
    lostLeads.forEach((lead) => {
      counts.set(
        lead.lossReasonLabel,
        (counts.get(lead.lossReasonLabel) ?? 0) + 1,
      );
    });

    return [...counts.entries()]
      .sort((left, right) => right[1] - left[1])
      .slice(0, 5);
  }, [lostLeads]);

  const totalLostValue = lostLeads.reduce((sum, lead) => sum + lead.value, 0);
  const hasFilter = Boolean(query || sellerFilter || originFilter);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Leads Perdidos
        </h1>
        <p className="text-sm text-slate-500">
          {lostLeads.length} lead{lostLeads.length !== 1 ? 's' : ''} perdido
          {lostLeads.length !== 1 ? 's' : ''} ·{' '}
          <span className="font-medium text-slate-700">
            {formatMoney(totalLostValue)}
          </span>{' '}
          em pipeline perdido
        </p>
      </div>

      {/* KPI Cards */}
      <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          label="Leads perdidos"
          value={String(lostLeads.length)}
          icon={<TrendingDown className="h-4 w-4" />}
          accentClassName="text-red-600"
        />
        <KpiCard
          label="Pipeline perdido"
          value={formatMoney(totalLostValue)}
          icon={<BadgeDollarSign className="h-4 w-4" />}
          accentClassName="text-red-700"
        />
        <KpiCard
          label="Resultados filtrados"
          value={String(filteredLeads.length)}
          icon={<AlertTriangle className="h-4 w-4" />}
          accentClassName="text-slate-600"
        />
      </div>

      {/* Filters */}
      <div className="mb-6 grid gap-3 lg:grid-cols-3">
        <div className="relative min-w-0 lg:col-span-1 mr-2">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar loja, contato ou motivo..."
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 shadow-sm transition-colors focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 placeholder:text-slate-400"
          />
        </div>

        <div className="flex flex-wrap justify-end items-center gap-3 lg:col-span-2">
          <select
            value={sellerFilter}
            onChange={(event) => setSellerFilter(event.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition-colors focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 cursor-pointer"
          >
            <option value="">Todos os vendedores</option>
            {sellerOptions.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>

          <select
            value={originFilter}
            onChange={(event) => setOriginFilter(event.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition-colors focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 cursor-pointer"
          >
            <option value="">Todas as origens</option>
            {originOptions.map((origin) => (
              <option key={origin.id} value={origin.id}>
                {origin.name}
              </option>
            ))}
          </select>
          {hasFilter && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setSellerFilter('');
              setOriginFilter('');
            }}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
            Limpar
          </button>
        )}
        </div>

        
      </div>

      <div className="grid gap-6 lg:grid-cols-3 items-start">
        {/* Loss Reasons Summary (Sidebar on desktop) */}
        {reasonSummary.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-1 lg:sticky lg:top-4">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">
              Principais motivos de perda
            </h3>
            <div className="space-y-4">
              {reasonSummary.map(([reason, count]) => {
                const percentage = lostLeads.length
                  ? Math.round((count / lostLeads.length) * 100)
                  : 0;

                return (
                  <div key={reason}>
                    <div className="mb-1.5 flex items-center justify-between gap-3">
                      <span
                        className="text-sm font-medium text-slate-700 truncate"
                        title={reason}
                      >
                        {reason}
                      </span>
                      <span className="text-xs font-medium text-slate-500 whitespace-nowrap">
                        {count} ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-red-500 transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Lead Cards List */}
        <div
          className={`flex flex-col gap-4 ${reasonSummary.length > 0 ? 'lg:col-span-2' : 'lg:col-span-3'}`}
        >
          {filteredLeads.length ? (
            filteredLeads.map((lead) => {
              const seller = users.find((user) => user.id === lead.sellerId);
              const origin = origins.find((item) => item.id === lead.originId);

              return (
                <button
                  type="button"
                  key={lead.id}
                  onClick={() =>
                    router.push(`/comercial/crm-venda?lead=${lead.id}`)
                  }
                  className="group block w-full rounded-xl border border-red-200 border-l-4 border-l-red-500 bg-white p-5 text-left shadow-sm transition-all hover:border-red-300 hover:shadow-md"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    {/* Left: Info */}
                    <div className="min-w-45 flex-1">
                      <div className="text-base font-semibold text-slate-900 group-hover:text-red-700 transition-colors">
                        {lead.company}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                        {lead.cnpj && <span>{lead.cnpj}</span>}
                        {lead.cnpj && lead.contact && (
                          <span className="text-slate-300">•</span>
                        )}
                        {lead.contact && <span>{lead.contact}</span>}
                      </div>
                    </div>

                    {/* Right: Tags */}
                    <div className="flex flex-wrap items-center gap-2">
                      {seller && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">
                          <User className="h-3.5 w-3.5" />
                          {seller.name.split(' ')[0]}
                        </span>
                      )}

                      {origin && (
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                          {origin.name}
                        </span>
                      )}

                      {lead.value > 0 && (
                        <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                          {formatMoney(lead.value)}
                        </span>
                      )}

                      <span className="text-xs text-slate-400 sm:ml-2">
                        Perdido em {formatLostDate(lead.lostAt)}
                      </span>
                    </div>
                  </div>

                  {/* Loss Reason Callout */}
                  <div className="mt-4 rounded-lg border border-red-100 bg-red-50/50 p-3.5">
                    <div className="mb-1 text-[10px] font-bold tracking-wider text-red-600 uppercase">
                      Motivo da perda
                    </div>
                    <div className="text-sm font-medium text-slate-800">
                      {lead.lossReasonLabel}
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center px-4">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
                <TrendingDown className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">
                Nenhum lead perdido
              </h3>
              <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
                {hasFilter
                  ? 'Não encontramos resultados para os filtros aplicados. Tente limpar a busca.'
                  : 'Nenhum lead foi marcado como perdido no sistema.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
