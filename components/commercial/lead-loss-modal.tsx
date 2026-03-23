'use client';

import { useState } from 'react';

import { ModalShell } from '@/components/modal-shell';

export function LeadLossModal({
  open,
  leadName,
  onClose,
  onConfirm,
}: {
  open: boolean;
  leadName: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');
  const [showError, setShowError] = useState(false);

  return (
    <ModalShell
      open={open}
      title="Marcar como Perdido"
      description={leadName}
      maxWidthClassName="max-w-[460px]"
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[8px] border border-[#e2e8f0] bg-white px-4 py-2 text-[13px] font-semibold text-[#64748b]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              if (!reason.trim()) {
                setShowError(true);
                return;
              }
              onConfirm(reason.trim());
            }}
            className="rounded-[8px] bg-[#dc2626] px-4 py-2 text-[13px] font-semibold text-white"
          >
            Confirmar Perda
          </button>
        </>
      }
    >
      <div className="mb-4 rounded-[8px] border-[1.5px] border-[#fecaca] bg-[#fef2f2] px-[14px] py-3 text-[13px] font-semibold text-[#dc2626]">
        Esta acao e permanente. O lead sera movido para a lista de perdidos.
      </div>

      <label className="mb-[5px] block text-[11px] font-bold tracking-[.06em] text-[#64748b] uppercase">
        Motivo da Perda
      </label>
      <textarea
        value={reason}
        onChange={(event) => {
          setReason(event.target.value);
          if (showError && event.target.value.trim()) setShowError(false);
        }}
        rows={3}
        placeholder="Ex: preco fora do budget, concorrente, projeto cancelado..."
        className="min-h-[110px] w-full rounded-[7px] border-[1.5px] border-[#e2e8f0] bg-[#f8fafc] px-3 py-[9px] text-[13px] text-[#0f172a] outline-none"
      />
      {showError ? (
        <div className="mt-2 text-[12px] font-semibold text-[#dc2626]">
          O motivo e obrigatorio.
        </div>
      ) : null}
    </ModalShell>
  );
}
