'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, Search } from 'lucide-react';

import { fetchDevLookups, fetchDevTickets, type DevApiTicket, type DevApiUser } from '@/components/dev/api';

export function DevLibraryPage() {
  const [tickets, setTickets] = useState<DevApiTicket[]>([]);
  const [users, setUsers] = useState<DevApiUser[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [lookups, devTickets] = await Promise.all([fetchDevLookups(), fetchDevTickets()]);
        if (!active) return;
        setUsers(lookups.users || []);
        setTickets(devTickets);
      } catch {
        if (!active) return;
        setUsers([]);
        setTickets([]);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return tickets.filter((ticket) => {
      if (status && ticket.devStatus !== status) return false;
      if (!normalized) return true;
      return [ticket.proto, ticket.title, ticket.category, ticket.clientName || '', ticket.devType]
        .join(' ')
        .toLowerCase()
        .includes(normalized);
    });
  }, [query, status, tickets]);

  function handleExport() {
    const rows = [
      ['Protocolo', 'Título', 'Status', 'Tipo', 'Responsável', 'Sprint'],
      ...filtered.map((ticket) => [
        ticket.proto,
        ticket.title,
        ticket.devStatus,
        ticket.devType,
        users.find((user) => user.id === ticket.resp)?.name ?? '-',
        ticket.sprintId ?? '-',
      ]),
    ];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'dev-library.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-[20px] font-extrabold tracking-[-0.4px] text-[#0f172a]">Biblioteca Dev</h1>
          <p className="mt-0.5 text-[13px] text-[#64748b]">Consulte demandas, status e responsáveis do time.</p>
        </div>
        <button onClick={handleExport} className="inline-flex h-9 items-center gap-2 rounded-[8px] border border-[#e2e8f0] bg-white px-4 text-[13px] font-semibold text-[#0f172a] shadow-sm">
          <Download className="size-4" />
          Exportar
        </button>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-[1fr_220px]">
        <div className="flex items-center gap-2 rounded-[8px] border border-[#e2e8f0] bg-white px-4 py-3 shadow-sm">
          <Search className="size-4 text-[#64748b]" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por protocolo, título ou cliente" className="w-full border-none bg-transparent text-[13px] outline-none" />
        </div>
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-[8px] border border-[#e2e8f0] bg-white px-3 py-3 text-[13px] outline-none shadow-sm">
          <option value="">Todos os status</option>
          {[...new Set(tickets.map((ticket) => ticket.devStatus))].map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-[14px] border border-[#e2e8f0] bg-white shadow-sm">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-[#f8fafc]">
              {['Protocolo', 'Título', 'Status', 'Responsável', 'Sprint'].map((column) => (
                <th key={column} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[.06em] text-[#64748b]">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((ticket) => (
              <tr key={ticket.id} className="border-t border-[#e2e8f0]">
                <td className="px-4 py-3 text-[12px] font-semibold text-[#0f172a]">{ticket.proto}</td>
                <td className="px-4 py-3 text-[12px] text-[#0f172a]">{ticket.title}</td>
                <td className="px-4 py-3 text-[12px] text-[#475569]">{ticket.devStatus}</td>
                <td className="px-4 py-3 text-[12px] text-[#475569]">
                  {users.find((user) => user.id === ticket.resp)?.name ?? '-'}
                </td>
                <td className="px-4 py-3 text-[12px] text-[#475569]">{ticket.sprintId ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
