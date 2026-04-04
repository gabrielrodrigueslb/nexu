'use client';

import { useState } from 'react';
import { Pencil, Plus, Trash2, Users as UsersIcon } from 'lucide-react';

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
import { cn } from '@/lib/utils';

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

function ToolbarButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center gap-[6px] rounded-[6px] border border-[#e2e8f0] bg-white px-3 py-[6px] text-[12px] font-semibold text-[#64748b] transition-colors hover:border-[#2563eb] hover:text-[#2563eb]',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function FormLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[11px] font-bold tracking-[.06em] text-[#64748b] uppercase">
      {children}
    </label>
  );
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
      setErrorMessage('Nome e e-mail são obrigatórios.');
      return;
    }

    const emailInUse = users.some(
      (user) => user.email.toLowerCase() === normalizedEmail && user.id !== editingUserId,
    );

    if (emailInUse) {
      setErrorMessage('E-mail já cadastrado.');
      return;
    }

    if (!editingUserId && draft.password.trim().length < 6) {
      setErrorMessage('Senha mín. 6 chars.');
      return;
    }

    if (editingUserId && draft.password && draft.password.trim().length < 6) {
      setErrorMessage('Senha mín. 6 chars.');
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
    return (
      <div className="rounded-[12px] border border-dashed border-[#cbd5e1] bg-white px-6 py-12 text-center">
        <div className="text-[28px] leading-none">🔒</div>
        <div className="mt-3 text-[18px] font-bold text-[#0f172a]">
          Apenas Administradores
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="-mx-4 -my-6 md:-mx-6 lg:-mx-8 lg:-my-8">
        <div className="sticky top-0 z-20 flex min-h-14 items-center gap-4 border-b border-[#e2e8f0] bg-white px-6">
          <strong className="text-[15px] font-bold text-[#0f172a]">Usuários</strong>
          <div className="ml-auto flex flex-wrap items-center gap-2 py-3">
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-[6px] rounded-[6px] bg-[#2563eb] px-3 py-[6px] text-[12px] font-semibold text-white transition-colors hover:bg-[#1d4ed8]"
            >
              <Plus className="size-4" />
              Novo Usuário
            </button>
          </div>
        </div>

        <div className="bg-[#f1f5f9] px-6 py-6">
          <div className="mb-4">
            <div className="text-[26px] font-extrabold tracking-[-0.03em] text-[#0f172a]">
              Usuários
            </div>
            <div className="mt-2 text-[12px] text-[#64748b]">{users.length} usuário(s)</div>
          </div>

          <div className="overflow-hidden rounded-[12px] border border-[#e2e8f0] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
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
                          <span
                            className={cn(
                              'inline-flex rounded-full border px-[10px] py-[4px] text-[11px] font-bold',
                              roleMeta.className,
                            )}
                          >
                            {roleMeta.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[13px] text-[#475569]">{user.sector}</td>
                        <td className="px-4 py-3 text-[13px] text-[#475569]">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-[5px]">
                            <ToolbarButton onClick={() => openEditModal(user)}>
                              <Pencil className="size-3.5" />
                            </ToolbarButton>
                            {user.id !== currentUser.id ? (
                              <ToolbarButton
                                onClick={() => handleDelete(user.id)}
                                className="text-[#dc2626] hover:border-[#dc2626] hover:text-[#dc2626]"
                              >
                                <Trash2 className="size-3.5" />
                              </ToolbarButton>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <ModalShell
        open={isModalOpen}
        title={editingUser ? 'Editar Usuário' : 'Novo Usuário'}
        description="Gerencie os dados de acesso e permissão do usuário."
        maxWidthClassName="max-w-[560px]"
        onClose={closeModal}
        footer={
          <>
            <ToolbarButton onClick={closeModal}>Cancelar</ToolbarButton>
            <button
              type="button"
              onClick={handleSave}
              className="rounded-[8px] bg-[#2563eb] px-4 py-[10px] text-[13px] font-semibold text-white transition-colors hover:bg-[#1d4ed8]"
            >
              {editingUser ? 'Salvar alterações' : 'Criar usuário'}
            </button>
          </>
        }
      >
        <div className="grid gap-4">
          <div className="flex flex-col gap-[5px]">
            <FormLabel>Nome</FormLabel>
            <input
              value={draft.name}
              onChange={(event) => updateDraft('name', event.target.value)}
              className="w-full rounded-[7px] border-[1.5px] border-[#e2e8f0] bg-[#f8fafc] px-3 py-[9px] text-[13px] text-[#0f172a] outline-none transition-colors focus:border-[#2563eb]"
            />
          </div>

          <div className="flex flex-col gap-[5px]">
            <FormLabel>E-mail</FormLabel>
            <input
              type="email"
              value={draft.email}
              onChange={(event) => updateDraft('email', event.target.value)}
              className="w-full rounded-[7px] border-[1.5px] border-[#e2e8f0] bg-[#f8fafc] px-3 py-[9px] text-[13px] text-[#0f172a] outline-none transition-colors focus:border-[#2563eb]"
            />
          </div>

          <div className="flex flex-col gap-[5px]">
            <FormLabel>{editingUser ? 'Nova Senha' : 'Senha'}</FormLabel>
            <input
              type="password"
              value={draft.password}
              onChange={(event) => updateDraft('password', event.target.value)}
              placeholder={editingUser ? 'Opcional' : 'Mín. 6 caracteres'}
              className="w-full rounded-[7px] border-[1.5px] border-[#e2e8f0] bg-[#f8fafc] px-3 py-[9px] text-[13px] text-[#0f172a] outline-none transition-colors focus:border-[#2563eb]"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-[5px]">
              <FormLabel>Papel</FormLabel>
              <select
                value={draft.role}
                onChange={(event) => updateDraft('role', event.target.value as UserRole)}
                className="w-full rounded-[7px] border-[1.5px] border-[#e2e8f0] bg-[#f8fafc] px-3 py-[9px] text-[13px] text-[#0f172a] outline-none transition-colors focus:border-[#2563eb]"
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {getRoleMeta(role).label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-[5px]">
              <FormLabel>Setor</FormLabel>
              <select
                value={draft.sector}
                onChange={(event) => updateDraft('sector', event.target.value as UserSector)}
                className="w-full rounded-[7px] border-[1.5px] border-[#e2e8f0] bg-[#f8fafc] px-3 py-[9px] text-[13px] text-[#0f172a] outline-none transition-colors focus:border-[#2563eb]"
              >
                {SECTOR_OPTIONS.map((sector) => (
                  <option key={sector} value={sector}>
                    {sector}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {errorMessage ? (
            <div className="rounded-[8px] border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-[12px] font-medium text-[#dc2626]">
              {errorMessage}
            </div>
          ) : null}

          <div className="rounded-[10px] border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 text-[12px] text-[#64748b]">
            <div className="inline-flex items-center gap-2 font-semibold text-[#0f172a]">
              <UsersIcon className="size-4 text-[#2563eb]" />
              Regras
            </div>
            <div className="mt-2">Nome e e-mail são obrigatórios.</div>
            <div>E-mail não pode duplicar.</div>
            <div>Senha precisa ter pelo menos 6 caracteres.</div>
          </div>
        </div>
      </ModalShell>
    </>
  );
}
