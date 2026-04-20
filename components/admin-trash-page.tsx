'use client';

import { useState } from 'react';
import { RotateCcw, Trash2, Lock, Trash } from 'lucide-react';

import { useAdminTrash } from '@/components/admin-settings-storage';
import { useCurrentAdminUser } from '@/components/admin-users-storage';
import { hasModuleAccess } from '@/lib/auth';

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('pt-BR');
}
function moduleLabel(moduleKey: string) {
  const labels: Record<string, string> = {
    COMMERCIAL: 'Comercial',
    CADASTROS: 'Cadastros',
    IMPLANTACAO: 'Implantação',
    LIXEIRA: 'Lixeira',
    SUPORTE: 'Suporte',
    DESENVOLVIMENTO: 'Desenvolvimento',
    FINANCEIRO: 'Financeiro',
    USUARIOS: 'Usuários',
  };
  return labels[moduleKey] || moduleKey;
}

export function AdminTrashPage() {
  const { items, isLoading, error, restoreItem, deleteForever } =
    useAdminTrash();
  const { access } = useCurrentAdminUser();
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const canAccess = hasModuleAccess(access, 'LIXEIRA', 'view');
  const canRestore = hasModuleAccess(access, 'LIXEIRA', 'edit');
  const canHardDelete = hasModuleAccess(access, 'LIXEIRA', 'manage');

  async function handleRestore(itemId: string) {
    if (!window.confirm('Restaurar este item?')) return;
    try {
      await restoreItem(itemId);
      setMessage('Item restaurado com sucesso.');
      setErrorMessage('');
    } catch (e: any) {
      setErrorMessage(e.message || 'Falha.');
    }
  }
  async function handleHardDelete(itemId: string) {
    if (!window.confirm('Excluir permanentemente?')) return;
    try {
      await deleteForever(itemId);
      setMessage('Item excluido permanentemente.');
      setErrorMessage('');
    } catch (e: any) {
      setErrorMessage(e.message || 'Falha.');
    }
  }

  if (!canAccess)
    return (
      <div className="mt-4 rounded-[16px] border border-dashed border-[#cbd5e1] bg-white px-6 py-12 text-center shadow-sm">
        <div className="mx-auto mb-3 inline-flex size-14 items-center justify-center rounded-full bg-[#f1f5f9] text-[#64748b]">
          <Lock className="size-6" />
        </div>
        <div className="text-[16px] font-bold text-[#0f172a]">
          Acesso Negado
        </div>
        <div className="mt-1 text-[13px] text-[#64748b]">
          Sem permissão para o módulo de lixeira.
        </div>
      </div>
    );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-[20px] font-extrabold tracking-[-0.4px] text-[#0f172a]">
            Lixeira de Auditoria
          </h1>
          <p className="mt-0.5 text-[13px] text-[#64748b]">
            {items.length} item(ns) removidos recentemente
          </p>
        </div>
      </div>

      {message && (
        <div className="mb-4 rounded-[8px] border border-[#bfdbfe] bg-[#eff6ff] px-4 py-3 text-[13px] font-semibold text-[#1d4ed8]">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-[8px] border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-[13px] font-semibold text-[#dc2626]">
          {error}
        </div>
      )}
      {errorMessage && (
        <div className="mb-4 rounded-[8px] border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-[13px] font-semibold text-[#dc2626]">
          {errorMessage}
        </div>
      )}

      {isLoading ? (
        <div className="rounded-[10px] border border-[#e2e8f0] bg-white p-6 text-[13px] text-[#64748b]">
          Carregando...
        </div>
      ) : items.length ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col justify-between rounded-[10px] border border-[#e2e8f0] bg-white p-4 shadow-sm transition-all hover:border-[#fecaca] hover:shadow-md"
            >
              <div>
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] font-bold text-[#0f172a]">
                      {item.label || item.entityId}
                    </div>
                    <div className="font-mono text-[11px] font-semibold text-[#64748b]">
                      {item.entityType} · {moduleLabel(item.moduleKey)}
                    </div>
                  </div>
                  <span className="shrink-0 rounded-[6px] bg-[#fef2f2] border border-[#fecaca] px-2 py-0.5 text-[10px] font-bold text-[#dc2626]">
                    Removido
                  </span>
                </div>
                <div className="mb-3 rounded-[6px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 text-[12px] text-[#475569]">
                  <span className="font-bold text-[#0f172a]">ID:</span>{' '}
                  {item.entityId}
                </div>
                <div className="mb-4 text-[12px] text-[#64748b]">
                  Excluído por{' '}
                  <strong className="text-[#0f172a]">
                    {item.deletedById || '?'}
                  </strong>{' '}
                  em {formatDateTime(item.deletedAt)}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-[#f1f5f9]">
                {canRestore && (
                  <button
                    onClick={() => void handleRestore(item.id)}
                    className="inline-flex h-8 flex-1 items-center justify-center gap-2 rounded-[6px] border border-[#e2e8f0] bg-white text-[12px] font-semibold text-[#0f172a] hover:bg-[#f8fafc]"
                  >
                    <RotateCcw className="size-3.5" /> Restaurar
                  </button>
                )}
                {canHardDelete && (
                  <button
                    onClick={() => void handleHardDelete(item.id)}
                    className="inline-flex h-8 flex-1 items-center justify-center gap-2 rounded-[6px] bg-[#fef2f2] border border-[#fecaca] text-[12px] font-semibold text-[#dc2626] hover:bg-[#fee2e2]"
                  >
                    <Trash2 className="size-3.5" /> Permanente
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-[12px] border border-dashed border-[#cbd5e1] bg-white px-6 py-12 text-center shadow-sm">
          <div className="mx-auto mb-3 inline-flex size-14 items-center justify-center rounded-full bg-[#f1f5f9] text-[#64748b]">
            <Trash className="size-6" />
          </div>
          <div className="mt-3 text-[15px] font-bold text-[#0f172a]">
            Lixeira vazia
          </div>
          <div className="mt-1 text-[13px] text-[#64748b]">
            Itens removidos aparecem aqui.
          </div>
        </div>
      )}
    </div>
  );
}
