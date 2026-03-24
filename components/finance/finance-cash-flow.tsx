'use client';

import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type ReactNode,
} from 'react';
import {
  AlertTriangle,
  CalendarDays,
  Check,
  CircleDollarSign,
  FileSpreadsheet,
  Landmark,
  Trash2,
  Upload,
  Wallet,
  X,
} from 'lucide-react';

import { formatMoney } from '@/components/utils';

const STORAGE_KEY = 'nx_fluxo_importado';

type FlowTab = 'caixa' | 'despesas' | 'receitas' | 'atrasadas';
type GroupBy = '' | 'cc' | 'conta';
type NoticeTone = 'success' | 'error';

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

type LedgerRow = LedgerExpenseRow | LedgerRevenueRow;

type SavedFlowData = {
  caixa: CashFlowSummary | null;
  despesas: LedgerExpenseRow[];
  receitas: LedgerRevenueRow[];
  atrasadas: LedgerRevenueRow[];
  importedAt: string | null;
  mode?: 'mock' | 'imported' | null;
};

type Notice = {
  tone: NoticeTone;
  text: string;
};

const EMPTY_FLOW_DATA: SavedFlowData = {
  caixa: null,
  despesas: [],
  receitas: [],
  atrasadas: [],
  importedAt: null,
  mode: null,
};

const FLOW_TABS: Array<{ key: FlowTab; label: string }> = [
  { key: 'caixa', label: 'Fluxo de Caixa' },
  { key: 'despesas', label: 'Despesas' },
  { key: 'receitas', label: 'Receitas' },
  { key: 'atrasadas', label: 'Rec. Atrasadas' },
];

const PAGE_HEADER_TITLE = 'Fluxo de Caixa';
const PAGE_HEADER_SUBTITLE =
  'Visao financeira de caixa, despesas, receitas e inadimplencia';

const GROUP_OPTIONS: Array<{ value: GroupBy; label: string }> = [
  { value: '', label: 'Sem agrupamento' },
  { value: 'cc', label: 'Por Centro de Custo' },
  { value: 'conta', label: 'Por Conta' },
];

function createMockFlowData(): SavedFlowData {
  const despesas: LedgerExpenseRow[] = [
    {
      fornecedor: 'Amazon AWS',
      vencimento: '18/03/2026',
      _vencRaw: '2026-03-18',
      situacao: 'Pendente',
      valor: 2480,
      emAberto: 2480,
      pago: 0,
      categoria: 'Infraestrutura',
      centroCusto: 'Tecnologia',
      conta: 'Banco Inter',
    },
    {
      fornecedor: 'RD Station',
      vencimento: '19/03/2026',
      _vencRaw: '2026-03-19',
      situacao: 'Quitado',
      valor: 890,
      emAberto: 0,
      pago: 890,
      categoria: 'Marketing',
      centroCusto: 'Comercial',
      conta: 'Banco Inter',
    },
    {
      fornecedor: 'Contabilidade Prime',
      vencimento: '22/03/2026',
      _vencRaw: '2026-03-22',
      situacao: 'Pendente',
      valor: 1350,
      emAberto: 1350,
      pago: 0,
      categoria: 'Administrativo',
      centroCusto: 'Financeiro',
      conta: 'Caixa Operacional',
    },
    {
      fornecedor: 'Google Workspace',
      vencimento: '24/03/2026',
      _vencRaw: '2026-03-24',
      situacao: 'Pendente',
      valor: 620,
      emAberto: 620,
      pago: 0,
      categoria: 'Assinaturas',
      centroCusto: 'Tecnologia',
      conta: 'Caixa Operacional',
    },
  ];

  const receitas: LedgerRevenueRow[] = [
    {
      cliente: 'Atlas Energia',
      vencimento: '18/03/2026',
      _vencRaw: '2026-03-18',
      situacao: 'Recebido',
      valor: 4200,
      emAberto: 0,
      recebido: 4200,
      categoria: 'Mensalidade',
      centroCusto: 'SaaS',
      conta: 'Banco Inter',
      obs: '',
    },
    {
      cliente: 'ValeNet',
      vencimento: '20/03/2026',
      _vencRaw: '2026-03-20',
      situacao: 'Pendente',
      valor: 6800,
      emAberto: 6800,
      recebido: 0,
      categoria: 'Setup',
      centroCusto: 'Implantacao',
      conta: 'Caixa Operacional',
      obs: '',
    },
    {
      cliente: 'Orbit Telecom',
      vencimento: '23/03/2026',
      _vencRaw: '2026-03-23',
      situacao: 'Parcial',
      valor: 5200,
      emAberto: 1700,
      recebido: 3500,
      categoria: 'Mensalidade',
      centroCusto: 'SaaS',
      conta: 'Banco Inter',
      obs: '',
    },
    {
      cliente: 'Nova Clin',
      vencimento: '26/03/2026',
      _vencRaw: '2026-03-26',
      situacao: 'Pendente',
      valor: 3150,
      emAberto: 3150,
      recebido: 0,
      categoria: 'Mensalidade',
      centroCusto: 'SaaS',
      conta: 'Caixa Operacional',
      obs: '',
    },
  ];

  const atrasadas: LedgerRevenueRow[] = [
    {
      cliente: 'Urban Food',
      vencimento: '08/03/2026',
      _vencRaw: '2026-03-08',
      situacao: 'Atrasado',
      valor: 2400,
      emAberto: 2400,
      recebido: 0,
      categoria: 'Mensalidade',
      centroCusto: 'SaaS',
      conta: 'Banco Inter',
      obs: 'Renegociacao em andamento',
    },
    {
      cliente: 'Aster Labs',
      vencimento: '12/03/2026',
      _vencRaw: '2026-03-12',
      situacao: 'Atrasado',
      valor: 1850,
      emAberto: 1850,
      recebido: 0,
      categoria: 'Mensalidade',
      centroCusto: 'SaaS',
      conta: 'Caixa Operacional',
      obs: 'Contato financeiro pendente',
    },
    {
      cliente: 'Prisma Log',
      vencimento: '16/03/2026',
      _vencRaw: '2026-03-16',
      situacao: 'Atrasado',
      valor: 2980,
      emAberto: 2980,
      recebido: 0,
      categoria: 'Mensalidade',
      centroCusto: 'SaaS',
      conta: 'Banco Inter',
      obs: 'Boleto reenviado',
    },
  ];

  const caixa: CashFlowSummary = {
    referencia: '2026-03-18',
    contas: [
      {
        nome: 'Banco Inter',
        saldoInicial: 18250,
        chequeEspecial: 5000,
        saldoFinal: 24610,
      },
      {
        nome: 'Caixa Operacional',
        saldoInicial: 9640,
        chequeEspecial: 2500,
        saldoFinal: 11780,
      },
      {
        nome: 'Aplicacao CDI',
        saldoInicial: 38000,
        chequeEspecial: 0,
        saldoFinal: 38000,
      },
    ],
    saldoInicial: 27890,
    totalDespesas: 5340,
    subTotal1: 16240,
    chequeEspecialTotal: 7500,
    saldoFinalGeral: 38890,
    aplicacao: 38000,
    dias: [
      { data: '2026-03-18', semana: 'quarta-feira', receita: 4200, despesa: 2480, saldoDiario: 1720 },
      { data: '2026-03-19', semana: 'quinta-feira', receita: 0, despesa: 890, saldoDiario: 830 },
      { data: '2026-03-20', semana: 'sexta-feira', receita: 6800, despesa: 0, saldoDiario: 7630 },
      { data: '2026-03-21', semana: 'sábado', receita: 0, despesa: 0, saldoDiario: 7630 },
      { data: '2026-03-22', semana: 'domingo', receita: 0, despesa: 1350, saldoDiario: 6280 },
      { data: '2026-03-23', semana: 'segunda-feira', receita: 3500, despesa: 0, saldoDiario: 9780 },
      { data: '2026-03-24', semana: 'terça-feira', receita: 0, despesa: 620, saldoDiario: 9160 },
      { data: '2026-03-25', semana: 'quarta-feira', receita: 0, despesa: 0, saldoDiario: 9160 },
      { data: '2026-03-26', semana: 'quinta-feira', receita: 3150, despesa: 0, saldoDiario: 12310 },
    ],
    inadimplencia: {
      buckets: [
        { label: 'De 01 a 03 Dias', valor: 1850, pct: 0.2566 },
        { label: 'De 04 a 06 Dias', valor: 2980, pct: 0.4133 },
        { label: 'Acima de 30 Dias', valor: 2400, pct: 0.3331 },
      ],
      total: 7230,
      receitaRecorrente: 18150,
      pctRecorrente: 0.3983,
    },
    fluxoRealizado: {
      receita: 7700,
      despesa: 890,
    },
    fluxoPendente: {
      receita: 11650,
      despesa: 4450,
    },
    saldoBancos: 24610,
  };

  return {
    caixa,
    despesas,
    receitas,
    atrasadas,
    importedAt: null,
    mode: 'mock',
  };
}

