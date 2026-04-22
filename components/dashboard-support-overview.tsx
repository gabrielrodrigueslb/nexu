'use client';

import { useMemo, useState } from 'react';

import { techs } from './dashboard-support/data';
import { getSupportTicketsByKind, useSupportDashboard } from './dashboard-support/hooks';
import type { TicketListKind } from './dashboard-support/types';
import {
  PhaseCard,
  ServicesCard,
  SupportDateFilter,
  SupportKpis,
  TechOwnersCard,
  TicketListModal,
  TimeCompletionPanel,
  TypeComparisonCard,
} from './dashboard-support/sections';

export function DashboardSupportOverview() {
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [modalKind, setModalKind] = useState<TicketListKind | null>(null);

  const data = useSupportDashboard(dateRange.from, dateRange.to);
  const hasFilter = Boolean(dateRange.from || dateRange.to);

  const techNameById = useMemo(
    () =>
      techs.reduce<Record<string, string>>((accumulator, tech) => {
        accumulator[tech.id] = tech.name;
        return accumulator;
      }, {}),
    [],
  );

  const novosAtPhase = useMemo(
    () =>
      data.activeTickets.reduce<Record<string, number>>((accumulator, ticket) => {
        if (ticket.tipo === 'novo') {
          accumulator[ticket.csStatus] = (accumulator[ticket.csStatus] ?? 0) + 1;
        }
        return accumulator;
      }, {}),
    [data.activeTickets],
  );

  const upsellAtPhase = useMemo(
    () =>
      data.activeTickets.reduce<Record<string, number>>((accumulator, ticket) => {
        if (ticket.tipo === 'inclusao') {
          accumulator[ticket.csStatus] = (accumulator[ticket.csStatus] ?? 0) + 1;
        }
        return accumulator;
      }, {}),
    [data.activeTickets],
  );

  const serviceRows = useMemo(
    () =>
      Object.entries(data.productTotals)
        .map(([nome, total]) => {
          const done = data.productDone[nome] ?? 0;
          return {
            nome,
            total,
            done,
            pct: total ? Math.round((done / total) * 100) : 0,
          };
        })
        .sort((left, right) => right.total - left.total),
    [data.productDone, data.productTotals],
  );

  const techRows = useMemo(
    () =>
      data.techStats.map((row) => ({
        id: row.tech.id,
        name: row.tech.name,
        activeCount: row.myCards.length,
        novos: row.novos,
        ups: row.ups,
        avg: row.myAvg,
        taskCount: row.myTasks.length,
        taskDone: row.myDone.length,
        taskPct: row.myPct,
        overdue: row.myOver,
      })),
    [data.techStats],
  );

  const modalTickets =
    modalKind === null
      ? []
      : getSupportTicketsByKind(
          modalKind,
          data.activeTickets,
          data.filteredCompletedTickets,
          data.overdueTickets,
        );

  return (
    <div className="grid gap-0 pb-2">
      <div className="mb-4">
        <div className="text-[19px] font-extrabold tracking-[-0.4px] text-[#0f172a]">
          Dashboard Suporte
        </div>
        <div className="mt-[2px] text-[13px] text-[#64748b]">
          Visão completa das implantações
        </div>
      </div>

      <SupportDateFilter
        dateRange={dateRange}
        hasFilter={hasFilter}
        completedCount={data.filteredCompletedTickets.length}
        onChange={setDateRange}
        onClear={() => setDateRange({ from: '', to: '' })}
      />

      <SupportKpis
        activeCount={data.activeTickets.length}
        completedCount={data.filteredCompletedTickets.length}
        pendingCount={data.pendTasks.length}
        doneCount={data.doneTasks.length}
        novosAtivos={data.novosAtivos}
        upsellAtivos={data.upsellAtivos}
        novosConcl={data.novosConcl}
        upsellConcl={data.upsellConcl}
        overdue={data.overdue}
        pctGeral={data.pctGeral}
        hasFilter={hasFilter}
        onOpenList={setModalKind}
      />

      <TimeCompletionPanel
        hasFilter={hasFilter}
        withTimeCount={data.withTime.length}
        avgDays={data.avgDays}
        avgNovos={data.avgNovos}
        avgUps={data.avgUps}
        minDays={data.minDays}
        maxDays={data.maxDays}
        fastest={data.fastest}
        slowest={data.slowest}
        buckets={data.buckets}
      />

      <div className="mb-4 grid gap-[14px] xl:grid-cols-2">
        <PhaseCard
          phaseCount={data.phaseCount}
          novosAtPhase={novosAtPhase}
          upsellAtPhase={upsellAtPhase}
        />
        <ServicesCard rows={serviceRows} />
      </div>

      <TypeComparisonCard
        hasFilter={hasFilter}
        novosAtivos={data.novosAtivos}
        novosConcl={data.novosConcl}
        upsellAtivos={data.upsellAtivos}
        upsellConcl={data.upsellConcl}
        avgNovos={data.avgNovos}
        avgUps={data.avgUps}
      />

      <TechOwnersCard rows={techRows} />

      <TicketListModal
        open={modalKind !== null}
        title={
          modalKind === 'done'
            ? 'Finalizados'
            : modalKind === 'overdue'
              ? 'Em Atraso'
              : 'Em Implantação'
        }
        tickets={modalTickets}
        techNameById={techNameById}
        onClose={() => setModalKind(null)}
      />
    </div>
  );
}
