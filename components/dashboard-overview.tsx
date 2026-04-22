'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  BriefcaseBusiness,
  CalendarDays,
  ChartPie,
  CircleCheckBig,
  Clock3,
  Link2,
  Package2,
  TrendingUp,
  Trophy,
  UserRoundPlus,
  Wrench,
  X,
} from 'lucide-react';

import { rankIcon } from '@/components/ui';
import { apiRequest } from '@/lib/api-client';
import { cn } from '@/lib/utils';

type BadgeTone = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'gray';

type RankingRow = {
  name: string;
  tickets: number;
  setup: number;
  recurring: number;
};

type OverviewPayload = {
  totals: {
    expectedSetup: number;
    expectedRecurring: number;
    expectedTotal: number;
    approvedSetup: number;
    approvedRecurring: number;
    approvedTotal: number;
    pendingSetup: number;
    pendingRecurring: number;
    pendingTotal: number;
    totalCommercialTickets: number;
    newClientsCount: number;
    upsellCount: number;
    totalDevTickets: number;
    criticalDevCount: number;
  };
  charts: {
    products: Array<[string, number]>;
    integrations: Array<[string, number]>;
    ranking: RankingRow[];
    commercialStatuses: Array<{ label: string; count: number; tone: BadgeTone }>;
    devPriorities: Array<{ label: string; count: number; tone: BadgeTone }>;
  };
};

const badgeToneClassName: Record<BadgeTone, string> = {
  red: 'border-[#fecaca] bg-[#fef2f2] text-[#dc2626]',
  orange: 'border-[#fde68a] bg-[#fffbeb] text-[#d97706]',
  yellow: 'border-[#fde68a] bg-[#fefce8] text-[#854d0e]',
  green: 'border-[#a7f3d0] bg-[#ecfdf5] text-[#059669]',
  blue: 'border-[#bfdbfe] bg-[#eff6ff] text-[#2563eb]',
  gray: 'border-[#e2e8f0] bg-[#f1f5f9] text-[#475569]',
};

function formatMoney(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function Badge({
  tone,
  children,
}: {
  tone: BadgeTone;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-[9px] py-[3px] text-[11px] font-bold whitespace-nowrap',
        badgeToneClassName[tone],
      )}
    >
      {children}
    </span>
  );
}

function DashboardCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <article
      className={cn(
        'rounded-[10px] border border-[#e2e8f0] bg-white p-[18px] shadow-[0_1px_3px_rgba(0,0,0,.08)]',
        className,
      )}
    >
      {children}
    </article>
  );
}

function SummaryMetricCard({
  value,
  label,
  valueClassName,
  icon,
  iconClassName,
  footer,
}: {
  value: string | number;
  label: string;
  valueClassName?: string;
  icon: React.ReactNode;
  iconClassName: string;
  footer?: React.ReactNode;
}) {
  return (
    <DashboardCard>
      <div className="mb-[10px] flex items-start justify-between">
        <div>
          <div className={cn('text-[26px] leading-none font-extrabold', valueClassName)}>
            {value}
          </div>
          <div className="mt-[3px] text-xs text-[#64748b]">{label}</div>
        </div>

        <div
          className={cn(
            'flex size-10 items-center justify-center rounded-[10px] text-lg',
            iconClassName,
          )}
        >
          {icon}
        </div>
      </div>

      {footer ? <div className="mt-[6px] text-[11px] text-[#64748b]">{footer}</div> : null}
    </DashboardCard>
  );
}

