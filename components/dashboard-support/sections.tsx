import {
  CalendarDays,
  Check,
  ChevronRight,
  CircleAlert,
  CircleCheckBig,
  Clock3,
  KanbanSquare,
  Package2,
  Plus,
  Rocket,
  TrendingUp,
  Trophy,
  Wrench,
  X,
} from 'lucide-react';

import { Panel } from '../ui';
import type { TicketListKind, TimeBucket } from './types';
import { getInitials, formatDate, percentage } from './utils';

type DateRange = { from: string; to: string };
type SupportListItem = {
  id: string;
  nome: string;
  tipo: 'novo' | 'inclusao';
  produto: string;
  csStatus: string;
  respTec: string;
  createdAt: string;
  updatedAt?: string;
};

function Title({
  icon,
  children,
  suffix,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  suffix?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center gap-2 text-[14px] font-bold text-[#0f172a]">
      <span className="text-[#64748b]">{icon}</span>
      <span>{children}</span>
      {suffix}
    </div>
  );
}

function TypePill({
  kind,
  value,
}: {
  kind: 'novo' | 'inclusao';
  value: React.ReactNode;
}) {
  const isNovo = kind === 'novo';
  return (
    <span
      className={
        isNovo
          ? 'inline-flex items-center gap-1 rounded-full border border-[#a7f3d0] bg-[#ecfdf5] px-[7px] py-[1px] text-[10px] font-bold text-[#059669]'
          : 'inline-flex items-center gap-1 rounded-full border border-[#ddd6fe] bg-[#f5f3ff] px-[7px] py-[1px] text-[10px] font-bold text-[#7c3aed]'
      }
    >
      {isNovo ? <Plus className="size-3" /> : <TrendingUp className="size-3" />}
      {value}
    </span>
  );
}

function KpiCard({
  title,
  value,
  subtitle,
  icon,
  tone,
  clickHint,
  onClick,
}: {
  title: string;
  value: React.ReactNode;
  subtitle: React.ReactNode;
  icon: React.ReactNode;
  tone: 'accent' | 'success' | 'warning' | 'purple';
  clickHint?: string;
  onClick?: () => void;
}) {
  const styles = {
    accent: { text: 'text-[#2563eb]', bg: 'bg-[#eff6ff]' },
    success: { text: 'text-[#059669]', bg: 'bg-[#ecfdf5]' },
    warning: { text: 'text-[#d97706]', bg: 'bg-[#fffbeb]' },
    purple: { text: 'text-[#7c3aed]', bg: 'bg-[#f5f3ff]' },
  }[tone];
  const content = (
    <Panel className="p-[18px] text-left">
      <div className="mb-[10px] flex items-start justify-between gap-4">
        <div>
          <div className={`text-[26px] leading-none font-extrabold ${styles.text}`}>
            {value}
          </div>
          <div className="mt-[3px] text-[12px] text-[#64748b]">{title}</div>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-[10px] ${styles.bg}`}>
          {icon}
        </div>
      </div>
      <div className="text-[11px] text-[#64748b]">{subtitle}</div>
      {clickHint ? (
        <div className={`mt-[6px] inline-flex items-center gap-1 text-[10px] font-semibold ${styles.text}`}>
          <span>{clickHint}</span>
          <ChevronRight className="size-3" />
        </div>
      ) : null}
    </Panel>
  );

  if (!onClick) return content;
  return (
    <button type="button" onClick={onClick} className="w-full">
      {content}
    </button>
  );
}

export function SupportDateFilter({
  dateRange,
  hasFilter,
  completedCount,
  onChange,
  onClear,
}: {
  dateRange: DateRange;
  hasFilter: boolean;
  completedCount: number;
  onChange: (next: DateRange) => void;
  onClear: () => void;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-[10px] rounded-[10px] border border-[#e2e8f0] bg-white px-4 py-3">
      <span className="inline-flex items-center gap-2 text-[13px] font-bold text-[#64748b]">
        <CalendarDays className="size-4" />
        Periodo (finalizados)
      </span>
      <label className="text-[12px] text-[#64748b]">De:</label>
      <input
        type="date"
        value={dateRange.from}
        onChange={(event) => onChange({ ...dateRange, from: event.target.value })}
        className="rounded-[6px] border border-[#e2e8f0] bg-[#f1f5f9] px-2 py-[5px] text-[12px] text-[#0f172a] outline-none"
      />
      <label className="text-[12px] text-[#64748b]">Ate:</label>
      <input
        type="date"
        value={dateRange.to}
        onChange={(event) => onChange({ ...dateRange, to: event.target.value })}
        className="rounded-[6px] border border-[#e2e8f0] bg-[#f1f5f9] px-2 py-[5px] text-[12px] text-[#0f172a] outline-none"
      />
      {hasFilter ? (
        <>
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1 rounded-[7px] border border-[#e2e8f0] bg-white px-3 py-[5px] text-[12px] font-semibold text-[#64748b]"
          >
            <X className="size-3.5" />
            Limpar
          </button>
          <span className="text-[11px] font-semibold text-[#2563eb]">
            {completedCount} ticket(s) no periodo
          </span>
        </>
      ) : null}
    </div>
  );
}

export function SupportKpis({
  activeCount,
  completedCount,
  pendingCount,
  doneCount,
  novosAtivos,
  upsellAtivos,
  novosConcl,
  upsellConcl,
  overdue,
  pctGeral,
  hasFilter,
  onOpenList,
}: {
  activeCount: number;
  completedCount: number;
  pendingCount: number;
  doneCount: number;
  novosAtivos: number;
  upsellAtivos: number;
  novosConcl: number;
  upsellConcl: number;
  overdue: number;
  pctGeral: number;
  hasFilter: boolean;
  onOpenList: (kind: TicketListKind) => void;
}) {
  return (
    <div
      className="mb-4 grid gap-3"
      style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}
    >
      <KpiCard
        title="Em Implantacao"
        value={activeCount}
        tone="accent"
        icon={<Rocket className="size-5 text-[#2563eb]" />}
        subtitle={
          <span className="inline-flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[#059669]">
              <Plus className="size-3" />
              {novosAtivos} novos
            </span>
            <span className="inline-flex items-center gap-1 text-[#7c3aed]">
              <TrendingUp className="size-3" />
              {upsellAtivos} upsell
            </span>
          </span>
        }
        clickHint="Clique para ver"
        onClick={() => onOpenList('active')}
      />
      <KpiCard
        title={`Finalizados${hasFilter ? ' (periodo)' : ''}`}
        value={completedCount}
        tone="success"
        icon={<CircleCheckBig className="size-5 text-[#059669]" />}
        subtitle={
          <span className="inline-flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[#059669]">
              <Plus className="size-3" />
              {novosConcl}
            </span>
            <span className="inline-flex items-center gap-1 text-[#7c3aed]">
              <TrendingUp className="size-3" />
              {upsellConcl}
            </span>
          </span>
        }
        clickHint="Clique para ver"
        onClick={() => onOpenList('done')}
      />
      <KpiCard
        title="Tarefas Pendentes"
        value={pendingCount}
        tone="warning"
        icon={<Clock3 className="size-5 text-[#d97706]" />}
        subtitle={
          overdue ? (
            <span className="inline-flex items-center gap-1 font-bold text-[#dc2626]">
              <CircleAlert className="size-3.5" />
              {overdue} em atraso
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[#059669]">
              <Check className="size-3.5" />
              Sem atrasos
            </span>
          )
        }
      />
      <KpiCard
        title="Tarefas Concluidas"
        value={doneCount}
        tone="purple"
        icon={<Wrench className="size-5 text-[#7c3aed]" />}
        subtitle={
          <div>
            <div className="mb-1 h-1.5 overflow-hidden rounded-full bg-[#e2e8f0]">
              <div
                className="h-full rounded-full bg-[#059669]"
                style={{ width: `${pctGeral}%` }}
              />
            </div>
            <span>{pctGeral}% concluido</span>
          </div>
        }
      />
    </div>
  );
}

export function TicketListModal({
  open,
  title,
  tickets,
  techNameById,
  onClose,
}: {
  open: boolean;
  title: string;
  tickets: SupportListItem[];
  techNameById: Record<string, string>;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/45 p-4 backdrop-blur-[2px]">
      <Panel className="max-h-[80vh] w-full max-w-[760px] overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#e2e8f0] px-5 py-4">
          <div className="text-[16px] font-extrabold text-[#0f172a]">{title}</div>
          <button type="button" onClick={onClose} className="rounded-[8px] border border-[#e2e8f0] p-2 text-[#64748b]">
            <X className="size-4" />
          </button>
        </div>
        <div className="scrollbar-minimal max-h-[calc(80vh-73px)] overflow-y-auto p-5">
          {tickets.length ? (
            <div className="grid gap-3">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="rounded-[10px] border border-[#e2e8f0] bg-[#f8fafc] p-4">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div className="text-[14px] font-bold text-[#0f172a]">{ticket.nome}</div>
                    <TypePill
                      kind={ticket.tipo}
                      value={ticket.tipo === 'novo' ? 'Novo' : 'Upsell'}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 text-[11px] text-[#64748b]">
                    <span>{ticket.csStatus}</span>
                    <span>{ticket.produto}</span>
                    <span>{techNameById[ticket.respTec] ?? 'Sem responsavel'}</span>
                    <span>{formatDate(ticket.createdAt)}</span>
                    {ticket.updatedAt ? <span>{formatDate(ticket.updatedAt)}</span> : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-[13px] text-[#64748b]">Nenhum ticket encontrado.</div>
          )}
        </div>
      </Panel>
    </div>
  );
}

export function TimeCompletionPanel({
  hasFilter,
  withTimeCount,
  avgDays,
  avgNovos,
  avgUps,
  minDays,
  maxDays,
  fastest,
  slowest,
  buckets,
}: {
  hasFilter: boolean;
  withTimeCount: number;
  avgDays: number;
  avgNovos: number | null;
  avgUps: number | null;
  minDays: number;
  maxDays: number;
  fastest: SupportListItem | null;
  slowest: SupportListItem | null;
  buckets: TimeBucket[];
}) {
  return (
    <Panel className="mb-4 p-[18px]">
      <Title
        icon={<Clock3 className="size-4" />}
        suffix={hasFilter ? <span className="text-[12px] text-[#64748b]">(periodo selecionado)</span> : undefined}
      >
        Tempo Medio de Conclusao
      </Title>
      {!withTimeCount ? (
        <div className="py-5 text-center text-[13px] text-[#64748b]">
          Nenhum ticket finalizado{hasFilter ? ' no periodo' : ''} com dados suficientes.
        </div>
      ) : (
        <>
          <div className="mb-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-[10px] bg-[#f8fafc] p-[14px] text-center">
              <div className="text-[28px] font-extrabold text-[#2563eb]">{Math.round(avgDays)}d</div>
              <div className="mt-[3px] text-[12px] font-semibold text-[#64748b]">Media geral</div>
              <div className="mt-[6px] flex items-center justify-center gap-2 text-[11px] text-[#64748b]">
                {avgNovos !== null ? <span className="inline-flex items-center gap-1"><Plus className="size-3" />{avgNovos}d</span> : null}
                {avgUps !== null ? <span className="inline-flex items-center gap-1"><TrendingUp className="size-3" />{avgUps}d</span> : null}
              </div>
              <div className="mt-[2px] text-[11px] text-[#64748b]">{withTimeCount} ticket(s) analisado(s)</div>
            </div>
            <div className="rounded-[10px] border border-[#86efac] bg-[#ecfdf5] p-[14px] text-center">
              <div className="text-[28px] font-extrabold text-[#059669]">{Math.round(minDays)}d</div>
              <div className="mt-[3px] inline-flex items-center gap-1 text-[12px] font-semibold text-[#059669]">
                <Trophy className="size-3.5" />
                Mais rapido
              </div>
              {fastest ? (
                <>
                  <div className="mt-[6px] truncate text-[11px] text-[#64748b]" title={fastest.nome}>
                    {fastest.nome}
                  </div>
                  <div className="text-[10px] text-[#64748b]">
                    {formatDate(fastest.createdAt)} - {formatDate(fastest.updatedAt!)}
                  </div>
                </>
              ) : null}
            </div>
            <div className="rounded-[10px] border border-[#fca5a5] bg-[#fef2f2] p-[14px] text-center">
              <div className="text-[28px] font-extrabold text-[#dc2626]">{Math.round(maxDays)}d</div>
              <div className="mt-[3px] inline-flex items-center gap-1 text-[12px] font-semibold text-[#dc2626]">
                <Clock3 className="size-3.5" />
                Mais demorado
              </div>
              {slowest ? (
                <>
                  <div className="mt-[6px] truncate text-[11px] text-[#64748b]" title={slowest.nome}>
                    {slowest.nome}
                  </div>
                  <div className="text-[10px] text-[#64748b]">
                    {formatDate(slowest.createdAt)} - {formatDate(slowest.updatedAt!)}
                  </div>
                </>
              ) : null}
            </div>
          </div>
          <div className="mb-[10px] text-[11px] font-bold uppercase tracking-[.07em] text-[#64748b]">
            Distribuicao por faixa de tempo
          </div>
          {buckets.map((bucket) => {
            const pct = percentage(bucket.n, withTimeCount);
            return (
              <div key={bucket.lbl} className="mb-2 flex items-center gap-[10px]">
                <div className="w-[75px] shrink-0 text-[12px] text-[#0f172a]">{bucket.lbl}</div>
                <div className="h-4 flex-1 overflow-hidden rounded-[4px] bg-[#f8fafc]">
                  <div className="h-full rounded-[4px]" style={{ width: `${pct}%`, background: bucket.color }} />
                </div>
                <div className="min-w-[55px] text-right text-[12px] font-bold text-[#0f172a]">
                  {bucket.n} <span className="font-normal text-[#64748b]">({pct}%)</span>
                </div>
              </div>
            );
          })}
        </>
      )}
    </Panel>
  );
}

export function PhaseCard({
  phaseCount,
  novosAtPhase,
  upsellAtPhase,
}: {
  phaseCount: Array<{ col: string; n: number }>;
  novosAtPhase: Record<string, number>;
  upsellAtPhase: Record<string, number>;
}) {
  const max = Math.max(1, ...phaseCount.map((item) => item.n));
  return (
    <Panel className="p-[18px]">
      <Title icon={<KanbanSquare className="size-4" />}>Fases do Kanban</Title>
      {phaseCount.length ? (
        phaseCount.map((item) => (
          <div key={item.col} className="mb-3">
            <div className="mb-[5px] flex items-center justify-between gap-3 text-[13px]">
              <span className="font-semibold text-[#0f172a]">{item.col}</span>
              <div className="flex gap-[5px]">
                <TypePill kind="novo" value={novosAtPhase[item.col] ?? 0} />
                <TypePill kind="inclusao" value={upsellAtPhase[item.col] ?? 0} />
                <span className="inline-flex rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-[7px] py-[1px] text-[10px] font-bold text-[#2563eb]">
                  {item.n}
                </span>
              </div>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[#e2e8f0]">
              <div className="h-full rounded-full bg-[#059669]" style={{ width: `${Math.round((item.n / max) * 100)}%` }} />
            </div>
          </div>
        ))
      ) : (
        <div className="py-5 text-center text-[13px] text-[#64748b]">Sem dados</div>
      )}
    </Panel>
  );
}

export function ServicesCard({
  rows,
}: {
  rows: Array<{ nome: string; total: number; done: number; pct: number }>;
}) {
  return (
    <Panel className="p-[18px]">
      <Title icon={<Package2 className="size-4" />}>Servicos em Andamento</Title>
      {rows.length ? (
        rows.map((row) => (
          <div key={row.nome} className="mb-3">
            <div className="mb-1 flex justify-between gap-3 text-[13px]">
              <span className="text-[#0f172a]">{row.nome}</span>
              <span className="text-[11px] text-[#64748b]">
                <strong>{row.done}</strong>/{row.total} ({row.pct}%)
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[#e2e8f0]">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${row.pct}%`,
                  background: row.pct === 100 ? '#059669' : row.pct > 60 ? '#7c3aed' : '#2563eb',
                }}
              />
            </div>
          </div>
        ))
      ) : (
        <div className="py-5 text-center text-[13px] text-[#64748b]">Sem tarefas</div>
      )}
    </Panel>
  );
}

