'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRightLeft,
  BadgeCheck,
  CalendarDays,
  CircleCheckBig,
  ClipboardList,
  Clock3,
  KanbanSquare,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  Wrench,
  X,
} from 'lucide-react';

import type { GoalsState, Lead, Ticket } from './types';
import { formatMoney, sumBy } from './utils';
import { useActivityTotals, useCrmData, useOriginStats, useSdrStats, useVendorStats } from './hooks';
import { MetricCard, SectionTitle } from './ui';
import {
  ActivitiesTable,
  FunnelPanel,
  OriginsTable,
  SdrTable,
  TaskAlerts,
  TicketJourneyPanel,
  VendorTable,
} from './sections';
import {
  fetchCommercialLeads,
  fetchCommercialLookups,
  fetchDashboardTickets,
  mapBackendLeadTicketToDashboardTicket,
  mapBackendLeadToDashboardLead,
  type CommercialLookups,
} from './commercial/backend';

function buildGoalDefaults(leads: Lead[]) {
  const wins = leads.filter((lead) => lead.status === 'Ganho');
  const sellers = [...new Set(leads.map((lead) => lead.sellerId).filter(Boolean))] as string[];
  const sdrs = [...new Set(leads.map((lead) => lead.sdrId).filter(Boolean))] as string[];
  const activitiesTotal = leads.reduce((sum, lead) => sum + lead.tasks.length, 0);

  return {
    leadsTotal: leads.length,
    salesTotal: wins.reduce((sum, lead) => sum + lead.value, 0),
    sdrs: Object.fromEntries(sdrs.map((id) => [id, leads.filter((lead) => lead.sdrId === id).length])),
    sellers: Object.fromEntries(
      sellers.map((id) => [
        id,
        wins.filter((lead) => lead.sellerId === id).reduce((sum, lead) => sum + lead.value, 0),
      ]),
    ),
    activitiesMeta: activitiesTotal,
    activitiesIndividual: Object.fromEntries(
      sellers.map((id) => [id, leads.filter((lead) => lead.sellerId === id).reduce((sum, lead) => sum + lead.tasks.length, 0)]),
    ),
  } satisfies GoalsState;
}

