'use client';

import { useMemo, useState } from 'react';

import { useDevDashboard } from './dashboard-dev/hooks';
import type { DevListKind } from './dashboard-dev/types';
import {
  ActiveSprintCard,
  DeadlineManagementCard,
  DevDateFilter,
  DevKpis,
  DevListModal,
  KanbanFlowCard,
  LeaderboardCard,
  ResolutionTimeCard,
  SprintHistoryCard,
  VelocityCard,
} from './dashboard-dev/sections';

export function DashboardDevOverview() {
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [modalKind, setModalKind] = useState<DevListKind | null>(null);

  const data = useDevDashboard(dateRange.from, dateRange.to);

  const modalTickets = useMemo(() => {
    if (modalKind === 'open') return data.listOpen;
    if (modalKind === 'done') return data.listDone;
    if (modalKind === 'overdue') return data.listOverdue;
    return [];
  }, [data.listDone, data.listOpen, data.listOverdue, modalKind]);

  const modalTitle =
    modalKind === 'open'
      ? 'Tickets Abertos'
      : modalKind === 'done'
        ? 'Concluídos'
        : 'Em Atraso';

  return (
    <div className="grid gap-0 pb-2">
      <div className="mb-4">
        <div className="text-[19px] font-extrabold tracking-[-0.4px] text-[#0f172a]">
          Dashboard Desenvolvimento
        </div>
        <div className="mt-[2px] text-[13px] text-[#64748b]">
          Visão Scrum Master - métricas, vencimentos e pontuação da equipe
        </div>
      </div>

      <DevDateFilter
        dateRange={dateRange}
        hasFilter={data.hasFilter}
        completedCount={data.completedCount}
        onChange={setDateRange}
        onClear={() => setDateRange({ from: '', to: '' })}
      />

      <DevKpis
        totalOpen={data.totalOpen}
        completedCount={data.completedCount}
        overdueCount={data.overdueT.length}
        avgCycle={data.avgCycle}
        bugRate={data.bugRate}
        onOpenList={setModalKind}
      />

      <div className="mb-4 grid gap-[14px] xl:grid-cols-2">
        <KanbanFlowCard byStatus={data.byStatus} maxByStatus={data.maxByStatus} />
        <VelocityCard
          velocityByS={data.velocityByS}
          activeSp={data.activeSp}
          spVelocity={data.spVelocity}
        />
      </div>

      <ResolutionTimeCard
        hasFilter={data.hasFilter}
        resolvedCount={data.resolvedT.length}
        resAvg={data.resAvg}
        resMin={data.resMin}
        resMax={data.resMax}
        resByType={data.resByType}
        resFastest={data.resFastest}
        resSlowest={data.resSlowest}
        resBkData={data.resBkData}
      />

      <DeadlineManagementCard overdueT={data.overdueT} nearT={data.nearT} />

      <ActiveSprintCard
        activeSp={data.activeSp}
        spPct={data.spPct}
        spVelocity={data.spVelocity}
        spBugCount={data.spBugs.length}
        spDoneCount={data.spDone.length}
        spTotalCount={data.spT.length}
        activeSprintBugs={data.spBugs}
      />

      <LeaderboardCard leaderboard={data.leaderboard} />

      <SprintHistoryCard rows={data.sprintHistory} />

      <DevListModal
        open={modalKind !== null}
        title={modalTitle}
        tickets={modalTickets}
        onClose={() => setModalKind(null)}
      />
    </div>
  );
}
