'use client';

import { useMemo, useState } from 'react';
import { Pencil, Plus, Users as UsersIcon, Lock } from 'lucide-react';

import { ModalShell } from '@/components/modal-shell';
import {
  ROLE_OPTIONS,
  SECTOR_OPTIONS,
  getRoleMeta,
  type UserModulePermissionRecord,
  useAccessDefinitions,
  useAdminUsers,
  useCurrentAdminUser,
} from '@/components/admin-users-storage';
import type { AccessLevel, UserRole, UserSector } from '@/lib/auth';
import { cn } from '@/lib/utils';

type UserDraft = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  sector: UserSector;
  accessPresetId: string;
  modulePermissions: Record<string, AccessLevel>;
};
const ACCESS_OPTIONS: AccessLevel[] = ['none', 'view', 'edit', 'manage'];
const EMPTY_DRAFT: UserDraft = {
  name: '',
  email: '',
  password: '',
  role: 'basic',
  sector: 'CS',
  accessPresetId: '',
  modulePermissions: {},
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('pt-BR');
}
function getInitials(name: string) {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || '?'
  );
}
function toModulePermissionMap(items: UserModulePermissionRecord[] = []) {
  return Object.fromEntries(
    items.map((item) => [item.moduleKey, item.accessLevel]),
  );
}
function FormLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1 block text-[11px] font-bold tracking-[.06em] text-[#64748b] uppercase">
      {children}
    </label>
  );
}

