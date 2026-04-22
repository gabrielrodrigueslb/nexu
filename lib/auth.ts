export const SESSION_COOKIE_NAME = "nexu_session";
export const ACCESS_TOKEN_COOKIE_NAME = "nexu_access_token";
export const REFRESH_TOKEN_COOKIE_NAME = "nexu_refresh_token";

export type AccessLevel = "none" | "view" | "edit" | "manage";
export type UserRole = "basic" | "leader" | "admin" | "sdr";
export type UserSector =
  | "CS"
  | "Comercial"
  | "Financeiro"
  | "Desenvolvimento"
  | "Suporte"
  | "Implantacao";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  sector: UserSector;
  accessPresetId?: string | null;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SessionAccessModule = {
  moduleKey: string;
  accessLevel: AccessLevel;
  source: "role" | "preset" | "user";
  module: {
    key: string;
    name: string;
    description?: string | null;
    active: boolean;
    sortOrder: number;
  };
};

export type SessionAccess = {
  role: UserRole;
  preset?: {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    role: UserRole;
    isSystem: boolean;
  } | null;
  modules: SessionAccessModule[];
  permissionMap: Record<string, AccessLevel>;
};

export type SessionData = {
  user: SessionUser;
  access: SessionAccess;
};

const accessRank: Record<AccessLevel, number> = {
  none: 0,
  view: 1,
  edit: 2,
  manage: 3,
};

export function formatUserLabel(email: string, fallbackName?: string) {
  if (fallbackName?.trim()) {
    return fallbackName.trim();
  }

  const [name] = email.split("@");

  return name
    .split(".")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

export function hasModuleAccess(
  access: SessionAccess | null | undefined,
  moduleKey: string,
  requiredLevel: AccessLevel = "view",
) {
  if (!access) return false;
  const currentLevel = access.permissionMap?.[moduleKey] || "none";
  return accessRank[currentLevel] >= accessRank[requiredLevel];
}
