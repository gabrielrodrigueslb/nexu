'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarX,
  CheckCircle2,
  ClipboardList,
  Clock3,
  MapPinned,
  MonitorPlay,
  Phone,
  User,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import type { ActivityType, Lead, LeadTask } from '@/components/types';

import {
  fetchCommercialLeads,
  fetchCommercialLookups,
  mapBackendLeadToDashboardLead,
  type CommercialLookups,
} from './backend';

type TaskView = 'todas' | 'pendentes' | 'atrasadas' | 'feitas';

type FlattenedLeadTask = LeadTask & {
  leadId: string;
  leadName: string;
  leadSellerId?: string;
  leadStatus: Lead['status'];
};

const TASK_TYPE_META: Record<
  ActivityType,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badgeClassName: string;
  }
> = {
  reuniao: {
    label: 'Reunião',
    icon: Phone,
    badgeClassName: 'border-blue-200 bg-blue-50 text-blue-700',
  },
  demo: {
    label: 'Demo',
    icon: MonitorPlay,
    badgeClassName: 'border-violet-200 bg-violet-50 text-violet-700',
  },
  visita: {
    label: 'Visita',
    icon: MapPinned,
    badgeClassName: 'border-amber-200 bg-amber-50 text-amber-700',
  },
};

function getTaskTimestamp(date?: string) {
  if (!date) return Number.POSITIVE_INFINITY;
  return new Date(date).getTime();
}

