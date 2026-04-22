'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  CreditCard,
  FileDown,
  Search,
  User,
  X,
} from 'lucide-react';

import { ModalShell } from '@/components/modal-shell';
import { formatMoney, sumBy } from '@/components/utils';

import {
  confirmFinanceContract,
  fetchFinanceContracts,
  type FinanceContractRecord,
} from './finance-contracts-api';

type BillingTicketRecord = FinanceContractRecord;

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function sellerName(ticket: BillingTicketRecord) {
  return ticket.lead?.seller?.name || ticket.assignee?.name || 'Sem responsavel';
}

function downloadCsv(rows: BillingTicketRecord[]) {
  const header = [
    'ticket',
    'empresa',
    'cnpj',
    'contato',
    'plano',
    'pagamento',
    'setup',
    'recorrencia',
    'responsavel',
    'status',
    'criado_em',
  ];

  const body = rows.map((row) => [
    row.code,
    row.company,
    row.cnpj || '',
    row.contact || '',
    row.plan || '',
    row.paymentMethod || '',
    String(row.setupAmount),
    String(row.recurringAmount),
    sellerName(row),
    row.status,
    row.createdAt,
  ]);

  const csvContent = [header, ...body]
    .map((line) =>
      line
        .map((value) => `"${String(value).replaceAll('"', '""')}"`)
        .join(','),
    )
    .join('\n');

  const blob = new Blob([`\uFEFF${csvContent}`], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'financeiro-cobranca-contrato.csv';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function statusLabel(status: BillingTicketRecord['status']) {
  if (status === 'pendente_financeiro') return 'Ag. Cobranca';
  if (status === 'pagamento_confirmado') return 'Cobranca gerada';
  if (status === 'em_implantacao') return 'Em implantacao';
  if (status === 'concluido') return 'Concluido';
  return 'Cancelado';
}

export function FinanceBillingContract() {
  const [tickets, setTickets] = useState<BillingTicketRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'lista'>('cards');
  const [search, setSearch] = useState('');
  const [sellerFilter, setSellerFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');

  const deferredSearch = useDeferredValue(search);
  const normalizedSearch = deferredSearch.trim().toLowerCase();

  useEffect(() => {
    let active = true;

    async function load() {
      setIsLoading(true);
      setError('');

      try {
        const nextTickets = await fetchFinanceContracts();
        if (!active) return;
        setTickets(nextTickets);
      } catch (nextError) {
        if (!active) return;
        setError(
          nextError instanceof Error
            ? nextError.message
            : 'Falha ao carregar cobrancas e contratos.',
        );
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  const pendingTickets = useMemo(
    () => tickets.filter((ticket) => ticket.status === 'pendente_financeiro'),
    [tickets],
  );

  const sellerOptions = useMemo(
    () =>
      [...new Map(
        pendingTickets
          .filter((ticket) => ticket.assignee)
          .map((ticket) => [ticket.assignee!.id, ticket.assignee!]),
      ).values()],
    [pendingTickets],
  );

  const paymentOptions = useMemo(
    () =>
      [...new Set(
        pendingTickets.map((ticket) => ticket.paymentMethod).filter(Boolean),
      )].sort(),
    [pendingTickets],
  );

  const filteredTickets = useMemo(() => {
    return pendingTickets.filter((ticket) => {
      const matchesSearch = normalizedSearch
        ? [
            ticket.code,
            ticket.company,
            ticket.cnpj || '',
            ticket.contact || '',
            sellerName(ticket),
          ]
            .join(' ')
            .toLowerCase()
            .includes(normalizedSearch)
        : true;
      const matchesSeller = sellerFilter ? ticket.assignee?.id === sellerFilter : true;
      const matchesPayment = paymentFilter ? ticket.paymentMethod === paymentFilter : true;

      return matchesSearch && matchesSeller && matchesPayment;
    });
  }, [normalizedSearch, paymentFilter, pendingTickets, sellerFilter]);

  const selectedTicket =
    tickets.find((ticket) => ticket.id === selectedTicketId) ?? null;

  const totalSetup = sumBy(pendingTickets, (ticket) => ticket.setupAmount);
  const totalRecurring = sumBy(pendingTickets, (ticket) => ticket.recurringAmount);
  const hasFilters = Boolean(search || sellerFilter || paymentFilter);

  async function confirmBilling(ticketId: string) {
    setIsSaving(ticketId);
    setError('');

    try {
      const updated = await confirmFinanceContract(ticketId);
      setTickets((current) =>
        current.map((ticket) => (ticket.id === ticketId ? updated : ticket)),
      );
      setSelectedTicketId((current) => (current === ticketId ? null : current));
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : 'Falha ao confirmar cobranca.',
      );
    } finally {
      setIsSaving(null);
    }
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <section className="mb-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-[19px] font-extrabold tracking-[-0.4px] text-[#0f172a]">
              Cobranca e Contrato
            </div>
            <div className="mt-[2px] text-[13px] text-[#64748b]">
              Tickets aguardando cobranca
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setViewMode((current) => (current === 'cards' ? 'lista' : 'cards'))
              }
              className="inline-flex items-center gap-2 self-start rounded-[10px] border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
            >
              {viewMode === 'cards' ? 'Ver lista' : 'Ver cards'}
            </button>

            <button
              type="button"
              onClick={() => downloadCsv(pendingTickets)}
              className="inline-flex items-center gap-2 self-start rounded-[10px] border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
            >
              <FileDown className="h-4 w-4" />
              Exportar
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
            {pendingTickets.length} pendente{pendingTickets.length !== 1 ? 's' : ''}
          </span>
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
            Setup: {formatMoney(totalSetup)}
          </span>
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
            Recorrencia: {formatMoney(totalRecurring)}
          </span>
        </div>
      </section>

      <section className="mb-6 rounded-[18px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px_220px_auto] xl:items-center">
          <div className="relative min-w-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar empresa, ticket, CNPJ ou contato..."
              className="w-full rounded-[10px] border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-700 outline-none transition-colors focus:border-emerald-500"
            />
          </div>

          <select
            value={sellerFilter}
            onChange={(event) => setSellerFilter(event.target.value)}
            className="rounded-[10px] border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition-colors focus:border-emerald-500"
          >
            <option value="">Todos os responsaveis</option>
            {sellerOptions.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>

          <select
            value={paymentFilter}
            onChange={(event) => setPaymentFilter(event.target.value)}
            className="rounded-[10px] border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition-colors focus:border-emerald-500"
          >
            <option value="">Todas as formas</option>
            {paymentOptions.map((paymentMethod) => (
              <option key={paymentMethod} value={paymentMethod}>
                {paymentMethod}
              </option>
            ))}
          </select>

          {hasFilters ? (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setSellerFilter('');
                setPaymentFilter('');
              }}
              className="inline-flex items-center justify-center gap-2 rounded-[10px] border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
            >
              <X className="h-4 w-4" />
              Limpar
            </button>
          ) : (
            <div className="text-right text-xs text-slate-500">
              {filteredTickets.length} resultado{filteredTickets.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </section>

      {error ? (
        <div className="mb-4 rounded-[10px] border border-[#fecaca] bg-[#fff5f5] px-4 py-3 text-[13px] text-[#b91c1c]">
          {error}
        </div>
      ) : null}

      <section className="mt-6">
        {isLoading ? (
          <div className="rounded-[24px] border border-slate-200 bg-white px-6 py-14 text-center shadow-sm text-sm text-slate-500">
            Carregando cobrancas e contratos...
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-slate-300 bg-white/80 px-6 py-14 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              {pendingTickets.length === 0 ? 'Nenhum pendente' : 'Nenhum resultado'}
            </h2>
          </div>
        ) : viewMode === 'lista' ? (
          <div className="overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                      Empresa
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                      CNPJ
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                      Plano / Pagamento
                    </th>
                    <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                      Setup
                    </th>
                    <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                      Recorrencia
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                      Responsavel
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                      Criado em
                    </th>
                    <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                      Acao
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      onClick={() => setSelectedTicketId(ticket.id)}
                      className="cursor-pointer border-t border-slate-200 transition-colors hover:bg-slate-50"
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-950">
                          {ticket.company}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {ticket.code}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {ticket.cnpj || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        <div className="font-medium text-slate-800">
                          {ticket.plan || '-'}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {ticket.paymentMethod || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">
                        {formatMoney(ticket.setupAmount)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">
                        {formatMoney(ticket.recurringAmount)}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {sellerName(ticket)}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {formatDate(ticket.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            void confirmBilling(ticket.id);
                          }}
                          disabled={isSaving === ticket.id}
                          className="inline-flex items-center gap-2 rounded-[10px] bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Cobranca Gerada
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredTickets.map((ticket) => (
              <article
                key={ticket.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedTicketId(ticket.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setSelectedTicketId(ticket.id);
                  }
                }}
                className="rounded-[18px] border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-lg font-semibold tracking-tight text-slate-950">
                      {ticket.company}
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                      CNPJ: {ticket.cnpj || '-'}
                    </div>
                  </div>

                  <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                    {statusLabel(ticket.status)}
                  </span>
                </div>

                <div className="mt-3 text-sm text-slate-500">
                  Plano:{' '}
                  <strong className="font-semibold text-slate-700">
                    {ticket.plan || '-'}
                  </strong>{' '}
                  · {ticket.paymentMethod || '-'}
                </div>

                <div className="mt-2 text-sm text-slate-600">
                  Setup:{' '}
                  <strong className="font-semibold text-slate-900">
                    {formatMoney(ticket.setupAmount)}
                  </strong>{' '}
                  · Recorrencia:{' '}
                  <strong className="font-semibold text-slate-900">
                    {formatMoney(ticket.recurringAmount)}
                  </strong>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-500">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {formatDate(ticket.createdAt)}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-500">
                    <User className="h-3.5 w-3.5" />
                    {sellerName(ticket)}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-500">
                    {ticket.code}
                  </span>
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      void confirmBilling(ticket.id);
                    }}
                    disabled={isSaving === ticket.id}
                    className="inline-flex items-center gap-2 rounded-[10px] bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Cobranca Gerada
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <ModalShell
        open={Boolean(selectedTicket)}
        title={selectedTicket ? `Ticket ${selectedTicket.code}` : 'Detalhes do ticket'}
        description="Resumo financeiro e comercial do ticket selecionado."
        maxWidthClassName="max-w-[760px]"
        onClose={() => setSelectedTicketId(null)}
        footer={
          selectedTicket ? (
            <>
              <button
                type="button"
                onClick={() => setSelectedTicketId(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
              >
                Fechar
              </button>
              {selectedTicket.status === 'pendente_financeiro' ? (
                <button
                  type="button"
                  onClick={() => void confirmBilling(selectedTicket.id)}
                  disabled={isSaving === selectedTicket.id}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Confirmar cobranca
                </button>
              ) : null}
            </>
          ) : null
        }
      >
        {selectedTicket ? (
          <div className="grid gap-6">
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Protocolo interno
                  </div>
                  <div className="mt-1 font-mono text-xl font-bold text-[#2563eb]">
                    {selectedTicket.code}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                    {statusLabel(selectedTicket.status)}
                  </span>
                  <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    {selectedTicket.plan || '-'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Empresa
                </div>
                <div className="mt-1 text-base font-semibold text-slate-950">
                  {selectedTicket.company}
                </div>
                <div className="mt-3 text-sm text-slate-500">
                  CNPJ: {selectedTicket.cnpj || '-'}
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  Contato: {selectedTicket.contact || '-'}
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  Lead vinculado: {selectedTicket.leadId ?? '-'}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Condicoes comerciais
                </div>
                <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                  <CreditCard className="h-4 w-4 text-slate-400" />
                  {selectedTicket.paymentMethod || '-'}
                </div>
                <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                  <User className="h-4 w-4 text-slate-400" />
                  {sellerName(selectedTicket)}
                </div>
                <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                  <CalendarDays className="h-4 w-4 text-slate-400" />
                  Criado em {formatDate(selectedTicket.createdAt)}
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Setup
                </div>
                <div className="mt-2 text-2xl font-bold text-slate-950">
                  {formatMoney(selectedTicket.setupAmount)}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-emerald-50 p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
                  Recorrencia
                </div>
                <div className="mt-2 text-2xl font-bold text-emerald-700">
                  {formatMoney(selectedTicket.recurringAmount)}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </ModalShell>
    </div>
  );
}
