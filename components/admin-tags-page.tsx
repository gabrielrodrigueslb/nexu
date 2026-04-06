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
  AppPrimaryButton,
  AppToolbarButton,
} from '@/components/app-ui-kit';
import { type TagRecord, useAdminTags } from '@/components/admin-settings-storage';
import { ModalShell } from '@/components/modal-shell';
import { cn } from '@/lib/utils';

const COLOR_OPTIONS = [
  '#ef4444',
  '#8b5cf6',
  '#f97316',
  '#1e293b',
  '#3b82f6',
  '#eab308',
  '#059669',
  '#ec4899',
];

export function AdminTagsPage() {
  const [tags, setTags] = useAdminTags();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ name: '', color: COLOR_OPTIONS[0] });
  const [errorMessage, setErrorMessage] = useState('');
  const [open, setOpen] = useState(false);

  const editingTag = useMemo(
    () => tags.find((tag) => tag.id === editingId) ?? null,
    [editingId, tags],
  );

  function openCreateModal() {
    setEditingId(null);
    setDraft({ name: '', color: COLOR_OPTIONS[0] });
    setErrorMessage('');
    setOpen(true);
  }

  function openEditModal(tag: TagRecord) {
    setEditingId(tag.id);
    setDraft({ name: tag.name, color: tag.color });
    setErrorMessage('');
    setOpen(true);
  }

  function closeModal() {
    setEditingId(null);
    setDraft({ name: '', color: COLOR_OPTIONS[0] });
    setErrorMessage('');
    setOpen(false);
  }

  function handleSave() {
    const normalizedName = draft.name.trim();
    if (!normalizedName) {
      setErrorMessage('Informe o nome.');
      return;
    }

    if (editingId) {
      setTags((current) =>
        current.map((tag) =>
          tag.id === editingId ? { ...tag, name: normalizedName, color: draft.color } : tag,
        ),
      );
    } else {
      setTags((current) => [
        ...current,
        { id: `tag-${Date.now()}`, name: normalizedName, color: draft.color },
      ]);
    }

    closeModal();
  }

  function handleDelete(tagId: string) {
    if (!window.confirm('Remover etiqueta?')) return;
    setTags((current) => current.filter((tag) => tag.id !== tagId));
  }

  return (
    <>
      <AppPageShell>
        <AppPageToolbar
          title="Etiquetas"
          actions={
            <AppPrimaryButton onClick={openCreateModal}>
              <Plus className="size-4" />
              Nova Etiqueta
            </AppPrimaryButton>
          }
        />

        <AppPageContent>
          <AppPageIntro
            title="Etiquetas"
            subtitle="Etiquetas coloridas para organizar os cards"
          />

          <div className="grid gap-2">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className="flex items-center gap-3 rounded-[8px] border border-[#e2e8f0] bg-white px-4 py-3"
              >
                <span
                  className="inline-flex rounded-full px-4 py-1 text-[13px] font-bold text-white"
                  style={{ backgroundColor: tag.color }}
                >
                  {tag.name}
                </span>
                <div className="flex-1 text-[12px] text-[#64748b]">{tag.color}</div>
                <AppToolbarButton onClick={() => openEditModal(tag)}>
                  <Pencil className="size-3.5" />
                </AppToolbarButton>
                <AppToolbarButton
                  onClick={() => handleDelete(tag.id)}
                  className="text-[#dc2626] hover:border-[#dc2626] hover:text-[#dc2626]"
                >
                  <Trash2 className="size-3.5" />
                </AppToolbarButton>
              </div>
            ))}

            {!tags.length ? (
              <AppEmptyState
                icon="🏷️"
                title="Nenhuma etiqueta"
                description="Crie etiquetas para organizar e filtrar seus cards."
              />
            ) : null}
          </div>
        </AppPageContent>
      </AppPageShell>

      <ModalShell
        open={open}
        title={editingTag ? 'Editar Etiqueta' : 'Nova Etiqueta'}
        description="Defina o nome e a cor da etiqueta."
        maxWidthClassName="max-w-[560px]"
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
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-[5px]">
            <AppFormLabel>Cor</AppFormLabel>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setDraft((current) => ({ ...current, color }))}
                  className={cn(
                    'size-10 rounded-full border-2 transition-transform hover:scale-105',
                    draft.color === color ? 'border-[#0f172a]' : 'border-transparent',
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {errorMessage ? <AppAlert tone="danger">{errorMessage}</AppAlert> : null}
        </div>
      </ModalShell>
    </>
  );
}
