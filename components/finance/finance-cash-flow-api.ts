import { apiRequest } from '@/lib/api-client';

type CashFlowAccount = {
  nome: string;
  saldoInicial: number | null;
  chequeEspecial: number | null;
  saldoFinal: number | null;
};

type CashFlowDay = {
  data: string;
  semana: string;
  receita: number;
  despesa: number;
  saldoDiario: number | null;
};

type InadimplenciaBucket = {
  label: string;
  valor: number;
  pct: number;
};

type CashFlowSummary = {
  referencia: string | null;
  contas: CashFlowAccount[];
  saldoInicial: number;
  totalDespesas: number;
  subTotal1: number;
  chequeEspecialTotal: number;
  saldoFinalGeral: number;
  aplicacao: number;
  dias: CashFlowDay[];
  inadimplencia: {
    buckets: InadimplenciaBucket[];
    total: number;
    receitaRecorrente: number;
    pctRecorrente: number;
  };
  fluxoRealizado: {
    receita: number;
    despesa: number;
  };
  fluxoPendente: {
    receita: number;
    despesa: number;
  };
  saldoBancos: number;
  _computed?: boolean;
};

type LedgerExpenseRow = {
  fornecedor: string;
  vencimento: string;
  _vencRaw: string | null;
  situacao: string;
  valor: number;
  emAberto: number;
  pago: number;
  categoria: string;
  centroCusto: string;
  conta: string;
};

type LedgerRevenueRow = {
  cliente: string;
  vencimento: string;
  _vencRaw: string | null;
  situacao: string;
  valor: number;
  emAberto: number;
  recebido: number;
  categoria: string;
  centroCusto: string;
  conta: string;
  obs: string;
};

export type FinanceCashFlowPayload = {
  caixa: CashFlowSummary | null;
  despesas: LedgerExpenseRow[];
  receitas: LedgerRevenueRow[];
  atrasadas: LedgerRevenueRow[];
  importedAt: string | null;
};

export async function fetchFinanceCashFlow() {
  const payload = (await apiRequest('/api/backend/finance/cash-flow')) as {
    item: FinanceCashFlowPayload;
  };

  return payload.item;
}

export async function saveFinanceCashFlow(input: FinanceCashFlowPayload) {
  const payload = (await apiRequest('/api/backend/finance/cash-flow', {
    method: 'PUT',
    body: JSON.stringify(input),
  })) as {
    item: FinanceCashFlowPayload;
  };

  return payload.item;
}

export async function clearFinanceCashFlow() {
  await apiRequest('/api/backend/finance/cash-flow', {
    method: 'DELETE',
  });
}
