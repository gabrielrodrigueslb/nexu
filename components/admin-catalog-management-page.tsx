'use client';

import { useMemo, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';

import {
  buildCatalogId,
  type AdminCatalogItem,
  useAdminIntegrations,
  useAdminProducts,
} from '@/components/admin-catalogs';
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
  AppToolbarButton,
} from '@/components/app-ui-kit';
import { ModalShell } from '@/components/modal-shell';

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
      emptyTitle: 'Nenhum produto',
      emptyDescription: 'Clique em "+ Novo Produto" para começar.',
      primaryLabel: 'Novo Produto',
      modalCreateTitle: 'Novo Produto',
      modalEditTitle: 'Editar Produto',
      activeLabel: 'Ativo',
      confirmDelete: 'Remover produto?',
      rowIcon: '📦',
      rowIconClassName: 'bg-[#eff6ff]',
    };
  }

  return {
    title: 'Integrações',
    subtitle: 'Lista de integrações disponíveis no formulário comercial',
    emptyTitle: 'Nenhuma integração',
    emptyDescription: 'Clique em "+ Nova Integração" para começar.',
    primaryLabel: 'Nova Integração',
    modalCreateTitle: 'Nova Integração',
    modalEditTitle: 'Editar Integração',
    activeLabel: 'Ativa',
    confirmDelete: 'Remover integração?',
    rowIcon: '🔗',
    rowIconClassName: 'bg-[#dbeafe]',
  };
}

export function AdminCatalogManagementPage({ type }: { type: CatalogType }) {
  const [products, setProducts] = useAdminProducts();
  const [integrations, setIntegrations] = useAdminIntegrations();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draft, setDraft] = useState<CatalogDraft>(EMPTY_DRAFT);
  const [errorMessage, setErrorMessage] = useState('');

  const meta = getPageMeta(type);
  const items = type === 'products' ? products : integrations;
  const setItems = type === 'products' ? setProducts : setIntegrations;
  const editingItem = useMemo(
    () => items.find((item) => item.id === editingId) ?? null,
    [editingId, items],
  );

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

  function handleSave() {
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

    if (editingId) {
      setItems((current) =>
        current.map((item) =>
          item.id === editingId ? { ...item, name: normalizedName } : item,
        ),
      );
    } else {
      setItems((current) => [
        ...current,
        {
          id: buildCatalogId(normalizedName),
          name: normalizedName,
          active: true,
        },
      ]);
    }

    closeModal();
  }

  function handleDelete(itemId: string) {
    if (!window.confirm(meta.confirmDelete)) return;
    setItems((current) => current.filter((item) => item.id !== itemId));
  }

  return (
    <>
      <AppPageShell>
        <AppPageToolbar
          title={meta.title}
          actions={
            <AppPrimaryButton onClick={openCreateModal}>
              <Plus className="size-4" />
              {meta.primaryLabel}
            </AppPrimaryButton>
          }
        />

        <AppPageContent>
          <AppPageIntro title={meta.title} subtitle={meta.subtitle} />

          <div className="grid gap-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-[8px] border border-[#e2e8f0] bg-white px-4 py-3"
              >
                <div
                  className={cn(
                    'inline-flex size-[34px] items-center justify-center rounded-[8px] text-[15px]',
                    meta.rowIconClassName,
                  )}
                >
                  {meta.rowIcon}
                </div>
                <div className="flex-1 text-[13px] font-semibold text-[#0f172a]">
                  {item.name}
                </div>
                <AppPill className="border-[#a7f3d0] bg-[#ecfdf5] text-[#059669]">
                  {meta.activeLabel}
                </AppPill>
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
              </div>
            ))}

            {!items.length ? (
              <AppEmptyState
                icon={meta.rowIcon}
                title={meta.emptyTitle}
                description={meta.emptyDescription}
              />
            ) : null}
          </div>
        </AppPageContent>
      </AppPageShell>

      <ModalShell
        open={isModalOpen}
        title={editingItem ? meta.modalEditTitle : meta.modalCreateTitle}
        description="Gerencie os itens disponíveis no formulário comercial."
        maxWidthClassName="max-w-[520px]"
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
          <div className="flex flex-col gap-[5px]">
            <AppFormLabel>Nome</AppFormLabel>
            <AppInput
              value={draft.name}
              onChange={(event) => setDraft({ name: event.target.value })}
            />
          </div>

          {errorMessage ? (
            <AppAlert tone="danger">{errorMessage}</AppAlert>
          ) : null}
        </div>
      </ModalShell>
    </>
  );
}