export function TypeComparisonCard({
  hasFilter,
  novosAtivos,
  novosConcl,
  upsellAtivos,
  upsellConcl,
  avgNovos,
  avgUps,
}: {
  hasFilter: boolean;
  novosAtivos: number;
  novosConcl: number;
  upsellAtivos: number;
  upsellConcl: number;
  avgNovos: number | null;
  avgUps: number | null;
}) {
  return (
    <Panel className="mb-4 p-[18px]">
      <Title icon={<TrendingUp className="size-4" />}>Novos x Upsell</Title>
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <div className="mb-[10px] inline-flex items-center gap-1 text-[12px] font-bold uppercase tracking-[.06em] text-[#059669]">
            <Plus className="size-3.5" />
            Clientes Novos
          </div>
          <div className="flex justify-between border-b border-[#e2e8f0] py-[6px] text-[13px]">
            <span>Em Implantacao</span>
            <TypePill kind="novo" value={novosAtivos} />
          </div>
          <div className="flex justify-between border-b border-[#e2e8f0] py-[6px] text-[13px]">
            <span>Finalizados{hasFilter ? ' (periodo)' : ''}</span>
            <TypePill kind="novo" value={novosConcl} />
          </div>
          <div className="flex justify-between py-[8px] text-[14px] font-bold text-[#0f172a]">
            <span>Total</span>
            <span>{novosAtivos + novosConcl}</span>
          </div>
          {avgNovos !== null ? (
            <div className="text-[11px] text-[#64748b]">Tempo medio: {avgNovos} dias</div>
          ) : null}
        </div>
        <div>
          <div className="mb-[10px] inline-flex items-center gap-1 text-[12px] font-bold uppercase tracking-[.06em] text-[#7c3aed]">
            <TrendingUp className="size-3.5" />
            Upsell / Inclusao
          </div>
          <div className="flex justify-between border-b border-[#e2e8f0] py-[6px] text-[13px]">
            <span>Em Implantacao</span>
            <TypePill kind="inclusao" value={upsellAtivos} />
          </div>
          <div className="flex justify-between border-b border-[#e2e8f0] py-[6px] text-[13px]">
            <span>Finalizados{hasFilter ? ' (periodo)' : ''}</span>
            <TypePill kind="inclusao" value={upsellConcl} />
          </div>
          <div className="flex justify-between py-[8px] text-[14px] font-bold text-[#0f172a]">
            <span>Total</span>
            <span>{upsellAtivos + upsellConcl}</span>
          </div>
          {avgUps !== null ? (
            <div className="text-[11px] text-[#64748b]">Tempo medio: {avgUps} dias</div>
          ) : null}
        </div>
      </div>
    </Panel>
  );
}

