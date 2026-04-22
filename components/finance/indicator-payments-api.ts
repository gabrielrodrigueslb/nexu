import { apiRequest } from "@/lib/api-client";

export type FinanceIndicatorPaymentRecord = {
  id: string | null;
  leadId: string;
  ticketCode: string | null;
  company: string;
  indicatorId: string;
  indicatorName: string;
  amount: number;
  commissionPercent: number;
  indicator: {
    id: string;
    name: string;
    percentSetup: number;
    docType: "CPF" | "CNPJ";
    docNumber?: string | null;
    contact?: string | null;
    email?: string | null;
    bank?: string | null;
    agency?: string | null;
    account?: string | null;
    pixKey?: string | null;
  };
  status: "pending" | "paid";
  dueDate?: string | null;
  paidAt?: string | null;
  notes?: string | null;
  wonAt?: string | null;
  paymentMethod?: string | null;
  setupAmount: number;
  recurringAmount: number;
  seller?: {
    id: string;
    name: string;
    email: string;
    role: string;
    sector: string;
  } | null;
  paidBy?: {
    id: string;
    name: string;
    email: string;
    role: string;
    sector: string;
  } | null;
};

export async function fetchIndicatorPayments() {
  const payload = (await apiRequest("/api/backend/indicator-payments")) as {
    items: FinanceIndicatorPaymentRecord[];
  };

  return payload.items || [];
}

export async function updateIndicatorPayment(
  leadId: string,
  input: {
    status: "pending" | "paid";
    dueDate?: string | null;
    paidAt?: string | null;
    notes?: string | null;
  },
) {
  const payload = (await apiRequest(`/api/backend/indicator-payments/${leadId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  })) as {
    item: FinanceIndicatorPaymentRecord;
  };

  return payload.item;
}