export function DashboardCrmOverview() {
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [lookups, setLookups] = useState<CommercialLookups | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [goals, setGoals] = useState<GoalsState>({
    leadsTotal: 0,
    salesTotal: 0,
    sdrs: {},
    sellers: {},
    activitiesMeta: 0,
    activitiesIndividual: {},
  });

  useEffect(() => {
    let active = true;

    async function load() {
      const [nextLookups, leadItems, ticketItems] = await Promise.all([
        fetchCommercialLookups(),
        fetchCommercialLeads(),
        fetchDashboardTickets(),
      ]);

      if (!active) return;

      const nextLeads = leadItems.map(mapBackendLeadToDashboardLead);
      const linkedLeadTickets = leadItems
        .map(mapBackendLeadTicketToDashboardTicket)
        .filter((ticket): ticket is Ticket => Boolean(ticket));
      const mergedTickets = [...ticketItems];

      linkedLeadTickets.forEach((ticket) => {
        if (!mergedTickets.some((current) => current.id === ticket.id)) {
          mergedTickets.push(ticket);
        }
      });

      setLookups(nextLookups);
      setLeads(nextLeads);
      setTickets(mergedTickets);
      setGoals(buildGoalDefaults(nextLeads));
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  const data = useCrmData(leads, tickets, dateRange.from, dateRange.to);
  const originStats = useOriginStats(data.filteredLeads, lookups?.origins || []);
  const sdrStats = useSdrStats(data.filteredLeads, lookups?.sdrs || []);
  const vendorStats = useVendorStats(data.filteredLeads, data.filteredTickets, lookups?.users || []);
  const { actTotalGlobal, actDoneGlobal } = useActivityTotals(vendorStats);

  const hasFilter = Boolean(dateRange.from || dateRange.to);

  const ticketStages = useMemo(
    () => [
      {
        label: 'Aguard. Pagamento',
        count: data.tkPendFin.length,
        value: data.tkValPendFin,
        color: '#d97706',
      },
      {
        label: 'Pagamento Confirmado',
        count: data.tkPagConf.length,
        value: sumBy(data.tkPagConf, data.ticketValue),
        color: '#7c3aed',
      },
      {
        label: 'Em Implantação',
        count: data.tkImpl.length,
        value: data.tkValImpl,
        color: '#2563eb',
      },
      {
        label: 'Concluído',
        count: data.tkConc.length,
        value: data.tkSetupConc + data.tkMRR,
        color: '#059669',
      },
      {
        label: 'Cancelado',
        count: data.tkCancel.length,
        value: sumBy(data.tkCancel, data.ticketValue),
        color: '#dc2626',
      },
    ],
    [data],
  );

  function updateGoal<K extends keyof GoalsState>(key: K, value: GoalsState[K]) {
    setGoals((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="grid gap-0 pb-2">
      <div className="mb-0 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[19px] font-extrabold tracking-[-0.4px] text-[#0f172a]">
            Dashboard CRM
          </div>
          <div className="mt-[2px] text-[13px] text-[#64748b]">
            Visão 360° do pipeline — leads, SDRs, vendedores, tarefas e metas
Visão Geral
            {hasFilter ? (
              <span className="ml-2 rounded-full bg-[#eff6ff] px-[9px] py-[2px] text-[11px] font-bold text-[#2563eb]">
                Período filtrado
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-[.05em] text-[#64748b]">
            Período:
          </span>
          {(['from', 'to'] as const).map((key) => (
            <div
              key={key}
              className="flex items-center gap-2 rounded-[7px] border border-[#e2e8f0] bg-white px-2 py-[5px]"
            >
              <CalendarDays className="size-3.5 text-[#64748b]" />
              <input
                type="date"
                value={dateRange[key]}
                onChange={(event) => setDateRange((prev) => ({ ...prev, [key]: event.target.value }))}
                className="bg-transparent text-[12px] text-[#0f172a] outline-none"
              />
            </div>
          ))}
          {hasFilter ? (
            <>
              <button
                type="button"
                onClick={() => setDateRange({ from: '', to: '' })}
                className="inline-flex items-center gap-1 rounded-[7px] border border-[#e2e8f0] bg-white px-3 py-[5px] text-[12px] font-semibold text-[#64748b]"
              >
                <X className="size-3.5" /> Limpar
              </button>
              <span className="rounded-full bg-[#eff6ff] px-[10px] py-[3px] text-[11px] font-bold text-[#2563eb]">
                Filtrado
              </span>
            </>
          ) : null}
        </div>
      </div>

      <SectionTitle title="Visão Geral" />
      <div className="mb-1 grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(195px, 1fr))' }}>
        <MetricCard icon={<TrendingUp className="size-[18px] text-[#2563eb]" />} title="Leads Ativos" value={`${data.ativos.length}`} subtitle={`Pipeline: ${formatMoney(data.totalVal)}`} tone="accent" />
        <MetricCard icon={<Trophy className="size-[18px] text-[#059669]" />} title="Leads Ganhos" value={`${data.ganhos.length}`} subtitle={`${formatMoney(data.ganhoVal)} captados`} tone="success" />
        <MetricCard icon={<TrendingDown className="size-[18px] text-[#dc2626]" />} title="Leads Perdidos" value={`${data.perdidos.length}`} subtitle={`${formatMoney(data.perdidoVal)} perdidos`} tone="error" />
        <MetricCard icon={<ArrowRightLeft className="size-[18px] text-[#0f172a]" />} title="Tx. Conversão" value={`${data.txConv}%`} subtitle="Ganhos vs. encerrados" tone={data.txConv >= 30 ? 'success' : data.txConv >= 15 ? 'warning' : 'error'} />
        <MetricCard icon={<KanbanSquare className="size-[18px] text-[#7c3aed]" />} title="Tickets Ativos" value={`${data.tkAtivos.length}`} subtitle={`${data.tkImpl.length} em implantação`} tone="purple" />
        <MetricCard icon={<ClipboardList className="size-[18px] text-[#0f172a]" />} title="Tarefas Pendentes" value={`${data.tPend.length}`} subtitle={`${data.tAtrasadas.length} atrasadas / ${data.tHoje.length} hoje`} tone={data.tAtrasadas.length > 0 ? 'error' : 'neutral'} />
        <MetricCard icon={<CircleCheckBig className="size-[18px] text-[#059669]" />} title="Tarefas Concluídas" value={`${data.tFeitas.length}`} subtitle={`${Math.round((data.tFeitas.length / Math.max(data.allTasks.length, 1)) * 100)}% do total`} tone="success" />
      </div>

      <SectionTitle title="Funil de Vendas & Jornada de Implantação" />
      <div className="mb-1 grid gap-[14px] xl:grid-cols-2">
        <FunnelPanel data={data} />
        <TicketJourneyPanel data={data} ticketStages={ticketStages} />
      </div>

      {originStats.length ? (
        <>
          <SectionTitle title="Leads por Origem" description="Valor ganho e pipeline em aberto por canal de aquisição" />
          <OriginsTable originStats={originStats} />
        </>
      ) : null}

      <SectionTitle title="Leads por SDR" description="Captação individual, distribuição por vendedor e metas" />
      <SdrTable
        sdrStats={sdrStats}
        users={lookups?.users || []}
        goals={goals}
        totalLeads={data.filteredLeads.length}
        onChangeLeadsGoal={(value) => updateGoal('leadsTotal', value)}
        onChangeSdrGoal={(id, value) => updateGoal('sdrs', { ...goals.sdrs, [id]: value })}
      />

      <SectionTitle title="Ranking de Vendedores" description="Performance, receita, tickets e metas individuais" />
      <VendorTable
        vendorStats={vendorStats}
        goals={goals}
        ganhoVal={data.ganhoVal}
        onChangeSalesGoal={(value) => updateGoal('salesTotal', value)}
        onChangeSellerGoal={(id, value) => updateGoal('sellers', { ...goals.sellers, [id]: value })}
      />

      {vendorStats.length ? (
        <>
          <SectionTitle title="Tarefas por Tipo - Por Vendedor" description="Atividades realizadas e taxa de conclusão" />
          <ActivitiesTable
            vendorStats={vendorStats}
            goals={goals}
            actTotalGlobal={actTotalGlobal}
            actDoneGlobal={actDoneGlobal}
            onChangeMetaGlobal={(value) => updateGoal('activitiesMeta', value)}
            onChangeMetaIndividual={(id, value) =>
              updateGoal('activitiesIndividual', { ...goals.activitiesIndividual, [id]: value })
            }
          />
        </>
      ) : null}

      {data.tAtrasadas.length || data.tHoje.length ? (
        <>
          <SectionTitle title="Alertas de Tarefas" />
          <TaskAlerts tAtrasadas={data.tAtrasadas} tHoje={data.tHoje} users={lookups?.users || []} />
        </>
      ) : null}

      <div className="mt-2 grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(195px, 1fr))' }}>
        <MetricCard icon={<Clock3 className="size-[18px] text-[#d97706]" />} title="Aguard. Financeiro" value={`${data.tkPendFin.length}`} subtitle={`${formatMoney(data.tkValPendFin)} em aberto`} tone="warning" />
        <MetricCard icon={<BadgeCheck className="size-[18px] text-[#7c3aed]" />} title="Pagto. Confirmado" value={`${data.tkPagConf.length}`} subtitle={formatMoney(sumBy(data.tkPagConf, data.ticketValue))} tone="purple" />
        <MetricCard icon={<Wrench className="size-[18px] text-[#2563eb]" />} title="Em Implantação" value={`${data.tkImpl.length}`} subtitle={formatMoney(data.tkValImpl)} tone="accent" />
        <MetricCard icon={<Target className="size-[18px] text-[#059669]" />} title="Concluídos" value={`${data.tkConc.length}`} subtitle={`Setup: ${formatMoney(data.tkSetupConc)}`} tone="success" />
      </div>
    </div>
  );
}
