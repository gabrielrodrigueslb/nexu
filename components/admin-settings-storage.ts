'use client';

import { useEffect, useState } from 'react';

import { origins as initialOrigins, sdrs as initialSdrs } from '@/components/data';

export type TagRecord = {
  id: string;
  name: string;
  color: string;
};

export type OriginRecord = {
  id: string;
  name: string;
  active: boolean;
};

export type SDRRecord = {
  id: string;
  name: string;
  active: boolean;
};

export type IndicatorRecord = {
  id: string;
  name: string;
  docType: 'CPF' | 'CNPJ';
  docNumber?: string;
  contact?: string;
  email?: string;
  percentSetup: number;
  bank?: string;
  agency?: string;
  account?: string;
  pixKey?: string;
  createdAt: string;
};

export type TrashRecord = {
  id: string;
  title: string;
  proto: string;
  source: 'commercial' | 'dev';
  cancelReason?: string;
  canceledBy?: string;
  canceledAt: string;
  restoreTarget?: string;
  payload?: Record<string, unknown>;
};

export const TAGS_STORAGE_KEY = 'nx_admin_tags';
export const ORIGINS_STORAGE_KEY = 'nx_admin_origins';
export const SDRS_STORAGE_KEY = 'nx_admin_sdrs';
export const INDICATORS_STORAGE_KEY = 'nx_admin_indicators';
export const TRASH_STORAGE_KEY = 'nx_admin_trash';

const INITIAL_TAGS: TagRecord[] = [
  { id: 'tag-urgent', name: 'Urgente', color: '#ef4444' },
  { id: 'tag-vip', name: 'VIP', color: '#8b5cf6' },
  { id: 'tag-client', name: 'Aguardando Cliente', color: '#f97316' },
  { id: 'tag-blocked', name: 'Bloqueado', color: '#1e293b' },
  { id: 'tag-validate', name: 'Em Validação', color: '#3b82f6' },
  { id: 'tag-priority', name: 'Prioridade Alta', color: '#eab308' },
];

const INITIAL_ORIGINS: OriginRecord[] = initialOrigins.map((origin) => ({
  ...origin,
  active: true,
}));

const INITIAL_SDRS: SDRRecord[] = initialSdrs.map((sdr) => ({
  ...sdr,
  active: true,
}));

const INITIAL_INDICATORS: IndicatorRecord[] = [
  {
    id: 'ind-1',
    name: 'Canal Parceiros Sul',
    docType: 'CNPJ',
    docNumber: '11.222.333/0001-44',
    contact: 'Renato Lima',
    email: 'renato@parceirossul.com.br',
    percentSetup: 12,
    bank: 'Banco do Brasil',
    agency: '1234',
    account: '99881-2',
    pixKey: 'financeiro@parceirossul.com.br',
    createdAt: '2026-03-10',
  },
];

const INITIAL_TRASH: TrashRecord[] = [];

function loadRecords<T>(storageKey: string, fallback: T[]) {
  if (typeof window === 'undefined') return fallback;

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : fallback;
  } catch {
    return fallback;
  }
}

function saveRecords<T>(storageKey: string, records: T[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(storageKey, JSON.stringify(records));
}

function useStoredList<T>(storageKey: string, fallback: T[]) {
  const [items, setItems] = useState<T[]>(() => loadRecords(storageKey, fallback));

  useEffect(() => {
    saveRecords(storageKey, items);
  }, [items, storageKey]);

  return [items, setItems] as const;
}

export function useAdminTags() {
  return useStoredList(TAGS_STORAGE_KEY, INITIAL_TAGS);
}

export function useAdminOrigins() {
  return useStoredList(ORIGINS_STORAGE_KEY, INITIAL_ORIGINS);
}

export function useAdminSdrs() {
  return useStoredList(SDRS_STORAGE_KEY, INITIAL_SDRS);
}

export function useAdminIndicators() {
  return useStoredList(INDICATORS_STORAGE_KEY, INITIAL_INDICATORS);
}

export function useAdminTrash() {
  return useStoredList(TRASH_STORAGE_KEY, INITIAL_TRASH);
}
