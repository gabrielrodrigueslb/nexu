'use client';

import { useMemo, useState } from 'react';
import { Pencil, Plus, Trash2, Lock, TrendingUp } from 'lucide-react';

import {
  type IndicatorRecord,
  useAdminIndicators,
} from '@/components/admin-settings-storage';
import { useCurrentAdminUser } from '@/components/admin-users-storage';
import { ModalShell } from '@/components/modal-shell';
import { hasModuleAccess } from '@/lib/auth';

type IndicatorDraft = {
  name: string;
  docType: 'CPF' | 'CNPJ';
  docNumber: string;
  contact: string;
  email: string;
  percentSetup: string;
  bank: string;
  agency: string;
  account: string;
  pixKey: string;
};
const EMPTY_DRAFT: IndicatorDraft = {
  name: '',
  docType: 'CPF',
  docNumber: '',
  contact: '',
  email: '',
  percentSetup: '',
  bank: '',
  agency: '',
  account: '',
  pixKey: '',
};

function toDraft(indicator: IndicatorRecord | null): IndicatorDraft {
  if (!indicator) return EMPTY_DRAFT;
  return {
    name: indicator.name,
    docType: indicator.docType,
    docNumber: indicator.docNumber ?? '',
    contact: indicator.contact ?? '',
    email: indicator.email ?? '',
    percentSetup: String(indicator.percentSetup || ''),
    bank: indicator.bank ?? '',
    agency: indicator.agency ?? '',
    account: indicator.account ?? '',
    pixKey: indicator.pixKey ?? '',
  };
}
function FormLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1 block text-[11px] font-bold tracking-[.06em] text-[#64748b] uppercase">
      {children}
    </label>
  );
}