function parseNumber(value: unknown) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value !== 'string') {
    return 0;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return 0;
  }

  const normalized = trimmed
    .replace(/R\$\s?/g, '')
    .replace(/\s/g, '')
    .replace(/\.(?=\d{3}(?:\D|$))/g, '')
    .replace(',', '.');

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizePercent(value: number) {
  return value > 1 ? value / 100 : value;
}

function normalizeText(value: unknown) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function excelSerialToDate(value: number) {
  const utcDays = Math.floor(value - 25569);
  const utcValue = utcDays * 86400;
  return new Date(utcValue * 1000);
}

function coerceDate(value: unknown) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'number' && value > 1000 && value < 100000) {
    const excelDate = excelSerialToDate(value);
    return Number.isNaN(excelDate.getTime()) ? null : excelDate;
  }

  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateLabel(value: string | null | undefined) {
  if (!value) {
    return '—';
  }

  const date = coerceDate(value);
  if (!date) {
    return String(value);
  }

  return date.toLocaleDateString('pt-BR');
}

function formatCompactMoney(value: number) {
  const amount = Math.abs(value);
  if (amount >= 1_000_000) {
    return `${(value / 1_000_000).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}M`;
  }

  if (amount >= 1000) {
    return `${(value / 1000).toLocaleString('pt-BR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })}k`;
  }

  return formatMoney(value);
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function loadSavedFlowData(): SavedFlowData {
  if (typeof window === 'undefined') {
    return EMPTY_FLOW_DATA;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return EMPTY_FLOW_DATA;
    }

    const parsed = JSON.parse(raw) as Partial<SavedFlowData>;

    if (parsed.mode === 'mock') {
      return EMPTY_FLOW_DATA;
    }

    const normalized: SavedFlowData = {
      caixa: parsed.caixa ?? null,
      despesas: Array.isArray(parsed.despesas) ? parsed.despesas : [],
      receitas: Array.isArray(parsed.receitas) ? parsed.receitas : [],
      atrasadas: Array.isArray(parsed.atrasadas) ? parsed.atrasadas : [],
      importedAt:
        typeof parsed.importedAt === 'string' ? parsed.importedAt : null,
      mode: parsed.mode === 'imported' ? parsed.mode : null,
    };

    if (
      !normalized.caixa &&
      normalized.despesas.length === 0 &&
      normalized.receitas.length === 0 &&
      normalized.atrasadas.length === 0
    ) {
      return EMPTY_FLOW_DATA;
    }

    return normalized;
  } catch {
    return EMPTY_FLOW_DATA;
  }
}

function saveFlowData(data: SavedFlowData) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function isExpenseRow(row: LedgerRow): row is LedgerExpenseRow {
  return 'fornecedor' in row;
}

function matchesDateRange(
  value: string | null | undefined,
  from: string,
  to: string,
) {
  if (!value) {
    return true;
  }

  const current = coerceDate(value);
  if (!current) {
    return true;
  }

  if (from) {
    const fromDate = coerceDate(from);
    if (fromDate && current < fromDate) {
      return false;
    }
  }

  if (to) {
    const toDate = coerceDate(`${to}T23:59:59`);
    if (toDate && current > toDate) {
      return false;
    }
  }

  return true;
}

function computeCaixaFromImports(
  despesas: LedgerExpenseRow[],
  receitas: LedgerRevenueRow[],
  atrasadas: LedgerRevenueRow[],
): CashFlowSummary {
  const weekdays = [
    'domingo',
    'segunda-feira',
    'terca-feira',
    'quarta-feira',
    'quinta-feira',
    'sexta-feira',
    'sabado',
  ];

  const dateMap = new Map<string, CashFlowDay>();

  const ensureDay = (date: Date) => {
    const key = toDateKey(date);

    if (!dateMap.has(key)) {
      dateMap.set(key, {
        data: key,
        semana: weekdays[date.getDay()],
        receita: 0,
        despesa: 0,
        saldoDiario: 0,
      });
    }

    return dateMap.get(key)!;
  };

  for (const row of receitas) {
    const date = coerceDate(row._vencRaw ?? row.vencimento);
    if (!date) continue;
    ensureDay(date).receita += parseNumber(row.valor);
  }

  for (const row of atrasadas) {
    const date = coerceDate(row._vencRaw ?? row.vencimento);
    if (!date) continue;
    ensureDay(date).receita += parseNumber(row.valor);
  }

  for (const row of despesas) {
    const date = coerceDate(row._vencRaw ?? row.vencimento);
    if (!date) continue;
    ensureDay(date).despesa += parseNumber(row.valor);
  }

  const dias = [...dateMap.values()].sort((left, right) =>
    left.data.localeCompare(right.data),
  );

  let saldoAcumulado = 0;
  for (const dia of dias) {
    saldoAcumulado += dia.receita - dia.despesa;
    dia.saldoDiario = saldoAcumulado;
  }

  const totalReceitas = receitas.reduce((sum, row) => sum + parseNumber(row.valor), 0);
  const totalAtrasadas = atrasadas.reduce((sum, row) => sum + parseNumber(row.valor), 0);
  const totalDespesas = despesas.reduce((sum, row) => sum + parseNumber(row.valor), 0);

  return {
    referencia: dias[0]?.data ?? toDateKey(new Date()),
    contas: [],
    saldoInicial: 0,
    totalDespesas,
    subTotal1: totalReceitas + totalAtrasadas - totalDespesas,
    chequeEspecialTotal: 0,
    saldoFinalGeral: totalReceitas + totalAtrasadas - totalDespesas,
    aplicacao: 0,
    dias,
    inadimplencia: {
      buckets: [],
      total: totalAtrasadas,
      receitaRecorrente: atrasadas.reduce(
        (sum, row) => sum + parseNumber(row.valor),
        0,
      ),
      pctRecorrente: 0,
    },
    fluxoRealizado: {
      receita: receitas.reduce((sum, row) => sum + parseNumber(row.recebido), 0),
      despesa: despesas.reduce((sum, row) => sum + parseNumber(row.pago), 0),
    },
    fluxoPendente: {
      receita: receitas.reduce((sum, row) => sum + parseNumber(row.emAberto), 0),
      despesa: despesas.reduce((sum, row) => sum + parseNumber(row.emAberto), 0),
    },
    saldoBancos: 0,
    _computed: true,
  };
}

