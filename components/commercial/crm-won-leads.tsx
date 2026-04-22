import { Trophy } from 'lucide-react';

import { formatMoney } from '@/components/utils';

import { formatBackendDate } from './backend';
import type { CommercialLeadRecord } from './types';

type CrmWonLeadsProps = {
  leads: CommercialLeadRecord[];
  getSellerName: (sellerId?: string) => string | undefined;
  onOpenLead?: (leadId: string) => void;
};

export function CrmWonLeads({ leads, getSellerName, onOpenLead }: CrmWonLeadsProps) {
  return (
    <div className="mb-3">
      <div className="mb-2 text-[11px] font-bold tracking-[.06em] text-[#059669] uppercase">
        Leads Ganhos ({leads.length})
      </div>
      <div className="flex flex-col gap-[6px]">
        {leads.length ? (
          leads.map((lead) => (
            <button
              type="button"
              key={lead.id}
              onClick={() => onOpenLead?.(lead.id)}
              className="flex items-center gap-[10px] rounded-[8px] border border-[#a7f3d0] bg-[#ecfdf5] px-[14px] py-[10px] text-left"
            >
              <span className="inline-flex h-[20px] w-[20px] items-center justify-center text-[#059669]">
                <Trophy className="h-[18px] w-[18px]" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-bold text-[#0f172a]">
                  {lead.company || '-'}
                </div>
                <div className="text-[11px] text-[#64748b]">
                  {formatBackendDate(lead.wonAt)}
                  {lead.generatedTicketId ? (
                    <>
                      {' '}
                      · Ticket:{' '}
                      <strong className="font-mono text-[#2563eb]">
                        {lead.generatedTicketId}
                      </strong>
                    </>
                  ) : null}
                </div>
              </div>
              {getSellerName(lead.sellerId) ? (
                <span className="inline-flex rounded-full border border-[#ddd6fe] bg-[#f5f3ff] px-[9px] py-[3px] text-[11px] font-bold text-[#7c3aed]">
                  {getSellerName(lead.sellerId)?.split(' ')[0]}
                </span>
              ) : null}
              {lead.value ? (
                <span className="inline-flex rounded-full border border-[#a7f3d0] bg-white px-[9px] py-[3px] text-[12px] font-extrabold text-[#059669]">
                  {formatMoney(lead.value)}
                </span>
              ) : null}
            </button>
          ))
        ) : (
          <div className="px-[10px] py-[10px] text-[13px] text-[#64748b]">
            Nenhum lead ganho ainda.
          </div>
        )}
      </div>
    </div>
  );
}
