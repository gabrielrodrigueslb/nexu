'use client';

import { useMemo, useState } from 'react';
import { Pencil, Plus, Trash2, Lock, ListTodo, UserCircle } from 'lucide-react';

import { ModalShell } from '@/components/modal-shell';
import { useCurrentAdminUser } from '@/components/admin-users-storage';
import { hasModuleAccess } from '@/lib/auth';

type SimpleItem = { id: string; name: string; active: boolean };
type PageType = 'origins' | 'sdrs';

function getMeta(type: PageType) {
  if (type === 'origins') {
    return {
      title: 'Origens CRM',
      subtitle: 'Cadastro de origens de leads',
      primaryLabel: 'Nova Origem',
      modalCreateTitle: 'Nova Origem',
      modalEditTitle: 'Editar Origem',
      emptyTitle: 'Nenhuma origem',
      emptyDescription: 'Clique em "+ Nova" para iniciar',
    };
  }
  return {
    title: 'SDRs',
    subtitle: 'Sales Development Representatives',
    primaryLabel: 'Novo SDR',
    modalCreateTitle: 'Novo SDR',
    modalEditTitle: 'Editar SDR',
    emptyTitle: 'Nenhum SDR',
    emptyDescription: 'Clique em "+ Novo" para iniciar',
  };
}

type AdminSimpleSettingsPageProps<T extends SimpleItem> = {
  type: PageType;
  items: T[];
  isLoading?: boolean;
  error?: string;
  createItem: (
    input: Pick<T, 'name'> & Partial<Pick<T, 'active'>>,
  ) => Promise<void>;
  updateItem: (
    id: string,
    input: Partial<Pick<T, 'name' | 'active'>>,
  ) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
};
function FormLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1 block text-[11px] font-bold tracking-[.06em] text-[#64748b] uppercase">
      {children}
    </label>
  );
}

export function AdminSimpleSettingsPage<T extends SimpleItem>({
  type,
  items,
  isLoading,
  error,
  createItem,
  updateItem,
  deleteItem,
}: AdminSimpleSettingsPageProps<T>) {
  const meta = getMeta(type);
  const { access } = useCurrentAdminUser();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [open, setOpen] = useState(false);

  const editingItem = useMemo(
    () => items.find((item) => item.id === editingId) ?? null,
    [editingId, items],
  );
  const canView = hasModuleAccess(access, 'CADASTROS', 'view');
  const canEdit = hasModuleAccess(access, 'CADASTROS', 'edit');
  const canManage = hasModuleAccess(access, 'CADASTROS', 'manage');

  function openCreateModal() {
    setEditingId(null);
    setDraft('');
    setErrorMessage('');
    setOpen(true);
  }
  function openEditModal(item: T) {
    setEditingId(item.id);
    setDraft(item.name);
    setErrorMessage('');
    setOpen(true);
  }
  function closeModal() {
    setEditingId(null);
    setDraft('');
    setErrorMessage('');
    setOpen(false);
  }
  async function handleSave() {
    const normalizedName = draft.trim();
    if (!normalizedName) {
      setErrorMessage('Informe o nome.');
      return;
    }
    if (
      items.some(
        (item) =>
          item.name.toLowerCase() === normalizedName.toLowerCase() &&
          item.id !== editingId,
      )
    ) {
      setErrorMessage('Nome já cadastrado.');
      return;
    }
    setIsSaving(true);
    setErrorMessage('');
    try {
      if (editingId) {
        await updateItem(editingId, { name: normalizedName });
      } else {
        await createItem({ name: normalizedName, active: true } as any);
      }
      closeModal();
    } catch (e: any) {
      setErrorMessage(e.message || 'Erro');
    } finally {
      setIsSaving(false);
    }
  }
  async function handleDelete(itemId: string) {
    if (!window.confirm('Remover?')) return;
    try {
      await deleteItem(itemId);
    } catch (e: any) {
      setErrorMessage(e.message);
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
            {meta.title}
          </h1>
          <p className="mt-0.5 text-[13px] text-[#64748b]">{meta.subtitle}</p>
        </div>
        {canEdit && (
          <button
            onClick={openCreateModal}
            className="inline-flex h-9 items-center gap-2 rounded-[8px] bg-[#2563eb] px-4 text-[13px] font-semibold text-white shadow-sm hover:bg-[#1d4ed8]"
          >
            <Plus className="size-4" /> {meta.primaryLabel}
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
          <div className="p-6 text-[13px] text-[#64748b]">Carregando...</div>
        ) : items.length ? (
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
                <th className="px-4 py-3 text-[11px] font-bold tracking-[.06em] text-[#64748b] uppercase">
                  Nome
                </th>
                <th className="w-[120px] px-4 py-3 text-[11px] font-bold tracking-[.06em] text-[#64748b] uppercase">
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
                  <td className="px-4 py-3 text-[13px] font-semibold text-[#0f172a]">
                    {item.name}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
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
        ) : (
          <div className="rounded-[12px] px-6 py-12 text-center">
            <div className="mx-auto mb-3 inline-flex size-14 items-center justify-center rounded-full bg-[#eff6ff] text-[#2563eb]">
              {type === 'origins' ? (
                <ListTodo className="size-6" />
              ) : (
                <UserCircle className="size-6" />
              )}
            </div>
            <div className="mt-3 text-[15px] font-bold text-[#0f172a]">
              {meta.emptyTitle}
            </div>
            <div className="mt-1 text-[13px] text-[#64748b]">
              {meta.emptyDescription}
            </div>
          </div>
        )}
      </div>

      <ModalShell
        open={open}
        title={editingItem ? meta.modalEditTitle : meta.modalCreateTitle}
        maxWidthClassName="max-w-[480px]"
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
          <div>
            <FormLabel>Nome</FormLabel>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="h-9 w-full rounded-[6px] border border-[#e2e8f0] bg-[#f8fafc] px-3 text-[13px] outline-none focus:border-[#2563eb] focus:bg-white"
            />
          </div>
          {errorMessage && (
            <div className="rounded-[8px] border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-[13px] font-semibold text-[#dc2626]">
              {errorMessage}
            </div>
          )}
        </div>
      </ModalShell>
    </div>
  );
}
