'use client';

import { useState } from 'react';
import { Pencil, Plus, Trash2, Users as UsersIcon } from 'lucide-react';

import {
  AppAlert,
  AppEmptyState,
  AppFormLabel,
  AppInput,
  AppPageContent,
  AppPageIntro,
  AppPageShell,
  AppPageToolbar,
  AppPill,
  AppPrimaryButton,
  AppSelect,
  AppSurface,
  AppToolbarButton,
} from '@/components/app-ui-kit';
import { ModalShell } from '@/components/modal-shell';
import {
  CURRENT_USER_ID,
  INITIAL_ADMIN_USERS,
  ROLE_OPTIONS,
  SECTOR_OPTIONS,
  type AdminUserRecord,
  type UserRole,
  type UserSector,
  useAdminUsers,
} from '@/components/admin-users-storage';

type UserDraft = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  sector: UserSector;
};

const EMPTY_DRAFT: UserDraft = {
  name: '',
  email: '',
  password: '',
  role: 'agent',
  sector: 'CS',
};

function formatDate(value: string) {
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
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

function getRoleMeta(role: UserRole) {
  if (role === 'admin') {
    return {
      label: 'Admin',
      className: 'border-[#ddd6fe] bg-[#f5f3ff] text-[#7c3aed]',
    };
  }

  if (role === 'supervisor') {
    return {
      label: 'Supervisor',
      className: 'border-[#fbcfe8] bg-[#fdf2f8] text-[#be185d]',
    };
  }

  return {
    label: 'Agente',
    className: 'border-[#bfdbfe] bg-[#eff6ff] text-[#2563eb]',
  };
}

export function AdminUsersPage() {
  const [users, setUsers] = useAdminUsers();
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draft, setDraft] = useState<UserDraft>(EMPTY_DRAFT);
  const [errorMessage, setErrorMessage] = useState('');
  const currentUser = users.find((user) => user.id === CURRENT_USER_ID) ?? INITIAL_ADMIN_USERS[0];
  const editingUser = users.find((user) => user.id === editingUserId) ?? null;

  function updateDraft<Key extends keyof UserDraft>(key: Key, value: UserDraft[Key]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function openCreateModal() {
    setEditingUserId(null);
    setDraft(EMPTY_DRAFT);
    setErrorMessage('');
    setIsModalOpen(true);
  }

  function openEditModal(user: AdminUserRecord) {
    setEditingUserId(user.id);
    setDraft({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      sector: user.sector,
    });
    setErrorMessage('');
    setIsModalOpen(true);
  }

  function closeModal() {
    setEditingUserId(null);
    setDraft(EMPTY_DRAFT);
    setErrorMessage('');
    setIsModalOpen(false);
  }

  function handleSave() {
    const normalizedEmail = draft.email.trim().toLowerCase();

    if (!draft.name.trim() || !normalizedEmail) {
      setErrorMessage('Nome e e-mail sao obrigatorios.');
      return;
    }

    const emailInUse = users.some(
      (user) => user.email.toLowerCase() === normalizedEmail && user.id !== editingUserId,
    );

    if (emailInUse) {
      setErrorMessage('E-mail ja cadastrado.');
      return;
    }

    if (!editingUserId && draft.password.trim().length < 6) {
      setErrorMessage('Senha min. 6 chars.');
      return;
    }

    if (editingUserId && draft.password && draft.password.trim().length < 6) {
      setErrorMessage('Senha min. 6 chars.');
      return;
    }

    if (editingUserId) {
      setUsers((current) =>
        current.map((user) =>
          user.id === editingUserId
            ? {
                ...user,
                name: draft.name.trim(),
                email: normalizedEmail,
                role: draft.role,
                sector: draft.sector,
                password: draft.password.trim() ? draft.password.trim() : user.password,
                updatedAt: new Date().toISOString().slice(0, 10),
              }
            : user,
        ),
      );
    } else {
      setUsers((current) => [
        ...current,
        {
          id: `usr-${Date.now()}`,
          name: draft.name.trim(),
          email: normalizedEmail,
          password: draft.password.trim(),
          role: draft.role,
          sector: draft.sector,
          createdAt: new Date().toISOString().slice(0, 10),
        },
      ]);
    }

    closeModal();
  }

  function handleDelete(userId: string) {
    if (!window.confirm('Remover?')) return;
    setUsers((current) => current.filter((user) => user.id !== userId));
  }

  if (currentUser.role !== 'admin') {
    return <AppEmptyState icon="🔒" title="Apenas Administradores" />;
  }

  return (
    <>
      <AppPageShell>
        <AppPageToolbar
          title="Usuarios"
          actions={
            <AppPrimaryButton onClick={openCreateModal}>
              <Plus className="size-4" />
              Novo Usuario
            </AppPrimaryButton>
          }
        />

        <AppPageContent>
          <AppPageIntro title="Usuarios" subtitle={`${users.length} usuario(s)`} />

          <AppSurface className="overflow-hidden shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
                    {['Nome', 'E-mail', 'Papel', 'Setor', 'Criado', ''].map((header) => (
                      <th
                        key={header || 'actions'}
                        className="px-4 py-3 text-left text-[12px] font-bold text-[#64748b]"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const roleMeta = getRoleMeta(user.role);

                    return (
                      <tr key={user.id} className="border-b border-[#e2e8f0] last:border-b-0">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="inline-flex size-7 items-center justify-center rounded-full bg-[#2563eb] text-[11px] font-bold text-white">
                              {getInitials(user.name)}
                            </div>
                            <strong className="text-[13px] text-[#0f172a]">{user.name}</strong>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[13px] text-[#475569]">{user.email}</td>
                        <td className="px-4 py-3">
                          <AppPill className={roleMeta.className}>{roleMeta.label}</AppPill>
                        </td>
                        <td className="px-4 py-3 text-[13px] text-[#475569]">{user.sector}</td>
                        <td className="px-4 py-3 text-[13px] text-[#475569]">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-[5px]">
                            <AppToolbarButton onClick={() => openEditModal(user)}>
                              <Pencil className="size-3.5" />
                            </AppToolbarButton>
                            {user.id !== currentUser.id ? (
                              <AppToolbarButton
                                onClick={() => handleDelete(user.id)}
                                className="text-[#dc2626] hover:border-[#dc2626] hover:text-[#dc2626]"
                              >
                                <Trash2 className="size-3.5" />
                              </AppToolbarButton>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </AppSurface>
        </AppPageContent>
      </AppPageShell>

      <ModalShell
        open={isModalOpen}
        title={editingUser ? 'Editar Usuario' : 'Novo Usuario'}
        description="Gerencie os dados de acesso e permissao do usuario."
        maxWidthClassName="max-w-[560px]"
        onClose={closeModal}
        footer={
          <>
            <AppToolbarButton onClick={closeModal}>Cancelar</AppToolbarButton>
            <AppPrimaryButton onClick={handleSave} className="rounded-[8px] px-4 py-[10px] text-[13px]">
              {editingUser ? 'Salvar alteracoes' : 'Criar usuario'}
            </AppPrimaryButton>
          </>
        }
      >
        <div className="grid gap-4">
          <div className="flex flex-col gap-[5px]">
            <AppFormLabel>Nome</AppFormLabel>
            <AppInput value={draft.name} onChange={(event) => updateDraft('name', event.target.value)} />
          </div>

          <div className="flex flex-col gap-[5px]">
            <AppFormLabel>E-mail</AppFormLabel>
            <AppInput
              type="email"
              value={draft.email}
              onChange={(event) => updateDraft('email', event.target.value)}
            />
          </div>

          <div className="flex flex-col gap-[5px]">
            <AppFormLabel>{editingUser ? 'Nova Senha' : 'Senha'}</AppFormLabel>
            <AppInput
              type="password"
              value={draft.password}
              onChange={(event) => updateDraft('password', event.target.value)}
              placeholder={editingUser ? 'Opcional' : 'Min. 6 caracteres'}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-[5px]">
              <AppFormLabel>Papel</AppFormLabel>
              <AppSelect
                value={draft.role}
                onChange={(event) => updateDraft('role', event.target.value as UserRole)}
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {getRoleMeta(role).label}
                  </option>
                ))}
              </AppSelect>
            </div>

            <div className="flex flex-col gap-[5px]">
              <AppFormLabel>Setor</AppFormLabel>
              <AppSelect
                value={draft.sector}
                onChange={(event) => updateDraft('sector', event.target.value as UserSector)}
              >
                {SECTOR_OPTIONS.map((sector) => (
                  <option key={sector} value={sector}>
                    {sector}
                  </option>
                ))}
              </AppSelect>
            </div>
          </div>

          {errorMessage ? <AppAlert tone="danger">{errorMessage}</AppAlert> : null}

          <AppSurface className="rounded-[10px] bg-[#f8fafc] px-4 py-3 text-[12px] text-[#64748b]">
            <div className="inline-flex items-center gap-2 font-semibold text-[#0f172a]">
              <UsersIcon className="size-4 text-[#2563eb]" />
              Regras
            </div>
            <div className="mt-2">Nome e e-mail sao obrigatorios.</div>
            <div>E-mail nao pode duplicar.</div>
            <div>Senha precisa ter pelo menos 6 caracteres.</div>
          </AppSurface>
        </div>
      </ModalShell>
    </>
  );
}
