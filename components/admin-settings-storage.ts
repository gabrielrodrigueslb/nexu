"use client";

import { useCallback, useEffect, useState } from "react";

import { apiRequest } from "@/lib/api-client";

export type TagRecord = {
  id: string;
  name: string;
  color: string;
  active?: boolean;
};

export type OriginRecord = {
  id: string;
  name: string;
  active: boolean;
};

export type IndicatorRecord = {
  id: string;
  name: string;
  docType: "CPF" | "CNPJ";
  docNumber?: string;
  contact?: string;
  email?: string;
  percentSetup: number;
  bank?: string;
  agency?: string;
  account?: string;
  pixKey?: string;
  active?: boolean;
  createdAt: string;
};

export type TrashRecord = {
  id: string;
  moduleKey: string;
  entityType: string;
  entityId: string;
  label: string;
  deletedById?: string | null;
  deletedAt: string;
};

function useRemoteCollection<T>(path: string) {
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const payload = await apiRequest(path);
      setItems(payload.items || []);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Falha ao carregar dados.");
    } finally {
      setIsLoading(false);
    }
  }, [path]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    items,
    isLoading,
    error,
    reload,
  };
}

export function useAdminTags() {
  const resource = useRemoteCollection<TagRecord>("/api/backend/catalog/tags");

  return {
    ...resource,
    createTag: async (input: Pick<TagRecord, "name" | "color">) => {
      await apiRequest("/api/backend/catalog/tags", {
        method: "POST",
        body: JSON.stringify(input),
      });
      await resource.reload();
    },
    updateTag: async (id: string, input: Partial<Pick<TagRecord, "name" | "color" | "active">>) => {
      await apiRequest(`/api/backend/catalog/tags/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      });
      await resource.reload();
    },
    deleteTag: async (id: string) => {
      await apiRequest(`/api/backend/catalog/tags/${id}`, {
        method: "DELETE",
      });
      await resource.reload();
    },
  };
}

function createSimpleSettingsHook<T extends OriginRecord>(path: string) {
  return function useSimpleSettings() {
    const resource = useRemoteCollection<T>(path);

    return {
      ...resource,
      createItem: async (input: Pick<T, "name"> & Partial<Pick<T, "active">>) => {
        await apiRequest(path, {
          method: "POST",
          body: JSON.stringify(input),
        });
        await resource.reload();
      },
      updateItem: async (id: string, input: Partial<Pick<T, "name" | "active">>) => {
        await apiRequest(`${path}/${id}`, {
          method: "PATCH",
          body: JSON.stringify(input),
        });
        await resource.reload();
      },
      deleteItem: async (id: string) => {
        await apiRequest(`${path}/${id}`, {
          method: "DELETE",
        });
        await resource.reload();
      },
    };
  };
}

export const useAdminOrigins = createSimpleSettingsHook<OriginRecord>(
  "/api/backend/catalog/origins",
);

export function useAdminIndicators() {
  const resource = useRemoteCollection<IndicatorRecord>("/api/backend/catalog/indicators");

  return {
    ...resource,
    createIndicator: async (
      input: Omit<IndicatorRecord, "id" | "createdAt">,
    ) => {
      await apiRequest("/api/backend/catalog/indicators", {
        method: "POST",
        body: JSON.stringify(input),
      });
      await resource.reload();
    },
    updateIndicator: async (
      id: string,
      input: Partial<Omit<IndicatorRecord, "id" | "createdAt">>,
    ) => {
      await apiRequest(`/api/backend/catalog/indicators/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      });
      await resource.reload();
    },
    deleteIndicator: async (id: string) => {
      await apiRequest(`/api/backend/catalog/indicators/${id}`, {
        method: "DELETE",
      });
      await resource.reload();
    },
  };
}

export function useAdminTrash() {
  const resource = useRemoteCollection<TrashRecord>("/api/backend/trash?page=1&limit=100");

  return {
    ...resource,
    restoreItem: async (id: string) => {
      await apiRequest(`/api/backend/trash/${id}/restore`, {
        method: "POST",
      });
      await resource.reload();
    },
    deleteForever: async (id: string) => {
      await apiRequest(`/api/backend/trash/${id}`, {
        method: "DELETE",
      });
      await resource.reload();
    },
  };
}
