'use client';

import { useMemo, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';

import {
  type IndicatorRecord,
  useAdminIndicators,
} from '@/components/admin-settings-storage';
import { useCurrentAdminUser } from '@/components/admin-users-storage';
import { ModalShell } from '@/components/modal-shell';
import { cn } from '@/lib/utils';

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

function FormLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[11px] font-bold tracking-[.06em] text-[#64748b] uppercase">
      {children}
    </label>
  );
}

function inputClassName() {
  return 'w-full rounded-[7px] border-[1.5px] border-[#e2e8f0] bg-[#f8fafc] px-3 py-[9px] text-[13px] text-[#0f172a] outline-none transition-colors focus:border-[#2563eb]';
}

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

export function AdminIndicatorsPage() {
  const [items, setItems] = useAdminIndicators();
  const { currentUser } = useCurrentAdminUser();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<IndicatorDraft>(EMPTY_DRAFT);
  const [open, setOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const editingItem = useMemo(
    () => items.find((item) => item.id === editingId) ?? null,
    [editingId, items],
  );

  const canManage = currentUser.role === 'admin';

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

  function handleSave() {
    const normalizedName = draft.name.trim();
    const percentSetup = Number(draft.percentSetup);

    if (!normalizedName) {
      setErrorMessage('Informe o nome.');
      return;
    }

    if (!percentSetup || percentSetup <= 0 || percentSetup > 100) {
      setErrorMessage('Informe uma % valida entre 0 e 100.');
      return;
    }

    const payload: IndicatorRecord = {
      id: editingId ?? `indicator-${Date.now()}`,
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
      createdAt: editingItem?.createdAt ?? new Date().toISOString().slice(0, 10),
    };

    if (editingId) {
      setItems((current) =>
        current.map((item) => (item.id === editingId ? payload : item)),
      );
    } else {
      setItems((current) => [...current, payload]);
    }

    closeModal();
  }

  function handleDelete(itemId: string) {
    if (!window.confirm('Remover indicador?')) return;
    setItems((current) => current.filter((item) => item.id !== itemId));
  }

  if (!canManage) {
    return (
      <div className="rounded-[12px] border border-dashed border-[#cbd5e1] bg-white px-6 py-12 text-center">
        <div className="text-[28px] leading-none">🔒</div>
        <div className="mt-3 text-[18px] font-bold text-[#0f172a]">
          Apenas Administradores
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="-mx-4 -my-6 md:-mx-6 lg:-mx-8 lg:-my-8">
        <div className="sticky top-0 z-20 flex min-h-14 items-center gap-4 border-b border-[#e2e8f0] bg-white px-6">
          <strong className="text-[15px] font-bold text-[#0f172a]">Indicadores</strong>
          <div className="ml-auto flex flex-wrap items-center gap-2 py-3">
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-[6px] rounded-[6px] bg-[#2563eb] px-3 py-[6px] text-[12px] font-semibold text-white transition-colors hover:bg-[#1d4ed8]"
            >
              <Plus className="size-4" />
              Novo Indicador
            </button>
          </div>
        </div>

        <div className="bg-[#f1f5f9] px-6 py-6">
          <div className="mb-4">
            <div className="text-[26px] font-extrabold tracking-[-0.03em] text-[#0f172a]">
              Indicadores
            </div>
            <div className="mt-2 text-[12px] text-[#64748b]">
              Comissao calculada sobre o valor de setup fechado
            </div>
          </div>

          {items.length ? (
            <div className="overflow-hidden rounded-[12px] border border-[#e2e8f0] bg-white">
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
                      <th className="px-4 py-3 text-left text-[12px] font-bold text-[#64748b]">
                        Nome / Documento
                      </th>
                      <th className="px-4 py-3 text-left text-[12px] font-bold text-[#64748b]">
                        Contato
                      </th>
                      <th className="px-4 py-3 text-left text-[12px] font-bold text-[#64748b]">
                        Dados de Pagamento
                      </th>
                      <th className="w-[110px] px-4 py-3 text-left text-[12px] font-bold text-[#64748b]">
                        % Setup
                      </th>
                      <th className="w-[96px] px-4 py-3 text-left text-[12px] font-bold text-[#64748b]">
                        Acoes
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-[#e2e8f0] last:border-b-0"
                      >
                        <td className="px-4 py-3">
                          <div className="text-[13px] font-bold text-[#0f172a]">
                            {item.name}
                          </div>
                          {item.docNumber ? (
                            <div className="text-[11px] text-[#64748b]">
                              {item.docType}: {item.docNumber}
                            </div>
                          ) : null}
                          {item.email ? (
                            <div className="text-[11px] text-[#64748b]">{item.email}</div>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 text-[12px] text-[#0f172a]">
                          {item.contact || '—'}
                        </td>
                        <td className="px-4 py-3 text-[12px] leading-[1.6] text-[#0f172a]">
                          {item.bank ? (
                            <div>
                              <strong>{item.bank}</strong> Ag {item.agency || '—'} / Cc{' '}
                              {item.account || '—'}
                            </div>
                          ) : null}
                          {item.pixKey ? <div>PIX: {item.pixKey}</div> : null}
                          {!item.bank && !item.pixKey ? (
                            <span className="text-[#64748b]">—</span>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-[10px] py-[4px] text-[13px] font-bold text-[#2563eb]">
                            {item.percentSetup}%
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-[5px]">
                            <ToolbarButton onClick={() => openEditModal(item)}>
                              <Pencil className="size-3.5" />
                            </ToolbarButton>
                            <ToolbarButton
                              onClick={() => handleDelete(item.id)}
                              className="text-[#dc2626] hover:border-[#dc2626] hover:text-[#dc2626]"
                            >
                              <Trash2 className="size-3.5" />
                            </ToolbarButton>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="rounded-[12px] border border-dashed border-[#cbd5e1] bg-white px-6 py-12 text-center">
              <div className="text-[28px] leading-none">🤝</div>
              <div className="mt-3 text-[18px] font-bold text-[#0f172a]">
                Nenhum indicador cadastrado
              </div>
              <div className="mt-1 text-[13px] text-[#64748b]">
                Clique em &quot;+ Novo Indicador&quot; para comecar.
              </div>
            </div>
          )}
        </div>
      </div>

      <ModalShell
        open={open}
        title={editingItem ? 'Editar Indicador' : 'Novo Indicador'}
        description="Cadastre os dados de contato, repasse e pagamento."
        maxWidthClassName="max-w-[720px]"
        onClose={closeModal}
        footer={
          <>
            <ToolbarButton onClick={closeModal}>Cancelar</ToolbarButton>
            <button
              type="button"
              onClick={handleSave}
              className="rounded-[8px] bg-[#2563eb] px-4 py-[10px] text-[13px] font-semibold text-white transition-colors hover:bg-[#1d4ed8]"
            >
              Salvar
            </button>
          </>
        }
      >
        <div className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-[5px]">
              <FormLabel>Nome</FormLabel>
              <input
                value={draft.name}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, name: event.target.value }))
                }
                className={inputClassName()}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-[120px_1fr]">
              <div className="flex flex-col gap-[5px]">
                <FormLabel>Documento</FormLabel>
                <select
                  value={draft.docType}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      docType: event.target.value as IndicatorDraft['docType'],
                    }))
                  }
                  className={inputClassName()}
                >
                  <option value="CPF">CPF</option>
                  <option value="CNPJ">CNPJ</option>
                </select>
              </div>
              <div className="flex flex-col gap-[5px]">
                <FormLabel>Numero</FormLabel>
                <input
                  value={draft.docNumber}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      docNumber: event.target.value,
                    }))
                  }
                  className={inputClassName()}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex flex-col gap-[5px]">
              <FormLabel>Contato</FormLabel>
              <input
                value={draft.contact}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, contact: event.target.value }))
                }
                className={inputClassName()}
              />
            </div>
            <div className="flex flex-col gap-[5px]">
              <FormLabel>Email</FormLabel>
              <input
                value={draft.email}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, email: event.target.value }))
                }
                className={inputClassName()}
              />
            </div>
            <div className="flex flex-col gap-[5px]">
              <FormLabel>% Setup</FormLabel>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={draft.percentSetup}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    percentSetup: event.target.value,
                  }))
                }
                className={inputClassName()}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex flex-col gap-[5px]">
              <FormLabel>Banco</FormLabel>
              <input
                value={draft.bank}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, bank: event.target.value }))
                }
                className={inputClassName()}
              />
            </div>
            <div className="flex flex-col gap-[5px]">
              <FormLabel>Agencia</FormLabel>
              <input
                value={draft.agency}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, agency: event.target.value }))
                }
                className={inputClassName()}
              />
            </div>
            <div className="flex flex-col gap-[5px]">
              <FormLabel>Conta</FormLabel>
              <input
                value={draft.account}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, account: event.target.value }))
                }
                className={inputClassName()}
              />
            </div>
          </div>

          <div className="flex flex-col gap-[5px]">
            <FormLabel>PIX</FormLabel>
            <input
              value={draft.pixKey}
              onChange={(event) =>
                setDraft((current) => ({ ...current, pixKey: event.target.value }))
              }
              className={inputClassName()}
            />
          </div>

          {errorMessage ? (
            <div className="rounded-[8px] border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-[12px] font-medium text-[#dc2626]">
              {errorMessage}
            </div>
          ) : null}
        </div>
      </ModalShell>
    </>
  );
}