export function AdminUsersPage() {
  const { currentUser, access } = useCurrentAdminUser();
  const {
    users,
    isLoading,
    error,
    createUser,
    updateUser,
    resetPassword,
    fetchUserAccess,
  } = useAdminUsers();
  const {
    presets,
    modules,
    isLoading: isAccessLoading,
  } = useAccessDefinitions();
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingAccess, setIsLoadingAccess] = useState(false);
  const [draft, setDraft] = useState<UserDraft>(EMPTY_DRAFT);
  const [errorMessage, setErrorMessage] = useState('');

  const editingUser = users.find((user) => user.id === editingUserId) ?? null;
  const availablePresets = useMemo(
    () => presets.filter((preset) => preset.role === draft.role),
    [draft.role, presets],
  );

  function updateDraft<Key extends keyof UserDraft>(
    key: Key,
    value: UserDraft[Key],
  ) {
    setDraft((current) => ({ ...current, [key]: value }));
  }
  function updateModulePermission(moduleKey: string, accessLevel: AccessLevel) {
    setDraft((current) => ({
      ...current,
      modulePermissions: {
        ...current.modulePermissions,
        [moduleKey]: accessLevel,
      },
    }));
  }
  function openCreateModal() {
    setEditingUserId(null);
    setDraft(EMPTY_DRAFT);
    setErrorMessage('');
    setIsModalOpen(true);
  }
  async function openEditModal(userId: string) {
    setIsLoadingAccess(true);
    setErrorMessage('');
    try {
      const detail = await fetchUserAccess(userId);
      const user = users.find((item) => item.id === userId);
      if (!user) return;
      setEditingUserId(user.id);
      setDraft({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
        sector: user.sector,
        accessPresetId: detail.accessPresetId || '',
        modulePermissions: toModulePermissionMap(detail.modulePermissions),
      });
      setIsModalOpen(true);
    } catch (nextError) {
      setErrorMessage(
        nextError instanceof Error
          ? nextError.message
          : 'Falha ao carregar acesso.',
      );
    } finally {
      setIsLoadingAccess(false);
    }
  }
  function closeModal() {
    setEditingUserId(null);
    setDraft(EMPTY_DRAFT);
    setErrorMessage('');
    setIsModalOpen(false);
  }
  async function handleSave() {
    const normalizedEmail = draft.email.trim().toLowerCase();
    const modulePermissions = Object.entries(draft.modulePermissions)
      .filter(([, accessLevel]) => accessLevel !== 'none')
      .map(([moduleKey, accessLevel]) => ({ moduleKey, accessLevel }));
    if (!draft.name.trim() || !normalizedEmail) {
      setErrorMessage('Nome e e-mail sao obrigatorios.');
      return;
    }
    if (!editingUserId && draft.password.trim().length < 10) {
      setErrorMessage('A senha precisa ter ao menos 10 caracteres.');
      return;
    }
    setIsSaving(true);
    setErrorMessage('');
    try {
      if (editingUserId) {
        await updateUser(editingUserId, {
          name: draft.name.trim(),
          role: draft.role,
          sector: draft.sector,
          accessPresetId: draft.accessPresetId || null,
          modulePermissions,
        });
        if (draft.password.trim()) {
          await resetPassword(editingUserId, draft.password.trim());
        }
      } else {
        await createUser({
          name: draft.name.trim(),
          email: normalizedEmail,
          password: draft.password.trim(),
          role: draft.role,
          sector: draft.sector,
          accessPresetId: draft.accessPresetId || null,
          modulePermissions,
        });
      }
      closeModal();
    } catch (nextError) {
      setErrorMessage(
        nextError instanceof Error
          ? nextError.message
          : 'Falha ao salvar usuario.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  const canManage =
    currentUser?.role === 'admin' &&
    access?.permissionMap?.USUARIOS === 'manage';
  if (!canManage)
    return (
      <div className="mt-4 rounded-[16px] border border-dashed border-[#cbd5e1] bg-white px-6 py-12 text-center shadow-sm">
        <div className="mx-auto mb-3 inline-flex size-14 items-center justify-center rounded-full bg-[#f1f5f9] text-[#64748b]">
          <Lock className="size-6" />
        </div>
        <div className="text-[16px] font-bold text-[#0f172a]">
          Acesso Negado
        </div>
        <div className="mt-1 text-[13px] text-[#64748b]">
          Apenas administradores podem acessar esta área.
        </div>
      </div>
    );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-[20px] font-extrabold tracking-[-0.4px] text-[#0f172a]">
            Usuários
          </h1>
          <p className="mt-0.5 text-[13px] text-[#64748b]">
            {users.length} usuário(s) cadastrados no sistema
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex h-9 items-center gap-2 rounded-[8px] bg-[#2563eb] px-4 text-[13px] font-semibold text-white shadow-sm hover:bg-[#1d4ed8]"
        >
          <Plus className="size-4" /> Novo Usuário
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-[8px] border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-[13px] font-semibold text-[#dc2626]">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-[10px] border border-[#e2e8f0] bg-white shadow-sm">
        {isLoading ? (
          <div className="px-4 py-8 text-[13px] text-[#64748b]">
            Carregando usuários...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
                  {['Nome', 'E-mail', 'Papel', 'Setor', 'Preset', 'Ações'].map(
                    (header) => (
                      <th
                        key={header}
                        className="px-4 py-3 text-[11px] font-bold tracking-[.06em] text-[#64748b] uppercase"
                      >
                        {header}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const roleMeta = getRoleMeta(user.role);
                  const presetName =
                    presets.find((preset) => preset.id === user.accessPresetId)
                      ?.name || 'Custom';
                  return (
                    <tr
                      key={user.id}
                      className="border-b border-[#e2e8f0] last:border-b-0 hover:bg-[#f8fafc] transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#eff6ff] text-[11px] font-bold text-[#2563eb] border border-[#bfdbfe]">
                            {getInitials(user.name)}
                          </div>
                          <strong className="text-[13px] text-[#0f172a]">
                            {user.name}
                          </strong>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-[#475569]">
                        {user.email}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex rounded-full px-[10px] py-[3px] text-[11px] font-bold',
                            roleMeta.className,
                          )}
                        >
                          {roleMeta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-[#475569]">
                        {user.sector}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-[#475569]">
                        {presetName}
                        <div className="text-[11px] text-[#94a3b8]">
                          Criado em {formatDate(user.createdAt)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => void openEditModal(user.id)}
                          className="inline-flex size-8 items-center justify-center rounded-[6px] border border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f1f5f9]"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ModalShell
        open={isModalOpen}
        title={editingUser ? 'Editar Usuário' : 'Novo Usuário'}
        maxWidthClassName="max-w-[720px]"
        onClose={closeModal}
        footer={
          <div className="flex w-full justify-end gap-2">
            <button
              onClick={closeModal}
              className="h-9 rounded-[8px] border border-[#e2e8f0] bg-white px-4 text-[13px] font-semibold text-[#64748b] hover:bg-[#f8fafc]"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="h-9 rounded-[8px] bg-[#2563eb] px-4 text-[13px] font-semibold text-white hover:bg-[#1d4ed8]"
            >
              {isSaving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        }
      >
        <div className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <FormLabel>Nome</FormLabel>
              <input
                value={draft.name}
                onChange={(e) => updateDraft('name', e.target.value)}
                className="h-9 w-full rounded-[6px] border border-[#e2e8f0] bg-[#f8fafc] px-3 text-[13px] outline-none focus:border-[#2563eb] focus:bg-white"
              />
            </div>
            <div>
              <FormLabel>E-mail</FormLabel>
              <input
                type="email"
                value={draft.email}
                onChange={(e) => updateDraft('email', e.target.value)}
                disabled={Boolean(editingUser)}
                className="h-9 w-full rounded-[6px] border border-[#e2e8f0] bg-[#f8fafc] px-3 text-[13px] outline-none focus:border-[#2563eb] focus:bg-white disabled:opacity-50"
              />
            </div>
          </div>
          <div>
            <FormLabel>{editingUser ? 'Nova Senha' : 'Senha'}</FormLabel>
            <input
              type="password"
              value={draft.password}
              onChange={(e) => updateDraft('password', e.target.value)}
              placeholder={
                editingUser ? 'Opcional para redefinir' : 'Min. 10 caracteres'
              }
              className="h-9 w-full rounded-[6px] border border-[#e2e8f0] bg-[#f8fafc] px-3 text-[13px] outline-none focus:border-[#2563eb] focus:bg-white"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <FormLabel>Cargo Base</FormLabel>
              <select
                value={draft.role}
                onChange={(e) =>
                  updateDraft('role', e.target.value as UserRole)
                }
                className="h-9 w-full rounded-[6px] border border-[#e2e8f0] bg-[#f8fafc] px-3 text-[13px] outline-none focus:border-[#2563eb] focus:bg-white"
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {getRoleMeta(role).label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FormLabel>Setor</FormLabel>
              <select
                value={draft.sector}
                onChange={(e) =>
                  updateDraft('sector', e.target.value as UserSector)
                }
                className="h-9 w-full rounded-[6px] border border-[#e2e8f0] bg-[#f8fafc] px-3 text-[13px] outline-none focus:border-[#2563eb] focus:bg-white"
              >
                {SECTOR_OPTIONS.map((sector) => (
                  <option key={sector} value={sector}>
                    {sector}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FormLabel>Preset</FormLabel>
              <select
                value={draft.accessPresetId}
                onChange={(e) => updateDraft('accessPresetId', e.target.value)}
                className="h-9 w-full rounded-[6px] border border-[#e2e8f0] bg-[#f8fafc] px-3 text-[13px] outline-none focus:border-[#2563eb] focus:bg-white"
              >
                <option value="">Sem preset</option>
                {availablePresets.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="rounded-[10px] border border-[#e2e8f0] bg-[#f8fafc] p-4">
            <div className="mb-3 inline-flex items-center gap-2 font-bold text-[#0f172a]">
              <UsersIcon className="size-4 text-[#2563eb]" /> Permissão por
              módulo
            </div>
            {isAccessLoading || isLoadingAccess ? (
              <div className="text-[13px] text-[#64748b]">
                Carregando acessos...
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {modules.map((module) => (
                  <div
                    key={module.key}
                    className="rounded-[8px] border border-[#e2e8f0] bg-white p-3"
                  >
                    <div className="text-[13px] font-semibold text-[#0f172a]">
                      {module.name}
                    </div>
                    {module.description && (
                      <div className="mt-0.5 text-[11px] text-[#64748b]">
                        {module.description}
                      </div>
                    )}
                    <select
                      value={draft.modulePermissions[module.key] || 'none'}
                      onChange={(e) =>
                        updateModulePermission(
                          module.key,
                          e.target.value as AccessLevel,
                        )
                      }
                      className="mt-2 h-8 w-full rounded-[6px] border border-[#e2e8f0] bg-[#f8fafc] px-2 text-[12px] outline-none focus:border-[#2563eb] focus:bg-white"
                    >
                      {ACCESS_OPTIONS.map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>
          {errorMessage && (
            <div className="mt-4 rounded-[8px] border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-[13px] font-semibold text-[#dc2626]">
              {errorMessage}
            </div>
          )}
        </div>
      </ModalShell>
    </div>
  );
}
