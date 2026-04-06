'use client';

import { useMemo, useState } from 'react';
import { Pencil, Plus } from 'lucide-react';

import {
  AppAlert,
  AppEmptyState,
  AppFormLabel,
  AppInput,
  AppPageContent,
  AppPageIntro,
  AppPageShell,
  AppPageToolbar,
  AppPrimaryButton,
  AppSurface,
  AppToolbarButton,
} from '@/components/app-ui-kit';
import { ModalShell } from '@/components/modal-shell';

type SimpleItem = {
  id: string;
  name: string;
  active?: boolean;
};

type PageType = 'origins' | 'sdrs';

function getMeta(type: PageType) {
  if (type === 'origins') {
    return {
      title: 'Origens CRM',
      subtitle: 'Cadastro de origens de leads',
      primaryLabel: 'Nova Origem',
      modalCreateTitle: 'Nova Origem',
      modalEditTitle: 'Editar Origem',
      emptyTitle: 'Nenhuma origem cadastrada',
      emptyDescription: 'Clique em + Nova Origem para começar',
      emptyIcon: '📋',
    };
  }

  return {
    title: 'SDRs',
    subtitle: 'Cadastro de Sales Development Representatives',
    primaryLabel: 'Novo SDR',
    modalCreateTitle: 'Novo SDR',
    modalEditTitle: 'Editar SDR',
    emptyTitle: 'Nenhum SDR cadastrado',
    emptyDescription: 'Clique em + Novo SDR para começar',
    emptyIcon: '👤',
  };
}

export function AdminSimpleSettingsPage({
  type,
  items,
  setItems,
}: {
  type: PageType;
  items: SimpleItem[];
  setItems: React.Dispatch<React.SetStateAction<SimpleItem[]>>;
}) {
  const meta = getMeta(type);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [open, setOpen] = useState(false);

  const editingItem = useMemo(
    () => items.find((item) => item.id === editingId) ?? null,
    [editingId, items],
  );

  function openCreateModal() {
    setEditingId(null);
    setDraft('');
    setErrorMessage('');
    setOpen(true);
  }

  function openEditModal(item: SimpleItem) {
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

  function handleSave() {
    const normalizedName = draft.trim();
    if (!normalizedName) {
      setErrorMessage('Informe o nome.');
      return;
    }

    const duplicate = items.some(
      (item) =>
        item.name.toLowerCase() === normalizedName.toLowerCase() && item.id !== editingId,
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
        { id: `${type}-${Date.now()}`, name: normalizedName, active: true },
      ]);
    }

    closeModal();
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

          {items.length ? (
            <AppSurface className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
                      <th className="px-4 py-3 text-left text-[12px] font-bold text-[#64748b]">
                        Nome
                      </th>
                      <th className="w-[100px] px-4 py-3 text-left text-[12px] font-bold text-[#64748b]">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-b border-[#e2e8f0] last:border-b-0">
                        <td className="px-4 py-3 text-[13px] font-semibold text-[#0f172a]">
                          {item.name}
                        </td>
                        <td className="px-4 py-3">
                          <AppToolbarButton onClick={() => openEditModal(item)}>
                            <Pencil className="size-3.5" />
                            Editar
                          </AppToolbarButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </AppSurface>
          ) : (
            <AppEmptyState
              icon={meta.emptyIcon}
              title={meta.emptyTitle}
              description={meta.emptyDescription}
            />
          )}
        </AppPageContent>
      </AppPageShell>

      <ModalShell
        open={open}
        title={editingItem ? meta.modalEditTitle : meta.modalCreateTitle}
        description="Gerencie os itens disponíveis no CRM."
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
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
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