export function TechOwnersCard({
  rows,
}: {
  rows: Array<{
    id: string;
    name: string;
    activeCount: number;
    novos: number;
    ups: number;
    avg: number | null;
    taskCount: number;
    taskDone: number;
    taskPct: number;
    overdue: number;
  }>;
}) {
  return (
    <Panel className="p-[18px]">
      <Title icon={<Wrench className="size-4" />}>Responsaveis Tecnicos</Title>
      {rows.length ? (
        rows.map((row) => (
          <div key={row.id} className="flex items-start gap-3 border-b border-[#e2e8f0] py-[10px] last:border-b-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2563eb] text-[12px] font-bold text-white">
              {getInitials(row.name)}
            </div>
            <div className="flex-1">
              <div className="mb-[3px] text-[13px] font-bold text-[#0f172a]">{row.name}</div>
              <div className="mb-1 flex flex-wrap items-center gap-2 text-[11px] text-[#64748b]">
                <span>{row.activeCount} ativo(s)</span>
                <span className="inline-flex items-center gap-1"><Plus className="size-3" />{row.novos}</span>
                <span className="inline-flex items-center gap-1"><TrendingUp className="size-3" />{row.ups}</span>
                {row.avg !== null ? <span>media {row.avg}d</span> : null}
              </div>
              {row.taskCount ? (
                <>
                  <div className="mb-1 h-1.5 overflow-hidden rounded-full bg-[#e2e8f0]">
                    <div className="h-full rounded-full bg-[#059669]" style={{ width: `${row.taskPct}%` }} />
                  </div>
                  <div className="text-[11px] text-[#64748b]">
                    {row.taskDone}/{row.taskCount} tarefas ({row.taskPct}%)
                    {row.overdue ? (
                      <span className="ml-2 inline-flex items-center gap-1 font-bold text-[#dc2626]">
                        <CircleAlert className="size-3" />
                        {row.overdue} atrasada(s)
                      </span>
                    ) : null}
                  </div>
                </>
              ) : null}
            </div>
            <span className="inline-flex rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-[9px] py-[3px] text-[11px] font-bold text-[#2563eb]">
              {row.activeCount}
            </span>
          </div>
        ))
      ) : (
        <div className="py-5 text-center text-[13px] text-[#64748b]">
          Atribua responsaveis tecnicos nos tickets.
        </div>
      )}
    </Panel>
  );
}
