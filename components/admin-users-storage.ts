"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { apiRequest } from "@/lib/api-client";
import type { SessionAccess, SessionUser, UserRole, UserSector } from "@/lib/auth";
import { useSession } from "@/components/providers/session-provider";

export type AccessPresetRecord = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  role: UserRole;
  isSystem: boolean;
  modulePermissions: Array<{
    moduleKey: string;
    accessLevel: "none" | "view" | "edit" | "manage";
  }>;
};

export type AccessModuleRecord = {
  key: string;
  name: string;
  description?: string | null;
  active: boolean;
  sortOrder: number;
};

export type UserModulePermissionRecord = {
  moduleKey: string;
  accessLevel: "none" | "view" | "edit" | "manage";
};

export type AdminUserRecord = SessionUser;

export const ROLE_OPTIONS: UserRole[] = ["basic", "leader", "admin", "sdr"];
export const SECTOR_OPTIONS: UserSector[] = [
  "CS",
  "Comercial",
  "Financeiro",
  "Desenvolvimento",
  "Suporte",
  "Implantacao",
];

export function getRoleMeta(role: UserRole) {
  if (role === "admin") {
    return {
      label: "Admin",
      className: "border-[#ddd6fe] bg-[#f5f3ff] text-[#7c3aed]",
    };
  }

  if (role === "leader") {
    return {
      label: "Líder",
      className: "border-[#fbcfe8] bg-[#fdf2f8] text-[#be185d]",
    };
  }

  if (role === "sdr") {
    return {
      label: "SDR",
      className: "border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]",
    };
  }

  return {
    label: "Básico",
    className: "border-[#bfdbfe] bg-[#eff6ff] text-[#2563eb]",
  };
}

export function useAdminUsers() {
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const payload = await apiRequest("/api/backend/users?page=1&limit=100");
      setUsers(payload.items || []);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Falha ao carregar usuários.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const createUser = useCallback(
    async (input: {
      name: string;
      email: string;
      password: string;
      role: UserRole;
      sector: UserSector;
      accessPresetId?: string | null;
      modulePermissions?: UserModulePermissionRecord[];
    }) => {
      await apiRequest("/api/backend/users", {
        method: "POST",
        body: JSON.stringify(input),
      });
      await reload();
    },
    [reload],
  );

  const updateUser = useCallback(
    async (
      userId: string,
      input: {
        name?: string;
        role?: UserRole;
        sector?: UserSector;
        isActive?: boolean;
        accessPresetId?: string | null;
        modulePermissions?: UserModulePermissionRecord[];
      },
    ) => {
      await apiRequest(`/api/backend/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      });
      await reload();
    },
    [reload],
  );

  const resetPassword = useCallback(async (userId: string, newPassword: string) => {
    await apiRequest(`/api/backend/users/${userId}/reset-password`, {
      method: "POST",
      body: JSON.stringify({ newPassword }),
    });
  }, []);

  const fetchUserAccess = useCallback(async (userId: string) => {
    const payload = await apiRequest(`/api/backend/access/users/${userId}`);
    return payload.item as {
      userId: string;
      role: UserRole;
      accessPresetId?: string | null;
      accessPreset?: AccessPresetRecord | null;
      modulePermissions: UserModulePermissionRecord[];
      effectiveAccess: SessionAccess;
    };
  }, []);

  return {
    users,
    isLoading,
    error,
    reload,
    createUser,
    updateUser,
    resetPassword,
    fetchUserAccess,
  };
}

export function useAccessDefinitions() {
  const [presets, setPresets] = useState<AccessPresetRecord[]>([]);
  const [modules, setModules] = useState<AccessModuleRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const [presetsPayload, modulesPayload] = await Promise.all([
        apiRequest("/api/backend/access/presets"),
        apiRequest("/api/backend/access/modules"),
      ]);

      setPresets(presetsPayload.items || []);
      setModules(modulesPayload.items || []);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Falha ao carregar acessos.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const moduleOptions = useMemo(
    () =>
      modules.map((module) => ({
        key: module.key,
        name: module.name,
      })),
    [modules],
  );

  return {
    presets,
    modules,
    moduleOptions,
    isLoading,
    error,
    reload,
  };
}

export function useCurrentAdminUser() {
  const session = useSession();

  return {
    currentUser: session?.user ?? null,
    access: session?.access ?? null,
  };
}
