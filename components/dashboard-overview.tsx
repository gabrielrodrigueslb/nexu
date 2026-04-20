"use client";

import { useState } from "react";
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
} from "lucide-react";

import { rankIcon } from "@/components/ui";
import { cn } from "@/lib/utils";

type CommercialStatus =
  | "lead"
  | "qualification"
  | "awaitingApproval"
  | "approved"
  | "lost";

type PriorityLevel = "CRITICO" | "ALTO" | "MEDIO" | "BAIXO";
type TicketKind = "novo" | "upsell";
type BadgeTone = "red" | "orange" | "yellow" | "green" | "blue" | "gray";

type CommercialTicket = {
  id: string;
  createdAt: string;
  seller: string;
  status: CommercialStatus;
  kind: TicketKind;
  product: string;
  integrations: string[];
  setupAmount: number;
  recurringAmount: number;
};

type DevTicket = {
  id: string;
  createdAt: string;
  priority: PriorityLevel;
};

type RankingRow = {
  name: string;
  tickets: number;
  setup: number;
  recurring: number;
};

const commercialStatusMeta: Record<
  CommercialStatus,
  { label: string; tone: BadgeTone }
> = {
  lead: { label: "Lead recebido", tone: "gray" },
  qualification: { label: "Em qualificacao", tone: "blue" },
  awaitingApproval: { label: "Aguardando aprovacao", tone: "orange" },
  approved: { label: "Aprovado", tone: "green" },
  lost: { label: "Perdido", tone: "red" },
};

const priorityMeta: Record<PriorityLevel, { label: string; tone: BadgeTone }> = {
  CRITICO: { label: "CRITICO", tone: "red" },
  ALTO: { label: "ALTO", tone: "orange" },
  MEDIO: { label: "MEDIO", tone: "yellow" },
  BAIXO: { label: "BAIXO", tone: "green" },
};

const badgeToneClassName: Record<BadgeTone, string> = {
  red: "border-[#fecaca] bg-[#fef2f2] text-[#dc2626]",
  orange: "border-[#fde68a] bg-[#fffbeb] text-[#d97706]",
  yellow: "border-[#fde68a] bg-[#fefce8] text-[#854d0e]",
  green: "border-[#a7f3d0] bg-[#ecfdf5] text-[#059669]",
  blue: "border-[#bfdbfe] bg-[#eff6ff] text-[#2563eb]",
  gray: "border-[#e2e8f0] bg-[#f1f5f9] text-[#475569]",
};

const commercialTickets: CommercialTicket[] = [
  {
    id: "CM-101",
    createdAt: "2026-03-02",
    seller: "Bianca",
    status: "approved",
    kind: "novo",
    product: "Nexu CRM",
    integrations: ["WhatsApp", "ERP"],
    setupAmount: 4200,
    recurringAmount: 1490,
  },
  {
    id: "CM-102",
    createdAt: "2026-03-04",
    seller: "Lucas",
    status: "awaitingApproval",
    kind: "upsell",
    product: "Financeiro Pro",
    integrations: ["Conta Azul"],
    setupAmount: 2600,
    recurringAmount: 990,
  },
  {
    id: "CM-103",
    createdAt: "2026-03-07",
    seller: "Bianca",
    status: "qualification",
    kind: "novo",
    product: "Nexu CRM",
    integrations: ["WhatsApp", "Slack"],
    setupAmount: 3100,
    recurringAmount: 1190,
  },
  {
    id: "CM-104",
    createdAt: "2026-03-09",
    seller: "Carla",
    status: "approved",
    kind: "upsell",
    product: "Implantacao Plus",
    integrations: ["Google Meet"],
    setupAmount: 1800,
    recurringAmount: 690,
  },
  {
    id: "CM-105",
    createdAt: "2026-03-12",
    seller: "Lucas",
    status: "lead",
    kind: "novo",
    product: "Nexu CRM",
    integrations: ["Pipedrive"],
    setupAmount: 3900,
    recurringAmount: 1290,
  },
  {
    id: "CM-106",
    createdAt: "2026-03-15",
    seller: "Carla",
    status: "awaitingApproval",
    kind: "upsell",
    product: "Financeiro Pro",
    integrations: ["Conta Azul", "WhatsApp"],
    setupAmount: 2100,
    recurringAmount: 890,
  },
  {
    id: "CM-107",
    createdAt: "2026-03-18",
    seller: "Bianca",
    status: "lost",
    kind: "novo",
    product: "Implantacao Plus",
    integrations: ["Slack"],
    setupAmount: 1600,
    recurringAmount: 640,
  },
];

