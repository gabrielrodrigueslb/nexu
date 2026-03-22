import { useMemo } from 'react';

import { origins, sdrs, users } from './data';
import { ACT_COLS, CRM_COLS } from './types';
import type { ActivityType, Lead, Ticket } from './types';
import { inRange, sumBy } from './utils';

const NOW = new Date('2026-03-21T12:00:00').getTime();

export function useCrmData(
  leads: Lead[],
  tickets: Ticket[],
  dateFrom: string,
  dateTo: string,
) {
  return useMemo(() => {
    const filteredLeads = leads.filter((lead) =>
      inRange(lead.createdAt, dateFrom, dateTo),
    );
    const filteredTickets = tickets.filter((ticket) =>
      inRange(ticket.createdAt, dateFrom, dateTo),
    );

    const ativos = filteredLeads.filter(
      (lead) => lead.status !== 'Ganho' && lead.status !== 'Perdido',
    );
    const ganhos = filteredLeads.filter((lead) => lead.status === 'Ganho');
    const perdidos = filteredLeads.filter((lead) => lead.status === 'Perdido');

    const totalVal = sumBy(ativos, (lead) => lead.value);
    const ganhoVal = sumBy(ganhos, (lead) => lead.value);
    const perdidoVal = sumBy(perdidos, (lead) => lead.value);
    const txConv =
      ganhos.length + perdidos.length > 0
        ? Math.round((ganhos.length / (ganhos.length + perdidos.length)) * 100)
        : 0;

    const ticketValue = (ticket: Ticket) =>
      ticket.setupAmount + ticket.recurringAmount;
    const tkPendFin = filteredTickets.filter(
      (ticket) => ticket.status === 'pendente_financeiro',
    );
    const tkPagConf = filteredTickets.filter(
      (ticket) => ticket.status === 'pagamento_confirmado',
    );
    const tkImpl = filteredTickets.filter(
      (ticket) => ticket.status === 'em_implantacao',
    );
    const tkConc = filteredTickets.filter(
      (ticket) => ticket.status === 'concluido',
    );
    const tkCancel = filteredTickets.filter(
      (ticket) => ticket.status === 'cancelado',
    );
    const tkAtivos = filteredTickets.filter(
      (ticket) => ticket.status !== 'cancelado',
    );

    const tkSetupTotal = sumBy(tkAtivos, (ticket) => ticket.setupAmount);
    const tkRecurTotal = sumBy(tkAtivos, (ticket) => ticket.recurringAmount);
    const tkMRR = sumBy(tkConc, (ticket) => ticket.recurringAmount);
    const tkSetupConc = sumBy(tkConc, (ticket) => ticket.setupAmount);
    const tkValImpl = sumBy(tkImpl, ticketValue);
    const tkValPendFin = sumBy(tkPendFin, ticketValue);

    const allTasks = filteredLeads.flatMap((lead) =>
      lead.tasks.map((task) => ({
        ...task,
        company: lead.company,
        sellerId: lead.sellerId,
      })),
    );

    const tPend = allTasks.filter((task) => !task.done);
    const tFeitas = allTasks.filter((task) => task.done);
    const tAtrasadas = tPend.filter(
      (task) =>
        new Date(task.date).getTime() < NOW && task.date !== '2026-03-21',
    );
    const tHoje = tPend.filter((task) => task.date === '2026-03-21');
    const leadsSemResp = ativos.filter((lead) => !lead.sellerId).length;
    const funnelMax = Math.max(
      1,
      ...CRM_COLS.map(
        (status) => ativos.filter((lead) => lead.status === status).length,
      ),
    );

    return {
      filteredLeads,
      filteredTickets,
      ativos,
      ganhos,
      perdidos,
      totalVal,
      ganhoVal,
      perdidoVal,
      txConv,
      tkPendFin,
      tkPagConf,
      tkImpl,
      tkConc,
      tkCancel,
      tkAtivos,
      tkSetupTotal,
      tkRecurTotal,
      tkMRR,
      tkSetupConc,
      tkValImpl,
      tkValPendFin,
      allTasks,
      tPend,
      tFeitas,
      tAtrasadas,
      tHoje,
      leadsSemResp,
      funnelMax,
      ticketValue,
    };
  }, [dateFrom, dateTo, leads, tickets]);
}

export function useOriginStats(filteredLeads: Lead[]) {
  return useMemo(() => {
    const rows = origins
      .map((origin) => {
        const originLeads = filteredLeads.filter(
          (lead) => lead.originId === origin.id,
        );
        const wins = originLeads.filter((lead) => lead.status === 'Ganho');
        const open = originLeads.filter(
          (lead) => lead.status !== 'Ganho' && lead.status !== 'Perdido',
        );

        return {
          name: origin.name,
          total: originLeads.length,
          ganhos: wins.length,
          ativos: open.length,
          valGanho: sumBy(wins, (lead) => lead.value),
          valAberto: sumBy(open, (lead) => lead.value),
        };
      })
      .filter((row) => row.total > 0);

    const withoutOrigin = filteredLeads.filter((lead) => !lead.originId);
    if (withoutOrigin.length) {
      const wins = withoutOrigin.filter((lead) => lead.status === 'Ganho');
      const open = withoutOrigin.filter(
        (lead) => lead.status !== 'Ganho' && lead.status !== 'Perdido',
      );

      rows.push({
        name: 'Sem origem',
        total: withoutOrigin.length,
        ganhos: wins.length,
        ativos: open.length,
        valGanho: sumBy(wins, (lead) => lead.value),
        valAberto: sumBy(open, (lead) => lead.value),
      });
    }

    return rows.sort((left, right) => right.total - left.total);
  }, [filteredLeads]);
}