function formatTaskDate(date?: string) {
  if (!date) return '-';

  return new Date(date).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function KpiCard({
  label,
  value,
  icon,
  colorClassName,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  colorClassName: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className={`text-2xl font-bold ${colorClassName}`}>{value}</div>
      <div className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-500">
        {icon}
        <span>{label}</span>
      </div>
    </div>
  );
}

export function CommercialCrmLeadTasks() {
  const router = useRouter();
  const [lookups, setLookups] = useState<CommercialLookups | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [taskTypeFilter, setTaskTypeFilter] = useState<ActivityType | ''>('');
  const [sellerFilter, setSellerFilter] = useState('');
  const [view, setView] = useState<TaskView>('todas');
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let active = true;

    async function load() {
      const [nextLookups, leadItems] = await Promise.all([
        fetchCommercialLookups(),
        fetchCommercialLeads(),
      ]);

      if (!active) return;

      setLookups(nextLookups);
      setLeads(leadItems.map(mapBackendLeadToDashboardLead));
    }

    void load();

    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 60_000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const allTasks = useMemo<FlattenedLeadTask[]>(
    () =>
      leads.flatMap((lead) =>
        (lead.tasks ?? []).map((task) => ({
          ...task,
          leadId: lead.id,
          leadName: lead.company || 'Sem nome',
          leadSellerId: lead.sellerId,
          leadStatus: lead.status,
        })),
      ),
    [leads],
  );

  const total = allTasks.length;
  const completed = allTasks.filter((task) => task.done);
  const pending = allTasks.filter((task) => !task.done);
  const overdue = pending.filter((task) => task.date && getTaskTimestamp(task.date) < now);

  const filteredTasks = useMemo(() => {
    let items =
      view === 'feitas'
        ? completed
        : view === 'atrasadas'
          ? overdue
          : view === 'pendentes'
            ? pending
            : allTasks;

    if (taskTypeFilter) {
      items = items.filter((task) => task.type === taskTypeFilter);
    }

    if (sellerFilter === 'sem') {
      items = items.filter((task) => !task.leadSellerId);
    } else if (sellerFilter) {
      items = items.filter((task) => task.leadSellerId === sellerFilter);
    }

    return [...items].sort((left, right) => getTaskTimestamp(left.date) - getTaskTimestamp(right.date));
  }, [allTasks, completed, overdue, pending, sellerFilter, taskTypeFilter, view]);

  const hasSecondaryFilter = Boolean(taskTypeFilter || sellerFilter);

  function renderTabButton(
    tabView: TaskView,
    label: string,
    count: number,
    activeClassName?: string,
  ) {
    const active = view === tabView;

    return (
      <button
        type="button"
        key={tabView}
        onClick={() => setView(tabView)}
        className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-all ${
          active
            ? `${activeClassName ?? 'bg-blue-600 text-white shadow-sm'} font-semibold`
            : 'bg-slate-100 font-medium text-slate-600 hover:bg-slate-200'
        }`}
      >
        <span>{label}</span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-bold ${
            active ? 'bg-white/25 text-white' : 'bg-slate-300 text-slate-700'
          }`}
        >
          {count}
        </span>
      </button>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tarefas dos Leads</h1>
        <p className="text-sm text-slate-500">
          Visão consolidada das tarefas do CRM, sem dados mockados.
        </p>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total" value={total} icon={<ClipboardList className="h-4 w-4" />} colorClassName="text-blue-600" />
        <KpiCard label="Pendentes" value={pending.length} icon={<Clock3 className="h-4 w-4" />} colorClassName="text-amber-600" />
        <KpiCard label="Atrasadas" value={overdue.length} icon={<AlertTriangle className="h-4 w-4" />} colorClassName="text-red-600" />
        <KpiCard label="Concluídas" value={completed.length} icon={<CheckCircle2 className="h-4 w-4" />} colorClassName="text-emerald-600" />
      </div>

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {renderTabButton('todas', 'Todas', total)}
          {renderTabButton('pendentes', 'Pendentes', pending.length, 'bg-amber-600 text-white')}
          {renderTabButton('atrasadas', 'Atrasadas', overdue.length, 'bg-red-600 text-white')}
          {renderTabButton('feitas', 'Concluídas', completed.length, 'bg-emerald-600 text-white')}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={taskTypeFilter}
            onChange={(event) => setTaskTypeFilter(event.target.value as ActivityType | '')}
            className="cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Todos os tipos</option>
            {Object.entries(TASK_TYPE_META).map(([value, meta]) => (
              <option key={value} value={value}>
                {meta.label}
              </option>
            ))}
          </select>

          <select
            value={sellerFilter}
            onChange={(event) => setSellerFilter(event.target.value)}
            className="min-w-45 cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Todos os vendedores</option>
            <option value="sem">- Sem responsável</option>
            {(lookups?.users || []).map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>

          {hasSecondaryFilter ? (
            <button
              type="button"
              onClick={() => {
                setTaskTypeFilter('');
                setSellerFilter('');
              }}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              Limpar
            </button>
          ) : null}

          <span className="ml-1 text-sm text-slate-500">{filteredTasks.length} registro(s)</span>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Lead</th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Tipo</th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Data / Hora</th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Vendedor</th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Etapa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredTasks.length ? (
                filteredTasks.map((task) => {
                  const meta = TASK_TYPE_META[task.type];
                  const TypeIcon = meta.icon;
                  const isOverdue = !task.done && task.date && getTaskTimestamp(task.date) < now;
                  const seller = lookups?.users.find((user) => user.id === task.leadSellerId);

                  return (
                    <tr
                      key={`${task.leadId}-${task.title}-${task.date ?? 'sem-data'}`}
                      onClick={() => router.push(`/comercial/crm-venda?lead=${task.leadId}`)}
                      className={`cursor-pointer transition-colors hover:bg-slate-50 ${
                        task.done ? 'opacity-70' : ''
                      } ${isOverdue ? 'bg-red-50/50 hover:bg-red-50' : ''}`}
                    >
                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-900">{task.leadName}</div>
                        {task.title ? <div className="mt-1 text-xs text-slate-500">{task.title}</div> : null}
                      </td>

                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${meta.badgeClassName}`}>
                          <TypeIcon className="h-3.5 w-3.5" />
                          {meta.label}
                        </span>
                      </td>

                      <td className={`whitespace-nowrap px-5 py-4 ${isOverdue ? 'font-semibold text-red-600' : 'text-slate-700'}`}>
                        {formatTaskDate(task.date)}
                      </td>

                      <td className="px-5 py-4">
                        {task.done ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Concluída
                          </span>
                        ) : isOverdue ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            Atrasada
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                            <Clock3 className="h-3.5 w-3.5" />
                            Pendente
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {seller ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
                            <User className="h-3.5 w-3.5 text-slate-400" />
                            {seller.name.split(' ')[0]}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-xs text-slate-500">{task.leadStatus}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <CalendarX className="h-10 w-10 text-slate-300" />
                      <p className="text-sm font-medium text-slate-500">
                        Nenhuma tarefa encontrada com os filtros atuais.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