const devTickets: DevTicket[] = [
  { id: "DV-301", createdAt: "2026-03-03", priority: "CRITICO" },
  { id: "DV-302", createdAt: "2026-03-05", priority: "ALTO" },
  { id: "DV-303", createdAt: "2026-03-08", priority: "MEDIO" },
  { id: "DV-304", createdAt: "2026-03-10", priority: "CRITICO" },
  { id: "DV-305", createdAt: "2026-03-13", priority: "BAIXO" },
  { id: "DV-306", createdAt: "2026-03-17", priority: "ALTO" },
  { id: "DV-307", createdAt: "2026-03-19", priority: "MEDIO" },
];

function formatMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function isDateInRange(date: string, from: string, to: string) {
  if (from && date < from) {
    return false;
  }

  if (to && date > to) {
    return false;
  }

  return true;
}

function sumBy<T>(items: T[], pick: (item: T) => number) {
  return items.reduce((total, item) => total + pick(item), 0);
}

function getCountRows(values: string[]) {
  const counts = values.reduce<Record<string, number>>((accumulator, value) => {
    accumulator[value] = (accumulator[value] ?? 0) + 1;
    return accumulator;
  }, {});

  return Object.entries(counts).sort((left, right) => right[1] - left[1]);
}

function getRankingRows(items: CommercialTicket[]) {
  const grouped = items.reduce<Record<string, RankingRow>>((accumulator, item) => {
    const current = accumulator[item.seller] ?? {
      name: item.seller,
      tickets: 0,
      setup: 0,
      recurring: 0,
    };

    current.tickets += 1;
    current.setup += item.setupAmount;
    current.recurring += item.recurringAmount;
    accumulator[item.seller] = current;
    return accumulator;
  }, {});

  return Object.values(grouped).sort(
    (left, right) =>
      right.setup + right.recurring - (left.setup + left.recurring)
  );
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
        "inline-flex items-center rounded-full border px-[9px] py-[3px] text-[11px] font-bold whitespace-nowrap",
        badgeToneClassName[tone]
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
        "rounded-[10px] border border-[#e2e8f0] bg-white p-[18px] shadow-[0_1px_3px_rgba(0,0,0,.08)]",
        className
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
          <div
            className={cn(
              "text-[26px] leading-none font-extrabold",
              valueClassName
            )}
          >
            {value}
          </div>
          <div className="mt-[3px] text-xs text-[#64748b]">{label}</div>
        </div>

        <div
          className={cn(
            "flex size-10 items-center justify-center rounded-[10px] text-lg",
            iconClassName
          )}
        >
          {icon}
        </div>
      </div>

      {footer ? (
        <div className="mt-[6px] text-[11px] text-[#64748b]">{footer}</div>
      ) : null}
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
  const maxValue = rows.length
    ? Math.max(...rows.map(([, count]) => count), 1)
    : 1;

  return (
    <DashboardCard className="rounded-[10px] p-[18px]">
      <h3 className="mb-[14px] flex items-center gap-[6px] text-sm font-bold text-[#0f172a]">
        {icon}
        {title}
      </h3>

      <div className="flex flex-col gap-2">
        {rows.length ? (
          rows.map(([name, count]) => (
            <div
              key={name}
              className="flex items-center gap-[10px] text-xs text-[#0f172a]"
            >
              <div className="w-[140px] truncate font-semibold text-[#64748b]">
                {name}
              </div>
              <div className="h-[10px] flex-1 overflow-hidden rounded-full bg-[#e2e8f0]">
                <div
                  className={cn("h-full rounded-full transition-[width]", fillClassName)}
                  style={{ width: `${Math.round((count / maxValue) * 100)}%` }}
                />
              </div>
              <div className="w-[50px] text-right font-bold">{count}</div>
            </div>
          ))
        ) : (
          <div className="px-5 py-5 text-center text-[13px] text-[#64748b]">
            Sem dados
          </div>
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
              "flex items-center justify-between py-[7px] text-[13px]",
              index !== rows.length - 1 && "border-b border-[#e2e8f0]"
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
        Sem dados de vendas - atribua responsaveis nos tickets.
      </DashboardCard>
    );
  }

  return (
    <DashboardCard className="overflow-x-auto p-0">
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
            {["#", "Vendedor", "Tickets", "Setup", "Total"].map((column) => (
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
          {rows.map((row, index) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const position =
              index === 0 ? (
                "🥇"
              ) : index === 1 ? (
                "🥈"
              ) : index === 2 ? (
                "🥉"
              ) : (
                <span className="text-[#64748b]">{index + 1}</span>
              );

            return (
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
                <td className="px-[14px] py-[11px] text-[13px]">
                  {formatMoney(row.setup)}
                </td>
                <td className="px-[14px] py-[11px] text-[13px]">
                  <strong>{formatMoney(row.setup + row.recurring)}</strong>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </DashboardCard>
  );
}

export function DashboardOverview() {
  const [dateRange, setDateRange] = useState({
    dashFrom: "",
    dashTo: "",
  });

  const filteredCommercialTickets = commercialTickets.filter((ticket) =>
    isDateInRange(ticket.createdAt, dateRange.dashFrom, dateRange.dashTo)
  );
  const filteredDevTickets = devTickets.filter((ticket) =>
    isDateInRange(ticket.createdAt, dateRange.dashFrom, dateRange.dashTo)
  );
  const hasDateFilter = Boolean(dateRange.dashFrom || dateRange.dashTo);

  const totalExpected = sumBy(
    filteredCommercialTickets,
    (ticket) => ticket.setupAmount + ticket.recurringAmount
  );
  const expectedSetup = sumBy(filteredCommercialTickets, (ticket) => ticket.setupAmount);
  const expectedRecurring = sumBy(
    filteredCommercialTickets,
    (ticket) => ticket.recurringAmount
  );

  const approvedTickets = filteredCommercialTickets.filter(
    (ticket) => ticket.status === "approved"
  );
  const pendingTickets = filteredCommercialTickets.filter(
    (ticket) => ticket.status === "awaitingApproval"
  );
  const approvedTotal = sumBy(
    approvedTickets,
    (ticket) => ticket.setupAmount + ticket.recurringAmount
  );
  const approvedSetup = sumBy(approvedTickets, (ticket) => ticket.setupAmount);
  const approvedRecurring = sumBy(
    approvedTickets,
    (ticket) => ticket.recurringAmount
  );
  const pendingTotal = sumBy(
    pendingTickets,
    (ticket) => ticket.setupAmount + ticket.recurringAmount
  );
  const pendingSetup = sumBy(pendingTickets, (ticket) => ticket.setupAmount);
  const pendingRecurring = sumBy(pendingTickets, (ticket) => ticket.recurringAmount);

  const newClientsCount = filteredCommercialTickets.filter(
    (ticket) => ticket.kind === "novo"
  ).length;
  const upsellCount = filteredCommercialTickets.filter(
    (ticket) => ticket.kind === "upsell"
  ).length;
  const criticalDevCount = filteredDevTickets.filter(
    (ticket) => ticket.priority === "CRITICO"
  ).length;

  const productRows = getCountRows(
    filteredCommercialTickets.map((ticket) => ticket.product)
  );
  const integrationRows = getCountRows(
    filteredCommercialTickets.flatMap((ticket) => ticket.integrations)
  );
  const rankingRows = getRankingRows(filteredCommercialTickets);

  const commercialStatusRows = (
    Object.entries(commercialStatusMeta) as Array<
      [CommercialStatus, (typeof commercialStatusMeta)[CommercialStatus]]
    >
  ).map(([status, meta]) => ({
    label: meta.label,
    badge: <Badge tone={meta.tone}>{filteredCommercialTickets.filter((ticket) => ticket.status === status).length}</Badge>,
  }));

  const priorityRows = (
    Object.entries(priorityMeta) as Array<
      [PriorityLevel, (typeof priorityMeta)[PriorityLevel]]
    >
  ).map(([priority, meta]) => ({
    label: meta.label,
    badge: <Badge tone={meta.tone}>{filteredDevTickets.filter((ticket) => ticket.priority === priority).length}</Badge>,
  }));

  return (
    <div className="grid gap-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
      <div className="mb-0 flex flex-wrap items-center gap-[10px] rounded-[10px] border border-[#e2e8f0] bg-white px-4 py-3">
        <span className="flex items-center gap-2 text-[13px] font-bold text-[#64748b]">
          <CalendarDays className="size-4 text-[#2563eb]" />
          Periodo
        </span>

        <label className="text-xs text-[#64748b]" htmlFor="dash-from">
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
          Ate:
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
            onClick={() => setDateRange({ dashFrom: "", dashTo: "" })}
            className="inline-flex items-center gap-1 rounded-[6px] border border-[#e2e8f0] bg-transparent px-3 py-1.5 text-xs font-semibold text-[#64748b] transition-colors hover:bg-[#f8fafc] hover:text-[#0f172a]"
          >
            <X className="size-3.5" />
            Limpar
          </button>
        ) : null}

        {hasDateFilter ? (
          <span className="ml-1 text-[11px] font-semibold text-[#2563eb]">
            {filteredCommercialTickets.length} ticket(s) no periodo
          </span>
        ) : null}
      </div>

      <section className="grid gap-[14px] xl:grid-cols-3">
        <SummaryMetricCard
          value={formatMoney(totalExpected)}
          label="Valor Total Esperado"
          valueClassName="text-[#2563eb]"
          icon={<Package2 className="size-5 text-[#2563eb]" />}
          iconClassName="bg-[#eff6ff]"
          footer={
            <>
              Setup: <strong>{formatMoney(expectedSetup)}</strong> · Recorrencia:{" "}
              <strong>{formatMoney(expectedRecurring)}</strong>
            </>
          }
        />
        <SummaryMetricCard
          value={formatMoney(approvedTotal)}
          label="Valor Aprovado"
          valueClassName="text-[#059669]"
          icon={<CircleCheckBig className="size-5 text-[#059669]" />}
          iconClassName="bg-[#ecfdf5]"
          footer={
            <>
              Setup: <strong>{formatMoney(approvedSetup)}</strong> ·
              Recorrencia: <strong>{formatMoney(approvedRecurring)}</strong>
            </>
          }
        />
        <SummaryMetricCard
          value={formatMoney(pendingTotal)}
          label="Aguardando Aprovacao"
          valueClassName="text-[#d97706]"
          icon={<Clock3 className="size-5 text-[#d97706]" />}
          iconClassName="bg-[#fffbeb]"
          footer={
            <>
              Setup: <strong>{formatMoney(pendingSetup)}</strong> · Recorrencia:{" "}
              <strong>{formatMoney(pendingRecurring)}</strong>
            </>
          }
        />
      </section>

      <section className="grid gap-[14px] md:grid-cols-2 xl:grid-cols-4">
        <SummaryMetricCard
          value={filteredCommercialTickets.length}
          label="Total Tickets Comercial"
          icon={<BriefcaseBusiness className="size-5 text-[#7c3aed]" />}
          iconClassName="bg-[#f5f3ff]"
        />
        <SummaryMetricCard
          value={newClientsCount}
          label="Clientes Novos"
          valueClassName="text-[#059669]"
          icon={<UserRoundPlus className="size-5 text-[#059669]" />}
          iconClassName="bg-[#ecfdf5]"
        />
        <SummaryMetricCard
          value={upsellCount}
          label="Inclusoes / Upsell"
          valueClassName="text-[#7c3aed]"
          icon={<TrendingUp className="size-5 text-[#7c3aed]" />}
          iconClassName="bg-[#f5f3ff]"
        />
        <SummaryMetricCard
          value={filteredDevTickets.length}
          label="Tickets Dev"
          icon={<Wrench className="size-5 text-[#dc2626]" />}
          iconClassName="bg-[#fef2f2]"
          footer={
            <span className="font-semibold text-[#dc2626]">
              {criticalDevCount} criticos
            </span>
          }
        />
      </section>

      <section className="grid gap-[14px] xl:grid-cols-2">
        <BarChartCard
          title="Vendas por Produto"
          rows={productRows}
          fillClassName="bg-[#2563eb]"
          icon={<Package2 className="size-4 text-[#2563eb]" />}
        />
        <BarChartCard
          title="Integracoes Mais Vendidas"
          rows={integrationRows}
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
        <DistributionCard
          title="Dev por Prioridade"
          rows={priorityRows}
          icon={<Wrench className="size-4 text-[#dc2626]" />}
        />
      </section>

      <div>
        <h3 className="mb-3 mt-[18px] flex items-center gap-[6px] text-[15px] font-bold text-[#0f172a]">
          <Trophy className="size-4 text-[#d97706]" />
          Ranking Comercial
        </h3>
        <RankingTable rows={rankingRows} />
      </div>
    </div>
  );
}
