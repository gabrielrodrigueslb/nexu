import {
  CalendarDays,
  ChevronRight,
  CircleAlert,
  CircleCheckBig,
  Clock3,
  FilePenLine,
  Flag,
  Gauge,
  KanbanSquare,
  Medal,
  Plus,
  SquareTerminal,
  Target,
  Ticket,
  Trophy,
  X,
} from 'lucide-react';

import { Panel } from '../ui';
import { findUserById } from './hooks';
import type { DevListKind, DevTicket, Sprint } from './types';
import { DEV_COLS } from './types';
import { formatDate, getInitials, percentage } from './utils';

type DateRange = { from: string; to: string };
const DONE_STATUS = DEV_COLS[DEV_COLS.length - 1];

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

function ListButtonCard({
  title,
  value,
  tone,
  icon,
  subtitle,
  onClick,
}: {
  title: string;
  value: React.ReactNode;
  tone: 'accent' | 'success' | 'error' | 'purple';
  icon: React.ReactNode;
  subtitle: React.ReactNode;
  onClick?: () => void;
}) {
  const styles = {
    accent: { text: 'text-[#2563eb]', bg: 'bg-[#eff6ff]' },
    success: { text: 'text-[#059669]', bg: 'bg-[#ecfdf5]' },
    error: { text: 'text-[#dc2626]', bg: 'bg-[#fef2f2]' },
    purple: { text: 'text-[#7c3aed]', bg: 'bg-[#f5f3ff]' },
  }[tone];

  const card = (
    <Panel className="p-[18px] text-left">
      <div className="mb-[10px] flex items-start justify-between gap-3">
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
      {onClick ? (
        <div className={`mt-1 inline-flex items-center gap-1 text-[10px] font-semibold ${styles.text}`}>
          <span>Clique para ver</span>
          <ChevronRight className="size-3" />
        </div>
      ) : null}
    </Panel>
  );

  if (!onClick) return card;
  return (
    <button type="button" onClick={onClick} className="w-full">
      {card}
    </button>
  );
}

function StatusBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-full border border-[#e2e8f0] bg-[#f1f5f9] px-[9px] py-[3px] text-[11px] font-bold text-[#475569]">
      {children}
    </span>
  );
}

export function DevDateFilter({
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
        Periodo (concluidos)
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
            {completedCount} concluido(s) no periodo
          </span>
        </>
      ) : null}
    </div>
  );
}

export function DevKpis({
  totalOpen,
  completedCount,
  overdueCount,
  avgCycle,
  bugRate,
  onOpenList,
}: {
  totalOpen: number;
  completedCount: number;
  overdueCount: number;
  avgCycle: number | null;
  bugRate: number;
  onOpenList: (kind: DevListKind) => void;
}) {
  return (
    <div
      className="mb-4 grid gap-3"
      style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}
    >
      <ListButtonCard
        title="Tickets Abertos"
        value={totalOpen}
        tone="accent"
        icon={<Ticket className="size-5 text-[#2563eb]" />}
        subtitle={null}
        onClick={() => onOpenList('open')}
      />
      <ListButtonCard
        title="Concluidos"
        value={completedCount}
        tone="success"
        icon={<CircleCheckBig className="size-5 text-[#059669]" />}
        subtitle={null}
        onClick={() => onOpenList('done')}
      />
      <ListButtonCard
        title="Em Atraso"
        value={overdueCount}
        tone={overdueCount ? 'error' : 'success'}
        icon={<CircleAlert className={`size-5 ${overdueCount ? 'text-[#dc2626]' : 'text-[#059669]'}`} />}
        subtitle={null}
        onClick={() => onOpenList('overdue')}
      />
      <ListButtonCard
        title="Cycle Time Medio"
        value={avgCycle !== null ? `${avgCycle}d` : '--'}
        tone="purple"
        icon={<Clock3 className="size-5 text-[#7c3aed]" />}
        subtitle={`Taxa de bugs: ${bugRate}%`}
      />
    </div>
  );
}

