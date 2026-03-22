import { useMemo } from 'react';

import { supportTickets, techs } from './data';
import type { SupportTicket } from './types';
import { buildTimeBuckets, diffDays, inRange, percentage, sumBy } from './utils';

const TODAY = new Date('2026-03-22T12:00:00').getTime();

export function useSupportDashboard(dateFrom: string, dateTo: string) {
  return useMemo(() => {
    const activeTickets = supportTickets.filter((ticket) => ticket.status === 'active');
    const allCompletedTickets = supportTickets.filter(
      (ticket) => ticket.status === 'done' && ticket.updatedAt,
    );
    const filteredCompletedTickets =
      dateFrom || dateTo
        ? allCompletedTickets.filter((ticket) =>
            inRange(ticket.updatedAt!, dateFrom, dateTo),
          )
        : allCompletedTickets;

    const activeTasks = activeTickets.flatMap((ticket) => ticket.tasks);
    const pendTasks = activeTasks.filter((task) => !task.done);
    const doneTasks = activeTasks.filter((task) => task.done);
    const overdue = pendTasks.filter(
      (task) => task.endDate && new Date(task.endDate).getTime() < TODAY,
    ).length;
    const pctGeral = percentage(doneTasks.length, activeTasks.length);

    const withTime = filteredCompletedTickets.filter(
      (ticket) => ticket.createdAt && ticket.updatedAt,
    );
    const timeValues = withTime.map((ticket) => diffDays(ticket.createdAt, ticket.updatedAt!));
    const avgDays = timeValues.length
      ? sumBy(timeValues, (value) => value) / timeValues.length
      : 0;
    const novosWithTime = withTime.filter((ticket) => ticket.tipo === 'novo');
    const upsellWithTime = withTime.filter((ticket) => ticket.tipo === 'inclusao');
    const avgNovos = novosWithTime.length
      ? Math.round(
          sumBy(novosWithTime, (ticket) => diffDays(ticket.createdAt, ticket.updatedAt!)) /
            novosWithTime.length,
        )
      : null;
    const avgUps = upsellWithTime.length
      ? Math.round(
          sumBy(upsellWithTime, (ticket) => diffDays(ticket.createdAt, ticket.updatedAt!)) /
            upsellWithTime.length,
        )
      : null;
    const fastest = withTime.length
      ? [...withTime].sort(
          (left, right) =>
            diffDays(left.createdAt, left.updatedAt!) -
            diffDays(right.createdAt, right.updatedAt!),
        )[0]
      : null;
    const slowest = withTime.length
      ? [...withTime].sort(
          (left, right) =>
            diffDays(right.createdAt, right.updatedAt!) -
            diffDays(left.createdAt, left.updatedAt!),
        )[0]
      : null;
    const minDays = timeValues.length ? Math.min(...timeValues) : 0;
    const maxDays = timeValues.length ? Math.max(...timeValues) : 0;
    const buckets = buildTimeBuckets(timeValues);

    const phaseMap = activeTickets.reduce<Record<string, number>>((accumulator, ticket) => {
      accumulator[ticket.csStatus] = (accumulator[ticket.csStatus] ?? 0) + 1;
      return accumulator;
    }, {});
    const phaseCount = Object.entries(phaseMap).map(([col, n]) => ({ col, n }));

    const productTotals = supportTickets.reduce<Record<string, number>>(
      (accumulator, ticket) => {
        accumulator[ticket.produto] = (accumulator[ticket.produto] ?? 0) + 1;
        return accumulator;
      },
      {},
    );
    const productDone = allCompletedTickets.reduce<Record<string, number>>(
      (accumulator, ticket) => {
        accumulator[ticket.produto] = (accumulator[ticket.produto] ?? 0) + 1;
        return accumulator;
      },
      {},
    );

    const novosAtivos = activeTickets.filter((ticket) => ticket.tipo === 'novo').length;
    const upsellAtivos = activeTickets.filter((ticket) => ticket.tipo === 'inclusao').length;
    const novosConcl = filteredCompletedTickets.filter(
      (ticket) => ticket.tipo === 'novo',
    ).length;
    const upsellConcl = filteredCompletedTickets.filter(
      (ticket) => ticket.tipo === 'inclusao',
    ).length;

    const techStats = techs.map((tech) => {
      const myCards = activeTickets.filter((ticket) => ticket.respTec === tech.id);
      const myTasks = myCards.flatMap((ticket) => ticket.tasks);
      const myDone = myTasks.filter((task) => task.done);
      const myOver = myTasks.filter(
        (task) => !task.done && task.endDate && new Date(task.endDate).getTime() < TODAY,
      ).length;
      const myPct = percentage(myDone.length, myTasks.length);
      const myConclPeriod = filteredCompletedTickets.filter(
        (ticket) => ticket.respTec === tech.id,
      );
      const myAvg = myConclPeriod.length
        ? Math.round(
            sumBy(
              myConclPeriod,
              (ticket) => diffDays(ticket.createdAt, ticket.updatedAt!),
            ) / myConclPeriod.length,
          )
        : null;

      return {
        tech,
        myCards,
        myTasks,
        myDone,
        myOver,
        myPct,
        novos: myCards.filter((ticket) => ticket.tipo === 'novo').length,
        ups: myCards.filter((ticket) => ticket.tipo === 'inclusao').length,
        myAvg,
      };
    });

    return {
      activeTickets,
      filteredCompletedTickets,
      pendTasks,
      doneTasks,
      overdue,
      pctGeral,
      withTime,
      avgDays,
      avgNovos,
      avgUps,
      fastest,
      slowest,
      minDays,
      maxDays,
      buckets,
      phaseCount,
      productTotals,
      productDone,
      novosAtivos,
      upsellAtivos,
      novosConcl,
      upsellConcl,
      techStats,
    };
  }, [dateFrom, dateTo]);
}

export function getSupportTicketsByKind(
  kind: 'active' | 'done',
  activeTickets: SupportTicket[],
  filteredCompletedTickets: SupportTicket[],
) {
  return kind === 'active' ? activeTickets : filteredCompletedTickets;
}
