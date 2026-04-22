'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { BriefcaseBusiness, Bug, Headset, Search, Users } from 'lucide-react';

import { Panel, SmallPill } from './ui';
import { formatMoney } from './utils';
import { apiRequest } from '@/lib/api-client';

type Tone = 'accent' | 'success' | 'warning' | 'error' | 'purple' | 'neutral';
type SearchGroup = 'Leads CRM' | 'Tickets Comerciais' | 'Desenvolvimento' | 'Implantação';

type SearchResult = {
  key: string;
  group: SearchGroup;
  title: string;
  subtitle: string;
  details: string[];
  pills: Array<{ label: string; tone: Tone }>;
  searchable: string[];
  score: number;
};

type BackendLead = {
  id: string;
  company: string;
  status: string;
  value: number;
  seller?: { id: string; name: string } | null;
  sdr?: { id: string; name: string } | null;
  origin?: { id: string; name: string } | null;
  tasks?: Array<{ title: string }>;
};

type BackendTicket = {
  id: string;
  code: string;
  company: string;
  status: string;
  type: string;
  createdAt: string;
  setupAmount: number;
  recurringAmount: number;
  csStatus?: string | null;
  assignee?: { id: string; name: string } | null;
  technicalAssignee?: { id: string; name: string } | null;
  tasks?: Array<{ title: string }>;
};

type BackendDevTicket = {
  id: number;
  proto: string;
  title: string;
  category: string;
  devType: string;
  devStatus: string;
  complexity: string;
  totalPts: number;
  deadline?: string | null;
  assignee?: { id: string; name: string } | null;
  sprint?: { id: string; name: string } | null;
};

const GROUP_ORDER: SearchGroup[] = [
  'Leads CRM',
  'Tickets Comerciais',
  'Desenvolvimento',
  'Implantação',
];

const GROUP_META: Record<SearchGroup, { icon: React.ReactNode; description: string }> = {
  'Leads CRM': {
    icon: <Users className="size-4 text-[#2563eb]" />,
    description: 'Leads, vendedores, SDRs e origens',
  },
  'Tickets Comerciais': {
    icon: <BriefcaseBusiness className="size-4 text-[#7c3aed]" />,
    description: 'Tickets fechados, setup e recorrência',
  },
  Desenvolvimento: {
    icon: <Bug className="size-4 text-[#d97706]" />,
    description: 'Demandas, sprints e responsáveis',
  },
  Implantação: {
    icon: <Headset className="size-4 text-[#059669]" />,
    description: 'Tickets de implantação, produto e técnico',
  },
};

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function formatCommercialStatus(status: string) {
  const labels: Record<string, string> = {
    pendente_financeiro: 'Pendente financeiro',
    pagamento_confirmado: 'Pagamento confirmado',
    em_implantacao: 'Em implantação',
    concluido: 'Concluído',
    cancelado: 'Cancelado',
  };

  return labels[status] ?? status;
}

function formatImplantacaoType(type: string) {
  return type === 'upsell' ? 'Inclusão' : 'Novo';
}

