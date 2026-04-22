export function formatMoney(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function inRange(date: string, from: string, to: string) {
  const normalized = date.slice(0, 10);
  if (from && normalized < from) return false;
  if (to && normalized > to) return false;
  return true;
}

export function sumBy<T>(items: T[], getter: (item: T) => number) {
  return items.reduce((total, item) => total + getter(item), 0);
}

export function progressColor(value: number) {
  if (value >= 100) return '#059669';
  if (value >= 70) return '#d97706';
  return '#2563eb';
}

export function statusToneColor(value: number) {
  if (value >= 30) return '#059669';
  if (value >= 15) return '#d97706';
  return '#dc2626';
}

export function toneStyles(
  tone: 'accent' | 'success' | 'warning' | 'error' | 'purple' | 'neutral',
) {
  const map = {
    accent: {
      text: 'text-[#2563eb]',
      bg: 'bg-[#eff6ff]',
      pill: 'border-[#bfdbfe] bg-[#eff6ff] text-[#2563eb]',
    },
    success: {
      text: 'text-[#059669]',
      bg: 'bg-[#ecfdf5]',
      pill: 'border-[#a7f3d0] bg-[#ecfdf5] text-[#059669]',
    },
    warning: {
      text: 'text-[#d97706]',
      bg: 'bg-[#fffbeb]',
      pill: 'border-[#fde68a] bg-[#fffbeb] text-[#d97706]',
    },
    error: {
      text: 'text-[#dc2626]',
      bg: 'bg-[#fef2f2]',
      pill: 'border-[#fecaca] bg-[#fef2f2] text-[#dc2626]',
    },
    purple: {
      text: 'text-[#7c3aed]',
      bg: 'bg-[#f5f3ff]',
      pill: 'border-[#ddd6fe] bg-[#f5f3ff] text-[#7c3aed]',
    },
    neutral: {
      text: 'text-[#0f172a]',
      bg: 'bg-[#f8fafc]',
      pill: 'border-[#e2e8f0] bg-[#f8fafc] text-[#475569]',
    },
  } as const;

  return map[tone];
}
