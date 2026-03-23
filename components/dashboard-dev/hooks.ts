import { useMemo } from 'react';

import { devTickets, devUsers, sprints } from './data';
import { DEV_COLS } from './types';
import type { DevTicket, DevType, DevUser } from './types';
import {
  buildResolutionBuckets,
  complexityBasePoints,
  diffDays,
  inRange,
  percentage,
  sumBy,
} from './utils';

const TODAY = new Date('2026-03-22T12:00:00').getTime();

function calculateTicketScore(ticket: DevTicket) {
  const base = complexityBasePoints(ticket.complexity);
  let bonus = 0;
  let penalties = 0;

  if (ticket.criticalBug) bonus += 2;
  if (ticket.docDone) bonus += 3;
  if (ticket.incident) bonus += 3;
  if (ticket.compliment) bonus += 3;
  if (
    ticket.updatedAt &&
    ticket.deadline &&
    new Date(ticket.updatedAt).getTime() <= new Date(ticket.deadline).getTime()
  ) {
    bonus += 5;
  }

  if (ticket.prodBug) penalties -= 2;
  if (ticket.reopened) penalties -= 2;
  if (!ticket.docDone) penalties -= 2;
  if (
    ticket.updatedAt &&
    ticket.deadline &&
    new Date(ticket.updatedAt).getTime() > new Date(ticket.deadline).getTime()
  ) {
    penalties -= 4;
  }

  return { base, bonus, penalties, pts: base + bonus + penalties };
}

