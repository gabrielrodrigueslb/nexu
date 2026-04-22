'use client';

export type ProposalRow = {
  name: string;
  setup: number;
  recurring: number;
};

export type ProposalBranding = {
  brandName: string;
  website?: string;
  email?: string;
  phone?: string;
  logoUrl?: string;
};

export type ProposalData = {
  company: string;
  cnpj?: string;
  contact?: string;
  phone?: string;
  observations?: string;
  isLite?: boolean;
  agents?: number;
  supervisors?: number;
  admins?: number;
  consultant?: string;
  sellerName?: string;
  validUntil?: string;
  products: ProposalRow[];
  integrations: ProposalRow[];
  totalSetup: number;
  totalRecurring: number;
  grandTotal: number;
  protocol?: string;
  branding: ProposalBranding;
};

function escapeHtml(value?: string | null) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
}

function formatLongDate(value: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(value);
}

function formatValidity(validUntil?: string) {
  if (!validUntil) return '15 dias a partir da emissao';

  const parsed = new Date(`${validUntil}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return '15 dias a partir da emissao';

  return formatLongDate(parsed);
}

function iconSvg(name: 'print' | 'close' | 'list' | 'users' | 'calendar' | 'note') {
  const common =
    'width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';

  switch (name) {
    case 'print':
      return `<svg ${common}><path d="M6 9V3h12v6"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v7H6z"/></svg>`;
    case 'close':
      return `<svg ${common}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`;
    case 'list':
      return `<svg ${common}><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg>`;
    case 'users':
      return `<svg ${common}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`;
    case 'calendar':
      return `<svg ${common}><path d="M8 2v4"/><path d="M16 2v4"/><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18"/></svg>`;
    case 'note':
      return `<svg ${common}><path d="M14 2H6a2 2 0 0 0-2 2v16l4-4h10a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>`;
    default:
      return '';
  }
}

function renderSectionTitle(icon: string, label: string) {
  return `
    <div class="section-title">
      <span class="section-icon">${iconSvg(icon as 'list' | 'users' | 'calendar' | 'note')}</span>
      <span>${escapeHtml(label)}</span>
    </div>
  `;
}

function renderRows(rows: ProposalRow[]) {
  if (!rows.length) {
    return `
      <tr>
        <td colspan="3" class="empty-row">Nenhum produto ou integracao selecionado</td>
      </tr>
    `;
  }

  return rows
    .map(
      (row, index) => `
        <tr class="${index % 2 === 0 ? 'row-even' : 'row-odd'}">
          <td class="item-name">${escapeHtml(row.name)}</td>
          <td class="item-val">${row.setup > 0 ? formatCurrency(row.setup) : '&mdash;'}</td>
          <td class="item-val">${row.recurring > 0 ? `${formatCurrency(row.recurring)}/mes` : '&mdash;'}</td>
        </tr>
      `,
    )
    .join('');
}

