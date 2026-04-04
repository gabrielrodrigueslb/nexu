'use client';

import { useMemo, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';

import {
  buildCatalogId,
  type AdminCatalogItem,
  useAdminIntegrations,
  useAdminProducts,
} from '@/components/admin-catalogs';
import { ModalShell } from '@/components/modal-shell';
import { cn } from '@/lib/utils';

type CatalogType = 'products' | 'integrations';

type CatalogDraft = {
  name: string;
};

const EMPTY_DRAFT: CatalogDraft = {
  name: '',
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
      <div className="-mx-4 -my-6 md:-mx-6 lg:-mx-8 lg:-my-8">
        <div className="sticky top-0 z-20 flex min-h-14 items-center gap-4 border-b border-[#e2e8f0] bg-white px-6">
          <strong className="text-[15px] font-bold text-[#0f172a]">{meta.title}</strong>
          <div className="ml-auto flex flex-wrap items-center gap-2 py-3">
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-[6px] rounded-[6px] bg-[#2563eb] px-3 py-[6px] text-[12px] font-semibold text-white transition-colors hover:bg-[#1d4ed8]"
            >
              <Plus className="size-4" />
              {meta.primaryLabel}
            </button>
          </div>
        </div>

        <div className="bg-[#f1f5f9] px-6 py-6">
          <div className="mb-4">
            <div className="text-[26px] font-extrabold tracking-[-0.03em] text-[#0f172a]">
              {meta.title}
            </div>
            <div className="mt-2 text-[12px] text-[#64748b]">{meta.subtitle}</div>
          </div>

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
                <span className="inline-flex rounded-full border border-[#a7f3d0] bg-[#ecfdf5] px-[10px] py-[4px] text-[11px] font-bold text-[#059669]">
                  {meta.activeLabel}
                </span>
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
              </div>
            ))}

            {!items.length ? (
              <div className="rounded-[12px] border border-dashed border-[#cbd5e1] bg-white px-6 py-12 text-center">
                <div className="text-[28px] leading-none">{meta.rowIcon}</div>
                <div className="mt-3 text-[18px] font-bold text-[#0f172a]">
                  {meta.emptyTitle}
                </div>
                <div className="mt-1 text-[13px] text-[#64748b]">
                  {meta.emptyDescription}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <ModalShell
        open={isModalOpen}
        title={editingItem ? meta.modalEditTitle : meta.modalCreateTitle}
        description="Gerencie os itens disponíveis no formulário comercial."
        maxWidthClassName="max-w-[520px]"
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
          <div className="flex flex-col gap-[5px]">
            <FormLabel>Nome</FormLabel>
            <input
              value={draft.name}
              onChange={(event) => setDraft({ name: event.target.value })}
              className="w-full rounded-[7px] border-[1.5px] border-[#e2e8f0] bg-[#f8fafc] px-3 py-[9px] text-[13px] text-[#0f172a] outline-none transition-colors focus:border-[#2563eb]"
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