function buildIndex(
  leads: BackendLead[],
  tickets: BackendTicket[],
  devTickets: BackendDevTicket[],
): SearchResult[] {
  const leadResults: SearchResult[] = leads.map((lead) => ({
    key: `lead-${lead.id}`,
    group: 'Leads CRM',
    title: lead.company,
    subtitle: `Lead ${lead.id}`,
    details: [
      `Status: ${lead.status}`,
      lead.seller?.name ? `Vendedor: ${lead.seller.name}` : 'Sem vendedor',
      lead.sdr?.name ? `SDR: ${lead.sdr.name}` : 'Sem SDR',
      lead.origin?.name ? `Origem: ${lead.origin.name}` : 'Sem origem',
      `Valor: ${formatMoney(lead.value)}`,
    ],
    pills: [
      {
        label: lead.status,
        tone: lead.status === 'Ganho' ? 'success' : lead.status === 'Perdido' ? 'error' : 'accent',
      },
      { label: lead.id, tone: 'neutral' },
    ],
    searchable: [
      lead.id,
      lead.company,
      lead.status,
      lead.seller?.name ?? '',
      lead.sdr?.name ?? '',
      lead.origin?.name ?? '',
      ...(lead.tasks || []).map((task) => task.title),
    ],
    score: 0,
  }));

  const commercialResults: SearchResult[] = tickets.map((ticket) => ({
    key: `ticket-${ticket.id}`,
    group: 'Tickets Comerciais',
    title: ticket.company || ticket.code,
    subtitle: `${ticket.code} · ${formatCommercialStatus(ticket.status)}`,
    details: [
      `Responsável: ${ticket.assignee?.name ?? 'Não informado'}`,
      `Setup: ${formatMoney(ticket.setupAmount)}`,
      `Recorrência: ${formatMoney(ticket.recurringAmount)}`,
      `Criado em: ${ticket.createdAt.slice(0, 10)}`,
    ],
    pills: [
      {
        label: formatCommercialStatus(ticket.status),
        tone:
          ticket.status === 'concluido'
            ? 'success'
            : ticket.status === 'cancelado'
              ? 'error'
              : ticket.status === 'em_implantacao'
                ? 'purple'
                : 'warning',
      },
      { label: ticket.code, tone: 'neutral' },
    ],
    searchable: [
      ticket.id,
      ticket.code,
      ticket.company,
      ticket.status,
      ticket.assignee?.name ?? '',
      ticket.technicalAssignee?.name ?? '',
    ],
    score: 0,
  }));

  const devResults: SearchResult[] = devTickets.map((ticket) => ({
    key: `dev-${ticket.id}`,
    group: 'Desenvolvimento',
    title: ticket.title,
    subtitle: `${ticket.proto} · ${ticket.devType} · ${ticket.category}`,
    details: [
      `Status: ${ticket.devStatus}`,
      `Responsável: ${ticket.assignee?.name ?? 'Não informado'}`,
      ticket.sprint?.name ? `Sprint: ${ticket.sprint.name}` : 'Sem sprint',
      `Pontos: ${ticket.totalPts}`,
      ticket.deadline ? `Prazo: ${ticket.deadline}` : 'Sem prazo',
    ],
    pills: [
      {
        label: ticket.devStatus,
        tone:
          ticket.devStatus === 'Concluído'
            ? 'success'
            : ticket.devStatus === 'Backlog'
              ? 'neutral'
              : ticket.devStatus === 'Em Desenvolvimento'
                ? 'warning'
                : 'purple',
      },
      {
        label: ticket.devType,
        tone:
          ticket.devType === 'Bug'
            ? 'error'
            : ticket.devType === 'Feature'
              ? 'accent'
              : 'neutral',
      },
    ],
    searchable: [
      String(ticket.id),
      ticket.proto,
      ticket.title,
      ticket.devType,
      ticket.category,
      ticket.devStatus,
      ticket.assignee?.name ?? '',
      ticket.sprint?.name ?? '',
      ticket.complexity,
    ],
    score: 0,
  }));

  const implantacaoResults: SearchResult[] = tickets
    .filter((ticket) => ['pagamento_confirmado', 'em_implantacao', 'concluido'].includes(ticket.status))
    .map((ticket) => ({
      key: `implantacao-${ticket.id}`,
      group: 'Implantação' as const,
      title: ticket.company || ticket.code,
      subtitle: `${ticket.code} · ${formatImplantacaoType(ticket.type)} · ${ticket.csStatus || 'Briefing'}`,
      details: [
        `Técnico: ${ticket.technicalAssignee?.name ?? ticket.assignee?.name ?? 'Não informado'}`,
        `Status: ${formatCommercialStatus(ticket.status)}`,
        `Etapa: ${ticket.csStatus || 'Briefing'}`,
        `Tarefas: ${(ticket.tasks || []).length}`,
      ],
      pills: [
        {
          label: ticket.csStatus || 'Briefing',
          tone: ticket.status === 'concluido' ? 'success' : 'accent',
        },
        {
          label: formatImplantacaoType(ticket.type),
          tone: 'neutral',
        },
      ],
      searchable: [
        ticket.id,
        ticket.code,
        ticket.company,
        ticket.csStatus || '',
        ticket.technicalAssignee?.name ?? '',
        ...(ticket.tasks || []).map((task) => task.title),
      ],
      score: 0,
    }));

  return [...leadResults, ...commercialResults, ...devResults, ...implantacaoResults];
}

