'use client';

import { useEffect, useMemo, useState } from 'react';

export type UserRole = 'admin' | 'supervisor' | 'agent';
export type UserSector =
  | 'CS'
  | 'Comercial'
  | 'Financeiro'
  | 'Desenvolvimento'
  | 'Suporte'
  | 'Implantacao';

export type AdminUserRecord = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  sector: UserSector;
  createdAt: string;
  updatedAt?: string;
};

export const ADMIN_USERS_STORAGE_KEY = 'nx_admin_users';
export const CURRENT_USER_ID = 'usr-1';

export const ROLE_OPTIONS: UserRole[] = ['agent', 'supervisor', 'admin'];
export const SECTOR_OPTIONS: UserSector[] = [
  'CS',
  'Comercial',
  'Financeiro',
  'Desenvolvimento',
  'Suporte',
  'Implantacao',
];

export const INITIAL_ADMIN_USERS: AdminUserRecord[] = [
  {
    id: 'usr-1',
    name: 'Gabriel Admin',
    email: 'gabriel@nexu.com.br',
    password: 'nexu123',
    role: 'admin',
    sector: 'Desenvolvimento',
    createdAt: '2026-03-01',
  },
  {
    id: 'usr-2',
    name: 'Moara Pereira',
    email: 'moara@nexu.com.br',
    password: 'nexu123',
    role: 'supervisor',
    sector: 'Desenvolvimento',
    createdAt: '2026-03-03',
  },
  {
    id: 'usr-3',
    name: 'Bianca Souza',
    email: 'bianca@nexu.com.br',
    password: 'nexu123',
    role: 'agent',
    sector: 'Comercial',
    createdAt: '2026-03-05',
  },
  {
    id: 'usr-4',
    name: 'Mariana Alves',
    email: 'mariana@nexu.com.br',
    password: 'nexu123',
    role: 'agent',
    sector: 'Implantacao',
    createdAt: '2026-03-07',
  },
];

export function loadStoredUsers() {
  if (typeof window === 'undefined') return INITIAL_ADMIN_USERS;

  try {
    const raw = window.localStorage.getItem(ADMIN_USERS_STORAGE_KEY);
    if (!raw) return INITIAL_ADMIN_USERS;
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) return INITIAL_ADMIN_USERS;

    return parsed.filter(
      (item): item is AdminUserRecord =>
        Boolean(item && typeof item === 'object' && 'id' in item && 'email' in item),
    );
  } catch {
    return INITIAL_ADMIN_USERS;
  }
}

export function saveStoredUsers(users: AdminUserRecord[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ADMIN_USERS_STORAGE_KEY, JSON.stringify(users));
}

export function useAdminUsers() {
  const [users, setUsers] = useState<AdminUserRecord[]>(() => loadStoredUsers());

  useEffect(() => {
    saveStoredUsers(users);
  }, [users]);

  return [users, setUsers] as const;
}

export function useCurrentAdminUser() {
  const [users, setUsers] = useAdminUsers();
  const currentUser = useMemo(
    () => users.find((user) => user.id === CURRENT_USER_ID) ?? INITIAL_ADMIN_USERS[0],
    [users],
  );

  return { users, setUsers, currentUser };
}
