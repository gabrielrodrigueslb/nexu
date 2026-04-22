import type { Complexity, ResolutionBucket } from './types';

export function inRange(date: string, from: string, to: string) {
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

export function sumBy<T>(items: T[], getter: (item: T) => number) {
  return items.reduce((total, item) => total + getter(item), 0);
}

export function diffDays(start: string, end: string) {
  return Math.max(
    0,
    Math.round(
      (new Date(end).getTime() - new Date(start).getTime()) / 86400000,
    ),
  );
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(value));
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function percentage(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

export function complexityBasePoints(complexity: Complexity) {
  if (complexity === 'Simples') return 1;
  if (complexity === 'Média') return 2;
  return 3;
}

export function buildResolutionBuckets(days: number[]): ResolutionBucket[] {
  const configs = [
    { lbl: '0-3d', color: '#2563eb', test: (value: number) => value <= 3 },
    {
      lbl: '4-7d',
      color: '#7c3aed',
      test: (value: number) => value >= 4 && value <= 7,
    },
    {
      lbl: '8-14d',
      color: '#d97706',
      test: (value: number) => value >= 8 && value <= 14,
    },
    { lbl: '15d+', color: '#dc2626', test: (value: number) => value >= 15 },
  ] as const;

  return configs.map((config) => ({
    lbl: config.lbl,
    n: days.filter(config.test).length,
    color: config.color,
  }));
}
