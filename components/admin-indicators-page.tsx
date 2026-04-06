'use client';

import { useMemo, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';

import {
  AppAlert,
  AppEmptyState,
  AppFormLabel,
  AppInput,
  AppPageContent,
  AppPageIntro,
  AppPageShell,
  AppPageToolbar,
  AppPill,
  AppPrimaryButton,
  AppSelect,
  AppSurface,
  AppToolbarButton,
} from '@/components/app-ui-kit';
import {
  type IndicatorRecord,
  useAdminIndicators,
} from '@/components/admin-settings-storage';
import { useCurrentAdminUser } from '@/components/admin-users-storage';
import { ModalShell } from '@/components/modal-shell';

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
      setItems((current) => current.map((item) => (item.id === editingId ? payload : item)));
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
    return <AppEmptyState icon="🔒" title="Apenas Administradores" />;
  }

  return (
    <>
      <AppPageShell>
        <AppPageToolbar
          title="Indicadores"
          actions={
            <AppPrimaryButton onClick={openCreateModal}>
              <Plus className="size-4" />
              Novo Indicador
            </AppPrimaryButton>
          }
        />

        <AppPageContent>
          <AppPageIntro
            title="Indicadores"
            subtitle="Comissao calculada sobre o valor de setup fechado"
          />

          {items.length ? (
            <AppSurface className="overflow-hidden">
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
                      <tr key={item.id} className="border-b border-[#e2e8f0] last:border-b-0">
                        <td className="px-4 py-3">
                          <div className="text-[13px] font-bold text-[#0f172a]">{item.name}</div>
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
                          <AppPill className="border-[#bfdbfe] bg-[#eff6ff] text-[#2563eb]">
                            {item.percentSetup}%
                          </AppPill>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-[5px]">
                            <AppToolbarButton onClick={() => openEditModal(item)}>
                              <Pencil className="size-3.5" />
                            </AppToolbarButton>
                            <AppToolbarButton
                              onClick={() => handleDelete(item.id)}
                              className="text-[#dc2626] hover:border-[#dc2626] hover:text-[#dc2626]"
                            >
                              <Trash2 className="size-3.5" />
                            </AppToolbarButton>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </AppSurface>
          ) : (
            <AppEmptyState
              icon="🤝"
              title="Nenhum indicador cadastrado"
              description='Clique em "+ Novo Indicador" para comecar.'
            />
          )}
        </AppPageContent>
      </AppPageShell>

      <ModalShell
        open={open}
        title={editingItem ? 'Editar Indicador' : 'Novo Indicador'}
        description="Cadastre os dados de contato, repasse e pagamento."
        maxWidthClassName="max-w-[720px]"
        onClose={closeModal}
        footer={
          <>
            <AppToolbarButton onClick={closeModal}>Cancelar</AppToolbarButton>
            <AppPrimaryButton onClick={handleSave} className="rounded-[8px] px-4 py-[10px] text-[13px]">
              Salvar
            </AppPrimaryButton>
          </>
        }
      >
        <div className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-[5px]">
              <AppFormLabel>Nome</AppFormLabel>
              <AppInput
                value={draft.name}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, name: event.target.value }))
                }
              />
            </div>
            <div className="grid gap-4 md:grid-cols-[120px_1fr]">
              <div className="flex flex-col gap-[5px]">
                <AppFormLabel>Documento</AppFormLabel>
                <AppSelect
                  value={draft.docType}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      docType: event.target.value as IndicatorDraft['docType'],
                    }))
                  }
                >
                  <option value="CPF">CPF</option>
                  <option value="CNPJ">CNPJ</option>
                </AppSelect>
              </div>
              <div className="flex flex-col gap-[5px]">
                <AppFormLabel>Numero</AppFormLabel>
                <AppInput
                  value={draft.docNumber}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      docNumber: event.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex flex-col gap-[5px]">
              <AppFormLabel>Contato</AppFormLabel>
              <AppInput
                value={draft.contact}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, contact: event.target.value }))
                }
              />
            </div>
            <div className="flex flex-col gap-[5px]">
              <AppFormLabel>Email</AppFormLabel>
              <AppInput
                value={draft.email}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, email: event.target.value }))
                }
              />
            </div>
            <div className="flex flex-col gap-[5px]">
              <AppFormLabel>% Setup</AppFormLabel>
              <AppInput
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
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex flex-col gap-[5px]">
              <AppFormLabel>Banco</AppFormLabel>
              <AppInput
                value={draft.bank}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, bank: event.target.value }))
                }
              />
            </div>
            <div className="flex flex-col gap-[5px]">
              <AppFormLabel>Agencia</AppFormLabel>
              <AppInput
                value={draft.agency}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, agency: event.target.value }))
                }
              />
            </div>
            <div className="flex flex-col gap-[5px]">
              <AppFormLabel>Conta</AppFormLabel>
              <AppInput
                value={draft.account}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, account: event.target.value }))
                }
              />
            </div>
          </div>

          <div className="flex flex-col gap-[5px]">
            <AppFormLabel>PIX</AppFormLabel>
            <AppInput
              value={draft.pixKey}
              onChange={(event) =>
                setDraft((current) => ({ ...current, pixKey: event.target.value }))
              }
            />
          </div>

          {errorMessage ? <AppAlert tone="danger">{errorMessage}</AppAlert> : null}
        </div>
      </ModalShell>
    </>
  );
}
