'use client';

import { useMemo, useState } from 'react';
import { Pencil, Plus, Trash2, Box, Link as LinkIcon, Lock } from 'lucide-react';

import {
  type AdminCatalogItem,
  useAdminIntegrations,
  useAdminProducts,
} from '@/components/admin-catalogs';
import { useCurrentAdminUser } from '@/components/admin-users-storage';
import { ModalShell } from '@/components/modal-shell';
import { hasModuleAccess } from '@/lib/auth';

type CatalogType = 'products' | 'integrations';

type CatalogDraft = {
  name: string;
};

const EMPTY_DRAFT: CatalogDraft = {
  name: '',
};

function getPageMeta(type: CatalogType) {
  if (type === 'products') {
    return {
      title: 'Produtos',
      subtitle: 'Lista de produtos disponíveis no formulário comercial',
      emptyTitle: 'Nenhum produto cadastrado',
      emptyDescription: 'Clique em "Novo Produto" para começar.',
      primaryLabel: 'Novo Produto',
      modalCreateTitle: 'Novo Produto',
      modalEditTitle: 'Editar Produto',
      activeLabel: 'Ativo',
      confirmDelete: 'Mover produto para a lixeira?',
      Icon: Box,
      iconColor: 'text-[#2563eb]',
      iconBg: 'bg-[#eff6ff]',
    };
  }

  return {
    title: 'Integrações',
    subtitle: 'Lista de integrações disponíveis no formulário comercial',
    emptyTitle: 'Nenhuma integração cadastrada',
    emptyDescription: 'Clique em "Nova Integração" para começar.',
    primaryLabel: 'Nova Integração',
    modalCreateTitle: 'Nova Integração',
    modalEditTitle: 'Editar Integração',
    activeLabel: 'Ativa',
    confirmDelete: 'Mover integração para a lixeira?',
    Icon: LinkIcon,
    iconColor: 'text-[#7c3aed]',
    iconBg: 'bg-[#f5f3ff]',
  };
}

function FormLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1 block text-[11px] font-bold tracking-[.06em] text-[#64748b] uppercase">
      {children}
    </label>
  );
}