export function useDevDashboard(dateFrom: string, dateTo: string) {
  return useMemo(() => {
    const doneStatus = DEV_COLS[DEV_COLS.length - 1];
    const hasFilter = Boolean(dateFrom || dateTo);
    const resolvedAll = devTickets.filter(
      (ticket) => ticket.devStatus === doneStatus && ticket.updatedAt,
    );
    const resolvedT = hasFilter
      ? resolvedAll.filter((ticket) => inRange(ticket.updatedAt!, dateFrom, dateTo))
      : resolvedAll;
    const openTickets = devTickets.filter((ticket) => ticket.devStatus !== doneStatus);
    const totalOpen = openTickets.length;
    const completedCount = resolvedT.length;

    const byStatus = DEV_COLS.reduce<Record<string, number>>((accumulator, status) => {
      accumulator[status] =
        status === doneStatus
          ? completedCount
          : devTickets.filter((ticket) => ticket.devStatus === status).length;
      return accumulator;
    }, {});

    const cycleValues = resolvedT.map((ticket) => diffDays(ticket.createdAt, ticket.updatedAt!));
    const avgCycle = cycleValues.length
      ? Math.round(sumBy(cycleValues, (value) => value) / cycleValues.length)
      : null;
    const bugRate = Math.round(
      percentage(devTickets.filter((ticket) => ticket.devType === 'Bug').length, devTickets.length),
    );

    const maxByStatus = Math.max(1, ...Object.values(byStatus));
    const velocityByS = sprints
      .filter((sprint) => sprint.closed)
      .map((sprint) => {
        const sprintTickets = devTickets.filter((ticket) => ticket.sprintId === sprint.id);
        const completed = sprintTickets.filter((ticket) => ticket.devStatus === doneStatus);
        return {
          id: sprint.id,
          name: sprint.name,
          pts: sumBy(completed, (ticket) => ticket.totalPts),
          count: completed.length,
        };
      });

    const activeSp = sprints.find((sprint) => !sprint.closed) ?? null;
    const spT = activeSp
      ? devTickets.filter((ticket) => ticket.sprintId === activeSp.id)
      : [];
    const spDone = spT.filter((ticket) => ticket.devStatus === doneStatus);
    const spVelocity = sumBy(spDone, (ticket) => ticket.totalPts);
    const spPct = percentage(spDone.length, spT.length);
    const spBugs = spT.filter((ticket) => ticket.devType === 'Bug');

    const resAvg = cycleValues.length
      ? sumBy(cycleValues, (value) => value) / cycleValues.length
      : 0;
    const resMin = cycleValues.length ? Math.min(...cycleValues) : 0;
    const resMax = cycleValues.length ? Math.max(...cycleValues) : 0;
    const resFastest = resolvedT.length
      ? [...resolvedT].sort(
          (left, right) =>
            diffDays(left.createdAt, left.updatedAt!) -
            diffDays(right.createdAt, right.updatedAt!),
        )[0]
      : null;
    const resSlowest = resolvedT.length
      ? [...resolvedT].sort(
          (left, right) =>
            diffDays(right.createdAt, right.updatedAt!) -
            diffDays(left.createdAt, left.updatedAt!),
        )[0]
      : null;

    const resByType = (['Feature', 'Task', 'Bug'] as DevType[]).reduce<
      Record<DevType, number | null>
    >(
      (accumulator, type) => {
        const items = resolvedT.filter((ticket) => ticket.devType === type);
        accumulator[type] = items.length
          ? Math.round(
              sumBy(items, (ticket) => diffDays(ticket.createdAt, ticket.updatedAt!)) /
                items.length,
            )
          : null;
        return accumulator;
      },
      { Feature: null, Task: null, Bug: null },
    );
    const resBkData = buildResolutionBuckets(cycleValues);

    const overdueT = openTickets.filter(
      (ticket) => ticket.deadline && new Date(ticket.deadline).getTime() < TODAY,
    );
    const nearT = openTickets.filter((ticket) => {
      if (!ticket.deadline) return false;
      const days = Math.round((new Date(ticket.deadline).getTime() - TODAY) / 86400000);
      return days >= 0 && days <= 14;
    });

    const leaderboard = devUsers
      .map((user) => {
        const mine = resolvedT.filter((ticket) => ticket.resp === user.id);
        const inDev = openTickets.filter((ticket) => ticket.resp === user.id).length;
        const overdue = overdueT.filter((ticket) => ticket.resp === user.id).length;
        const bugs = mine.filter((ticket) => ticket.prodBug).length;
        const score = mine.reduce(
          (accumulator, ticket) => {
            const ticketScore = calculateTicketScore(ticket);
            accumulator.base += ticketScore.base;
            accumulator.bonus += ticketScore.bonus;
            accumulator.penalties += ticketScore.penalties;
            accumulator.pts += ticketScore.pts;
            return accumulator;
          },
          { base: 0, bonus: 0, penalties: 0, pts: 0 },
        );
        return {
          u: user,
          mine: mine.length,
          inDev,
          overdue,
          bugs,
          base: score.base,
          bonus: score.bonus,
          penalties: score.penalties,
          pts: score.pts,
        };
      })
      .filter((item) => item.mine > 0 || item.inDev > 0)
      .sort((left, right) => right.pts - left.pts);

    const sprintHistory = sprints
      .slice()
      .reverse()
      .map((sprint) => {
        const sprintTickets = devTickets.filter((ticket) => ticket.sprintId === sprint.id);
        const sprintDone = sprintTickets.filter((ticket) => ticket.devStatus === doneStatus);
        const pct = percentage(sprintDone.length, sprintTickets.length);
        const vel = sumBy(sprintDone, (ticket) => ticket.totalPts);
        return {
          sprint,
          sprintTickets,
          sprintDone,
          pct,
          vel,
        };
      });

    const listOpen = openTickets;
    const listDone = resolvedT;
    const listOverdue = overdueT;

    return {
      hasFilter,
      totalOpen,
      completedCount,
      byStatus,
      maxByStatus,
      avgCycle,
      bugRate,
      velocityByS,
      activeSp,
      spT,
      spDone,
      spVelocity,
      spPct,
      spBugs,
      resolvedT,
      resAvg,
      resMin,
      resMax,
      resFastest,
      resSlowest,
      resByType,
      resBkData,
      overdueT,
      nearT,
      leaderboard,
      sprintHistory,
      listOpen,
      listDone,
      listOverdue,
    };
  }, [dateFrom, dateTo]);
}

export function findUserById(id: string): DevUser | undefined {
  return devUsers.find((user) => user.id === id);
}
