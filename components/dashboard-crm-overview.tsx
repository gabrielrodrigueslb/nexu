'use client';

import { useState } from 'react';
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

import type { GoalsState } from './types';
import { defaultGoals, leads, tickets } from './data';
import { formatMoney, sumBy } from './utils';
import {
  useCrmData,
  useOriginStats,
  useSdrStats,
  useVendorStats,
  useActivityTotals,
} from './hooks';
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

export function DashboardCrmOverview() {
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [goals, setGoals] = useState<GoalsState>(defaultGoals);

  const data = useCrmData(leads, tickets, dateRange.from, dateRange.to);
  const originStats = useOriginStats(data.filteredLeads);
  const sdrStats = useSdrStats(data.filteredLeads);
  const vendorStats = useVendorStats(data.filteredLeads, data.filteredTickets);
  const { actTotalGlobal, actDoneGlobal } = useActivityTotals(vendorStats);

  const hasFilter = Boolean(dateRange.from || dateRange.to);

  const ticketStages = [
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
      label: 'Em Implantacao',
      count: data.tkImpl.length,
      value: data.tkValImpl,
      color: '#2563eb',
    },
    {
      label: 'Concluido',
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
  ];

  function updateGoal<K extends keyof GoalsState>(
    key: K,
    value: GoalsState[K],
  ) {
    setGoals((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="grid gap-0 pb-2">
      {/* Header */}
      <div className="mb-0 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[19px] font-extrabold tracking-[-0.4px] text-[#0f172a]">
            Dashboard CRM
          </div>
          <div className="mt-[2px] text-[13px] text-[#64748b]">
            Visao 360 do pipeline - leads, SDRs, vendedores, tarefas e metas
            {hasFilter && (
              <span className="ml-2 rounded-full bg-[#eff6ff] px-[9px] py-[2px] text-[11px] font-bold text-[#2563eb]">
                Periodo filtrado
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold tracking-[.05em] text-[#64748b] uppercase">
            Periodo:
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
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, [key]: e.target.value }))
                }
                className="bg-transparent text-[12px] text-[#0f172a] outline-none"
              />
            </div>
          ))}
          {hasFilter && (
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
          )}
        </div>
      </div>

      {/* Overview metrics */}
      <SectionTitle title="Visao Geral" />
      <div
        className="mb-1 grid gap-3"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(195px, 1fr))' }}
      >
        <MetricCard
          icon={<TrendingUp className="size-[18px] text-[#2563eb]" />}
          title="Leads Ativos"
          value={`${data.ativos.length}`}
          subtitle={`Pipeline: ${formatMoney(data.totalVal)}`}
          tone="accent"
        />
        <MetricCard
          icon={<Trophy className="size-[18px] text-[#059669]" />}
          title="Leads Ganhos"
          value={`${data.ganhos.length}`}
          subtitle={`${formatMoney(data.ganhoVal)} captados`}
          tone="success"
        />
        <MetricCard
          icon={<TrendingDown className="size-[18px] text-[#dc2626]" />}
          title="Leads Perdidos"
          value={`${data.perdidos.length}`}
          subtitle={`${formatMoney(data.perdidoVal)} perdidos`}
          tone="error"
        />
        <MetricCard
          icon={<ArrowRightLeft className="size-[18px] text-[#0f172a]" />}
          title="Tx. Conversao"
          value={`${data.txConv}%`}
          subtitle="Ganhos vs. encerrados"
          tone={
            data.txConv >= 30
              ? 'success'
              : data.txConv >= 15
                ? 'warning'
                : 'error'
          }
        />
        <MetricCard
          icon={<KanbanSquare className="size-[18px] text-[#7c3aed]" />}
          title="Tickets Ativos"
          value={`${data.tkAtivos.length}`}
          subtitle={`${data.tkImpl.length} em implantacao`}
          tone="purple"
        />
        <MetricCard
          icon={<ClipboardList className="size-[18px] text-[#0f172a]" />}
          title="Tarefas Pendentes"
          value={`${data.tPend.length}`}
          subtitle={`${data.tAtrasadas.length} atrasadas / ${data.tHoje.length} hoje`}
          tone={data.tAtrasadas.length > 0 ? 'error' : 'neutral'}
        />
        <MetricCard
          icon={<CircleCheckBig className="size-[18px] text-[#059669]" />}
          title="Tarefas Concluidas"
          value={`${data.tFeitas.length}`}
          subtitle={`${Math.round((data.tFeitas.length / Math.max(data.allTasks.length, 1)) * 100)}% do total`}
          tone="success"
        />
      </div>

      {/* Funnel + Ticket journey */}
      <SectionTitle title="Funil de Vendas & Jornada de Implantacao" />
      <div className="mb-1 grid gap-[14px] xl:grid-cols-2">
        <FunnelPanel data={data} />
        <TicketJourneyPanel data={data} ticketStages={ticketStages} />
      </div>

      {/* Origins */}
      {originStats.length ? (
        <>
          <SectionTitle
            title="Leads por Origem"
            description="Valor ganho e pipeline em aberto por canal de aquisicao"
          />
          <OriginsTable originStats={originStats} />
        </>
      ) : null}

      {/* SDRs */}
      <SectionTitle
        title="Leads por SDR"
        description="Captacao individual, distribuicao por vendedor e metas"
      />
      <SdrTable
        sdrStats={sdrStats}
        goals={goals}
        totalLeads={data.filteredLeads.length}
        onChangeLeadsGoal={(v) => updateGoal('leadsTotal', v)}
        onChangeSdrGoal={(id, v) =>
          updateGoal('sdrs', { ...goals.sdrs, [id]: v })
        }
      />

      {/* Vendors ranking */}
      <SectionTitle
        title="Ranking de Vendedores"
        description="Performance, receita, tickets e metas individuais"
      />
      <VendorTable
        vendorStats={vendorStats}
        goals={goals}
        ganhoVal={data.ganhoVal}
        onChangeSalesGoal={(v) => updateGoal('salesTotal', v)}
        onChangeSellerGoal={(id, v) =>
          updateGoal('sellers', { ...goals.sellers, [id]: v })
        }
      />

      {/* Activities */}
      {vendorStats.length ? (
        <>
          <SectionTitle
            title="Tarefas por Tipo - Por Vendedor"
            description="Atividades realizadas e taxa de conclusao"
          />
          <ActivitiesTable
            vendorStats={vendorStats}
            goals={goals}
            actTotalGlobal={actTotalGlobal}
            actDoneGlobal={actDoneGlobal}
            onChangeMetaGlobal={(v) => updateGoal('activitiesMeta', v)}
            onChangeMetaIndividual={(id, v) =>
              updateGoal('activitiesIndividual', {
                ...goals.activitiesIndividual,
                [id]: v,
              })
            }
          />
        </>
      ) : null}

      {/* Task alerts */}
      {data.tAtrasadas.length || data.tHoje.length ? (
        <>
          <SectionTitle title="Alertas de Tarefas" />
          <TaskAlerts tAtrasadas={data.tAtrasadas} tHoje={data.tHoje} />
        </>
      ) : null}

      {/* Bottom ticket metrics */}
      <div
        className="mt-2 grid gap-3"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(195px, 1fr))' }}
      >
        <MetricCard
          icon={<Clock3 className="size-[18px] text-[#d97706]" />}
          title="Aguard. Financeiro"
          value={`${data.tkPendFin.length}`}
          subtitle={`${formatMoney(data.tkValPendFin)} em aberto`}
          tone="warning"
        />
        <MetricCard
          icon={<BadgeCheck className="size-[18px] text-[#7c3aed]" />}
          title="Pagto. Confirmado"
          value={`${data.tkPagConf.length}`}
          subtitle={formatMoney(sumBy(data.tkPagConf, data.ticketValue))}
          tone="purple"
        />
        <MetricCard
          icon={<Wrench className="size-[18px] text-[#2563eb]" />}
          title="Em Implantacao"
          value={`${data.tkImpl.length}`}
          subtitle={formatMoney(data.tkValImpl)}
          tone="accent"
        />
        <MetricCard
          icon={<Target className="size-[18px] text-[#059669]" />}
          title="Concluidos"
          value={`${data.tkConc.length}`}
          subtitle={`Setup: ${formatMoney(data.tkSetupConc)}`}
          tone="success"
        />
      </div>
    </div>
  );
}