function scoreResult(result: SearchResult, normalizedQuery: string, tokens: string[]) {
  const normalizedTitle = normalizeText(result.title);
  const normalizedSubtitle = normalizeText(result.subtitle);
  const normalizedBlob = normalizeText(result.searchable.join(' '));

  let score = 0;

  if (normalizedTitle === normalizedQuery || normalizedSubtitle === normalizedQuery) score += 100;
  if (normalizedTitle.includes(normalizedQuery)) score += 40;
  if (normalizedSubtitle.includes(normalizedQuery)) score += 20;

  score += tokens.reduce((total, token) => {
    if (normalizedTitle.includes(token)) return total + 8;
    if (normalizedSubtitle.includes(token)) return total + 4;
    if (normalizedBlob.includes(token)) return total + 2;
    return total;
  }, 0);

  return score;
}

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState<SearchResult[]>([]);
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [leadPayload, ticketPayload, devPayload] = await Promise.all([
          apiRequest('/api/backend/leads?page=1&limit=100') as Promise<{ items: BackendLead[] }>,
          apiRequest('/api/backend/tickets?page=1&limit=100') as Promise<{ items: BackendTicket[] }>,
          apiRequest('/api/backend/development/tickets?page=1&limit=100') as Promise<{
            items: BackendDevTicket[];
          }>,
        ]);

        if (!active) return;
        setIndex(
          buildIndex(leadPayload.items || [], ticketPayload.items || [], devPayload.items || []),
        );
      } catch {
        if (!active) return;
        setIndex([]);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  const normalizedQuery = normalizeText(deferredQuery);
  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);

  const results = useMemo(() => {
    if (!tokens.length) return [];

    return index
      .map((result) => ({
        ...result,
        score: scoreResult(result, normalizedQuery, tokens),
      }))
      .filter((result) =>
        tokens.every((token) =>
          normalizeText([result.title, result.subtitle, ...result.searchable].join(' ')).includes(
            token,
          ),
        ),
      )
      .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title));
  }, [index, normalizedQuery, tokens]);

  const groupedResults = useMemo(
    () =>
      GROUP_ORDER.map((group) => ({
        group,
        items: results.filter((result) => result.group === group),
      })).filter((entry) => entry.items.length > 0),
    [results],
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="mb-4 text-[19px] font-extrabold tracking-[-0.4px] text-[#0f172a]">
        Busca Global
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-[8px] border border-[#e2e8f0] bg-white px-4 py-3 shadow-[0_1px_3px_rgba(0,0,0,.08)]">
        <Search className="size-4 text-[#64748b]" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por CNPJ, nome, ID, sprint, responsável..."
          className="w-full border-none bg-transparent text-[13px] text-[#0f172a] outline-none placeholder:text-[#64748b]"
        />
      </div>

      {!tokens.length ? (
        <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
          <Panel className="p-5">
            <div className="mb-2 text-[14px] font-bold text-[#0f172a]">Pesquise em todos os módulos</div>
            <div className="text-[13px] leading-6 text-[#64748b]">
              A busca cruza leads do CRM, tickets comerciais, demandas de desenvolvimento e tickets
              de implantação.
            </div>
          </Panel>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {GROUP_ORDER.map((group) => {
              const meta = GROUP_META[group];
              const total = index.filter((item) => item.group === group).length;

              return (
                <Panel key={group} className="flex items-center gap-3 p-4">
                  <div className="flex size-10 items-center justify-center rounded-[10px] bg-[#f8fafc]">
                    {meta.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-bold text-[#0f172a]">{group}</div>
                    <div className="mt-0.5 text-[11px] text-[#64748b]">{meta.description}</div>
                  </div>
                  <div className="text-[18px] font-extrabold text-[#0f172a]">{total}</div>
                </Panel>
              );
            })}
          </div>
        </div>
      ) : groupedResults.length ? (
        <div className="space-y-5">
          <div className="text-[12px] font-semibold text-[#64748b]">
            {results.length} resultado{results.length === 1 ? '' : 's'} para{' '}
            <span className="text-[#0f172a]">&quot;{query.trim()}&quot;</span>
          </div>

          {groupedResults.map(({ group, items }) => (
            <div key={group}>
              <div className="mb-3 flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-[8px] bg-white shadow-[0_1px_3px_rgba(0,0,0,.08)]">
                  {GROUP_META[group].icon}
                </div>
                <div>
                  <div className="text-[14px] font-bold text-[#0f172a]">{group}</div>
                  <div className="text-[11px] text-[#64748b]">
                    {items.length} encontrado{items.length === 1 ? '' : 's'}
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
                {items.map((item) => (
                  <Panel key={item.key} className="p-4">
                    <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="text-[14px] font-bold text-[#0f172a]">{item.title}</div>
                        <div className="mt-1 text-[12px] text-[#64748b]">{item.subtitle}</div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {item.pills.map((pill) => (
                          <SmallPill key={`${item.key}-${pill.label}`} tone={pill.tone}>
                            {pill.label}
                          </SmallPill>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-1 sm:grid-cols-2">
                      {item.details.map((detail) => (
                        <div key={`${item.key}-${detail}`} className="text-[12px] text-[#475569]">
                          {detail}
                        </div>
                      ))}
                    </div>
                  </Panel>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Panel className="p-8 text-center">
          <div className="mb-2 text-[15px] font-bold text-[#0f172a]">Nenhum resultado encontrado</div>
          <div className="mx-auto max-w-[520px] text-[13px] leading-6 text-[#64748b]">
            Tente buscar por nome da empresa, ID do lead, status do ticket, nome do responsável,
            sprint ou produto.
          </div>
        </Panel>
      )}
    </div>
  );
}
