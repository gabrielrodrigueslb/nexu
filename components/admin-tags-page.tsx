'use client';

import { useMemo, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';

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
      <div className="-mx-4 -my-6 md:-mx-6 lg:-mx-8 lg:-my-8">
        <div className="sticky top-0 z-20 flex min-h-14 items-center gap-4 border-b border-[#e2e8f0] bg-white px-6">
          <strong className="text-[15px] font-bold text-[#0f172a]">Etiquetas</strong>
          <div className="ml-auto flex flex-wrap items-center gap-2 py-3">
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-[6px] rounded-[6px] bg-[#2563eb] px-3 py-[6px] text-[12px] font-semibold text-white transition-colors hover:bg-[#1d4ed8]"
            >
              <Plus className="size-4" />
              Nova Etiqueta
            </button>
          </div>
        </div>

        <div className="bg-[#f1f5f9] px-6 py-6">
          <div className="mb-4">
            <div className="text-[26px] font-extrabold tracking-[-0.03em] text-[#0f172a]">
              Etiquetas
            </div>
            <div className="mt-2 text-[12px] text-[#64748b]">
              Etiquetas coloridas para organizar os cards
            </div>
          </div>

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
                <ToolbarButton onClick={() => openEditModal(tag)}>
                  <Pencil className="size-3.5" />
                </ToolbarButton>
                <ToolbarButton
                  onClick={() => handleDelete(tag.id)}
                  className="text-[#dc2626] hover:border-[#dc2626] hover:text-[#dc2626]"
                >
                  <Trash2 className="size-3.5" />
                </ToolbarButton>
              </div>
            ))}

            {!tags.length ? (
              <div className="rounded-[12px] border border-dashed border-[#cbd5e1] bg-white px-6 py-12 text-center">
                <div className="text-[28px] leading-none">🏷️</div>
                <div className="mt-3 text-[18px] font-bold text-[#0f172a]">
                  Nenhuma etiqueta
                </div>
                <div className="mt-1 text-[13px] text-[#64748b]">
                  Crie etiquetas para organizar e filtrar seus cards.
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <ModalShell
        open={open}
        title={editingTag ? 'Editar Etiqueta' : 'Nova Etiqueta'}
        description="Defina o nome e a cor da etiqueta."
        maxWidthClassName="max-w-[560px]"
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
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              className="w-full rounded-[7px] border-[1.5px] border-[#e2e8f0] bg-[#f8fafc] px-3 py-[9px] text-[13px] text-[#0f172a] outline-none transition-colors focus:border-[#2563eb]"
            />
          </div>

          <div className="flex flex-col gap-[5px]">
            <FormLabel>Cor</FormLabel>
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
