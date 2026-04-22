'use client';

import { useEffect, useMemo, useState } from 'react';
import { Boxes, Search } from 'lucide-react';

import { fetchDevTickets, type DevApiTicket } from '@/components/dev/api';

type InstanceRow = {
  key: string;
  instance: string;
  clientName: string;
  protocol: string;
  status: string;
};

export function InstancesLibraryPage() {
  const [tickets, setTickets] = useState<DevApiTicket[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const nextTickets = await fetchDevTickets();
        if (!active) return;
        setTickets(nextTickets);
      } catch {
        if (!active) return;
        setTickets([]);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  const rows = useMemo<InstanceRow[]>(() => {
    const mapped = tickets
      .filter((ticket) => ticket.instance || ticket.clientName)
      .map((ticket) => ({
        key: `${ticket.id}-${ticket.instance || ticket.clientName}`,
        instance: ticket.instance || '-',
        clientName: ticket.clientName || '-',
        protocol: ticket.proto,
        status: ticket.devStatus,
      }));

    const normalized = query.trim().toLowerCase();
    return mapped.filter((row) =>
      !normalized
        ? true
        : [row.instance, row.clientName, row.protocol, row.status].join(' ').toLowerCase().includes(normalized),
    );
  }, [query, tickets]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="mb-6">
        <h1 className="text-[20px] font-extrabold tracking-[-0.4px] text-[#0f172a]">Biblioteca de Instâncias</h1>
        <p className="mt-0.5 text-[13px] text-[#64748b]">
          Consulte instâncias vinculadas às demandas de desenvolvimento.
        </p>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-[8px] border border-[#e2e8f0] bg-white px-4 py-3 shadow-sm">
        <Search className="size-4 text-[#64748b]" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por instância, cliente ou protocolo" className="w-full border-none bg-transparent text-[13px] outline-none" />
      </div>

      <div className="overflow-hidden rounded-[14px] border border-[#e2e8f0] bg-white shadow-sm">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-[#f8fafc]">
              {['Instância', 'Cliente', 'Protocolo', 'Status'].map((column) => (
                <th key={column} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[.06em] text-[#64748b]">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row) => (
                <tr key={row.key} className="border-t border-[#e2e8f0]">
                  <td className="px-4 py-3 text-[12px] font-semibold text-[#0f172a]">{row.instance}</td>
                  <td className="px-4 py-3 text-[12px] text-[#475569]">{row.clientName}</td>
                  <td className="px-4 py-3 text-[12px] text-[#475569]">{row.protocol}</td>
                  <td className="px-4 py-3 text-[12px] text-[#475569]">{row.status}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-[13px] text-[#64748b]">
                  <div className="mb-2 inline-flex size-10 items-center justify-center rounded-full bg-[#f8fafc]">
                    <Boxes className="size-5 text-[#64748b]" />
                  </div>
                  <div>Nenhuma instância disponível.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
