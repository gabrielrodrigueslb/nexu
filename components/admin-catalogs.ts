"use client";

import { useCallback, useEffect, useState } from "react";

import { apiRequest } from "@/lib/api-client";

export type AdminCatalogItem = {
  id: string;
  name: string;
  active: boolean;
  type: "PRODUCT" | "INTEGRATION";
};

function useCatalog(type: "PRODUCT" | "INTEGRATION") {
  const [items, setItems] = useState<AdminCatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const payload = await apiRequest(`/api/backend/catalog/items?type=${type}`);
      setItems(payload.items || []);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Falha ao carregar catalogo.");
    } finally {
      setIsLoading(false);
    }
  }, [type]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    items,
    isLoading,
    error,
    reload,
    createItem: async (input: { name: string }) => {
      await apiRequest("/api/backend/catalog/items", {
        method: "POST",
        body: JSON.stringify({
          name: input.name,
          type,
        }),
      });
      await reload();
    },
    updateItem: async (id: string, input: Partial<{ name: string; active: boolean }>) => {
      await apiRequest(`/api/backend/catalog/items/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      });
      await reload();
    },
    deleteItem: async (id: string) => {
      await apiRequest(`/api/backend/catalog/items/${id}`, {
        method: "DELETE",
      });
      await reload();
    },
  };
}

export function useAdminProducts() {
  return useCatalog("PRODUCT");
}

export function useAdminIntegrations() {
  return useCatalog("INTEGRATION");
}

export function getActiveCatalogNames(items: AdminCatalogItem[]) {
  return items.filter((item) => item.active).map((item) => item.name);
}

export function buildCatalogId(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function syncCatalogRows<
  T extends {
    id: string;
    name: string;
    enabled: boolean;
    setup: number;
    recurring: number;
  },
>(rows: T[], names: string[], createRow: (name: string) => T) {
  return names.map((name) => rows.find((row) => row.name === name) ?? createRow(name));
}
