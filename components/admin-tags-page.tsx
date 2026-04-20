'use client';

import { useMemo, useState } from 'react';
import { Pencil, Plus, Trash2, Lock, Tags } from 'lucide-react';

import { ModalShell } from '@/components/modal-shell';
import {
  useAdminTags,
  type TagRecord,
} from '@/components/admin-settings-storage';
import { useCurrentAdminUser } from '@/components/admin-users-storage';
import { hasModuleAccess } from '@/lib/auth';
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
function FormLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1 block text-[11px] font-bold tracking-[.06em] text-[#64748b] uppercase">
      {children}
    </label>
  );
}

export function AdminTagsPage() {
  const { access } = useCurrentAdminUser();
  const {
    items: tags,
    isLoading,
    error,
    createTag,
    updateTag,
    deleteTag,
  } = useAdminTags();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ name: '', color: COLOR_OPTIONS[0] });
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [open, setOpen] = useState(false);

  const editingTag = useMemo(
    () => tags.find((tag) => tag.id === editingId) ?? null,
    [editingId, tags],
  );
  const canView = hasModuleAccess(access, 'CADASTROS', 'view');
  const canEdit = hasModuleAccess(access, 'CADASTROS', 'edit');
  const canManage = hasModuleAccess(access, 'CADASTROS', 'manage');

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

  async function handleSave() {
    const normalizedName = draft.name.trim();
    if (!normalizedName) {
      setErrorMessage('Informe o nome.');
      return;
    }
    setIsSaving(true);
    setErrorMessage('');
    try {
      if (editingId) {
        await updateTag(editingId, {
          name: normalizedName,
          color: draft.color,
        });
      } else {
        await createTag({ name: normalizedName, color: draft.color });
      }
      closeModal();
    } catch (e: any) {
      setErrorMessage(e.message || 'Erro');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(tagId: string) {
    if (!window.confirm('Mover para a lixeira?')) return;
    try {
      await deleteTag(tagId);
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
            Etiquetas
          </h1>
          <p className="mt-0.5 text-[13px] text-[#64748b]">
            Etiquetas coloridas para classificar os cards
          </p>
        </div>
        {canEdit && (
          <button
            onClick={openCreateModal}
            className="inline-flex h-9 items-center gap-2 rounded-[8px] bg-[#2563eb] px-4 text-[13px] font-semibold text-white shadow-sm hover:bg-[#1d4ed8]"
          >
            <Plus className="size-4" /> Nova Etiqueta
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

      {isLoading ? (
        <div className="rounded-[10px] border border-[#e2e8f0] bg-white p-6 text-[13px] text-[#64748b]">
          Carregando...
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="flex items-center gap-3 rounded-[10px] border border-[#e2e8f0] bg-white p-4 shadow-sm transition-all hover:border-[#bfdbfe]"
            >
              <span
                className="inline-flex rounded-[6px] px-3 py-1 text-[12px] font-bold text-white shadow-sm"
                style={{ backgroundColor: tag.color }}
              >
                {tag.name}
              </span>
              <div className="flex-1" />
              {canEdit && (
                <button
                  onClick={() => openEditModal(tag)}
                  className="inline-flex size-8 items-center justify-center rounded-[6px] border border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f1f5f9]"
                >
                  <Pencil className="size-3.5" />
                </button>
              )}
              {canManage && (
                <button
                  onClick={() => void handleDelete(tag.id)}
                  className="inline-flex size-8 items-center justify-center rounded-[6px] border border-[#fecaca] bg-[#fef2f2] text-[#dc2626] hover:bg-[#fee2e2]"
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
            </div>
          ))}
          {!tags.length && (
            <div className="col-span-full rounded-[12px] border border-dashed border-[#cbd5e1] bg-white px-6 py-12 text-center shadow-sm">
              <div className="mx-auto mb-3 inline-flex size-14 items-center justify-center rounded-full bg-[#eff6ff] text-[#2563eb]">
                <Tags className="size-6" />
              </div>
              <div className="mt-3 text-[15px] font-bold text-[#0f172a]">
                Nenhuma etiqueta
              </div>
              <div className="mt-1 text-[13px] text-[#64748b]">
                Crie etiquetas para organizar e filtrar seus cards.
              </div>
            </div>
          )}
        </div>
      )}

      <ModalShell
        open={open}
        title={editingTag ? 'Editar Etiqueta' : 'Nova Etiqueta'}
        maxWidthClassName="max-w-[440px]"
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
              value={draft.name}
              onChange={(e) =>
                setDraft((c) => ({ ...c, name: e.target.value }))
              }
              className="h-9 w-full rounded-[6px] border border-[#e2e8f0] bg-[#f8fafc] px-3 text-[13px] outline-none focus:border-[#2563eb] focus:bg-white"
            />
          </div>
          <div>
            <FormLabel>Cor</FormLabel>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setDraft((c) => ({ ...c, color }))}
                  className={cn(
                    'size-8 rounded-[6px] border-[3px] transition-transform hover:scale-110',
                    draft.color === color
                      ? 'border-[#0f172a] shadow-md'
                      : 'border-transparent opacity-80',
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>
      </ModalShell>
    </div>
  );
}