function renderLicenses(data: ProposalData) {
  const rows = [
    data.agents
      ? `<tr class="row-even"><td class="item-name">Agentes</td><td class="item-val center">${data.agents}</td><td class="item-note">Atendentes / operadores</td></tr>`
      : '',
    data.supervisors
      ? `<tr class="row-odd"><td class="item-name">Supervisores</td><td class="item-val center">${data.supervisors}</td><td class="item-note">Supervisao e relatorios</td></tr>`
      : '',
    data.admins
      ? `<tr class="row-even"><td class="item-name">Administradores</td><td class="item-val center">${data.admins}</td><td class="item-note">Acesso total a plataforma</td></tr>`
      : '',
  ]
    .filter(Boolean)
    .join('');

  if (!rows) return '';

  return `
    <div class="section">
      ${renderSectionTitle('users', 'Licenças de usuário')}
      <table class="items-table">
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Qtd</th>
            <th>Descricao</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function renderObservations(observations?: string) {
  if (!observations?.trim()) return '';

  return `
    <div class="section">
      ${renderSectionTitle('note', 'Observações')}
      <div class="obs-box">
        <div class="obs-title">Detalhes adicionais</div>
        <div class="obs-text">${escapeHtml(observations).replace(/\n/g, '<br />')}</div>
      </div>
    </div>
  `;
}

function renderConsultant(data: ProposalData) {
  const name = data.consultant?.trim() || data.sellerName?.trim();
  if (!name) return '';

  const role = data.consultant?.trim() ? 'Consultoria comercial' : 'Responsável comercial';

  return `
    <div class="consultant-bar">
      <div class="consultant-avatar">${escapeHtml(name.slice(0, 1).toUpperCase())}</div>
      <div>
        <div class="consultant-name">${escapeHtml(name)}</div>
        <div class="consultant-role">${escapeHtml(role)}</div>
      </div>
    </div>
  `;
}

export function buildProposalHtml(data: ProposalData) {
  const rows = [...data.products, ...data.integrations];
  const protocol =
    data.protocol ?? `UC-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const issueDate = formatLongDate(new Date());
  const validUntil = formatValidity(data.validUntil);
  const brandName = escapeHtml(data.branding.brandName);
  const website = escapeHtml(data.branding.website);
  const email = escapeHtml(data.branding.email);
  const phone = escapeHtml(data.branding.phone);
  const logoUrl = escapeHtml(data.branding.logoUrl);

  return `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Orcamento ${escapeHtml(protocol)} - ${escapeHtml(data.company || 'Cliente')}</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      @page { margin: 0; size: A4; }
      body { font-family: "Segoe UI", Arial, sans-serif; background: #fff; color: #1a2433; font-size: 13px; }
      .icon-inline { display: inline-flex; align-items: center; justify-content: center; }
      .icon-inline svg { display: block; }

      .no-print { position: fixed; top: 16px; right: 16px; z-index: 9999; display: flex; gap: 10px; }
      .action-btn { display: inline-flex; align-items: center; gap: 8px; border: none; border-radius: 8px; padding: 12px 18px; font-size: 13px; font-weight: 700; cursor: pointer; }
      .action-btn.primary { background: linear-gradient(135deg, #0f172a, #2563eb); color: #fff; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35); }
      .action-btn.secondary { background: #fff; color: #64748b; border: 1.5px solid #e2e8f0; }

      .header {
        background: linear-gradient(135deg, #0f172a 0%, #1e3a6e 50%, #2563eb 100%);
        padding: 36px 48px 28px;
        color: #fff;
        position: relative;
        overflow: hidden;
      }
      .header::before {
        content: "";
        position: absolute;
        right: -60px;
        top: -60px;
        width: 260px;
        height: 260px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.06);
      }
      .header::after {
        content: "";
        position: absolute;
        right: 40px;
        top: 60px;
        width: 140px;
        height: 140px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.04);
      }
      .header-inner { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; position: relative; z-index: 1; }
      .brand-block { display: flex; align-items: center; gap: 14px; }
      .brand-block img { max-height: 52px; width: auto; display: block; }
      .brand-mark {
        width: 52px;
        height: 52px;
        border-radius: 14px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.16);
        color: #fff;
        font-size: 18px;
        font-weight: 900;
      }
      .brand-logo { font-size: 26px; font-weight: 900; letter-spacing: -1px; color: #fff; }
      .brand-tag { font-size: 10px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255, 255, 255, 0.65); margin-top: 3px; }
      .header-doc { text-align: right; }
      .doc-label { font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255, 255, 255, 0.6); }
      .doc-proto { font-size: 22px; font-weight: 800; color: #fff; line-height: 1; margin-top: 3px; }
      .doc-date { font-size: 11px; color: rgba(255, 255, 255, 0.7); margin-top: 5px; }
      .header-bottom { margin-top: 24px; position: relative; z-index: 1; }
      .orcamento-title { font-size: 30px; font-weight: 800; color: #fff; letter-spacing: -0.5px; }
      .orcamento-sub { font-size: 13px; color: rgba(255, 255, 255, 0.75); margin-top: 4px; }
      .badge-lite {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: rgba(255, 255, 255, 0.15);
        border: 1.5px solid rgba(255, 255, 255, 0.3);
        border-radius: 99px;
        padding: 5px 14px;
        font-size: 11px;
        font-weight: 700;
        color: #fff;
        margin-top: 10px;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }

      .body { padding: 0 48px 48px; }
      .client-card {
        background: #eff6ff;
        border: 1.5px solid #bfdbfe;
        border-radius: 12px;
        padding: 20px 24px;
        margin-top: 20px;
        display: flex;
        gap: 40px;
        flex-wrap: wrap;
      }
      .client-field { flex: 1; min-width: 150px; }
      .client-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #1d4ed8; margin-bottom: 4px; }
      .client-val { font-size: 14px; font-weight: 600; color: #1a2433; }
      .client-val.big { font-size: 17px; font-weight: 800; }

      .section { margin-top: 28px; }
      .section-title {
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #1d4ed8;
        border-bottom: 2px solid #bfdbfe;
        padding-bottom: 8px;
        margin-bottom: 14px;
        display: flex;
        align-items: center;
        gap: 9px;
      }
      .section-icon {
        width: 24px;
        height: 24px;
        border-radius: 999px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: #dbeafe;
        color: #1d4ed8;
      }

      .items-table { width: 100%; border-collapse: collapse; border-radius: 10px; overflow: hidden; }
      .items-table thead tr { background: linear-gradient(90deg, #0f172a, #2563eb); color: #fff; }
      .items-table thead th { padding: 11px 14px; text-align: left; font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; }
      .items-table td { padding: 10px 14px; }
      .items-table .item-name { font-weight: 600; }
      .items-table .item-val { text-align: right; white-space: nowrap; }
      .items-table .item-val.center { text-align: center; }
      .items-table .item-note { color: #475569; }
      .row-even { background: #f8fafc; }
      .row-odd { background: #fff; }
      .items-table tbody tr:hover { background: #eff6ff; }
      .empty-row { text-align: center; color: #999; padding: 16px; }

      .totals-grid { display: flex; gap: 16px; margin-top: 24px; flex-wrap: wrap; }
      .total-card { flex: 1; min-width: 130px; border-radius: 12px; padding: 18px 20px; border: 1.5px solid #e5e7eb; }
      .total-card.setup { background: #f0f9ff; border-color: #bae6fd; }
      .total-card.recur { background: #eff6ff; border-color: #bfdbfe; }
      .total-card.total { background: linear-gradient(135deg, #0f172a, #2563eb); border: none; color: #fff; }
      .total-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; opacity: 0.65; margin-bottom: 6px; }
      .total-card.total .total-label { color: rgba(255, 255, 255, 0.8); opacity: 1; }
      .total-val { font-size: 20px; font-weight: 800; line-height: 1; }
      .total-card.setup .total-val { color: #0284c7; }
      .total-card.recur .total-val { color: #2563eb; }
      .total-card.total .total-val { color: #fff; font-size: 24px; }
      .total-sub { font-size: 10px; margin-top: 5px; opacity: 0.6; }

      .validity-bar {
        background: #eff6ff;
        border: 1.5px solid #bfdbfe;
        border-radius: 10px;
        padding: 14px 20px;
        display: flex;
        align-items: center;
        gap: 12px;
        margin-top: 24px;
      }
      .validity-icon {
        width: 38px;
        height: 38px;
        border-radius: 999px;
        background: #dbeafe;
        color: #1d4ed8;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .validity-text { font-size: 12px; color: #1d4ed8; font-weight: 600; }
      .validity-text strong { display: block; font-size: 14px; color: #1e40af; margin-bottom: 2px; }

      .obs-box { background: #fffbeb; border: 1.5px solid #fde68a; border-radius: 10px; padding: 16px 18px; margin-top: 2px; }
      .obs-title { font-size: 11px; font-weight: 700; color: #92400e; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px; }
      .obs-text { font-size: 13px; color: #78350f; line-height: 1.6; }

      .consultant-bar {
        background: linear-gradient(90deg, #eff6ff, #fff);
        border: 1.5px solid #bfdbfe;
        border-radius: 10px;
        padding: 14px 20px;
        display: flex;
        align-items: center;
        gap: 14px;
        margin-top: 24px;
      }
      .consultant-avatar {
        width: 38px;
        height: 38px;
        border-radius: 50%;
        background: linear-gradient(135deg, #0f172a, #2563eb);
        color: #fff;
        font-size: 15px;
        font-weight: 800;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .consultant-name { font-size: 14px; font-weight: 700; color: #1a2433; }
      .consultant-role { font-size: 11px; color: #6b7280; margin-top: 2px; }

      .footer {
        background: #f8fafc;
        border-top: 2px solid #e2e8f0;
        padding: 20px 48px;
        margin-top: 32px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 10px;
      }
      .footer-brand { font-weight: 800; color: #1d4ed8; font-size: 13px; }
      .footer-brand small { display: block; margin-top: 4px; color: #64748b; font-size: 11px; font-weight: 600; }
      .footer-contacts { font-size: 11px; color: #64748b; text-align: right; line-height: 1.7; }
      .footer-legal { font-size: 10px; color: #94a3b8; margin-top: 6px; text-align: center; width: 100%; }

      .section, .totals-grid, .validity-bar, .consultant-bar, .obs-box { break-inside: avoid; page-break-inside: avoid; }
      .items-table, .items-table tbody tr { break-inside: avoid; page-break-inside: avoid; }

      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .no-print { display: none !important; }
        @page { margin: 12mm 0; size: A4; }
        @page :first { margin-top: 0; }
        .footer { break-inside: avoid; page-break-inside: avoid; }
      }
    </style>
  </head>
  <body>
    <div class="no-print">
      <button class="action-btn primary" onclick="window.print()">
        <span class="icon-inline">${iconSvg('print')}</span>
        <span>Salvar como PDF / Imprimir</span>
      </button>
      <button class="action-btn secondary" onclick="window.close()">
        <span class="icon-inline">${iconSvg('close')}</span>
        <span>Fechar</span>
      </button>
    </div>

    <div class="header">
      <div class="header-inner">
        <div class="brand-block">
          ${
            logoUrl
              ? `<div style="display:flex, flex-direction:column">
              <img src="${logoUrl}" alt="${brandName}" /> <div style="margin-top:14px" class="brand-tag">${website || 'Proposta comercial'}</div></div>`
              : `<div class="brand-mark">${brandName.slice(0, 1) || 'U'}</div>`
          }
          
        </div>
        <div class="header-doc">
          <div class="doc-label">Proposta comercial</div>
          <div class="doc-proto">${escapeHtml(protocol)}</div>
          <div class="doc-date">${escapeHtml(issueDate)}</div>
        </div>
      </div>

      <div class="header-bottom">
        <div class="orcamento-title">Orcamento</div>
        <div class="orcamento-sub">Resumo comercial com itens, valores e vigencia da proposta.</div>
        ${data.isLite ? '<div class="badge-lite">Plano lite</div>' : ''}
      </div>
    </div>

    <div class="body">
      <div class="client-card">
        <div class="client-field">
          <div class="client-label">Empresa</div>
          <div class="client-val big">${escapeHtml(data.company || 'Cliente')}</div>
        </div>
        <div class="client-field">
          <div class="client-label">CNPJ</div>
          <div class="client-val">${escapeHtml(data.cnpj || '-')}</div>
        </div>
        <div class="client-field">
          <div class="client-label">Contato</div>
          <div class="client-val">${escapeHtml(data.contact || '-')}</div>
        </div>
        <div class="client-field">
          <div class="client-label">Telefone</div>
          <div class="client-val">${escapeHtml(data.phone || '-')}</div>
        </div>
      </div>

      <div class="section">
        ${renderSectionTitle('list', 'Itens da proposta')}
        <table class="items-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Setup</th>
              <th>Mensalidade</th>
            </tr>
          </thead>
          <tbody>${renderRows(rows)}</tbody>
        </table>
      </div>

      ${renderLicenses(data)}

      <div class="totals-grid">
        <div class="total-card setup">
          <div class="total-label">Setup</div>
          <div class="total-val">${formatCurrency(data.totalSetup)}</div>
          <div class="total-sub">Cobrança inicial</div>
        </div>
        <div class="total-card recur">
          <div class="total-label">Mensalidade</div>
          <div class="total-val">${formatCurrency(data.totalRecurring)}</div>
          <div class="total-sub">Valor recorrente</div>
        </div>
        <div class="total-card total">
          <div class="total-label">Total apresentado</div>
          <div class="total-val">${formatCurrency(data.grandTotal)}</div>
          <div class="total-sub">Setup + primeira referencia mensal</div>
        </div>
      </div>

      <div class="validity-bar">
        <div class="validity-icon">${iconSvg('calendar')}</div>
        <div class="validity-text">
          <strong>Validade da proposta</strong>
          Esta proposta permanece valida ate ${escapeHtml(validUntil)}.
        </div>
      </div>

      ${renderConsultant(data)}
      ${renderObservations(data.observations)}
    </div>

    <div class="footer">
      <div class="footer-brand">
        ${brandName}
        ${website ? `<small>${website}</small>` : ''}
      </div>
      <div class="footer-contacts">
        ${email ? `<div>${email}</div>` : ''}
        ${phone ? `<div>${phone}</div>` : ''}
      </div>
      <div class="footer-legal">
        Documento gerado eletronicamente. Proposta ${escapeHtml(protocol)} emitida em ${escapeHtml(issueDate)}. Valores sujeitos a revisao comercial.
      </div>
    </div>
  </body>
</html>`;
}

export function openProposalPdfWindow(data: ProposalData) {
  const popup = window.open('', '_blank', 'width=960,height=760,scrollbars=yes,resizable=yes');

  if (!popup) return false;

  popup.document.write(buildProposalHtml(data));
  popup.document.close();
  return true;
}
