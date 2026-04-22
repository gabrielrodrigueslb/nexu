import { apiRequest } from "@/lib/api-client";

export type FinanceContractRecord = {
  id: string;
  code: string;
  leadId?: string | null;
  company: string;
  cnpj?: string | null;
  contact?: string | null;
  email?: string | null;
  phone?: string | null;
  plan?: string | null;
  paymentMethod?: string | null;
  installment?: string | null;
  type: "novo" | "upsell" | "renovacao";
  status:
    | "pendente_financeiro"
    | "pagamento_confirmado"
    | "em_implantacao"
    | "concluido"
    | "cancelado";
  createdAt: string;
  updatedAt: string;
  setupAmount: number;
  recurringAmount: number;
  assignee?: {
    id: string;
    name: string;
    sector: string;
  } | null;
  lead?: {
    id: string;
    company: string;
    cnpj?: string | null;
    contact?: string | null;
    seller?: {
      id: string;
      name: string;
      sector: string;
    } | null;
  } | null;
};

export async function fetchFinanceContracts() {
  const payload = (await apiRequest("/api/backend/finance/contracts")) as {
    items: FinanceContractRecord[];
  };

  return payload.items || [];
}

export async function confirmFinanceContract(ticketId: string) {
  const payload = (await apiRequest(`/api/backend/finance/contracts/${ticketId}/confirm`, {
    method: "PATCH",
  })) as {
    item: FinanceContractRecord;
  };

  return payload.item;
}