async function parseFluxoSheet(
  file: File,
  sheetType: FlowTab,
): Promise<CashFlowSummary | LedgerExpenseRow[] | LedgerRevenueRow[]> {
  const XLSX = await import('xlsx');
  const workbook = XLSX.read(await file.arrayBuffer(), {
    type: 'array',
    cellDates: true,
  });

  if (sheetType === 'caixa') {
    const sheetName =
      workbook.SheetNames.find((name) =>
        normalizeText(name).includes('fluxo'),
      ) ?? workbook.SheetNames[0];

    const raw = XLSX.utils.sheet_to_json<Array<string | number | Date | null>>(
      workbook.Sheets[sheetName],
      { header: 1, defval: null },
    );

    const findRow = (
      predicate: (row: Array<string | number | Date | null>) => boolean,
    ) => raw.find((row) => Array.isArray(row) && predicate(row));

    const findValue = (label: string, columnIndex = 7) =>
      parseNumber(
        findRow((row) => normalizeText(row[0]) === normalizeText(label))?.[
          columnIndex
        ] ??
          findRow((row) => normalizeText(row[0]) === normalizeText(label))?.[1] ??
          0,
      );

    const headerIndex = raw.findIndex((row) =>
      row?.some((cell) => normalizeText(cell).includes('data')),
    );

    const headerRow = raw[1] ?? [];
    const contaNames = headerRow
      .slice(1, 8)
      .map((cell) => String(cell ?? '').trim())
      .filter(Boolean);

    const saldoInicialRow =
      findRow((row) => normalizeText(row[0]).includes('saldo inicial')) ?? [];
    const chequeEspecialRow =
      findRow((row) => normalizeText(row[0]).includes('cheque especial')) ?? [];
    const saldoFinalRow =
      findRow((row) => normalizeText(row[0]).includes('saldo final')) ?? [];

    const contas: CashFlowAccount[] = contaNames.map((nome, index) => ({
      nome,
      saldoInicial:
        saldoInicialRow[index + 1] != null
          ? parseNumber(saldoInicialRow[index + 1])
          : null,
      chequeEspecial:
        chequeEspecialRow[index + 1] != null
          ? parseNumber(chequeEspecialRow[index + 1])
          : null,
      saldoFinal:
        saldoFinalRow[index + 1] != null
          ? parseNumber(saldoFinalRow[index + 1])
          : null,
    }));

    const dias: CashFlowDay[] = [];
    if (headerIndex >= 0) {
      for (let index = headerIndex + 1; index < raw.length; index += 1) {
        const row = raw[index];
        if (!row || row.every((cell) => cell == null || cell === '')) {
          continue;
        }

        const date = coerceDate(row[0]);
        if (!date) {
          continue;
        }

        dias.push({
          data: toDateKey(date),
          semana: String(row[1] ?? '').trim(),
          receita: parseNumber(row[2]),
          despesa: parseNumber(row[3]),
          saldoDiario: row[4] != null ? parseNumber(row[4]) : null,
        });

        if (dias.length >= 60) {
          break;
        }
      }
    }

    const inadLabels = [
      'De 01 a 03 Dias',
      'De 04 a 06 Dias',
      'De 07 a 14 Dias',
      'De 15 a 30 Dias',
      'Acima de 30 Dias',
    ];

    const inadBuckets: InadimplenciaBucket[] = [];
    let currentBucket: InadimplenciaBucket | null = null;

    for (const row of raw) {
      const label = String(row?.[6] ?? '').trim();
      if (!label) {
        continue;
      }

      if (inadLabels.some((item) => normalizeText(item) === normalizeText(label))) {
        currentBucket = { label, valor: 0, pct: 0 };
        inadBuckets.push(currentBucket);
        continue;
      }

      if (!currentBucket) {
        continue;
      }

      const bucketValue = parseNumber(row?.[7]);
      const bucketPct = normalizePercent(parseNumber(row?.[8]));

      if (bucketValue || bucketPct) {
        currentBucket.valor += bucketValue;
        currentBucket.pct += bucketPct;
      }
    }

    const saldoBancosIndex = raw.findIndex((row) =>
      normalizeText(row?.[0]).includes('saldo bancos'),
    );
    const saldoBancosRow = saldoBancosIndex >= 0 ? raw[saldoBancosIndex] : [];
    const saldoBancosValueRow =
      saldoBancosIndex >= 0 ? raw[saldoBancosIndex + 1] ?? [] : [];
    const fluxoRealizadoRow =
      findRow((row) => normalizeText(row[0]).includes('fluxo realizado')) ?? [];
    const fluxoPendenteRow =
      findRow((row) => normalizeText(row[0]).includes('fluxo pendente')) ?? [];
    const aplicacaoRow =
      findRow((row) => normalizeText(row[0]).includes('aplicacao')) ?? [];
    const referencia = coerceDate(raw[0]?.[1]);

    return {
      referencia: referencia ? toDateKey(referencia) : null,
      contas,
      saldoInicial: parseNumber(saldoInicialRow[7]),
      totalDespesas: Math.abs(findValue('TOTAL DESPESAS')),
      subTotal1: findValue('SUB TOTAL 1'),
      chequeEspecialTotal: findValue('CHEQUE ESPECIAL'),
      saldoFinalGeral: parseNumber(saldoFinalRow[7]),
      aplicacao: Math.abs(parseNumber(aplicacaoRow[1])),
      dias,
      inadimplencia: {
        buckets: inadBuckets,
        total: findValue('TOTAL'),
        receitaRecorrente: findValue('Receita Recorrente'),
        pctRecorrente: normalizePercent(findValue('Recorrencia')),
      },
      fluxoRealizado: {
        receita: parseNumber(fluxoRealizadoRow[2]),
        despesa: Math.abs(parseNumber(fluxoRealizadoRow[3])),
      },
      fluxoPendente: {
        receita: parseNumber(fluxoPendenteRow[2]),
        despesa: Math.abs(parseNumber(fluxoPendenteRow[3])),
      },
      saldoBancos:
        parseNumber(saldoBancosValueRow[0]) || parseNumber(saldoBancosRow?.[3]),
    };
  }

  const candidateNames =
    sheetType === 'despesas'
      ? ['Despesas']
      : sheetType === 'receitas'
        ? ['Receita']
        : ['Receita Atrasadas', 'Receitas Atrasadas'];

  const sheetName =
    workbook.SheetNames.find((name) =>
      candidateNames.some(
        (candidate) => normalizeText(candidate) === normalizeText(name),
      ),
    ) ?? workbook.SheetNames[0];

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
    workbook.Sheets[sheetName],
    { defval: '' },
  );

  const columnValue = (row: Record<string, unknown>, names: string[]) => {
    const match = Object.keys(row).find((key) =>
      names.some((name) => normalizeText(name) === normalizeText(key)),
    );
    return match ? row[match] : undefined;
  };

  if (sheetType === 'despesas') {
    return rows
      .filter((row) => columnValue(row, ['Nome do fornecedor']))
      .map((row) => {
        const rawDate = columnValue(row, ['Data de vencimento']);
        const parsedDate = coerceDate(rawDate);

        return {
          fornecedor: String(columnValue(row, ['Nome do fornecedor']) ?? '').trim(),
          vencimento: parsedDate
            ? parsedDate.toLocaleDateString('pt-BR')
            : String(rawDate ?? ''),
          _vencRaw: parsedDate ? toDateKey(parsedDate) : null,
          situacao: String(columnValue(row, ['Situação', 'Situacao']) ?? '').trim(),
          valor: parseNumber(columnValue(row, ['Valor original da parcela (R$)'])),
          emAberto: parseNumber(
            columnValue(row, ['Valor da parcela em aberto (R$)']),
          ),
          pago: parseNumber(columnValue(row, ['Valor pago da parcela (R$)'])),
          categoria: String(columnValue(row, ['Categoria 1']) ?? '').trim(),
          centroCusto: String(columnValue(row, ['Centro de Custo 1']) ?? '').trim(),
          conta: String(columnValue(row, ['Conta bancária']) ?? '').trim(),
        };
      });
  }

  return rows
    .filter((row) => columnValue(row, ['Nome do cliente']))
    .map((row) => {
      const rawDate = columnValue(row, ['Data de vencimento']);
      const parsedDate = coerceDate(rawDate);

      return {
        cliente: String(columnValue(row, ['Nome do cliente']) ?? '').trim(),
        vencimento: parsedDate
          ? parsedDate.toLocaleDateString('pt-BR')
          : String(rawDate ?? ''),
        _vencRaw: parsedDate ? toDateKey(parsedDate) : null,
        situacao: String(columnValue(row, ['Situação', 'Situacao']) ?? '').trim(),
        valor: parseNumber(columnValue(row, ['Valor original da parcela (R$)'])),
        emAberto: parseNumber(
          columnValue(row, [
            'Valor da parcela em aberto (R$)',
            'Valor total da parcela em aberto (R$)',
          ]),
        ),
        recebido: parseNumber(
          columnValue(row, ['Valor recebido da parcela (R$)']),
        ),
        categoria: String(columnValue(row, ['Categoria 1']) ?? '').trim(),
        centroCusto: String(columnValue(row, ['Centro de Custo 1']) ?? '').trim(),
        conta: String(columnValue(row, ['Conta bancária']) ?? '').trim(),
        obs: String(columnValue(row, ['Observações', 'Observacoes']) ?? '').trim(),
      };
    });
}

