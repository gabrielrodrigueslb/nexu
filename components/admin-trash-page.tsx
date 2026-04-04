'use client';

import { useState } from 'react';
import { RotateCcw, Trash2 } from 'lucide-react';

import { type TrashRecord, useAdminTrash } from '@/components/admin-settings-storage';
import { useCurrentAdminUser } from '@/components/admin-users-storage';
import { cn } from '@/lib/utils';

function ToolbarButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center gap-[6px] rounded-[6px] border border-[#e2e8f0] bg-white px-3 py-[6px] text-[12px] font-semibold text-[#64748b] transition-colors hover:border-[#2563eb] hover:text-[#2563eb]',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString('pt-BR');
}

function sourceLabel(source: TrashRecord['source']) {
  return source === 'commercial' ? 'Comercial' : 'Dev';
}

export function AdminTrashPage() {
  const [items, setItems] = useAdminTrash();
  const { currentUser } = useCurrentAdminUser();
  const [message, setMessage] = useState('');

  const canAccess = currentUser.role === 'admin' || currentUser.role === 'supervisor';
  const canHardDelete = currentUser.role === 'admin';

  function handleRestore(itemId: string) {
    if (!window.confirm('Restaurar este ticket?')) return;

    setItems((current) => {
      const targetItem = current.find((item) => item.id === itemId);

      if (
        targetItem?.restoreTarget &&
        targetItem.payload &&
        typeof window !== 'undefined'
      ) {
        try {
          const raw = window.localStorage.getItem(targetItem.restoreTarget);
          const parsed = raw ? JSON.parse(raw) : [];
          const next = Array.isArray(parsed) ? [...parsed, targetItem.payload] : [targetItem.payload];

          window.localStorage.setItem(targetItem.restoreTarget, JSON.stringify(next));
        } catch {
          // Keep the restore action resilient even if the destination payload is not available.
        }
      }

      return current.filter((item) => item.id !== itemId);
    });
    setMessage('Ticket restaurado.');
  }

  function handleHardDelete(itemId: string) {
    if (!window.confirm('Excluir permanentemente este ticket?')) return;

    setItems((current) => current.filter((item) => item.id !== itemId));
    setMessage('Item excluido permanentemente.');
  }

  if (!canAccess) {
    return (
      <div className="rounded-[12px] border border-dashed border-[#cbd5e1] bg-white px-6 py-12 text-center">
        <div className="text-[28px] leading-none">🔒</div>
        <div className="mt-3 text-[18px] font-bold text-[#0f172a]">Acesso Negado</div>
      </div>
    );
  }

  return (
    <div className="-mx-4 -my-6 md:-mx-6 lg:-mx-8 lg:-my-8">
      <div className="sticky top-0 z-20 flex min-h-14 items-center gap-4 border-b border-[#e2e8f0] bg-white px-6">
        <strong className="text-[15px] font-bold text-[#0f172a]">Lixeira</strong>
      </div>

      <div className="bg-[#f1f5f9] px-6 py-6">
        <div className="mb-4">
          <div className="text-[26px] font-extrabold tracking-[-0.03em] text-[#0f172a]">
            Lixeira de Auditoria
          </div>
          <div className="mt-2 text-[12px] text-[#64748b]">
            {items.length} ticket(s) cancelados
          </div>
        </div>

        {message ? (
          <div className="mb-4 rounded-[8px] border border-[#bfdbfe] bg-[#eff6ff] px-3 py-2 text-[12px] font-medium text-[#1d4ed8]">
            {message}
          </div>
        ) : null}

        {items.length ? (
          <div className="flex flex-col gap-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-[10px] border border-[#e2e8f0] bg-white p-[14px]"
              >
                <div className="mb-2 flex items-start gap-3">
                  <div className="flex-1">
                    <div className="text-[14px] font-bold text-[#0f172a]">
                      {item.title || '—'}
                    </div>
                    <div className="font-mono text-[11px] text-[#64748b]">
                      {item.proto || '—'} · {sourceLabel(item.source)}
                    </div>
                  </div>
                  <span className="inline-flex rounded-full border border-[#fecaca] bg-[#fef2f2] px-[10px] py-[4px] text-[11px] font-bold text-[#dc2626]">
                    Cancelado
                  </span>
                </div>

                <div className="mb-2 rounded-[6px] border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-[12px] text-[#0f172a]">
                  <strong>Motivo:</strong> {item.cancelReason || '—'}
                </div>

                <div className="mb-3 text-[11px] text-[#64748b]">
                  Cancelado por <strong>{item.canceledBy || '?'}</strong> em{' '}
                  {formatDateTime(item.canceledAt)}
                </div>

                <div className="flex flex-wrap gap-2">
                  <ToolbarButton onClick={() => handleRestore(item.id)}>
                    <RotateCcw className="size-3.5" />
                    Restaurar
                  </ToolbarButton>
                  {canHardDelete ? (
                    <ToolbarButton
                      onClick={() => handleHardDelete(item.id)}
                      className="text-[#dc2626] hover:border-[#dc2626] hover:text-[#dc2626]"
                    >
                      <Trash2 className="size-3.5" />
                      Excluir Permanente
                    </ToolbarButton>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[12px] border border-dashed border-[#cbd5e1] bg-white px-6 py-12 text-center">
            <div className="text-[28px] leading-none">🗑️</div>
            <div className="mt-3 text-[18px] font-bold text-[#0f172a]">
              Lixeira vazia
            </div>
            <div className="mt-1 text-[13px] text-[#64748b]">
              Tickets cancelados aparecem aqui.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