export function useSdrStats(filteredLeads: Lead[]) {
  return useMemo(() => {
    const leadsWithoutSdr = filteredLeads.filter((lead) => !lead.sdrId);

    const rows = sdrs
      .map((sdr) => {
        const sdrLeads = filteredLeads.filter((lead) => lead.sdrId === sdr.id);
        const wins = sdrLeads.filter((lead) => lead.status === 'Ganho');
        const open = sdrLeads.filter(
          (lead) => lead.status !== 'Ganho' && lead.status !== 'Perdido',
        );
        const lost = sdrLeads.filter((lead) => lead.status === 'Perdido');
        const bySeller = sdrLeads.reduce<Record<string, number>>(
          (accumulator, lead) => {
            const key = lead.sellerId ?? 'sem';
            accumulator[key] = (accumulator[key] ?? 0) + 1;
            return accumulator;
          },
          {},
        );

        return {
          sdr,
          total: sdrLeads.length,
          ganhos: wins.length,
          ativos: open.length,
          conv:
            wins.length + lost.length > 0
              ? Math.round((wins.length / (wins.length + lost.length)) * 100)
              : 0,
          bySeller,
        };
      })
      .filter((row) => row.total > 0)
      .sort((left, right) => right.total - left.total);

    return { rows, leadsWithoutSdr };
  }, [filteredLeads]);
}

export function useVendorStats(filteredLeads: Lead[], filteredTickets: Ticket[]) {
  return useMemo(() => {
    const sellerTaskMap: Record<
      string,
      Record<ActivityType, { total: number; done: number }>
    > = {};

    filteredLeads.forEach((lead) => {
      if (!lead.sellerId) return;

      if (!sellerTaskMap[lead.sellerId]) {
        sellerTaskMap[lead.sellerId] = {
          reuniao: { total: 0, done: 0 },
          demo: { total: 0, done: 0 },
          visita: { total: 0, done: 0 },
        };
      }

      lead.tasks.forEach((task) => {
        sellerTaskMap[lead.sellerId!][task.type].total += 1;
        if (task.done) sellerTaskMap[lead.sellerId!][task.type].done += 1;
      });
    });

    return users
      .map((user) => {
        const sellerLeads = filteredLeads.filter(
          (lead) => lead.sellerId === user.id,
        );
        const wins = sellerLeads.filter((lead) => lead.status === 'Ganho');
        const lost = sellerLeads.filter((lead) => lead.status === 'Perdido');
        const open = sellerLeads.filter(
          (lead) => lead.status !== 'Ganho' && lead.status !== 'Perdido',
        );
        const sellerTickets = filteredTickets.filter(
          (ticket) =>
            ticket.createdBy === user.id || ticket.assignee === user.id,
        );

        return {
          user,
          leads: sellerLeads.length,
          ganhos: wins.length,
          conv:
            wins.length + lost.length > 0
              ? Math.round((wins.length / (wins.length + lost.length)) * 100)
              : 0,
          revenue: sumBy(wins, (lead) => lead.value),
          pipeline: sumBy(open, (lead) => lead.value),
          ticketSetup: sumBy(sellerTickets, (ticket) => ticket.setupAmount),
          ticketRecurring: sumBy(
            sellerTickets,
            (ticket) => ticket.recurringAmount,
          ),
          allTaskStats: sellerTaskMap[user.id] ?? {
            reuniao: { total: 0, done: 0 },
            demo: { total: 0, done: 0 },
            visita: { total: 0, done: 0 },
          },
        };
      })
      .filter((row) => row.leads > 0 || row.ticketSetup > 0)
      .sort((left, right) => right.revenue - left.revenue);
  }, [filteredLeads, filteredTickets]);
}

export function useActivityTotals(vendorStats: ReturnType<typeof useVendorStats>) {
  return useMemo(() => {
    const actTotalGlobal = ACT_COLS.reduce(
      (total, type) =>
        total +
        vendorStats.reduce(
          (sellerTotal, seller) => sellerTotal + seller.allTaskStats[type].total,
          0,
        ),
      0,
    );
    const actDoneGlobal = ACT_COLS.reduce(
      (total, type) =>
        total +
        vendorStats.reduce(
          (sellerTotal, seller) => sellerTotal + seller.allTaskStats[type].done,
          0,
        ),
      0,
    );

    return { actTotalGlobal, actDoneGlobal };
  }, [vendorStats]);
}