export function AdminCatalogManagementPage({ type }: { type: CatalogType }) {
  const productsResource = useAdminProducts();
  const integrationsResource = useAdminIntegrations();
  const { access } = useCurrentAdminUser();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draft, setDraft] = useState<CatalogDraft>(EMPTY_DRAFT);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const meta = getPageMeta(type);
  const resource = type === 'products' ? productsResource : integrationsResource;
  const { items, isLoading, error, createItem, updateItem, deleteItem } = resource;
  
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
    setIsModalOpen(true);
  }

  function openEditModal(item: AdminCatalogItem) {
    setEditingId(item.id);
    setDraft({ name: item.name });
    setErrorMessage('');
    setIsModalOpen(true);
  }

  function closeModal() {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setErrorMessage('');
    setIsModalOpen(false);
  }

  async function handleSave() {
    const normalizedName = draft.name.trim();

    if (!normalizedName) {
      setErrorMessage('Informe o nome.');
      return;
    }

    const duplicate = items.some(
      (item) =>
        item.name.toLowerCase() === normalizedName.toLowerCase() &&
        item.id !== editingId,
    );

    if (duplicate) {
      setErrorMessage('Esse nome já está cadastrado.');
      return;
    }

    setIsSaving(true);
    setErrorMessage('');

    try {
      if (editingId) {
        await updateItem(editingId, { name: normalizedName });
      } else {
        await createItem({ name: normalizedName });
      }

      closeModal();
    } catch (nextError) {
      setErrorMessage(nextError instanceof Error ? nextError.message : 'Falha ao salvar item.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(itemId: string) {
    if (!window.confirm(meta.confirmDelete)) return;

    try {
      await deleteItem(itemId);
      setErrorMessage('');
    } catch (nextError) {
      setErrorMessage(nextError instanceof Error ? nextError.message : 'Falha ao excluir item.');
    }
  }

  if (!canView) {
    return (
      <div className="mt-4 rounded-[16px] border border-dashed border-[#cbd5e1] bg-white px-6 py-12 text-center shadow-sm">
        <div className="mx-auto mb-3 inline-flex size-14 items-center justify-center rounded-full bg-[#f1f5f9] text-[#64748b]">
          <Lock className="size-6" />
        </div>
        <div className="text-[16px] font-bold text-[#0f172a]">Acesso Negado</div>
        <div className="mt-1 text-[13px] text-[#64748b]">Sem permissão para o módulo de cadastros.</div>
      </div>
    );
  }

  const { Icon } = meta;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
      {/* Header Padronizado */}
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-[20px] font-extrabold tracking-[-0.4px] text-[#0f172a]">
            {meta.title}
          </h1>
          <p className="mt-0.5 text-[13px] text-[#64748b]">
            {meta.subtitle}
          </p>
        </div>
        {canEdit && (
          <button
            onClick={openCreateModal}
            className="inline-flex h-9 items-center gap-2 rounded-[8px] bg-[#2563eb] px-4 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-[#1d4ed8]"
          >
            <Plus className="size-4" />
            {meta.primaryLabel}
          </button>
        )}
      </div>

      {/* Alertas */}
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

      {/* Listagem / Tabela */}
      <div className="overflow-hidden rounded-[10px] border border-[#e2e8f0] bg-white shadow-sm">
        {isLoading ? (
          <div className="p-6 text-[13px] text-[#64748b]">Carregando itens...</div>
        ) : items.length ? (
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
                <th className="px-4 py-3 text-[11px] font-bold tracking-[.06em] text-[#64748b] uppercase">Item</th>
                <th className="w-[120px] px-4 py-3 text-[11px] font-bold tracking-[.06em] text-[#64748b] uppercase">Status</th>
                <th className="w-[120px] px-4 py-3 text-[11px] font-bold tracking-[.06em] text-[#64748b] uppercase text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-[#e2e8f0] last:border-b-0 hover:bg-[#f8fafc] transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="text-[13px] font-semibold text-[#0f172a]">
                      {item.name}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-[#ecfdf5] border border-[#a7f3d0] px-[10px] py-[3px] text-[11px] font-bold text-[#059669]">
                      {meta.activeLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {canEdit && (
                        <button
                          onClick={() => openEditModal(item)}
                          className="inline-flex size-8 items-center justify-center rounded-[6px] border border-[#e2e8f0] bg-white text-[#64748b] transition-colors hover:bg-[#f1f5f9]"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                      )}
                      {canManage && (
                        <button
                          onClick={() => void handleDelete(item.id)}
                          className="inline-flex size-8 items-center justify-center rounded-[6px] border border-[#fecaca] bg-[#fef2f2] text-[#dc2626] transition-colors hover:bg-[#fee2e2]"
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
            <div className={`mx-auto mb-3 inline-flex size-14 items-center justify-center rounded-full ${meta.iconBg} ${meta.iconColor}`}>
              <Icon className="size-6" />
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

      {/* Modal Criar/Editar */}
      <ModalShell
        open={isModalOpen}
        title={editingItem ? meta.modalEditTitle : meta.modalCreateTitle}
        description="Gerencie os itens disponíveis no formulário comercial."
        maxWidthClassName="max-w-[480px]"
        onClose={closeModal}
        footer={
          <div className="flex w-full justify-end gap-2">
            <button
              onClick={closeModal}
              className="h-9 rounded-[8px] border border-[#e2e8f0] bg-white px-4 text-[13px] font-semibold text-[#64748b] transition-colors hover:bg-[#f8fafc]"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="h-9 rounded-[8px] bg-[#2563eb] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[#1d4ed8] disabled:opacity-50"
            >
              {isSaving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        }
      >
        <div className="grid gap-4">
          <div className="flex flex-col gap-[5px]">
            <FormLabel>Nome</FormLabel>
            <input
              type="text"
              value={draft.name}
              onChange={(event) => setDraft({ name: event.target.value })}
              placeholder="Digite o nome..."
              className="h-9 w-full rounded-[6px] border border-[#e2e8f0] bg-[#f8fafc] px-3 text-[13px] text-[#0f172a] outline-none transition-colors focus:border-[#2563eb] focus:bg-white"
            />
          </div>
        </div>
      </ModalShell>
    </div>
  );
}