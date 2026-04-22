import { BellRing, Clock3 } from 'lucide-react';

import { cn } from '@/lib/utils';

import type { GoalsState, User } from './types';
import { ACT_COLS, CRM_COLS } from './types';
import type {
  useCrmData,
  useOriginStats,
  useSdrStats,
  useVendorStats,
} from './hooks';
import { formatMoney, progressColor, statusToneColor, sumBy } from './utils';
import {
  FragmentHeader,
  GoalBar,
  InlineGoalBar,
  InlineGoalBarMoney,
  Panel,
  SmallPill,
  rankIcon,
} from './ui';

const taskLabels: Record<string, string> = {
  reuniao: 'Reunião',
  demo: 'Demo',
  visita: 'Visita',
};

const taskColors: Record<string, string> = {
  reuniao: '#2563eb',
  demo: '#7c3aed',
  visita: '#d97706',
};

type CrmData = ReturnType<typeof useCrmData>;
type OriginStats = ReturnType<typeof useOriginStats>;
type SdrStats = ReturnType<typeof useSdrStats>;
type VendorStats = ReturnType<typeof useVendorStats>;
type TicketStage = {
  label: string;
  count: number;
  value: number;
  color: string;
};

export function FunnelPanel({ data }: { data: CrmData }) {
  return (
    <Panel className="p-[18px_20px]">
      <div className="mb-4 text-[13px] font-bold text-[#0f172a]">
        Funil de Vendas - Pipeline Ativo
      </div>
      <div className="flex flex-col gap-[7px]">
        {CRM_COLS.map((status, index) => {
          const stageLeads = data.ativos.filter(
            (lead) => lead.status === status,
          );
          const count = stageLeads.length;
          const value = sumBy(stageLeads, (lead) => lead.value);
          const width = Math.max(8, Math.round((count / data.funnelMax) * 100));
          const hue = Math.round(
            220 - (index / Math.max(CRM_COLS.length - 1, 1)) * 80,
          );

          return (
            <div key={status}>
              <div className="mb-[3px] flex justify-between gap-3">
                <span className="text-[11px] font-bold text-[#0f172a]">
                  {status}
                </span>
                <span className="text-[11px] text-[#64748b]">
                  {count} {count === 1 ? 'lead' : 'leads'}
                  {value ? ` / ${formatMoney(value)}` : ''}
                </span>
              </div>
              <div className="h-[10px] overflow-hidden rounded-full bg-[#f8fafc]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${width}%`,
                    background: `hsl(${hue},72%,52%)`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-[14px] border-t border-[#e2e8f0] pt-3">
        <span className="text-[12px] text-[#64748b]">
          Pipeline:{' '}
          <strong className="text-[#2563eb]">
            {formatMoney(data.totalVal)}
          </strong>
        </span>
        <span className="text-[12px] text-[#64748b]">
          Sem responsável:{' '}
          <strong
            className={
              data.leadsSemResp > 0 ? 'text-[#d97706]' : 'text-[#059669]'
            }
          >
            {data.leadsSemResp}
          </strong>
        </span>
        <span className="text-[12px] text-[#64748b]">
          Conversão:{' '}
          <strong style={{ color: statusToneColor(data.txConv) }}>
            {data.txConv}%
          </strong>
        </span>
      </div>
    </Panel>
  );
}

export function TicketJourneyPanel({
  data,
  ticketStages,
}: {
  data: CrmData;
  ticketStages: TicketStage[];
}) {
  const ticketMax = Math.max(1, ...ticketStages.map((stage) => stage.count));

  return (
    <Panel className="p-[18px_20px]">
      <div className="mb-4 text-[13px] font-bold text-[#0f172a]">
        Clientes Fechados - Jornada & Valores
      </div>
      {ticketStages.map((stage) => (
        <div key={stage.label} className="mb-[9px]">
          <div className="mb-[3px] flex justify-between gap-3">
            <span className="text-[11px] font-bold text-[#0f172a]">
              {stage.label}
            </span>
            <span
              className="text-[11px] font-bold"
              style={{ color: stage.color }}
            >
              {stage.count} {stage.count === 1 ? 'ticket' : 'tickets'}
              {stage.value ? ` / ${formatMoney(stage.value)}` : ''}
            </span>
          </div>
          <div className="h-[10px] overflow-hidden rounded-full bg-[#f8fafc]">
            <div
              className="h-full rounded-full opacity-85"
              style={{
                width: `${Math.max(
                  4,
                  Math.round((stage.count / ticketMax) * 100),
                )}%`,
                background: stage.color,
              }}
            />
          </div>
        </div>
      ))}
      <div className="mt-[14px] grid grid-cols-2 gap-[10px] border-t border-[#e2e8f0] pt-3">
        <div className="rounded-[8px] bg-[#eff6ff] p-2 text-center">
          <div className="text-[10px] font-bold tracking-[.04em] text-[#2563eb] uppercase">
            Setup Total
          </div>
          <div className="mt-[2px] text-[17px] font-extrabold text-[#2563eb]">
            {formatMoney(data.tkSetupTotal)}
          </div>
          <div className="text-[10px] text-[#64748b]">ativos</div>
        </div>
        <div className="rounded-[8px] bg-[#f5f3ff] p-2 text-center">
          <div className="text-[10px] font-bold tracking-[.04em] text-[#7c3aed] uppercase">
            Recorrência
          </div>
          <div className="mt-[2px] text-[17px] font-extrabold text-[#7c3aed]">
            {formatMoney(data.tkRecurTotal)}
          </div>
          <div className="text-[10px] text-[#64748b]">por mês, ativos</div>
        </div>
      </div>
    </Panel>
  );
}

export function OriginsTable({ originStats }: { originStats: OriginStats }) {
  if (!originStats.length) return null;

  return (
    <Panel className="overflow-hidden">
      <div className="border-b border-[#e2e8f0] px-[18px] py-[14px] text-[13px] font-bold text-[#0f172a]">
        Leads por Origem - Valor Ganho & Pipeline em Aberto
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr className="bg-[#f8fafc]">
              <th className="px-[14px] py-2 text-left text-[10px] font-bold text-[#64748b] uppercase">
                Origem
              </th>
              <th className="px-[14px] py-2 text-center text-[10px] font-bold text-[#64748b] uppercase">
                Leads
              </th>
              <th className="px-[14px] py-2 text-center text-[10px] font-bold text-[#64748b] uppercase">
                Ganhos
              </th>
              <th className="px-[14px] py-2 text-center text-[10px] font-bold text-[#64748b] uppercase">
                Em Aberto
              </th>
              <th className="px-[14px] py-2 text-center text-[10px] font-bold text-[#64748b] uppercase">
                Conv.
              </th>
              <th className="px-[14px] py-2 text-right text-[10px] font-bold text-[#059669] uppercase">
                Valor Ganho
              </th>
              <th className="px-[14px] py-2 text-right text-[10px] font-bold text-[#2563eb] uppercase">
                Pipeline Aberto
              </th>
            </tr>
          </thead>
          <tbody>
            {originStats.map((origin) => {
              const conv =
                origin.total > 0
                  ? Math.round((origin.ganhos / origin.total) * 100)
                  : 0;

              return (
                <tr
                  key={origin.name}
                  className="border-t border-[#e2e8f0] hover:bg-[#f8fafc]"
                >
                  <td className="px-[14px] py-[9px] font-bold text-[#0f172a]">
                    {origin.name}
                  </td>
                  <td className="px-[14px] py-[9px] text-center">
                    {origin.total}
                  </td>
                  <td className="px-[14px] py-[9px] text-center">
                    <SmallPill tone="success">{origin.ganhos}</SmallPill>
                  </td>
                  <td className="px-[14px] py-[9px] text-center">
                    <SmallPill tone="accent">{origin.ativos}</SmallPill>
                  </td>
                  <td className="px-[14px] py-[9px] text-center">
                    <strong style={{ color: statusToneColor(conv) }}>
                      {conv}%
                    </strong>
                  </td>
                  <td className="px-[14px] py-[9px] text-right font-extrabold text-[#059669]">
                    {formatMoney(origin.valGanho)}
                  </td>
                  <td className="px-[14px] py-[9px] text-right font-bold text-[#2563eb]">
                    {formatMoney(origin.valAberto)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-[#e2e8f0] bg-[#f8fafc] font-extrabold">
              <td className="px-[14px] py-[9px]">Total</td>
              <td className="px-[14px] py-[9px] text-center">
                {sumBy(originStats, (origin) => origin.total)}
              </td>
              <td className="px-[14px] py-[9px] text-center">
                {sumBy(originStats, (origin) => origin.ganhos)}
              </td>
              <td className="px-[14px] py-[9px] text-center">
                {sumBy(originStats, (origin) => origin.ativos)}
              </td>
              <td />
              <td className="px-[14px] py-[9px] text-right text-[#059669]">
                {formatMoney(sumBy(originStats, (origin) => origin.valGanho))}
              </td>
              <td className="px-[14px] py-[9px] text-right text-[#2563eb]">
                {formatMoney(sumBy(originStats, (origin) => origin.valAberto))}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </Panel>
  );
}

export function SdrTable({
  sdrStats,
  users,
  goals,
  totalLeads,
  onChangeLeadsGoal,
  onChangeSdrGoal,
}: {
  sdrStats: SdrStats;
  users: User[];
  goals: GoalsState;
  totalLeads: number;
  onChangeLeadsGoal: (value: number) => void;
  onChangeSdrGoal: (sdrId: string, value: number) => void;
}) {
  const { rows, leadsWithoutSdr } = sdrStats;

  return (
    <Panel className="overflow-hidden">
      <div className="border-b border-[#e2e8f0] px-[18px] py-[14px] flex items-center justify-between">
        <div className="mb-[2px] text-[13px] font-bold text-[#0f172a]">
          Leads por SDR - Captação & Distribuição
        </div>
        <div className="max-w-[340px]">
          <GoalBar
            label="Meta global de leads"
            placeholder="Ex: 100"
            actualValue={totalLeads}
            goalValue={goals.leadsTotal}
            isMoney={false}
            onChange={onChangeLeadsGoal}
          />
        </div>
      </div>
      {rows.length ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr className="bg-[#f8fafc]">
                <th className="px-[14px] py-2 text-left text-[10px] font-bold text-[#64748b] uppercase">
                  SDR
                </th>
                <th className="px-[14px] py-2 text-center text-[10px] font-bold text-[#64748b] uppercase">
                  Leads
                </th>
                <th className="px-[14px] py-2 text-center text-[10px] font-bold text-[#64748b] uppercase">
                  Ativos
                </th>
                <th className="px-[14px] py-2 text-center text-[10px] font-bold text-[#64748b] uppercase">
                  Ganhos
                </th>
                <th className="px-[14px] py-2 text-center text-[10px] font-bold text-[#64748b] uppercase">
                  Conv.
                </th>
                <th className="px-[14px] py-2 text-left text-[10px] font-bold text-[#64748b] uppercase">
                  Por Vendedor
                </th>
                <th className="px-[14px] py-2 text-right text-[10px] font-bold text-[#64748b] uppercase">
                  Meta Indiv.
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const goalValue = goals.sdrs[row.sdr.id] ?? 0;

                return (
                  <tr
                    key={row.sdr.id}
                    className="border-t border-[#e2e8f0] hover:bg-[#f8fafc]"
                  >
                    <td className="px-[14px] py-[9px] font-bold text-[#0f172a]">
                      {row.sdr.name}
                    </td>
                    <td className="px-[14px] py-[9px] text-center text-[16px] font-extrabold text-[#2563eb]">
                      {row.total}
                    </td>
                    <td className="px-[14px] py-[9px] text-center">
                      <SmallPill tone="accent">{row.ativos}</SmallPill>
                    </td>
                    <td className="px-[14px] py-[9px] text-center">
                      <SmallPill tone="success">{row.ganhos}</SmallPill>
                    </td>
                    <td className="px-[14px] py-[9px] text-center">
                      <strong style={{ color: statusToneColor(row.conv) }}>
                        {row.conv}%
                      </strong>
                    </td>
                    <td className="max-w-[240px] px-[14px] py-[9px]">
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(row.bySeller).map(
                          ([sellerId, count]) =>
                            sellerId === 'sem' ? (
                              <span
                                key={sellerId}
                                className="rounded-full bg-[#f8fafc] px-[7px] py-[1px] text-[10px] font-bold text-[#64748b]"
                              >
                                Sem resp. x{count}
                              </span>
                            ) : (
                              <span
                                key={sellerId}
                                className="rounded-full bg-[#f5f3ff] px-[7px] py-[1px] text-[10px] font-bold text-[#7c3aed]"
                              >
                                {
                                  users
                                    .find((user) => user.id === sellerId)
                                    ?.name.split(' ')[0]
                                }{' '}
                                x{count}
                              </span>
                            ),
                        )}
                      </div>
                    </td>
                    <td className="min-w-[160px] px-[14px] py-[9px]">
                      <InlineGoalBar
                        actualValue={row.total}
                        goalValue={goalValue}
                        onChangeGoal={(value) =>
                          onChangeSdrGoal(row.sdr.id, value)
                        }
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {leadsWithoutSdr.length ? (
              <tfoot>
                <tr className="border-t border-dashed border-[#e2e8f0] bg-[#f8fafc]">
                  <td className="px-[14px] py-2 text-[#64748b] italic">
                    Sem SDR
                  </td>
                  <td className="px-[14px] py-2 text-center text-[#64748b]">
                    {leadsWithoutSdr.length}
                  </td>
                  <td colSpan={5} />
                </tr>
              </tfoot>
            ) : null}
          </table>
        </div>
      ) : (
        <div className="px-5 py-5 text-center text-[13px] text-[#64748b]">
          Nenhum SDR com leads no período.
        </div>
      )}
    </Panel>
  );
}

export function VendorTable({
  vendorStats,
  goals,
  ganhoVal,
  onChangeSalesGoal,
  onChangeSellerGoal,
}: {
  vendorStats: VendorStats;
  goals: GoalsState;
  ganhoVal: number;
  onChangeSalesGoal: (value: number) => void;
  onChangeSellerGoal: (userId: string, value: number) => void;
}) {
  if (!vendorStats.length) {
    return (
      <Panel className="p-5 text-center text-[13px] text-[#64748b]">
        Nenhum lead no período selecionado.
      </Panel>
    );
  }

  return (
    <Panel className="overflow-hidden">
      <div className="border-b border-[#e2e8f0] px-[18px] py-[14px] flex items-center justify-between">
        <div className="mb-[2px] text-[13px] font-bold text-[#0f172a]">
          Ranking por Vendedor - Performance & Metas
        </div>
        <div className="max-w-[380px]">
          <GoalBar
            label="Meta global de receita (R$)"
            placeholder="Ex: 50000"
            actualValue={ganhoVal}
            goalValue={goals.salesTotal}
            isMoney
            onChange={onChangeSalesGoal}
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr className="bg-[#f8fafc]">
              <th className="px-[10px] py-2 text-left text-[10px] font-bold text-[#64748b] uppercase">
                #
              </th>
              <th className="px-[14px] py-2 text-left text-[10px] font-bold text-[#64748b] uppercase">
                Vendedor
              </th>
              <th className="px-[10px] py-2 text-center text-[10px] font-bold text-[#64748b] uppercase">
                Leads
              </th>
              <th className="px-[10px] py-2 text-center text-[10px] font-bold text-[#64748b] uppercase">
                Ganhos
              </th>
              <th className="px-[10px] py-2 text-center text-[10px] font-bold text-[#64748b] uppercase">
                Conv.
              </th>
              <th className="px-[10px] py-2 text-right text-[10px] font-bold text-[#059669] uppercase">
                Receita Lead
              </th>
              <th className="px-[10px] py-2 text-right text-[10px] font-bold text-[#2563eb] uppercase">
                Pipeline
              </th>
              <th className="px-[10px] py-2 text-right text-[10px] font-bold text-[#7c3aed] uppercase">
                Setup Tickets
              </th>
              <th className="px-[10px] py-2 text-right text-[10px] font-bold text-[#059669] uppercase">
                Recorr. Tickets
              </th>
              <th className="px-[10px] py-2 text-left text-[10px] font-bold text-[#64748b] uppercase">
                Meta (R$)
              </th>
            </tr>
          </thead>
          <tbody>
            {vendorStats.map((row, index) => {
              const goalValue = goals.sellers[row.user.id] ?? 0;

              return (
                <tr
                  key={row.user.id}
                  className="border-t border-[#e2e8f0] hover:bg-[#f8fafc]"
                >
                  <td className="px-[10px] py-[9px] font-bold">
                    {rankIcon(index)}
                  </td>
                  <td className="px-[14px] py-[9px]">
                    <div className="font-bold text-[#0f172a]">
                      {row.user.name.split(' ').slice(0, 2).join(' ')}
                    </div>
                    <div className="text-[10px] text-[#64748b]">
                      {row.user.sector}
                    </div>
                  </td>
                  <td className="px-[10px] py-[9px] text-center font-bold">
                    {row.leads}
                  </td>
                  <td className="px-[10px] py-[9px] text-center">
                    <SmallPill tone="success">{row.ganhos}</SmallPill>
                  </td>
                  <td className="px-[10px] py-[9px] text-center">
                    <strong style={{ color: statusToneColor(row.conv) }}>
                      {row.conv}%
                    </strong>
                  </td>
                  <td className="px-[10px] py-[9px] text-right font-extrabold text-[#059669]">
                    {formatMoney(row.revenue)}
                  </td>
                  <td className="px-[10px] py-[9px] text-right font-bold text-[#2563eb]">
                    {formatMoney(row.pipeline)}
                  </td>
                  <td className="px-[10px] py-[9px] text-right font-bold text-[#7c3aed]">
                    {row.ticketSetup ? formatMoney(row.ticketSetup) : '--'}
                  </td>
                  <td className="px-[10px] py-[9px] text-right font-bold text-[#059669]">
                    {row.ticketRecurring
                      ? `${formatMoney(row.ticketRecurring)}/mes`
                      : '--'}
                  </td>
                  <td className="min-w-[190px] px-[10px] py-[9px]">
                    <InlineGoalBarMoney
                      actualValue={row.revenue}
                      goalValue={goalValue}
                      onChangeGoal={(value) =>
                        onChangeSellerGoal(row.user.id, value)
                      }
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

export function ActivitiesTable({
  vendorStats,
  goals,
  actTotalGlobal,
  actDoneGlobal,
  onChangeMetaGlobal,
  onChangeMetaIndividual,
}: {
  vendorStats: VendorStats;
  goals: GoalsState;
  actTotalGlobal: number;
  actDoneGlobal: number;
  onChangeMetaGlobal: (value: number) => void;
  onChangeMetaIndividual: (userId: string, value: number) => void;
}) {
  const activitiesMetaProgress =
    goals.activitiesMeta > 0
      ? Math.min(100, Math.round((actTotalGlobal / goals.activitiesMeta) * 100))
      : 0;

  return (
    <Panel className="overflow-hidden">
      <div className="border-b border-[#e2e8f0] px-[18px] py-[14px]  flex items-center justify-between">
        <div className="mb-3 text-[13px] font-bold text-[#0f172a]">
          Atividades Comerciais por Vendedor
        </div>
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex flex-wrap gap-[14px]">
            {ACT_COLS.map((type) => {
              const total = vendorStats.reduce(
                (sum, row) => sum + row.allTaskStats[type].total,
                0,
              );

              return (
                <div
                  key={type}
                  className="rounded-[8px] bg-[#f8fafc] px-4 py-2 text-center"
                >
                  <div
                    className="text-[11px] font-bold"
                    style={{ color: taskColors[type] }}
                  >
                    {taskLabels[type]}
                  </div>
                  <div
                    className="mt-[2px] text-[22px] font-extrabold"
                    style={{ color: taskColors[type] }}
                  >
                    {total}
                  </div>
                </div>
              );
            })}
            <div className="rounded-[8px] border-2 border-[#2563eb] bg-[#f8fafc] px-4 py-2 text-center">
              <div className="text-[11px] font-bold text-[#2563eb]">
                Total Atividades
              </div>
              <div className="mt-[2px] text-[22px] font-extrabold text-[#2563eb]">
                {actTotalGlobal}
              </div>
            </div>
          </div>
          <div className="min-w-[220px] max-w-[340px] flex-1">
            <div className="mb-[5px] flex items-center gap-2">
              <span className="text-[11px] font-bold text-[#64748b]">
                Meta global (soma das 3):
              </span>
              <input
                type="number"
                min={0}
                step={1}
                value={goals.activitiesMeta || ''}
                placeholder="Ex: 60"
                onChange={(event) =>
                  onChangeMetaGlobal(Number(event.target.value) || 0)
                }
                className="w-20 rounded-[6px] border border-[#e2e8f0] bg-[#f8fafc] px-2 py-1 text-right text-[13px] font-bold text-[#0f172a] outline-none"
              />
            </div>
            <div className="h-[10px] overflow-hidden rounded-full bg-[#f8fafc]">
              <div
                className="h-full rounded-full transition-[width]"
                style={{
                  width: `${activitiesMetaProgress}%`,
                  background: progressColor(activitiesMetaProgress),
                }}
              />
            </div>
            <div className="mt-1 flex justify-between text-[11px]">
              <span className="text-[#64748b]">
                {actTotalGlobal} realizadas
                {actDoneGlobal > 0 ? ` / ${actDoneGlobal} concluídas` : ''}
              </span>
              <span
                className="font-bold"
                style={{ color: progressColor(activitiesMetaProgress) }}
              >
                {goals.activitiesMeta > 0
                  ? `${activitiesMetaProgress}% da meta (${goals.activitiesMeta})`
                  : 'Meta não definida'}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr className="bg-[#f8fafc]">
              <th
                className="px-[14px] py-[8px] text-left text-[10px] font-bold text-[#64748b] uppercase"
                rowSpan={2}
              >
                Vendedor
              </th>
              {ACT_COLS.map((type) => (
                <th
                  key={type}
                  colSpan={2}
                  className="border-l-2 border-[#e2e8f0] px-[10px] py-[7px] text-center text-[10px] font-bold uppercase"
                  style={{ color: taskColors[type] }}
                >
                  {taskLabels[type]}
                </th>
              ))}
              <th
                colSpan={2}
                className="border-l-2 border-[#e2e8f0] px-[10px] py-[7px] text-center text-[10px] font-bold text-[#2563eb] uppercase"
              >
                Total & Meta
              </th>
            </tr>
            <tr className="border-t border-[#e2e8f0] bg-[#f8fafc]">
              {ACT_COLS.map((type) => (
                <FragmentHeader key={type} />
              ))}
              <th className="border-l-2 border-[#e2e8f0] px-[8px] py-[6px] text-center text-[10px] font-bold text-[#2563eb]">
                Soma
              </th>
              <th className="px-[10px] py-[6px] text-center text-[10px] font-bold text-[#64748b]">
                Meta indiv.
              </th>
            </tr>
          </thead>
          <tbody>
            {vendorStats.map((row) => {
              const totalSeller = ACT_COLS.reduce(
                (sum, type) => sum + row.allTaskStats[type].total,
                0,
              );
              const goalValue = goals.activitiesIndividual[row.user.id] ?? 0;
              const width =
                goalValue > 0
                  ? Math.min(100, Math.round((totalSeller / goalValue) * 100))
                  : 0;
              const color = progressColor(width);

              return (
                <tr
                  key={row.user.id}
                  className="border-t border-[#e2e8f0] hover:bg-[#f8fafc]"
                >
                  <td className="px-[14px] py-[9px] font-bold text-[#0f172a]">
                    {row.user.name.split(' ').slice(0, 2).join(' ')}
                  </td>
                  {ACT_COLS.flatMap((type) => {
                    const stats = row.allTaskStats[type];

                    return [
                      <td
                        key={`${row.user.id}-${type}-total`}
                        className="border-l-2 border-[#e2e8f0] px-2 py-2 text-center"
                      >
                        {stats.total > 0 ? (
                          <span
                            className="font-extrabold"
                            style={{ color: taskColors[type] }}
                          >
                            {stats.total}
                          </span>
                        ) : (
                          <span className="text-[#cbd5e1]">--</span>
                        )}
                      </td>,
                      <td
                        key={`${row.user.id}-${type}-done`}
                        className="px-2 py-2 text-center"
                      >
                        {stats.done > 0 ? (
                          <span className="text-[11px] font-bold text-[#059669]">
                            {stats.done}
                          </span>
                        ) : (
                          <span className="text-[#cbd5e1]">--</span>
                        )}
                      </td>,
                    ];
                  })}
                  <td className="border-l-2 border-[#e2e8f0] px-[10px] py-2 text-center">
                    <span className="text-[16px] font-extrabold text-[#2563eb]">
                      {totalSeller}
                    </span>
                  </td>
                  <td className="min-w-[150px] px-[10px] py-2">
                    <div className="flex items-center gap-[6px]">
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={goalValue || ''}
                        placeholder="Meta"
                        onChange={(event) =>
                          onChangeMetaIndividual(
                            row.user.id,
                            Number(event.target.value) || 0,
                          )
                        }
                        className="w-[65px] rounded-[6px] border border-[#e2e8f0] bg-[#f8fafc] px-[6px] py-[3px] text-right text-[12px] text-[#0f172a] outline-none"
                      />
                      <div className="min-w-[54px] flex-1">
                        <div className="h-[7px] overflow-hidden rounded-full bg-[#f8fafc]">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${width}%`, background: color }}
                          />
                        </div>
                        <div className="mt-[2px] text-[10px] text-[#64748b]">
                          {goalValue > 0 ? `${width}% da meta` : '--'}
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-[#e2e8f0] bg-[#f8fafc] font-extrabold">
              <td className="px-[14px] py-[9px]">Total equipe</td>
              {ACT_COLS.flatMap((type) => {
                const total = vendorStats.reduce(
                  (sum, row) => sum + row.allTaskStats[type].total,
                  0,
                );
                const done = vendorStats.reduce(
                  (sum, row) => sum + row.allTaskStats[type].done,
                  0,
                );

                return [
                  <td
                    key={`${type}-tfoot-total`}
                    className="border-l-2 border-[#e2e8f0] px-2 py-[9px] text-center"
                    style={{ color: taskColors[type] }}
                  >
                    {total}
                  </td>,
                  <td
                    key={`${type}-tfoot-done`}
                    className="px-2 py-[9px] text-center text-[#059669]"
                  >
                    {done > 0 ? `${done}` : '--'}
                  </td>,
                ];
              })}
              <td className="border-l-2 border-[#e2e8f0] px-[10px] py-[9px] text-center text-[16px] text-[#2563eb]">
                {actTotalGlobal}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </Panel>
  );
}

type AlertTask = {
  title: string;
  company: string;
  sellerId?: string;
  date: string;
};

export function TaskAlerts({
  tAtrasadas,
  tHoje,
  users,
}: {
  tAtrasadas: AlertTask[];
  tHoje: AlertTask[];
  users: User[];
}) {
  if (!tAtrasadas.length && !tHoje.length) return null;

  return (
    <div
      className={cn(
        'grid gap-3',
        tAtrasadas.length && tHoje.length ? 'xl:grid-cols-2' : 'grid-cols-1',
      )}
    >
      {tAtrasadas.length ? (
        <div className="rounded-[10px] border-[1.5px] border-[#fecaca] bg-[#fef2f2] p-[14px_16px]">
          <div className="mb-[10px] text-[13px] font-bold text-[#dc2626]">
            Atrasadas ({tAtrasadas.length})
          </div>
          <div className="flex max-h-[220px] flex-col gap-[6px] overflow-y-auto">
            {tAtrasadas.slice(0, 15).map((task, index) => {
              const seller = task.sellerId
                ? users.find((user) => user.id === task.sellerId)
                : null;
              const daysLate = Math.ceil(
                (Date.now() - new Date(task.date).getTime()) / 86400000,
              );

              return (
                <div
                  key={`late-${index}`}
                  className="rounded-[7px] bg-white px-[10px] py-2 text-[12px]"
                >
                  <div className="flex items-start gap-2">
                    <BellRing className="mt-[1px] size-3.5 shrink-0 text-[#dc2626]" />
                    <div>
                      <div className="font-bold text-[#0f172a]">
                        {task.title}
                      </div>
                      <div className="text-[11px] text-[#64748b]">
                        {task.company}
                        {seller ? ` / ${seller.name.split(' ')[0]}` : ''}
                        <strong className="ml-1 text-[#dc2626]">
                          / {daysLate}d atraso
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
      {tHoje.length ? (
        <div className="rounded-[10px] border-[1.5px] border-[#fde68a] bg-[#fffbeb] p-[14px_16px]">
          <div className="mb-[10px] text-[13px] font-bold text-[#d97706]">
            Vencem Hoje ({tHoje.length})
          </div>
          <div className="flex max-h-[220px] flex-col gap-[6px] overflow-y-auto">
            {tHoje.slice(0, 15).map((task, index) => {
              const seller = task.sellerId
                ? users.find((user) => user.id === task.sellerId)
                : null;

              return (
                <div
                  key={`today-${index}`}
                  className="rounded-[7px] bg-white px-[10px] py-2 text-[12px]"
                >
                  <div className="flex items-start gap-2">
                    <Clock3 className="mt-[1px] size-3.5 shrink-0 text-[#d97706]" />
                    <div>
                      <div className="font-bold text-[#0f172a]">
                        {task.title}
                      </div>
                      <div className="text-[11px] text-[#64748b]">
                        {task.company}
                        {seller ? ` / ${seller.name.split(' ')[0]}` : ''}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
