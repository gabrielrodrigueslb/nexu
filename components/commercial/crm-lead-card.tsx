import { formatMoney } from '@/components/utils';

import type { CommercialLeadRecord } from './types';

type CrmLeadCardProps = {
  lead: CommercialLeadRecord;
  sellerName?: string;
  originName?: string;
  sdrName?: string;
  pendingTasks: number;
  onClick?: () => void;
};

function badgeClassName(tone: 'neutral' | 'accent' | 'purple' | 'warning' | 'success') {
  if (tone === 'accent') return 'border-[#bfdbfe] bg-[#eff6ff] text-[#2563eb]';
  if (tone === 'purple') return 'border-[#ddd6fe] bg-[#f5f3ff] text-[#7c3aed]';
  if (tone === 'warning') return 'border-[#fde68a] bg-[#fffbeb] text-[#d97706]';
  if (tone === 'success') return 'border-[#a7f3d0] bg-[#ecfdf5] text-[#059669]';
  return 'border-[#e2e8f0] bg-[#f1f5f9] text-[#475569]';
}

export function CrmLeadCard({
  lead,
  sellerName,
  originName,
  sdrName,
  pendingTasks,
  onClick,
}: CrmLeadCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-[8px] border border-[#e2e8f0] bg-white p-3 text-left shadow-[0_1px_3px_rgba(0,0,0,.08)] transition-all hover:border-[#cbd5e1] hover:shadow-[0_4px_14px_rgba(0,0,0,.1)]"
    >
      <div className="mb-1 text-[13px] leading-[1.3] font-bold text-[#0f172a]">
        {lead.company || 'Sem nome'}
        {lead.isLite ? (
          <span className="ml-1 rounded-[4px] bg-[#dbeafe] px-[5px] py-[1px] text-[9px] font-bold text-[#1d4ed8]">
            LITE
          </span>
        ) : null}
      </div>

      <div className="mb-[6px] text-[11px] leading-[1.4] text-[#64748b]">
        {lead.contact || '—'}
        {lead.cnpj ? (
          <span className="block text-[10px] text-[#64748b]">{lead.cnpj}</span>
        ) : null}
      </div>

      <div className="mt-1 flex flex-wrap gap-1">
        {originName ? (
          <span
            className={`inline-flex rounded-full border px-[9px] py-[3px] text-[11px] font-bold ${badgeClassName('neutral')}`}
          >
            {originName}
          </span>
        ) : null}
        {sellerName ? (
          <span
            className={`inline-flex rounded-full border px-[9px] py-[3px] text-[11px] font-bold ${badgeClassName('purple')}`}
          >
            {sellerName.split(' ')[0]}
          </span>
        ) : (
          <span
            className={`inline-flex rounded-full border px-[9px] py-[3px] text-[11px] font-bold ${badgeClassName('neutral')} opacity-60`}
          >
            Sem resp.
          </span>
        )}
        {sdrName ? (
          <span
            className={`inline-flex rounded-full border px-[9px] py-[3px] text-[11px] font-bold ${badgeClassName('accent')}`}
          >
            SDR {sdrName.split(' ')[0]}
          </span>
        ) : null}
        {lead.generatedTicketId ? (
          <span
            className={`inline-flex rounded-full border px-[9px] py-[3px] text-[11px] font-bold ${badgeClassName('success')}`}
          >
            {lead.generatedTicketId}
          </span>
        ) : null}
        {pendingTasks ? (
          <span
            className={`inline-flex rounded-full border px-[9px] py-[3px] text-[11px] font-bold ${badgeClassName('warning')}`}
          >
            Tarefas {pendingTasks}
          </span>
        ) : null}
        {lead.paymentMethod ? (
          <span
            className={`inline-flex rounded-full border px-[9px] py-[3px] text-[11px] font-bold ${badgeClassName('neutral')}`}
          >
            {lead.paymentMethod}
          </span>
        ) : null}
        {lead.value ? (
          <span
            className={`ml-auto inline-flex rounded-full border px-[9px] py-[3px] text-[11px] font-bold ${badgeClassName('success')}`}
          >
            {formatMoney(lead.value)}
          </span>
        ) : null}
      </div>
    </button>
  );
}