export function DevListModal({
  open,
  title,
  tickets,
  onClose,
}: {
  open: boolean;
  title: string;
  tickets: DevTicket[];
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/45 p-4 backdrop-blur-[2px]">
      <Panel className="max-h-[80vh] w-full max-w-[820px] overflow-hidden">
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
                  <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                    <div className="text-[14px] font-bold text-[#0f172a]">{ticket.title}</div>
                    <StatusBadge>{ticket.devStatus}</StatusBadge>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[11px] text-[#64748b]">
                    <span>{ticket.devType}</span>
                    <span>{ticket.category}</span>
                    <span>{findUserById(ticket.resp)?.name ?? '--'}</span>
                    {ticket.deadline ? <span>{formatDate(ticket.deadline)}</span> : null}
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

export function KanbanFlowCard({
  byStatus,
  maxByStatus,
}: {
  byStatus: Record<string, number>;
  maxByStatus: number;
}) {
  return (
    <Panel className="p-[18px]">
      <Title icon={<KanbanSquare className="size-4" />}>Fluxo do Kanban</Title>
      {DEV_COLS.map((col) => {
        const n = byStatus[col] || 0;
        const pct = Math.round((n / Math.max(maxByStatus, 1)) * 100);
        const isBottleneck = n > 0 && pct === 100 && col !== DEV_COLS[0] && col !== DONE_STATUS;

        return (
          <div key={col} className="mb-[10px]">
            <div className="mb-1 flex items-center justify-between text-[13px]">
              <span className="text-[#0f172a]">
                {col}
                {isBottleneck ? (
                  <span className="ml-2 text-[10px] text-[#dc2626]">Gargalo</span>
                ) : null}
              </span>
              <StatusBadge>{n}</StatusBadge>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[#e2e8f0]">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${pct}%`,
                  background: col === DONE_STATUS ? '#059669' : isBottleneck ? '#dc2626' : '#2563eb',
                }}
              />
            </div>
          </div>
        );
      })}
    </Panel>
  );
}

export function VelocityCard({
  velocityByS,
  activeSp,
  spVelocity,
}: {
  velocityByS: Array<{ id: string; name: string; pts: number; count: number }>;
  activeSp: Sprint | null;
  spVelocity: number;
}) {
  const mx = Math.max(1, ...velocityByS.map((item) => item.pts));

  return (
    <Panel className="p-[18px]">
      <Title icon={<Gauge className="size-4" />}>Velocidade por Sprint</Title>
      {velocityByS.length ? (
        velocityByS.slice(-6).map((item) => {
          const pct = Math.round((item.pts / mx) * 100);
          return (
            <div key={item.id} className="mb-[10px]">
              <div className="mb-[3px] flex justify-between gap-3 text-[12px]">
                <span className="max-w-[140px] truncate text-[#0f172a]">{item.name}</span>
                <span className="font-bold text-[#0f172a]">
                  {item.pts}pts - {item.count} tasks
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[#e2e8f0]">
                <div className="h-full rounded-full bg-[#7c3aed]" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })
      ) : (
        <div className="py-5 text-center text-[13px] text-[#64748b]">Nenhuma sprint finalizada</div>
      )}
      {activeSp ? (
        <div className="mt-2 rounded-[8px] bg-[#f8fafc] px-4 py-3 text-center text-[12px] text-[#2563eb]">
          <strong>{spVelocity} pts</strong> sprint atual em andamento
        </div>
      ) : null}
    </Panel>
  );
}

export function ResolutionTimeCard({
  hasFilter,
  resolvedCount,
  resAvg,
  resMin,
  resMax,
  resByType,
  resFastest,
  resSlowest,
  resBkData,
}: {
  hasFilter: boolean;
  resolvedCount: number;
  resAvg: number;
  resMin: number;
  resMax: number;
  resByType: Record<'Feature' | 'Task' | 'Bug', number | null>;
  resFastest: DevTicket | null;
  resSlowest: DevTicket | null;
  resBkData: Array<{ lbl: string; n: number; color: string }>;
}) {
  return (
    <Panel className="mb-4 p-[18px]">
      <Title
        icon={<Clock3 className="size-4" />}
        suffix={hasFilter ? <span className="text-[12px] text-[#64748b]">(periodo)</span> : undefined}
      >
        Tempo Medio de Resolucao
      </Title>
      {!resolvedCount ? (
        <div className="py-5 text-center text-[13px] text-[#64748b]">
          Nenhum ticket concluido{hasFilter ? ' no periodo' : ''} para calcular.
        </div>
      ) : (
        <>
          <div className="mb-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-[10px] bg-[#f8fafc] p-[14px] text-center">
              <div className="text-[28px] font-extrabold text-[#2563eb]">{Math.round(resAvg)}d</div>
              <div className="mt-[3px] text-[12px] font-semibold text-[#64748b]">Media geral</div>
              <div className="mt-[6px] text-[11px] text-[#64748b]">{resolvedCount} ticket(s) analisado(s)</div>
              <div className="mt-1 flex flex-wrap items-center justify-center gap-2 text-[11px] text-[#64748b]">
                {resByType.Feature !== null ? <span>Feature: {resByType.Feature}d</span> : null}
                {resByType.Task !== null ? <span>Task: {resByType.Task}d</span> : null}
                {resByType.Bug !== null ? <span className="text-[#dc2626]">Bug: {resByType.Bug}d</span> : null}
              </div>
            </div>
            <div className="rounded-[10px] border border-[#86efac] bg-[#ecfdf5] p-[14px] text-center">
              <div className="text-[28px] font-extrabold text-[#059669]">{Math.round(resMin)}d</div>
              <div className="mt-[3px] inline-flex items-center gap-1 text-[12px] font-semibold text-[#059669]">
                <Trophy className="size-3.5" />
                Mais rapido
              </div>
              {resFastest ? (
                <>
                  <div className="mt-[6px] truncate text-[11px] text-[#64748b]" title={resFastest.title}>
                    {resFastest.title}
                  </div>
                  <div className="text-[10px] text-[#64748b]">
                    {resFastest.devType} - {findUserById(resFastest.resp)?.name ?? '--'}
                  </div>
                </>
              ) : null}
            </div>
            <div className="rounded-[10px] border border-[#fca5a5] bg-[#fef2f2] p-[14px] text-center">
              <div className="text-[28px] font-extrabold text-[#dc2626]">{Math.round(resMax)}d</div>
              <div className="mt-[3px] inline-flex items-center gap-1 text-[12px] font-semibold text-[#dc2626]">
                <Clock3 className="size-3.5" />
                Mais demorado
              </div>
              {resSlowest ? (
                <>
                  <div className="mt-[6px] truncate text-[11px] text-[#64748b]" title={resSlowest.title}>
                    {resSlowest.title}
                  </div>
                  <div className="text-[10px] text-[#64748b]">
                    {resSlowest.devType} - {findUserById(resSlowest.resp)?.name ?? '--'}
                  </div>
                </>
              ) : null}
            </div>
          </div>
          <div className="mb-[10px] text-[11px] font-bold uppercase tracking-[.07em] text-[#64748b]">
            Distribuicao por faixa de tempo
          </div>
          {resBkData.map((bucket) => {
            const pct = percentage(bucket.n, resolvedCount);
            return (
              <div key={bucket.lbl} className="mb-2 flex items-center gap-[10px]">
                <div className="w-[80px] shrink-0 text-[12px] text-[#0f172a]">{bucket.lbl}</div>
                <div className="h-4 flex-1 overflow-hidden rounded-[4px] bg-[#f8fafc]">
                  <div className="h-full rounded-[4px]" style={{ width: `${pct}%`, background: bucket.color }} />
                </div>
                <div className="w-10 text-right text-[12px] font-bold text-[#0f172a]">{bucket.n}</div>
                <div className="w-8 text-[11px] text-[#64748b]">{pct}%</div>
              </div>
            );
          })}
        </>
      )}
    </Panel>
  );
}

export function DeadlineManagementCard({
  overdueT,
  nearT,
}: {
  overdueT: DevTicket[];
  nearT: DevTicket[];
}) {
  return (
    <Panel className="mb-4 p-[18px]">
      <Title icon={<CalendarDays className="size-4" />}>Gestao de Vencimentos</Title>
      {!overdueT.length && !nearT.length ? (
        <div className="py-3 text-center text-[13px] text-[#059669]">
          Nenhum ticket atrasado ou proximo do prazo
        </div>
      ) : null}
      {overdueT.length ? (
        <>
          <div className="mb-2 text-[11px] font-bold uppercase text-[#dc2626]">
            Atrasados ({overdueT.length})
          </div>
          <DeadlineTable mode="overdue" tickets={overdueT} />
        </>
      ) : null}
      {nearT.length ? (
        <>
          <div className={`mb-2 text-[11px] font-bold uppercase text-[#d97706] ${overdueT.length ? 'mt-3' : ''}`}>
            Proximos 14 dias ({nearT.length})
          </div>
          <DeadlineTable mode="near" tickets={nearT} />
        </>
      ) : null}
    </Panel>
  );
}

function DeadlineTable({
  mode,
  tickets,
}: {
  mode: 'overdue' | 'near';
  tickets: DevTicket[];
}) {
  const now = new Date('2026-03-22T12:00:00').getTime();
  const sorted = [...tickets].sort((left, right) =>
    (left.deadline ?? '') < (right.deadline ?? '') ? -1 : 1,
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[12px]">
        <thead>
          <tr className="border-b-2 border-[#e2e8f0]">
            <th className="px-[6px] py-[6px] text-left font-semibold text-[#64748b]">Ticket</th>
            <th className="px-[6px] py-[6px] text-center font-semibold text-[#64748b]">Responsavel</th>
            <th className="px-[6px] py-[6px] text-center font-semibold text-[#64748b]">Prazo</th>
            <th className="px-[6px] py-[6px] text-center font-semibold text-[#64748b]">
              {mode === 'overdue' ? 'Atraso' : 'Restam'}
            </th>
            <th className="px-[6px] py-[6px] text-center font-semibold text-[#64748b]">Status</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((ticket) => {
            const resp = findUserById(ticket.resp);
            const days = ticket.deadline
              ? Math.round((new Date(ticket.deadline).getTime() - now) / 86400000)
              : 0;
            const absDays = Math.abs(days);
            const toneClass =
              mode === 'overdue'
                ? 'text-[#dc2626]'
                : days <= 3
                  ? 'text-[#dc2626]'
                  : 'text-[#d97706]';

            return (
              <tr key={ticket.id} className="border-b border-[#e2e8f0]">
                <td className="px-[6px] py-[6px]">
                  <div className="max-w-[200px] truncate font-semibold text-[#0f172a]">
                    {ticket.title}
                  </div>
                  <div className="text-[10px] text-[#64748b]">
                    {ticket.devType} - {ticket.category}
                  </div>
                </td>
                <td className="px-[6px] py-[6px] text-center">
                  {resp ? <StatusBadge>{resp.name}</StatusBadge> : '--'}
                </td>
                <td className="px-[6px] py-[6px] text-center font-mono font-bold text-[#0f172a]">
                  {ticket.deadline ? formatDate(ticket.deadline) : '--'}
                </td>
                <td className={`px-[6px] py-[6px] text-center font-bold ${toneClass}`}>
                  {absDays}d
                </td>
                <td className="px-[6px] py-[6px] text-center">
                  <StatusBadge>{ticket.devStatus}</StatusBadge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function ActiveSprintCard({
  activeSp,
  spPct,
  spVelocity,
  spBugCount,
  spDoneCount,
  spTotalCount,
  activeSprintBugs,
}: {
  activeSp: Sprint | null;
  spPct: number;
  spVelocity: number;
  spBugCount: number;
  spDoneCount: number;
  spTotalCount: number;
  activeSprintBugs: DevTicket[];
}) {
  if (!activeSp) {
    return (
      <Panel className="mb-4 p-5 text-center">
        <div className="mb-2 inline-flex items-center justify-center text-[#64748b]">
          <Flag className="size-7" />
        </div>
        <div className="font-bold text-[#0f172a]">Nenhuma sprint ativa</div>
        <button
          type="button"
          className="mt-3 inline-flex items-center gap-2 rounded-[8px] bg-[#2563eb] px-4 py-2 text-[13px] font-semibold text-white"
        >
          <Plus className="size-4" />
          Criar Sprint
        </button>
      </Panel>
    );
  }

  return (
    <Panel className="mb-4 border-l-4 border-l-[#2563eb] p-[18px]">
      <div className="flex flex-wrap items-start justify-between gap-[10px]">
        <div className="flex-1">
          <div className="text-[11px] font-bold uppercase tracking-[.07em] text-[#2563eb]">
            Sprint Ativa
          </div>
          <div className="my-1 text-[18px] font-extrabold text-[#0f172a]">
            {activeSp.name}
          </div>
          {activeSp.goal ? (
            <div className="mb-[6px] inline-flex items-center gap-1 text-[12px] text-[#64748b]">
              <Target className="size-3.5" />
              {activeSp.goal}
            </div>
          ) : null}
          <div className="text-[12px] text-[#64748b]">
            {formatDate(activeSp.start)}
            {' -> '}
            {formatDate(activeSp.end)}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-[8px] bg-[#f8fafc] p-2">
            <div className="text-[20px] font-extrabold text-[#2563eb]">{spPct}%</div>
            <div className="text-[10px] text-[#64748b]">Completo</div>
          </div>
          <div className="rounded-[8px] bg-[#f8fafc] p-2">
            <div className="text-[20px] font-extrabold text-[#059669]">{spVelocity}</div>
            <div className="text-[10px] text-[#64748b]">Pts entregues</div>
          </div>
          <div className={`rounded-[8px] p-2 ${spBugCount ? 'bg-[#fef2f2]' : 'bg-[#f8fafc]'}`}>
            <div className={`text-[20px] font-extrabold ${spBugCount ? 'text-[#dc2626]' : 'text-[#059669]'}`}>
              {spBugCount}
            </div>
            <div className="text-[10px] text-[#64748b]">Bugs</div>
          </div>
        </div>
      </div>
      <div className="my-[10px] h-1.5 overflow-hidden rounded-full bg-[#e2e8f0]">
        <div
          className="h-full rounded-full"
          style={{
            width: `${spPct}%`,
            background: spPct === 100 ? '#059669' : '#2563eb',
          }}
        />
      </div>
      <div className="text-[11px] text-[#64748b]">
        {spDoneCount} / {spTotalCount} tickets - {spTotalCount - spDoneCount} restantes
      </div>
      {activeSprintBugs.length ? (
        <div className="mt-3 grid gap-2">
          {activeSprintBugs.map((bug) => (
            <div
              key={bug.id}
              className="rounded-[8px] border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-[11px]"
            >
              <div className="font-semibold text-[#0f172a]">{bug.title}</div>
              <div className="mt-1 text-[#64748b]">
                {bug.devStatus} - {findUserById(bug.resp)?.name ?? '--'}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </Panel>
  );
}

export function LeaderboardCard({
  leaderboard,
}: {
  leaderboard: Array<{
    u: { id: string; name: string };
    mine: number;
    inDev: number;
    overdue: number;
    bugs: number;
    base: number;
    bonus: number;
    penalties: number;
    pts: number;
  }>;
}) {
  return (
    <Panel className="mb-4 p-[18px]">
      <Title icon={<Trophy className="size-4" />}>Ranking da Equipe - Sistema de Pontuacao</Title>
      <div className="mb-3 text-[11px] text-[#64748b]">
        Base: Simples +1 - Media +2 - Complexa +3 - Bug Critico +2 | Bonus: Prazo +5 - Doc +3 - Incidente +3 - Elogio +3 | Penalidades: Bug Prod -2 - Reaberta -2 - Sem Doc -2 - Atraso -4
      </div>
      {leaderboard.length ? (
        leaderboard.map((item, index) => {
          const maxPoints = leaderboard[0]?.pts || 1;
          const pctBar = Math.round((item.pts / maxPoints) * 100);
          const medalColor =
            index === 0 ? '#f59e0b' : index === 1 ? '#94a3b8' : index === 2 ? '#cd7c4b' : '#64748b';

          return (
            <div key={item.u.id} className="flex items-center gap-3 border-b border-[#e2e8f0] py-[10px] last:border-b-0">
              <div className="flex w-7 justify-center" style={{ color: medalColor }}>
                {index < 3 ? <Medal className="size-[18px]" /> : <span>{index + 1}.</span>}
              </div>
              <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-[#2563eb] text-[12px] font-bold text-white">
                {getInitials(item.u.name)}
              </div>
              <div className="flex-1">
                <div className="mb-1 flex items-center justify-between gap-3">
                  <span className="text-[13px] font-bold text-[#0f172a]">{item.u.name}</span>
                  <span
                    className={`text-[16px] font-extrabold ${
                      item.pts >= 10
                        ? 'text-[#059669]'
                        : item.pts >= 5
                          ? 'text-[#2563eb]'
                          : 'text-[#64748b]'
                    }`}
                  >
                    {item.pts} pts
                  </span>
                </div>
                <div className="mb-1 h-1.5 overflow-hidden rounded-full bg-[#e2e8f0]">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pctBar}%`, background: medalColor }}
                  />
                </div>
                <div className="flex flex-wrap gap-2 text-[11px] text-[#64748b]">
                  <span>{item.mine} entregues</span>
                  <span>{item.inDev} em dev</span>
                  {item.base > 0 ? <span className="text-[#059669]">Base: +{item.base}</span> : null}
                  {item.bonus > 0 ? <span className="text-[#059669]">Bonus: +{item.bonus}</span> : null}
                  {item.penalties < 0 ? <span className="text-[#dc2626]">Penalidades: {item.penalties}</span> : null}
                  {item.overdue ? <span className="text-[#dc2626]">{item.overdue} atrasado(s)</span> : null}
                  {item.bugs ? <span className="text-[#dc2626]">{item.bugs} bug(s) prod</span> : null}
                </div>
              </div>
            </div>
          );
        })
      ) : (
        <div className="py-5 text-center text-[13px] text-[#64748b]">
          Nenhum responsavel atribuido em tickets concluidos.
        </div>
      )}
    </Panel>
  );
}

export function SprintHistoryCard({
  rows,
}: {
  rows: Array<{
    sprint: Sprint;
    sprintTickets: DevTicket[];
    sprintDone: DevTicket[];
    pct: number;
    vel: number;
  }>;
}) {
  if (!rows.length) return null;

  return (
    <Panel className="p-[18px]">
      <Title icon={<SquareTerminal className="size-4" />}>Historico de Sprints</Title>
      {rows.map((row) => (
        <div key={row.sprint.id} className="flex items-center gap-3 border-b border-[#e2e8f0] py-2 last:border-b-0">
          <div className="flex-1">
            <div className="text-[13px] font-semibold text-[#0f172a]">
              {row.sprint.name}{' '}
              <span
                className={`ml-1 inline-flex rounded-full px-[7px] py-[1px] text-[10px] font-bold ${
                  row.sprint.closed
                    ? 'border border-[#e2e8f0] bg-[#f1f5f9] text-[#475569]'
                    : 'border border-[#a7f3d0] bg-[#ecfdf5] text-[#059669]'
                }`}
              >
                {row.sprint.closed ? 'Fechada' : 'Ativa'}
              </span>
            </div>
            <div className="text-[11px] text-[#64748b]">
              {formatDate(row.sprint.start)}
              {' -> '}
              {formatDate(row.sprint.end)}
              {row.sprint.goal ? ` - ${row.sprint.goal}` : ''}
            </div>
          </div>
          <div className="text-right">
            <div className={`font-bold ${row.pct === 100 ? 'text-[#059669]' : 'text-[#2563eb]'}`}>
              {row.pct}%
            </div>
            <div className="text-[11px] text-[#64748b]">
              {row.sprintDone.length}/{row.sprintTickets.length} - {row.vel}pts
            </div>
          </div>
          {!row.sprint.closed ? (
            <div className="flex gap-[5px]">
              <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] border border-[#e2e8f0] text-[#64748b]">
                <FilePenLine className="size-4" />
              </button>
              <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] border border-[#fecaca] text-[#dc2626]">
                <Flag className="size-4" />
              </button>
            </div>
          ) : null}
        </div>
      ))}
    </Panel>
  );
}
