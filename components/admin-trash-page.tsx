'use client';

import { useState } from 'react';
import { RotateCcw, Trash2 } from 'lucide-react';

import {
  AppAlert,
  AppEmptyState,
  AppPageContent,
  AppPageIntro,
  AppPageShell,
  AppPageToolbar,
  AppPill,
  AppToolbarButton,
} from '@/components/app-ui-kit';
import { type TrashRecord, useAdminTrash } from '@/components/admin-settings-storage';
import { useCurrentAdminUser } from '@/components/admin-users-storage';

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

      if (targetItem?.restoreTarget && targetItem.payload && typeof window !== 'undefined') {
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
    return <AppEmptyState icon="🔒" title="Acesso Negado" />;
  }

  return (
    <AppPageShell>
      <AppPageToolbar title="Lixeira" />

      <AppPageContent>
        <AppPageIntro
          title="Lixeira de Auditoria"
          subtitle={`${items.length} ticket(s) cancelados`}
        />

        {message ? <AppAlert tone="info" className="mb-4">{message}</AppAlert> : null}

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
                  <AppPill className="border-[#fecaca] bg-[#fef2f2] text-[#dc2626]">
                    Cancelado
                  </AppPill>
                </div>

                <div className="mb-2 rounded-[6px] border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-[12px] text-[#0f172a]">
                  <strong>Motivo:</strong> {item.cancelReason || '—'}
                </div>

                <div className="mb-3 text-[11px] text-[#64748b]">
                  Cancelado por <strong>{item.canceledBy || '?'}</strong> em{' '}
                  {formatDateTime(item.canceledAt)}
                </div>

                <div className="flex flex-wrap gap-2">
                  <AppToolbarButton onClick={() => handleRestore(item.id)}>
                    <RotateCcw className="size-3.5" />
                    Restaurar
                  </AppToolbarButton>
                  {canHardDelete ? (
                    <AppToolbarButton
                      onClick={() => handleHardDelete(item.id)}
                      className="text-[#dc2626] hover:border-[#dc2626] hover:text-[#dc2626]"
                    >
                      <Trash2 className="size-3.5" />
                      Excluir Permanente
                    </AppToolbarButton>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <AppEmptyState
            icon="🗑️"
            title="Lixeira vazia"
            description="Tickets cancelados aparecem aqui."
          />
        )}
      </AppPageContent>
    </AppPageShell>
  );
}