export function AdminIndicatorsPage() {
  const {
    items,
    isLoading,
    error,
    createIndicator,
    updateIndicator,
    deleteIndicator,
  } = useAdminIndicators();
  const { access } = useCurrentAdminUser();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<IndicatorDraft>(EMPTY_DRAFT);
  const [open, setOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const editingItem = useMemo(
    () => items.find((item) => item.id === editingId) ?? null,
    [editingId, items],
  );
  const canView = hasModuleAccess(access, 'CADASTROS', 'view');
  const canEdit = hasModuleAccess(access, 'CADASTROS', 'edit');
  const canManage = hasModuleAccess(access, 'CADASTROS', 'manage');

  function openCreateModal() {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setErrorMessage('');
    setOpen(true);
  }
  function openEditModal(item: IndicatorRecord) {
    setEditingId(item.id);
    setDraft(toDraft(item));
    setErrorMessage('');
    setOpen(true);
  }
  function closeModal() {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setErrorMessage('');
    setOpen(false);
  }
  async function handleSave() {
    const normalizedName = draft.name.trim();
    const percentSetup = Number(draft.percentSetup);
    if (!normalizedName) {
      setErrorMessage('Informe o nome.');
      return;
    }
    if (
      !Number.isFinite(percentSetup) ||
      percentSetup <= 0 ||
      percentSetup > 100
    ) {
      setErrorMessage('Informe uma porcentagem valida entre 0 e 100.');
      return;
    }
    const payload: Omit<IndicatorRecord, 'id' | 'createdAt'> = {
      name: normalizedName,
      docType: draft.docType,
      docNumber: draft.docNumber.trim() || undefined,
      contact: draft.contact.trim() || undefined,
      email: draft.email.trim() || undefined,
      percentSetup,
      bank: draft.bank.trim() || undefined,
      agency: draft.agency.trim() || undefined,
      account: draft.account.trim() || undefined,
      pixKey: draft.pixKey.trim() || undefined,
      active: editingItem?.active ?? true,
    };
    setIsSaving(true);
    setErrorMessage('');
    try {
      if (editingId) {
        await updateIndicator(editingId, payload);
      } else {
        await createIndicator(payload);
      }
      closeModal();
    } catch (nextError) {
      setErrorMessage(
        nextError instanceof Error
          ? nextError.message
          : 'Falha ao salvar indicador.',
      );
    } finally {
      setIsSaving(false);
    }
  }
  async function handleDelete(itemId: string) {
    if (!window.confirm('Mover indicador para a lixeira?')) return;
    try {
      await deleteIndicator(itemId);
      setErrorMessage('');
    } catch (nextError) {
      setErrorMessage(
        nextError instanceof Error
          ? nextError.message
          : 'Falha ao excluir indicador.',
      );
    }
  }

  if (!canView)
    return (
      <div className="mt-4 rounded-[16px] border border-dashed border-[#cbd5e1] bg-white px-6 py-12 text-center shadow-sm">
        <div className="mx-auto mb-3 inline-flex size-14 items-center justify-center rounded-full bg-[#f1f5f9] text-[#64748b]">
          <Lock className="size-6" />
        </div>
        <div className="text-[16px] font-bold text-[#0f172a]">
          Acesso Negado
        </div>
        <div className="mt-1 text-[13px] text-[#64748b]">
          Sem permissão para o módulo de cadastros.
        </div>
      </div>
    );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-[20px] font-extrabold tracking-[-0.4px] text-[#0f172a]">
            Indicadores
          </h1>
          <p className="mt-0.5 text-[13px] text-[#64748b]">
            Comissão calculada sobre o valor de setup fechado
          </p>
        </div>
        {canEdit && (
          <button
            onClick={openCreateModal}
            className="inline-flex h-9 items-center gap-2 rounded-[8px] bg-[#2563eb] px-4 text-[13px] font-semibold text-white shadow-sm hover:bg-[#1d4ed8]"
          >
            <Plus className="size-4" /> Novo Indicador
          </button>
        )}
      </div>

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

      <div className="overflow-hidden rounded-[10px] border border-[#e2e8f0] bg-white shadow-sm">
        {isLoading ? (
          <div className="px-4 py-8 text-[13px] text-[#64748b]">
            Carregando...
          </div>
        ) : items.length ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
                  <th className="px-4 py-3 text-[11px] font-bold tracking-[.06em] text-[#64748b] uppercase">
                    Nome / Documento
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold tracking-[.06em] text-[#64748b] uppercase">
                    Contato
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold tracking-[.06em] text-[#64748b] uppercase">
                    Dados Pagamento
                  </th>
                  <th className="w-[110px] px-4 py-3 text-[11px] font-bold tracking-[.06em] text-[#64748b] uppercase">
                    % Setup
                  </th>
                  <th className="w-[96px] px-4 py-3 text-[11px] font-bold tracking-[.06em] text-[#64748b] uppercase">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-[#e2e8f0] last:border-b-0 hover:bg-[#f8fafc] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="text-[13px] font-bold text-[#0f172a]">
                        {item.name}
                      </div>
                      {item.docNumber && (
                        <div className="text-[11px] text-[#64748b]">
                          {item.docType}: {item.docNumber}
                        </div>
                      )}
                      {item.email && (
                        <div className="text-[11px] text-[#64748b]">
                          {item.email}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-[#0f172a]">
                      {item.contact || '-'}
                    </td>
                    <td className="px-4 py-3 text-[12px] leading-[1.6] text-[#0f172a]">
                      {item.bank && (
                        <div>
                          <strong>{item.bank}</strong> Ag {item.agency || '-'} /
                          Cc {item.account || '-'}
                        </div>
                      )}
                      {item.pixKey && <div>PIX: {item.pixKey}</div>}
                      {!item.bank && !item.pixKey && (
                        <span className="text-[#64748b]">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-[6px] bg-[#eff6ff] border border-[#bfdbfe] px-2 py-0.5 text-[11px] font-bold text-[#2563eb]">
                        {item.percentSetup}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center gap-1.5">
                        {canEdit && (
                          <button
                            onClick={() => openEditModal(item)}
                            className="inline-flex size-8 items-center justify-center rounded-[6px] border border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f1f5f9]"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                        )}
                        {canManage && (
                          <button
                            onClick={() => void handleDelete(item.id)}
                            className="inline-flex size-8 items-center justify-center rounded-[6px] border border-[#fecaca] bg-[#fef2f2] text-[#dc2626] hover:bg-[#fee2e2]"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-[12px] px-6 py-12 text-center">
            <div className="mx-auto mb-3 inline-flex size-14 items-center justify-center rounded-full bg-[#eff6ff] text-[#2563eb]">
              <TrendingUp className="size-6" />
            </div>
            <div className="mt-3 text-[15px] font-bold text-[#0f172a]">
              Nenhum indicador cadastrado
            </div>
            <div className="mt-1 text-[13px] text-[#64748b]">
              Clique em "Novo Indicador" para começar.
            </div>
          </div>
        )}
      </div>

      <ModalShell
        open={open}
        title={editingItem ? 'Editar Indicador' : 'Novo Indicador'}
        maxWidthClassName="max-w-[720px]"
        onClose={closeModal}
        footer={
          <div className="flex w-full justify-end gap-2">
            <button
              onClick={closeModal}
              className="h-9 rounded-[8px] border border-[#e2e8f0] bg-white px-4 text-[13px] font-semibold text-[#64748b] hover:bg-[#f8fafc]"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="h-9 rounded-[8px] bg-[#2563eb] px-4 text-[13px] font-semibold text-white hover:bg-[#1d4ed8]"
            >
              {isSaving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        }
      >
        <div className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <FormLabel>Nome</FormLabel>
              <input
                value={draft.name}
                onChange={(e) =>
                  setDraft((c) => ({ ...c, name: e.target.value }))
                }
                className="h-9 w-full rounded-[6px] border border-[#e2e8f0] bg-[#f8fafc] px-3 text-[13px] outline-none focus:border-[#2563eb] focus:bg-white"
              />
            </div>
            <div className="grid gap-4 grid-cols-[120px_1fr]">
              <div>
                <FormLabel>Documento</FormLabel>
                <select
                  value={draft.docType}
                  onChange={(e) =>
                    setDraft((c) => ({
                      ...c,
                      docType: e.target.value as 'CPF' | 'CNPJ',
                    }))
                  }
                  className="h-9 w-full rounded-[6px] border border-[#e2e8f0] bg-[#f8fafc] px-3 text-[13px] outline-none focus:border-[#2563eb] focus:bg-white"
                >
                  <option value="CPF">CPF</option>
                  <option value="CNPJ">CNPJ</option>
                </select>
              </div>
              <div>
                <FormLabel>Número</FormLabel>
                <input
                  value={draft.docNumber}
                  onChange={(e) =>
                    setDraft((c) => ({ ...c, docNumber: e.target.value }))
                  }
                  className="h-9 w-full rounded-[6px] border border-[#e2e8f0] bg-[#f8fafc] px-3 text-[13px] outline-none focus:border-[#2563eb] focus:bg-white"
                />
              </div>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <FormLabel>Contato</FormLabel>
              <input
                value={draft.contact}
                onChange={(e) =>
                  setDraft((c) => ({ ...c, contact: e.target.value }))
                }
                className="h-9 w-full rounded-[6px] border border-[#e2e8f0] bg-[#f8fafc] px-3 text-[13px] outline-none focus:border-[#2563eb] focus:bg-white"
              />
            </div>
            <div>
              <FormLabel>Email</FormLabel>
              <input
                value={draft.email}
                onChange={(e) =>
                  setDraft((c) => ({ ...c, email: e.target.value }))
                }
                className="h-9 w-full rounded-[6px] border border-[#e2e8f0] bg-[#f8fafc] px-3 text-[13px] outline-none focus:border-[#2563eb] focus:bg-white"
              />
            </div>
            <div>
              <FormLabel>% Setup</FormLabel>
              <input
                type="number"
                step="0.01"
                value={draft.percentSetup}
                onChange={(e) =>
                  setDraft((c) => ({ ...c, percentSetup: e.target.value }))
                }
                className="h-9 w-full rounded-[6px] border border-[#e2e8f0] bg-[#f8fafc] px-3 text-[13px] outline-none focus:border-[#2563eb] focus:bg-white"
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <FormLabel>Banco</FormLabel>
              <input
                value={draft.bank}
                onChange={(e) =>
                  setDraft((c) => ({ ...c, bank: e.target.value }))
                }
                className="h-9 w-full rounded-[6px] border border-[#e2e8f0] bg-[#f8fafc] px-3 text-[13px] outline-none focus:border-[#2563eb] focus:bg-white"
              />
            </div>
            <div>
              <FormLabel>Agência</FormLabel>
              <input
                value={draft.agency}
                onChange={(e) =>
                  setDraft((c) => ({ ...c, agency: e.target.value }))
                }
                className="h-9 w-full rounded-[6px] border border-[#e2e8f0] bg-[#f8fafc] px-3 text-[13px] outline-none focus:border-[#2563eb] focus:bg-white"
              />
            </div>
            <div>
              <FormLabel>Conta</FormLabel>
              <input
                value={draft.account}
                onChange={(e) =>
                  setDraft((c) => ({ ...c, account: e.target.value }))
                }
                className="h-9 w-full rounded-[6px] border border-[#e2e8f0] bg-[#f8fafc] px-3 text-[13px] outline-none focus:border-[#2563eb] focus:bg-white"
              />
            </div>
          </div>
          <div>
            <FormLabel>Chave PIX</FormLabel>
            <input
              value={draft.pixKey}
              onChange={(e) =>
                setDraft((c) => ({ ...c, pixKey: e.target.value }))
              }
              className="h-9 w-full rounded-[6px] border border-[#e2e8f0] bg-[#f8fafc] px-3 text-[13px] outline-none focus:border-[#2563eb] focus:bg-white"
            />
          </div>
        </div>
      </ModalShell>
    </div>
  );
}