function BarChartCard({
  title,
  rows,
  fillClassName,
  icon,
}: {
  title: string;
  rows: Array<[string, number]>;
  fillClassName: string;
  icon: React.ReactNode;
}) {
  const maxValue = rows.length ? Math.max(...rows.map(([, count]) => count), 1) : 1;

  return (
    <DashboardCard className="rounded-[10px] p-[18px]">
      <h3 className="mb-[14px] flex items-center gap-[6px] text-sm font-bold text-[#0f172a]">
        {icon}
        {title}
      </h3>

      <div className="flex flex-col gap-2">
        {rows.length ? (
          rows.map(([name, count]) => (
            <div key={name} className="flex items-center gap-[10px] text-xs text-[#0f172a]">
              <div className="w-[140px] truncate font-semibold text-[#64748b]">{name}</div>
              <div className="h-[10px] flex-1 overflow-hidden rounded-full bg-[#e2e8f0]">
                <div
                  className={cn('h-full rounded-full transition-[width]', fillClassName)}
                  style={{ width: `${Math.round((count / maxValue) * 100)}%` }}
                />
              </div>
              <div className="w-[50px] text-right font-bold">{count}</div>
            </div>
          ))
        ) : (
          <div className="px-5 py-5 text-center text-[13px] text-[#64748b]">Sem dados</div>
        )}
      </div>
    </DashboardCard>
  );
}

