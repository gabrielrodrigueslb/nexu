'use client';

import { useEffect, useState } from 'react';

import { INTEGRATION_CATALOG, PRODUCT_CATALOG } from '@/components/commercial/types';

export const PRODUCTS_STORAGE_KEY = 'nx_admin_products';
export const INTEGRATIONS_STORAGE_KEY = 'nx_admin_integrations';

export type AdminCatalogItem = {
  id: string;
  name: string;
  active: boolean;
};

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildInitialCatalog(values: readonly string[]) {
  return values.map((name) => ({
    id: slugify(name),
    name,
    active: true,
  }));
}

function loadCatalog(storageKey: string, fallback: readonly string[]) {
  if (typeof window === 'undefined') return buildInitialCatalog(fallback);

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return buildInitialCatalog(fallback);
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) return buildInitialCatalog(fallback);

    return parsed.filter(
      (item): item is AdminCatalogItem =>
        Boolean(item && typeof item === 'object' && 'id' in item && 'name' in item),
    );
  } catch {
    return buildInitialCatalog(fallback);
  }
}

function saveCatalog(storageKey: string, items: AdminCatalogItem[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(storageKey, JSON.stringify(items));
}

function useAdminCatalog(storageKey: string, fallback: readonly string[]) {
  const [items, setItems] = useState<AdminCatalogItem[]>(() => loadCatalog(storageKey, fallback));

  useEffect(() => {
    saveCatalog(storageKey, items);
  }, [items, storageKey]);

  return [items, setItems] as const;
}

export function useAdminProducts() {
  return useAdminCatalog(PRODUCTS_STORAGE_KEY, PRODUCT_CATALOG);
}

export function useAdminIntegrations() {
  return useAdminCatalog(INTEGRATIONS_STORAGE_KEY, INTEGRATION_CATALOG);
}

export function getActiveCatalogNames(items: AdminCatalogItem[]) {
  return items.filter((item) => item.active).map((item) => item.name);
}

export function buildCatalogId(name: string) {
  return slugify(name) || `item-${Date.now()}`;
}

export function syncCatalogRows<
  T extends {
    id: string;
    name: string;
    enabled: boolean;
    setup: number;
    recurring: number;
  },
>(
  rows: T[],
  names: string[],
  createRow: (name: string) => T,
) {
  return names.map((name) => {
    const existing = rows.find((row) => row.name === name);
    return existing ?? createRow(name);
  });
}
