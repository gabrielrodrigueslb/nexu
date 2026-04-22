'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
  BadgeDollarSign,
  Building2,
  CalendarDays,
  CheckCircle2,
  Copy,
  FileDown,
  Landmark,
  Search,
  User,
  Wallet,
  X,
} from 'lucide-react';

import { ModalShell } from '@/components/modal-shell';
import { formatMoney, sumBy } from '@/components/utils';

import {
  fetchIndicatorPayments,
  updateIndicatorPayment,
  type FinanceIndicatorPaymentRecord,
} from './indicator-payments-api';

function formatDate(value?: string | null) {
  if (!value) return '-';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function downloadCsv(rows: FinanceIndicatorPaymentRecord[]) {
  const header = [
    'lead',
    'ticket',
    'empresa',
    'indicador',
    'percentual_setup',
    'valor',
    'status',
    'data_vencimento',
    'data_pagamento',
    'seller',
  ];

  const body = rows.map((row) => [
    row.leadId,
    row.ticketCode || '',
    row.company,
    row.indicatorName,
    String(row.commissionPercent),
    String(row.amount),
    row.status,
    row.dueDate || '',
    row.paidAt || '',
    row.seller?.name || '',
  ]);

  const csv = [header, ...body]
    .map((line) =>
      line.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','),
    )
    .join('\n');

  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'financeiro-pagamento-indicadores.csv';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function copyToClipboard(value?: string | null) {
  if (!value) return;
  void navigator.clipboard.writeText(value);
}

export function FinanceIndicatorPayments() {
  const [items, setItems] = useState<FinanceIndicatorPaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid'>('all');
  const [indicatorFilter, setIndicatorFilter] = useState('');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setIsLoading(true);
      setError('');

      try {
        const nextItems = await fetchIndicatorPayments();
        if (!active) return;
        setItems(nextItems);
      } catch (nextError) {
        if (!active) return;
        setError(
          nextError instanceof Error
            ? nextError.message
            : 'Falha ao carregar pagamentos de indicadores.',
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

  const deferredSearch = useDeferredValue(search);
  const normalizedSearch = deferredSearch.trim().toLowerCase();

  const indicatorOptions = useMemo(
    () =>
      [...new Map(items.map((item) => [item.indicatorId, item.indicatorName])).entries()].map(
        ([id, name]) => ({ id, name }),
      ),
    [items],
  );

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        const matchesStatus = statusFilter === 'all' ? true : item.status === statusFilter;
        const matchesIndicator = indicatorFilter ? item.indicatorId === indicatorFilter : true;
        const matchesSearch = normalizedSearch
          ? [
              item.company,
              item.ticketCode || '',
              item.indicatorName,
              item.seller?.name || '',
            ]
              .join(' ')
              .toLowerCase()
              .includes(normalizedSearch)
          : true;

        return matchesStatus && matchesIndicator && matchesSearch;
      }),
    [indicatorFilter, items, normalizedSearch, statusFilter],
  );

  const selectedItem = items.find((item) => item.leadId === selectedLeadId) ?? null;
  const pendingItems = items.filter((item) => item.status === 'pending');
  const paidItems = items.filter((item) => item.status === 'paid');
  const totalAmount = sumBy(items, (item) => item.amount);
  const pendingAmount = sumBy(pendingItems, (item) => item.amount);
  const paidAmount = sumBy(paidItems, (item) => item.amount);
  const hasFilters = Boolean(search || indicatorFilter || statusFilter !== 'all');

  async function handleUpdateStatus(item: FinanceIndicatorPaymentRecord, status: 'pending' | 'paid') {
    setIsSaving(item.leadId);
    setError('');

    try {
      await updateIndicatorPayment(item.leadId, {
        status,
        dueDate: item.dueDate || item.wonAt || null,
        notes: item.notes || null,
      });

      const nextItems = await fetchIndicatorPayments();
      setItems(nextItems);

      if (selectedLeadId === item.leadId) {
        setSelectedLeadId(item.leadId);
      }
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : 'Falha ao atualizar pagamento do indicador.',
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
              Pagamento de Indicadores
            </div>
            <div className="mt-[2px] text-[13px] text-[#64748b]">
              Comissão de leads ganhos calculada sobre o setup fechado
            </div>
          </div>

          <button
            type="button"
            onClick={() => downloadCsv(filteredItems)}
            className="inline-flex items-center gap-2 self-start rounded-[10px] border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            <FileDown className="h-4 w-4" />
            Exportar
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[18px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Total Previsto
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-950">{formatMoney(totalAmount)}</div>
            <div className="mt-1 text-xs text-slate-500">{items.length} pagamento(s)</div>
          </div>
          <div className="rounded-[18px] border border-amber-200 bg-amber-50 p-4 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">
              Pendente
            </div>
            <div className="mt-2 text-2xl font-bold text-amber-700">{formatMoney(pendingAmount)}</div>
            <div className="mt-1 text-xs text-amber-700">{pendingItems.length} aguardando pagamento</div>
          </div>
          <div className="rounded-[18px] border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">
              Pago
            </div>
            <div className="mt-2 text-2xl font-bold text-emerald-700">{formatMoney(paidAmount)}</div>
            <div className="mt-1 text-xs text-emerald-700">{paidItems.length} pagamento(s) concluídos</div>
          </div>
          <div className="rounded-[18px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Ticket Setup
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-950">
              {formatMoney(sumBy(items, (item) => item.setupAmount))}
            </div>
            <div className="mt-1 text-xs text-slate-500">base total usada no cálculo</div>
          </div>
        </div>
      </section>

      <section className="mb-6 rounded-[18px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px_220px_auto] xl:items-center">
          <div className="relative min-w-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar empresa, ticket, indicador ou vendedor..."
              className="w-full rounded-[10px] border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-700 outline-none transition-colors focus:border-emerald-500"
            />
          </div>

          <select
            value={indicatorFilter}
            onChange={(event) => setIndicatorFilter(event.target.value)}
            className="rounded-[10px] border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition-colors focus:border-emerald-500"
          >
            <option value="">Todos os indicadores</option>
            {indicatorOptions.map((indicator) => (
              <option key={indicator.id} value={indicator.id}>
                {indicator.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as 'all' | 'pending' | 'paid')}
            className="rounded-[10px] border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition-colors focus:border-emerald-500"
          >
            <option value="all">Todos os status</option>
            <option value="pending">Pendentes</option>
            <option value="paid">Pagos</option>
          </select>

          {hasFilters ? (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setIndicatorFilter('');
                setStatusFilter('all');
              }}
              className="inline-flex items-center justify-center gap-2 rounded-[10px] border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
            >
              <X className="h-4 w-4" />
              Limpar
            </button>
          ) : (
            <div className="text-right text-xs text-slate-500">
              {filteredItems.length} resultado{filteredItems.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </section>

      {error ? (
        <div className="mb-4 rounded-[10px] border border-[#fecaca] bg-[#fff5f5] px-4 py-3 text-[13px] text-[#b91c1c]">
          {error}
        </div>
      ) : null}

      <section>
        {isLoading ? (
          <div className="rounded-[24px] border border-slate-200 bg-white px-6 py-14 text-center shadow-sm text-sm text-slate-500">
            Carregando pagamentos de indicadores...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-slate-300 bg-white/80 px-6 py-14 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <BadgeDollarSign className="h-7 w-7" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              {items.length === 0 ? 'Nenhum pagamento elegível' : 'Nenhum resultado'}
            </h2>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">Empresa</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">Indicador</th>
                    <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">Setup</th>
                    <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">Comissão</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">Vencimento</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">Status</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">Vendedor</th>
                    <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr
                      key={item.leadId}
                      onClick={() => setSelectedLeadId(item.leadId)}
                      className="cursor-pointer border-t border-slate-200 transition-colors hover:bg-slate-50"
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-950">{item.company}</div>
                        <div className="mt-1 text-xs text-slate-500">
                          {item.ticketCode || item.leadId}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        <div className="font-medium">{item.indicatorName}</div>
                        <div className="mt-1 text-xs text-slate-500">
                          {item.commissionPercent}% sobre setup
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">
                        {formatMoney(item.setupAmount)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-emerald-700">
                        {formatMoney(item.amount)}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {formatDate(item.dueDate || item.wonAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            item.status === 'paid'
                              ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border border-amber-200 bg-amber-50 text-amber-700'
                          }`}
                        >
                          {item.status === 'paid' ? 'Pago' : 'Pendente'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {item.seller?.name || '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleUpdateStatus(
                              item,
                              item.status === 'paid' ? 'pending' : 'paid',
                            );
                          }}
                          disabled={isSaving === item.leadId}
                          className={`inline-flex items-center gap-2 rounded-[10px] px-3 py-2 text-xs font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                            item.status === 'paid'
                              ? 'bg-slate-600 hover:bg-slate-700'
                              : 'bg-emerald-600 hover:bg-emerald-700'
                          }`}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {item.status === 'paid' ? 'Reabrir' : 'Marcar pago'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <ModalShell
        open={Boolean(selectedItem)}
        title={selectedItem ? `Pagamento ${selectedItem.ticketCode || selectedItem.leadId}` : 'Pagamento de indicador'}
        description="Resumo do lead, comissão calculada e dados de pagamento do indicador."
        maxWidthClassName="max-w-[820px]"
        onClose={() => setSelectedLeadId(null)}
        footer={
          selectedItem ? (
            <>
              <button
                type="button"
                onClick={() => setSelectedLeadId(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => void handleUpdateStatus(selectedItem, selectedItem.status === 'paid' ? 'pending' : 'paid')}
                disabled={isSaving === selectedItem.leadId}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                  selectedItem.status === 'paid'
                    ? 'bg-slate-600 hover:bg-slate-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                <CheckCircle2 className="h-4 w-4" />
                {selectedItem.status === 'paid' ? 'Marcar pendente' : 'Confirmar pagamento'}
              </button>
            </>
          ) : null
        }
      >
        {selectedItem ? (
          <div className="grid gap-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Lead / Empresa
                </div>
                <div className="mt-3 flex items-center gap-2 text-sm text-slate-700">
                  <Building2 className="h-4 w-4 text-slate-400" />
                  {selectedItem.company}
                </div>
                <div className="mt-2 flex items-center gap-2 text-sm text-slate-700">
                  <CalendarDays className="h-4 w-4 text-slate-400" />
                  Ganho em {formatDate(selectedItem.wonAt)}
                </div>
                <div className="mt-2 flex items-center gap-2 text-sm text-slate-700">
                  <User className="h-4 w-4 text-slate-400" />
                  {selectedItem.seller?.name || 'Sem vendedor'}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Comissão
                </div>
                <div className="mt-3 flex items-center gap-2 text-sm text-slate-700">
                  <Wallet className="h-4 w-4 text-slate-400" />
                  Setup base: {formatMoney(selectedItem.setupAmount)}
                </div>
                <div className="mt-2 flex items-center gap-2 text-sm text-slate-700">
                  <BadgeDollarSign className="h-4 w-4 text-slate-400" />
                  {selectedItem.commissionPercent}% = {formatMoney(selectedItem.amount)}
                </div>
                <div className="mt-2 flex items-center gap-2 text-sm text-slate-700">
                  <CalendarDays className="h-4 w-4 text-slate-400" />
                  Vencimento: {formatDate(selectedItem.dueDate || selectedItem.wonAt)}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                Dados do Indicador
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="text-sm text-slate-700">
                  <strong className="text-slate-950">{selectedItem.indicator.name}</strong>
                  <div className="mt-1 text-slate-500">
                    {selectedItem.indicator.docType}: {selectedItem.indicator.docNumber || '-'}
                  </div>
                  <div className="mt-1 text-slate-500">
                    Contato: {selectedItem.indicator.contact || '-'}
                  </div>
                  <div className="mt-1 text-slate-500">
                    E-mail: {selectedItem.indicator.email || '-'}
                  </div>
                </div>
                <div className="text-sm text-slate-700">
                  <div className="mt-1 flex items-center gap-2">
                    <Landmark className="h-4 w-4 text-slate-400" />
                    Banco: {selectedItem.indicator.bank || '-'}
                  </div>
                  <div className="mt-1 text-slate-500">
                    Agência: {selectedItem.indicator.agency || '-'}
                  </div>
                  <div className="mt-1 text-slate-500">
                    Conta: {selectedItem.indicator.account || '-'}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="font-medium text-slate-950">PIX:</span>
                    <span className="text-slate-600">{selectedItem.indicator.pixKey || '-'}</span>
                    {selectedItem.indicator.pixKey ? (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(selectedItem.indicator.pixKey)}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                      >
                        <Copy className="h-3 w-3" />
                        Copiar
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                Status Financeiro
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    selectedItem.status === 'paid'
                      ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border border-amber-200 bg-amber-50 text-amber-700'
                  }`}
                >
                  {selectedItem.status === 'paid' ? 'Pago' : 'Pendente'}
                </span>
                <span className="text-sm text-slate-500">
                  Pago em: {formatDate(selectedItem.paidAt)}
                </span>
                <span className="text-sm text-slate-500">
                  Baixado por: {selectedItem.paidBy?.name || '-'}
                </span>
              </div>
            </div>
          </div>
        ) : null}
      </ModalShell>
    </div>
  );
}