function DistributionCard({
  title,
  rows,
  icon,
}: {
  title: string;
  rows: Array<{ label: string; badge: React.ReactNode }>;
  icon: React.ReactNode;
}) {
  return (
    <DashboardCard className="rounded-[10px] p-[18px]">
      <h3 className="mb-[14px] flex items-center gap-[6px] text-sm font-bold text-[#0f172a]">
        {icon}
        {title}
      </h3>

      <div>
        {rows.map((row, index) => (
          <div
            key={row.label}
            className={cn(
              'flex items-center justify-between py-[7px] text-[13px]',
              index !== rows.length - 1 && 'border-b border-[#e2e8f0]',
            )}
          >
            <span>{row.label}</span>
            {row.badge}
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}

function RankingTable({ rows }: { rows: RankingRow[] }) {
  if (!rows.length) {
    return (
      <DashboardCard className="px-5 py-5 text-center text-[13px] text-[#64748b]">
        Sem dados de vendas.
      </DashboardCard>
    );
  }

  return (
    <DashboardCard className="overflow-x-auto p-0">
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
            {['#', 'Responsável', 'Tickets', 'Setup', 'Total'].map((column) => (
              <th
                key={column}
                className="px-[14px] py-[10px] text-left text-[11px] font-bold tracking-[0.06em] text-[#64748b] uppercase"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.name}
              className="border-b border-[#e2e8f0] last:border-b-0 hover:bg-[#f8fafc]"
            >
              <td className="px-[14px] py-[11px] text-base">{rankIcon(index)}</td>
              <td className="px-[14px] py-[11px] text-[13px]">
                <strong>{row.name}</strong>
              </td>
              <td className="px-[14px] py-[11px] text-[13px]">
                <Badge tone="blue">{row.tickets}</Badge>
              </td>
              <td className="px-[14px] py-[11px] text-[13px]">{formatMoney(row.setup)}</td>
              <td className="px-[14px] py-[11px] text-[13px]">
                <strong>{formatMoney(row.setup + row.recurring)}</strong>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </DashboardCard>
  );
}

const EMPTY_DATA: OverviewPayload = {
  totals: {
    expectedSetup: 0,
    expectedRecurring: 0,
    expectedTotal: 0,
    approvedSetup: 0,
    approvedRecurring: 0,
    approvedTotal: 0,
    pendingSetup: 0,
    pendingRecurring: 0,
    pendingTotal: 0,
    totalCommercialTickets: 0,
    newClientsCount: 0,
    upsellCount: 0,
    totalDevTickets: 0,
    criticalDevCount: 0,
  },
  charts: {
    products: [],
    integrations: [],
    ranking: [],
    commercialStatuses: [],
    devPriorities: [],
  },
};

export function DashboardOverview() {
  const [dateRange, setDateRange] = useState({
    dashFrom: '',
    dashTo: '',
  });
  const [data, setData] = useState<OverviewPayload>(EMPTY_DATA);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let active = true;

    async function load() {
      const params = new URLSearchParams();
      if (dateRange.dashFrom) params.set('from', `${dateRange.dashFrom}T00:00:00.000Z`);
      if (dateRange.dashTo) params.set('to', `${dateRange.dashTo}T23:59:59.999Z`);

      try {
        setLoadState('loading');
        const payload = (await apiRequest(
          `/api/backend/overview${params.size ? `?${params.toString()}` : ''}`,
        )) as OverviewPayload;
        if (!active) return;
        setData(payload);
        setLoadState('ready');
      } catch {
        if (!active) return;
        setLoadState('error');
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [dateRange.dashFrom, dateRange.dashTo]);

  const hasDateFilter = Boolean(dateRange.dashFrom || dateRange.dashTo);
  const hasDevData = data.totals.totalDevTickets > 0 || data.charts.devPriorities.length > 0;
  const commercialStatusRows = useMemo(
    () =>
      data.charts.commercialStatuses.map((row) => ({
        label: row.label,
        badge: <Badge tone={row.tone}>{row.count}</Badge>,
      })),
    [data.charts.commercialStatuses],
  );
  const priorityRows = useMemo(
    () =>
      data.charts.devPriorities.map((row) => ({
        label: row.label,
        badge: <Badge tone={row.tone}>{row.count}</Badge>,
      })),
    [data.charts.devPriorities],
  );

  if (loadState === 'error') {
    return (
      <DashboardCard className="p-8 text-center">
        <div className="text-[16px] font-extrabold text-[#0f172a]">
          Nao foi possivel carregar o dashboard.
        </div>
        <div className="mt-2 text-[13px] text-[#64748b]">
          Tente novamente em alguns instantes ou acione o suporte.
        </div>
      </DashboardCard>
    );
  }

  if (loadState === 'loading') {
    return (
      <DashboardCard className="p-8 text-center text-[13px] font-semibold text-[#64748b]">
        Carregando indicadores...
      </DashboardCard>
    );
  }

  return (
    <div className="grid gap-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
      <div className="mb-0 flex flex-wrap items-center justify-between gap-[10px] rounded-[10px] border border-[#e2e8f0] bg-white px-4 py-3">
        <span className="flex items-center gap-2 text-[13px] font-bold text-[#64748b]">
          <CalendarDays className="size-4 text-[#2563eb]" />
          Período
        </span>
<span className='flex items-center gap-2'>        <label className="text-xs text-[#64748b]" htmlFor="dash-from">
          De:
        </label>
        <input
          id="dash-from"
          type="date"
          value={dateRange.dashFrom}
          onChange={(event) =>
            setDateRange((current) => ({
              ...current,
              dashFrom: event.target.value,
            }))
          }
          className="rounded-[6px] border border-[#e2e8f0] bg-[#f1f5f9] px-2 py-[5px] text-xs text-[#0f172a] outline-none transition-colors focus:border-[#2563eb]"
        />

        <label className="text-xs text-[#64748b]" htmlFor="dash-to">
          Até:
        </label>
        <input
          id="dash-to"
          type="date"
          value={dateRange.dashTo}
          onChange={(event) =>
            setDateRange((current) => ({
              ...current,
              dashTo: event.target.value,
            }))
          }
          className="rounded-[6px] border border-[#e2e8f0] bg-[#f1f5f9] px-2 py-[5px] text-xs text-[#0f172a] outline-none transition-colors focus:border-[#2563eb]"
        />

        {hasDateFilter ? (
          <button
            type="button"
            onClick={() => setDateRange({ dashFrom: '', dashTo: '' })}
            className="inline-flex items-center gap-1 rounded-[6px] border border-[#e2e8f0] bg-transparent px-3 py-1.5 text-xs font-semibold text-[#64748b] transition-colors hover:bg-[#f8fafc] hover:text-[#0f172a]"
          >
            <X className="size-3.5" />
            Limpar
          </button>
        ) : null}</span>

      </div>

      <section className="grid gap-[14px] xl:grid-cols-3">
        <SummaryMetricCard
          value={formatMoney(data.totals.expectedTotal)}
          label="Valor Total Esperado"
          valueClassName="text-[#2563eb]"
          icon={<Package2 className="size-5 text-[#2563eb]" />}
          iconClassName="bg-[#eff6ff]"
          footer={
            <>
              Setup: <strong>{formatMoney(data.totals.expectedSetup)}</strong> · Recorrência:{' '}
              <strong>{formatMoney(data.totals.expectedRecurring)}</strong>
            </>
          }
        />
        <SummaryMetricCard
          value={formatMoney(data.totals.approvedTotal)}
          label="Valor Aprovado"
          valueClassName="text-[#059669]"
          icon={<CircleCheckBig className="size-5 text-[#059669]" />}
          iconClassName="bg-[#ecfdf5]"
          footer={
            <>
              Setup: <strong>{formatMoney(data.totals.approvedSetup)}</strong> · Recorrência:{' '}
              <strong>{formatMoney(data.totals.approvedRecurring)}</strong>
            </>
          }
        />
        <SummaryMetricCard
          value={formatMoney(data.totals.pendingTotal)}
          label="Aguardando Aprovação"
          valueClassName="text-[#d97706]"
          icon={<Clock3 className="size-5 text-[#d97706]" />}
          iconClassName="bg-[#fffbeb]"
          footer={
            <>
              Setup: <strong>{formatMoney(data.totals.pendingSetup)}</strong> · Recorrência:{' '}
              <strong>{formatMoney(data.totals.pendingRecurring)}</strong>
            </>
          }
        />
      </section>

      <section className="grid gap-[14px] md:grid-cols-2 xl:grid-cols-3">
        <SummaryMetricCard
          value={data.totals.totalCommercialTickets}
          label="Total Tickets Comercial"
          icon={<BriefcaseBusiness className="size-5 text-[#7c3aed]" />}
          iconClassName="bg-[#f5f3ff]"
        />
        <SummaryMetricCard
          value={data.totals.newClientsCount}
          label="Clientes Novos"
          valueClassName="text-[#059669]"
          icon={<UserRoundPlus className="size-5 text-[#059669]" />}
          iconClassName="bg-[#ecfdf5]"
        />
        <SummaryMetricCard
          value={data.totals.upsellCount}
          label="Inclusões / Upsell"
          valueClassName="text-[#7c3aed]"
          icon={<TrendingUp className="size-5 text-[#7c3aed]" />}
          iconClassName="bg-[#f5f3ff]"
        />
        {hasDevData ? (
          <SummaryMetricCard
          value={data.totals.totalDevTickets}
          label="Tickets Dev"
          icon={<Wrench className="size-5 text-[#dc2626]" />}
          iconClassName="bg-[#fef2f2]"
          footer={
            <span className="font-semibold text-[#dc2626]">
              {data.totals.criticalDevCount} críticos
            </span>
          }
          />
        ) : null}
      </section>

      <section className="grid gap-[14px] xl:grid-cols-2">
        <BarChartCard
          title="Vendas por Produto"
          rows={data.charts.products}
          fillClassName="bg-[#2563eb]"
          icon={<Package2 className="size-4 text-[#2563eb]" />}
        />
        <BarChartCard
          title="Integrações Mais Vendidas"
          rows={data.charts.integrations}
          fillClassName="bg-[#7c3aed]"
          icon={<Link2 className="size-4 text-[#7c3aed]" />}
        />
      </section>

      <section className="grid gap-[14px] xl:grid-cols-2">
        <DistributionCard
          title="Status Comercial"
          rows={commercialStatusRows}
          icon={<ChartPie className="size-4 text-[#2563eb]" />}
        />
        {hasDevData ? (
          <DistributionCard
          title="Dev por Prioridade"
          rows={priorityRows}
          icon={<Wrench className="size-4 text-[#dc2626]" />}
          />
        ) : null}
      </section>

      <div>
        <h3 className="mb-3 mt-[18px] flex items-center gap-[6px] text-[15px] font-bold text-[#0f172a]">
          <Trophy className="size-4 text-[#d97706]" />
          Ranking Comercial
        </h3>
        <RankingTable rows={data.charts.ranking} />
      </div>
    </div>
  );
}