function toneClasses(tone: NoticeTone) {
  if (tone === 'success') {
    return 'border-[#a7f3d0] bg-[#ecfdf5] text-[#047857]';
  }

  return 'border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]';
}

function valueColor(value: number) {
  if (value < 0) return 'text-[#dc2626]';
  if (value > 0) return 'text-[#059669]';
  return 'text-slate-500';
}

function badgeTone(type: 'success' | 'error' | 'warning' | 'accent' | 'neutral') {
  if (type === 'success') return 'border-[#a7f3d0] bg-[#ecfdf5] text-[#059669]';
  if (type === 'error') return 'border-[#fecaca] bg-[#fef2f2] text-[#dc2626]';
  if (type === 'warning') return 'border-[#fde68a] bg-[#fffbeb] text-[#d97706]';
  if (type === 'accent') return 'border-[#bfdbfe] bg-[#eff6ff] text-[#2563eb]';
  return 'border-slate-200 bg-slate-50 text-slate-600';
}

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  valueClassName = 'text-[#0f172a]',
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon?: ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-[18px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">
            {title}
          </div>
          <div className={`mt-1 break-words text-[22px] font-black ${valueClassName}`}>
            {value}
          </div>
          {subtitle ? (
            <div className="mt-1 text-[12px] text-slate-500">{subtitle}</div>
          ) : null}
        </div>
        {icon ? (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-slate-100 text-slate-600">
            {icon}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function FinanceCashFlow() {
  const [savedData, setSavedData] = useState<SavedFlowData>(EMPTY_FLOW_DATA);
  const [hydrated, setHydrated] = useState(false);
  const [tab, setTab] = useState<FlowTab>('caixa');
  const [groupBy, setGroupBy] = useState<GroupBy>('');
  const [ccFilter, setCcFilter] = useState('');
  const [accountFilter, setAccountFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [notice, setNotice] = useState<Notice | null>(null);
  const [importingTab, setImportingTab] = useState<FlowTab | null>(null);

  useEffect(() => {
    setSavedData(loadSavedFlowData());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    saveFlowData(savedData);
  }, [hydrated, savedData]);

  const despesas = savedData.despesas;
  const receitas = savedData.receitas;
  const atrasadas = savedData.atrasadas;
  const explicitCaixa = savedData.caixa;
  const hasSheets =
    despesas.length > 0 || receitas.length > 0 || atrasadas.length > 0;
  const caixa =
    explicitCaixa ??
    (hasSheets ? computeCaixaFromImports(despesas, receitas, atrasadas) : null);
  const lastImportedAt = savedData.importedAt;
  const activeTabMeta = FLOW_TABS.find((item) => item.key === tab) ?? FLOW_TABS[0];

  const isEmpty =
    !lastImportedAt &&
    !despesas.length &&
    !receitas.length &&
    !atrasadas.length &&
    !caixa;

  const selectedLedgerRows = useMemo<LedgerRow[]>(() => {
    if (tab === 'despesas') {
      return despesas;
    }

    if (tab === 'receitas') {
      return receitas;
    }

    return atrasadas;
  }, [atrasadas, despesas, receitas, tab]);

  const ledgerRows = useMemo(() => {
    return selectedLedgerRows.filter((row) => {
      const matchesDate = matchesDateRange(row._vencRaw, dateFrom, dateTo);
      const matchesCc = ccFilter ? row.centroCusto === ccFilter : true;
      const matchesAccount = accountFilter ? row.conta === accountFilter : true;
      return matchesDate && matchesCc && matchesAccount;
    });
  }, [accountFilter, ccFilter, dateFrom, dateTo, selectedLedgerRows]);

  const allCostCenters = useMemo(() => {
    return [
      ...new Set(selectedLedgerRows.map((row) => row.centroCusto).filter(Boolean)),
    ].sort();
  }, [selectedLedgerRows]);

  const allAccounts = useMemo(() => {
    return [...new Set(selectedLedgerRows.map((row) => row.conta).filter(Boolean))].sort();
  }, [selectedLedgerRows]);

  const ledgerTotals = useMemo(() => {
    const isExpenseTab = tab === 'despesas';

    return {
      valor: ledgerRows.reduce((sum, row) => sum + row.valor, 0),
      emAberto: ledgerRows.reduce((sum, row) => sum + row.emAberto, 0),
      pago: ledgerRows.reduce(
        (sum, row) =>
          sum +
          (isExpenseTab
            ? isExpenseRow(row)
              ? row.pago
              : 0
            : !isExpenseRow(row)
              ? row.recebido
              : 0),
        0,
      ),
      count: ledgerRows.length,
    };
  }, [ledgerRows, tab]);

  const groupedRows = useMemo(() => {
    if (!groupBy) {
      return null;
    }

    const key = groupBy === 'cc' ? 'centroCusto' : 'conta';
    const map = new Map<string, LedgerRow[]>();

    for (const row of ledgerRows) {
      const groupKey = row[key] || `Sem ${groupBy === 'cc' ? 'centro de custo' : 'conta'}`;
      const bucket = map.get(groupKey) ?? [];
      bucket.push(row);
      map.set(groupKey, bucket);
    }

    return [...map.entries()].sort((left, right) => {
      const leftTotal = left[1].reduce((sum, row) => sum + row.valor, 0);
      const rightTotal = right[1].reduce((sum, row) => sum + row.valor, 0);
      return rightTotal - leftTotal;
    });
  }, [groupBy, ledgerRows]);

  const topCategories = useMemo(() => {
    if (groupedRows) {
      return [];
    }

    const map = new Map<string, number>();
    for (const row of ledgerRows) {
      const key = row.categoria || 'Sem categoria';
      map.set(key, (map.get(key) ?? 0) + row.valor);
    }

    return [...map.entries()]
      .sort((left, right) => right[1] - left[1])
      .slice(0, 8);
  }, [groupedRows, ledgerRows]);

  const caixaDays = useMemo(() => {
    if (!caixa) {
      return [];
    }

    return caixa.dias.filter((day) => matchesDateRange(day.data, dateFrom, dateTo));
  }, [caixa, dateFrom, dateTo]);

  const caixaSummary = useMemo(() => {
    if (!caixa) {
      return null;
    }

    const filteredReceita = caixaDays.reduce((sum, day) => sum + day.receita, 0);
    const filteredDespesa = caixaDays.reduce((sum, day) => sum + day.despesa, 0);
    const isFiltered = Boolean(dateFrom || dateTo);

    return {
      isFiltered,
      totalDespesas: isFiltered ? filteredDespesa : caixa.totalDespesas,
      subTotal1: isFiltered ? filteredReceita - filteredDespesa : caixa.subTotal1,
      saldoFinal: isFiltered
        ? filteredReceita - filteredDespesa
        : caixa.saldoFinalGeral,
    };
  }, [caixa, caixaDays, dateFrom, dateTo]);

  async function handleImport(
    event: ChangeEvent<HTMLInputElement>,
    targetTab: FlowTab,
  ) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setImportingTab(targetTab);
    setNotice(null);

    try {
      const parsed = await parseFluxoSheet(file, targetTab);

      setSavedData((current) => {
        const nextImportedAt = new Date().toISOString();

        if (targetTab === 'caixa') {
          return {
            ...current,
            caixa: parsed as CashFlowSummary,
            importedAt: nextImportedAt,
            mode: 'imported',
          };
        }

        return {
          ...current,
          [targetTab]: parsed,
          importedAt: nextImportedAt,
          mode: 'imported',
        };
      });

      setTab(targetTab);
      setNotice({
        tone: 'success',
        text:
          targetTab === 'caixa'
            ? `Fluxo de Caixa importado com ${
                (parsed as CashFlowSummary).dias.length
              } dias.`
            : `${(parsed as Array<unknown>).length} registros importados em ${
                FLOW_TABS.find((item) => item.key === targetTab)?.label ?? targetTab
              }.`,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Falha ao processar o arquivo.';

      setNotice({
        tone: 'error',
        text: `Nao foi possivel importar o arquivo. ${message}`,
      });
    } finally {
      event.target.value = '';
      setImportingTab(null);
    }
  }

  function clearImportedData() {
    if (!window.confirm('Limpar os arquivos importados do fluxo financeiro?')) {
      return;
    }

    setSavedData(EMPTY_FLOW_DATA);
    setTab('caixa');
    setGroupBy('');
    setCcFilter('');
    setAccountFilter('');
    setDateFrom('');
    setDateTo('');
    setNotice({
      tone: 'success',
      text: 'Arquivos importados removidos com sucesso.',
    });
    window.localStorage.removeItem(STORAGE_KEY);
  }

  const today = new Date().toLocaleDateString('pt-BR');
  const isExpenseTab = tab === 'despesas';
  const isDelayedTab = tab === 'atrasadas';

  if (!hydrated) {
    return (
      <div className="grid gap-0 pb-2">
        <div className="mb-4">
          <div className="text-[19px] font-extrabold tracking-[-0.4px] text-[#0f172a]">
            {PAGE_HEADER_TITLE}
          </div>
          <div className="mt-[2px] text-[13px] text-[#64748b]">
            {PAGE_HEADER_SUBTITLE}
          </div>
        </div>
        <div className="rounded-[18px] border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <div className="text-sm text-slate-500">Carregando dados importados...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="grid gap-0 pb-2">
        

        <div className='flex justify-between items-center'>
<div className="mb-4">
          <div className="text-[19px] font-extrabold tracking-[-0.4px] text-[#0f172a]">
            {PAGE_HEADER_TITLE}
          </div>
          <div className="mt-[2px] text-[13px] text-[#64748b]">
            {PAGE_HEADER_SUBTITLE}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
            <div className="text-sm font-semibold text-slate-500">Periodo:</div>
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
              className="rounded-[10px] border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[#2563eb]"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
              className="rounded-[10px] border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[#2563eb]"
            />
            {dateFrom || dateTo ? (
              <button
                type="button"
                onClick={() => {
                  setDateFrom('');
                  setDateTo('');
                }}
                className="inline-flex items-center gap-2 rounded-[10px] border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-[#dc2626] transition-colors hover:bg-[#fef2f2]"
              >
                <X className="h-4 w-4" />
                Limpar periodo
              </button>
            ) : null}
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-[12px] border border-[#2563eb] bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1d4ed8]">
              <Upload className="h-4 w-4" />
              <span>
                {importingTab === tab ? 'Importando...' : `Importar ${activeTabMeta.label}`}
              </span>
              <input
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(event) => {
                  void handleImport(event, tab);
                }}
              />
            </label>

            {lastImportedAt ? (
              <div className="inline-flex items-center gap-2 rounded-[12px] border border-[#a7f3d0] bg-[#ecfdf5] px-3 py-2 text-sm font-semibold text-[#047857]">
                <Check className="h-4 w-4" />
                {new Date(lastImportedAt).toLocaleString('pt-BR')}
              </div>
            ) : null}

            {lastImportedAt ? (
              <button
                type="button"
                onClick={clearImportedData}
                className="inline-flex items-center gap-2 rounded-[12px] border border-[#fecaca] bg-white px-4 py-2 text-sm font-semibold text-[#dc2626] shadow-sm transition-colors hover:bg-[#fef2f2]"
              >
                <Trash2 className="h-4 w-4" />
                Limpar
              </button>
            ) : null}
          </div>
        </div>

        {notice ? (
          <div className={`mt-4 rounded-[18px] border px-4 py-3 text-sm font-medium ${toneClasses(notice.tone)}`}>
            {notice.text}
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-2">
          {FLOW_TABS.map((item) => {
            const count =
              item.key === 'caixa'
                ? caixa
                  ? 1
                  : 0
                : item.key === 'despesas'
                  ? despesas.length
                  : item.key === 'receitas'
                    ? receitas.length
                    : atrasadas.length;

            const active = tab === item.key;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  setTab(item.key);
                  setCcFilter('');
                  setAccountFilter('');
                }}
                className={`rounded-[12px] border px-4 py-2 text-sm font-bold transition-colors ${
                  active
                    ? 'border-[#2563eb] bg-[#2563eb] text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-white'
                }`}
              >
                {item.label}
                {item.key !== 'caixa' ? ` (${count})` : ''}
              </button>
            );
          })}
        </div>

        {isEmpty ? (
          <div className="mt-6 rounded-[24px] border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-14 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-[#2563eb] shadow-sm">
              <FileSpreadsheet className="h-8 w-8" />
            </div>
            <div className="mt-5 text-xl font-black text-[#0f172a]">
              Nenhum dado importado
            </div>
            <div className="mt-2 text-sm leading-6 text-slate-500">
              Comece importando o arquivo de <strong>Fluxo de Caixa</strong> e,
              se quiser detalhar a operacao, traga tambem <strong>Despesas</strong>,
              <strong> Receitas</strong> e <strong>Rec. Atrasadas</strong>.
            </div>
          </div>
        ) : null}

        {!isEmpty && tab === 'caixa' && caixa ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-[18px] font-extrabold text-[#0f172a]">
                    Fluxo de Caixa
                  </div>
                  {caixa._computed ? (
                    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold ${badgeTone('accent')}`}>
                      Calculado automaticamente
                    </span>
                  ) : null}
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  Referencia: {formatDateLabel(caixa.referencia)} | Saldo inicial:{' '}
                  {formatMoney(caixa.saldoInicial)} | Saldo final:{' '}
                  {formatMoney(caixa.saldoFinalGeral)}
                </div>
              </div>

            </div>

            {caixa.contas.length ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {caixa.contas
                  .filter(
                    (account) =>
                      (account.saldoFinal ?? 0) > 0 ||
                      (account.chequeEspecial ?? 0) > 0,
                  )
                  .map((account) => (
                    <div
                      key={account.nome}
                      className="rounded-[14px] border border-slate-200 border-l-4 border-l-[#2563eb] bg-white p-4 shadow-sm"
                    >
                      <div className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#2563eb]">
                        {account.nome}
                      </div>
                      <div className="mt-2 text-2xl font-black text-[#059669]">
                        {formatMoney(account.saldoFinal ?? 0)}
                      </div>
                      {account.saldoInicial ? (
                        <div className="mt-2 text-sm text-slate-500">
                          Inicial: {formatMoney(account.saldoInicial)}
                        </div>
                      ) : null}
                      {account.chequeEspecial ? (
                        <div className="mt-1 text-sm text-[#d97706]">
                          Cheque esp.: {formatMoney(account.chequeEspecial)}
                        </div>
                      ) : null}
                    </div>
                  ))}
              </div>
            ) : null}

            {caixaSummary ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                <MetricCard
                  title="Saldo Inicial"
                  value={formatMoney(caixa.saldoInicial)}
                  icon={<Wallet className="h-5 w-5" />}
                  valueClassName="text-[#2563eb]"
                />
                <MetricCard
                  title="Total Despesas"
                  value={formatMoney(caixaSummary.totalDespesas)}
                  icon={<AlertTriangle className="h-5 w-5" />}
                  valueClassName="text-[#dc2626]"
                />
                <MetricCard
                  title="Sub Total 1"
                  value={formatMoney(caixaSummary.subTotal1)}
                  icon={<CircleDollarSign className="h-5 w-5" />}
                  valueClassName={
                    caixaSummary.subTotal1 < 0 ? 'text-[#dc2626]' : 'text-[#059669]'
                  }
                />
                {!caixaSummary.isFiltered && caixa.chequeEspecialTotal > 0 ? (
                  <MetricCard
                    title="Cheque Especial"
                    value={formatMoney(caixa.chequeEspecialTotal)}
                    icon={<Landmark className="h-5 w-5" />}
                    valueClassName="text-[#d97706]"
                  />
                ) : null}
                <MetricCard
                  title="Saldo Final"
                  value={formatMoney(caixaSummary.saldoFinal)}
                  subtitle="Geral"
                  icon={<CalendarDays className="h-5 w-5" />}
                  valueClassName={
                    caixaSummary.saldoFinal < 0 ? 'text-[#dc2626]' : 'text-[#059669]'
                  }
                />
              </div>
            ) : null}

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-5 py-4">
                  <div className="text-base font-extrabold text-[#0f172a]">
                    Fluxo Diario
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    {caixaDays.length} de {caixa.dias.length} dias exibidos
                  </div>
                </div>

                {caixaDays.length ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
                            Data
                          </th>
                          <th className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
                            Dia
                          </th>
                          <th className="whitespace-nowrap px-4 py-3 text-right text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#059669]">
                            Receita
                          </th>
                          <th className="whitespace-nowrap px-4 py-3 text-right text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#dc2626]">
                            Despesa
                          </th>
                          <th className="whitespace-nowrap px-4 py-3 text-right text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#2563eb]">
                            Resultado
                          </th>
                          <th className="whitespace-nowrap px-4 py-3 text-right text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
                            Saldo Diario
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {caixaDays.map((day) => {
                          const isToday = formatDateLabel(day.data) === today;
                          const isWeekend =
                            normalizeText(day.semana) === 'sabado' ||
                            normalizeText(day.semana) === 'domingo';
                          const resultado = day.receita - day.despesa;

                          return (
                            <tr
                              key={day.data}
                              className={`border-t border-slate-200 ${
                                isToday ? 'bg-[#eef4ff]' : ''
                              } ${isWeekend ? 'opacity-70' : ''}`}
                            >
                              <td
                                className={`whitespace-nowrap px-4 py-3 font-semibold ${
                                  isToday ? 'text-[#2563eb]' : 'text-slate-800'
                                }`}
                              >
                                {formatDateLabel(day.data)}
                              </td>
                              <td className="whitespace-nowrap px-4 py-3 capitalize text-[#64748b]">
                                {day.semana || '—'}
                              </td>
                              <td className="whitespace-nowrap px-4 py-3 text-right font-bold text-[#059669]">
                                {day.receita ? formatMoney(day.receita) : '—'}
                              </td>
                              <td className="whitespace-nowrap px-4 py-3 text-right font-bold text-[#dc2626]">
                                {day.despesa ? formatMoney(day.despesa) : '—'}
                              </td>
                              <td className={`whitespace-nowrap px-4 py-3 text-right font-extrabold ${valueColor(resultado)}`}>
                                {resultado ? formatMoney(resultado) : '—'}
                              </td>
                              <td
                                className={`whitespace-nowrap px-4 py-3 text-right font-extrabold ${valueColor(
                                  day.saldoDiario ?? 0,
                                )}`}
                              >
                                {day.saldoDiario != null
                                  ? formatMoney(day.saldoDiario)
                                  : '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-slate-200 bg-slate-50">
                          <td
                            colSpan={2}
                            className="px-4 py-3 text-left text-base font-extrabold text-[#0f172a]"
                          >
                            Total
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right font-extrabold text-[#059669]">
                            {formatMoney(
                              caixaDays.reduce((sum, day) => sum + day.receita, 0),
                            )}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right font-extrabold text-[#dc2626]">
                            {formatMoney(
                              caixaDays.reduce((sum, day) => sum + day.despesa, 0),
                            )}
                          </td>
                          <td className="px-4 py-3" />
                          <td className="px-4 py-3" />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <div className="px-5 py-10 text-center text-sm text-slate-500">
                    Nenhum dia no periodo selecionado.
                  </div>
                )}
              </div>

              {caixa.inadimplencia.buckets.length ? (
                <div className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="text-base font-extrabold text-[#dc2626]">
                    Inadimplencia
                  </div>
                  <div className="mt-4 space-y-4">
                    {caixa.inadimplencia.buckets.map((bucket) => {
                      const width =
                        caixa.inadimplencia.total > 0
                          ? Math.min(
                              100,
                              Math.round(
                                (bucket.valor / caixa.inadimplencia.total) * 100,
                              ),
                            )
                          : 0;

                      return (
                        <div key={bucket.label}>
                          <div className="mb-2 flex items-start justify-between gap-3 text-sm">
                            <div className="font-bold text-slate-700">{bucket.label}</div>
                            <div className="text-right font-bold text-[#dc2626]">
                              {formatMoney(bucket.valor)}
                              <div className="font-medium text-slate-500">
                                {formatPercent(bucket.pct)}
                              </div>
                            </div>
                          </div>
                          <div className="h-2 rounded-full bg-slate-100">
                            <div
                              className="h-2 rounded-full bg-[#ef4444]"
                              style={{ width: `${width}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
              <MetricCard
                title="Fluxo Realizado"
                subtitle="Receita"
                value={formatMoney(caixa.fluxoRealizado.receita)}
                valueClassName="text-[#059669]"
              />
              <MetricCard
                title="Fluxo Realizado"
                subtitle="Despesa"
                value={formatMoney(caixa.fluxoRealizado.despesa)}
                valueClassName="text-[#dc2626]"
              />
              <MetricCard
                title="Fluxo Pendente"
                subtitle="Receita"
                value={formatMoney(caixa.fluxoPendente.receita)}
                valueClassName="text-[#059669]"
              />
              <MetricCard
                title="Fluxo Pendente"
                subtitle="Despesa"
                value={formatMoney(caixa.fluxoPendente.despesa)}
                valueClassName="text-[#dc2626]"
              />
              <MetricCard
                title="Saldo Bancos"
                value={formatMoney(caixa.saldoBancos)}
                valueClassName={
                  caixa.saldoBancos < 0 ? 'text-[#dc2626]' : 'text-[#059669]'
                }
              />
              <MetricCard
                title="Aplicacao"
                value={formatMoney(caixa.aplicacao)}
                valueClassName="text-[#7c3aed]"
              />
            </div>
          </div>
        ) : null}

        {!isEmpty && tab !== 'caixa' ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
              <div>
                <div className="text-[18px] font-extrabold text-[#0f172a]">
                  {FLOW_TABS.find((item) => item.key === tab)?.label}
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  {despesas.length} despesas | {receitas.length} receitas |{' '}
                  {atrasadas.length} atrasadas
                </div>
              </div>

            </div>

            <div className="flex flex-col gap-3 rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                {GROUP_OPTIONS.map((option) => {
                  const active = groupBy === option.value;

                  return (
                    <button
                      key={option.value || 'none'}
                      type="button"
                      onClick={() => setGroupBy(option.value)}
                      className={`rounded-[10px] border px-3 py-2 text-sm font-semibold transition-colors ${
                        active
                          ? 'border-[#2563eb] bg-[#eff6ff] text-[#2563eb]'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {allCostCenters.length ? (
                  <select
                    value={ccFilter}
                    onChange={(event) => setCcFilter(event.target.value)}
                    className="rounded-[10px] border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[#2563eb]"
                  >
                    <option value="">CC: Todos</option>
                    {allCostCenters.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                ) : null}

                {allAccounts.length ? (
                  <select
                    value={accountFilter}
                    onChange={(event) => setAccountFilter(event.target.value)}
                    className="rounded-[10px] border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[#2563eb]"
                  >
                    <option value="">Conta: Todas</option>
                    {allAccounts.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                ) : null}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                title="Valor Total"
                value={formatMoney(ledgerTotals.valor)}
                icon={<CircleDollarSign className="h-5 w-5" />}
                valueClassName={isExpenseTab ? 'text-[#dc2626]' : 'text-[#059669]'}
              />
              <MetricCard
                title="Em Aberto"
                value={formatMoney(ledgerTotals.emAberto)}
                icon={<AlertTriangle className="h-5 w-5" />}
                valueClassName="text-[#d97706]"
              />
              <MetricCard
                title={isExpenseTab ? 'Pago' : 'Recebido'}
                value={formatMoney(ledgerTotals.pago)}
                icon={<Check className="h-5 w-5" />}
                valueClassName="text-[#059669]"
              />
              <MetricCard
                title="Lancamentos"
                value={String(ledgerTotals.count)}
                icon={<Wallet className="h-5 w-5" />}
                valueClassName="text-[#2563eb]"
              />
            </div>

            {ledgerRows.length === 0 ? (
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-6 py-14 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm">
                  <FileSpreadsheet className="h-8 w-8" />
                </div>
                <div className="mt-5 text-xl font-black text-[#0f172a]">
                  Nenhum dado nesta aba
                </div>
              </div>
            ) : groupedRows ? (
              <div className="space-y-4">
                {groupedRows.map(([groupKey, rows]) => {
                  const totalValue = rows.reduce((sum, row) => sum + row.valor, 0);
                  const totalOpen = rows.reduce((sum, row) => sum + row.emAberto, 0);

                  return (
                    <div
                      key={groupKey}
                      className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm"
                    >
                      <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
                        <div className="text-base font-extrabold text-[#0f172a]">
                          {groupBy === 'cc' ? 'CC' : 'Conta'}:{' '}
                          <span className="text-[#2563eb]">{groupKey}</span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <div className="text-slate-500">
                            Valor:{' '}
                            <strong
                              className={
                                isExpenseTab ? 'text-[#dc2626]' : 'text-[#059669]'
                              }
                            >
                              {formatMoney(totalValue)}
                            </strong>
                          </div>
                          <div className="text-slate-500">
                            Em aberto:{' '}
                            <strong className="text-[#d97706]">
                              {formatMoney(totalOpen)}
                            </strong>
                          </div>
                        </div>
                      </div>
                      <LedgerTable
                        rows={rows}
                        isExpenseTab={isExpenseTab}
                        isDelayedTab={isDelayedTab}
                        groupBy={groupBy}
                        label="Subtotal"
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4">
                {topCategories.length ? (
                  <div className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-base font-extrabold text-[#0f172a]">
                      <Wallet className="h-5 w-5 text-[#2563eb]" />
                      Top Categorias
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      {topCategories.map(([category, total]) => {
                        const maxValue = topCategories[0]?.[1] ?? 1;
                        const width = Math.max(8, Math.round((total / maxValue) * 100));

                        return (
                          <div key={category}>
                            <div className="mb-2 flex items-center justify-between gap-3">
                              <div className="truncate text-sm font-bold text-slate-700">
                                {category}
                              </div>
                              <div className="whitespace-nowrap text-sm font-black text-slate-900">
                                {formatCompactMoney(total)}
                              </div>
                            </div>
                            <div className="h-2 rounded-full bg-slate-100">
                              <div
                                className={`h-2 rounded-full ${
                                  isExpenseTab ? 'bg-[#ef4444]' : 'bg-[#10b981]'
                                }`}
                                style={{ width: `${width}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                <div className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm">
                  <LedgerTable
                    rows={ledgerRows}
                    isExpenseTab={isExpenseTab}
                    isDelayedTab={isDelayedTab}
                    groupBy={groupBy}
                    label="Total"
                  />
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function LedgerTable({
  rows,
  isExpenseTab,
  isDelayedTab,
  groupBy,
  label,
}: {
  rows: LedgerRow[];
  isExpenseTab: boolean;
  isDelayedTab: boolean;
  groupBy: GroupBy;
  label: string;
}) {
  const now = new Date();
  const totalValue = rows.reduce((sum, row) => sum + row.valor, 0);
  const totalOpen = rows.reduce((sum, row) => sum + row.emAberto, 0);
  const totalPaid = rows.reduce(
    (sum, row) =>
      sum +
      (isExpenseTab
        ? isExpenseRow(row)
          ? row.pago
          : 0
        : !isExpenseRow(row)
          ? row.recebido
          : 0),
    0,
  );

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">
              {isExpenseTab ? 'Fornecedor' : 'Cliente'}
            </th>
            <th className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">
              Vencimento
            </th>
            <th className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">
              {isDelayedTab ? 'Atraso' : 'Situacao'}
            </th>
            <th className="whitespace-nowrap px-4 py-3 text-right text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">
              Valor
            </th>
            <th className="whitespace-nowrap px-4 py-3 text-right text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">
              Em Aberto
            </th>
            <th className="whitespace-nowrap px-4 py-3 text-right text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">
              {isExpenseTab ? 'Pago' : 'Recebido'}
            </th>
            {!groupBy || groupBy === 'conta' ? (
              <th className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">
                Centro de Custo
              </th>
            ) : null}
            {!groupBy || groupBy === 'cc' ? (
              <th className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">
                Conta
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const rowName = isExpenseRow(row) ? row.fornecedor : row.cliente;
            const paidValue = isExpenseRow(row) ? row.pago : row.recebido;
            const dueDate = coerceDate(row._vencRaw);
            const delayedDays =
              isDelayedTab && dueDate
                ? Math.max(
                    0,
                    Math.floor(
                      (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
                    ),
                  )
                : 0;
            const delayColor =
              delayedDays > 30
                ? 'text-[#dc2626]'
                : delayedDays > 14
                  ? 'text-[#d97706]'
                  : 'text-slate-500';
            const statusTone =
              normalizeText(row.situacao) === 'quitado'
                ? badgeTone('success')
                : normalizeText(row.situacao) === 'atrasado'
                  ? badgeTone('error')
                  : badgeTone('accent');

            return (
              <tr key={`${rowName}-${row._vencRaw}-${index}`} className="border-t border-slate-100">
                <td className="max-w-[220px] px-4 py-3">
                  <div className="truncate font-semibold text-slate-800">{rowName || '—'}</div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                  {row.vencimento || '—'}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  {isDelayedTab ? (
                    <span className={`font-black ${delayColor}`}>
                      {delayedDays ? `${delayedDays}d` : '—'}
                    </span>
                  ) : (
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusTone}`}>
                      {row.situacao || '—'}
                    </span>
                  )}
                </td>
                <td
                  className={`whitespace-nowrap px-4 py-3 text-right font-black ${
                    isExpenseTab ? 'text-[#dc2626]' : 'text-[#059669]'
                  }`}
                >
                  {formatCompactMoney(row.valor)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-black text-[#d97706]">
                  {row.emAberto > 0 ? formatCompactMoney(row.emAberto) : '—'}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-bold text-[#059669]">
                  {paidValue > 0 ? formatCompactMoney(paidValue) : '—'}
                </td>
                {!groupBy || groupBy === 'conta' ? (
                  <td className="max-w-[180px] px-4 py-3 text-slate-500">
                    <div className="truncate">{row.centroCusto || '—'}</div>
                  </td>
                ) : null}
                {!groupBy || groupBy === 'cc' ? (
                  <td className="max-w-[180px] px-4 py-3 text-slate-500">
                    <div className="truncate">{row.conta || '—'}</div>
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
        <tfoot className="bg-slate-50">
          <tr className="border-t-2 border-slate-200">
            <td colSpan={3} className="px-4 py-3 font-black text-slate-700">
              {label} ({rows.length})
            </td>
            <td
              className={`whitespace-nowrap px-4 py-3 text-right font-black ${
                isExpenseTab ? 'text-[#dc2626]' : 'text-[#059669]'
              }`}
            >
              {formatMoney(totalValue)}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-right font-black text-[#d97706]">
              {formatMoney(totalOpen)}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-right font-black text-[#059669]">
              {formatMoney(totalPaid)}
            </td>
            {!groupBy || groupBy === 'conta' ? <td /> : null}
            {!groupBy || groupBy === 'cc' ? <td /> : null}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
