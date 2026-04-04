'use client';

import { useMemo, useState } from 'react';
import { Pencil, Plus } from 'lucide-react';

import { ModalShell } from '@/components/modal-shell';
import { cn } from '@/lib/utils';

type SimpleItem = {
  id: string;
  name: string;
  active?: boolean;
};

type PageType = 'origins' | 'sdrs';

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

          {items.length ? (
            <div className="overflow-hidden rounded-[12px] border border-[#e2e8f0] bg-white">
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
                          <ToolbarButton onClick={() => openEditModal(item)}>
                            <Pencil className="size-3.5" />
                            Editar
                          </ToolbarButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="rounded-[12px] border border-dashed border-[#cbd5e1] bg-white px-6 py-12 text-center">
              <div className="text-[28px] leading-none">{meta.emptyIcon}</div>
              <div className="mt-3 text-[18px] font-bold text-[#0f172a]">{meta.emptyTitle}</div>
              <div className="mt-1 text-[13px] text-[#64748b]">{meta.emptyDescription}</div>
            </div>
          )}
        </div>
      </div>

      <ModalShell
        open={open}
        title={editingItem ? meta.modalEditTitle : meta.modalCreateTitle}
        description="Gerencie os itens disponíveis no CRM."
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
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
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
