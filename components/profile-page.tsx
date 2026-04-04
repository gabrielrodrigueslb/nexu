'use client';

import { useMemo, useState } from 'react';
import { Save } from 'lucide-react';

import { useCurrentAdminUser } from '@/components/admin-users-storage';

function getInitials(label: string) {
  return (
    label
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || '?'
  );
}

function roleLabel(role: string) {
  if (role === 'admin') return 'Administrador';
  if (role === 'supervisor') return 'Supervisor';
  return 'Agente';
}

function fieldClassName() {
  return 'w-full rounded-[7px] border-[1.5px] border-[#e2e8f0] bg-[#f8fafc] px-3 py-[9px] text-[13px] text-[#0f172a] outline-none transition-colors focus:border-[#2563eb]';
}

export function ProfilePage() {
  const { users, setUsers, currentUser } = useCurrentAdminUser();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const subtitle = useMemo(
    () => `${roleLabel(currentUser.role)} · ${currentUser.sector}`,
    [currentUser.role, currentUser.sector],
  );

  function handleSave() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMessage('Preencha todos os campos.');
      setMessage('');
      return;
    }

    if (currentPassword !== currentUser.password) {
      setErrorMessage('Senha atual incorreta.');
      setMessage('');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('Nova senha min. 6 caracteres.');
      setMessage('');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Senhas nao coincidem.');
      setMessage('');
      return;
    }

    setUsers(
      users.map((user) =>
        user.id === currentUser.id
          ? {
              ...user,
              password: newPassword,
              updatedAt: new Date().toISOString(),
            }
          : user,
      ),
    );

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrorMessage('');
    setMessage('Senha alterada com sucesso.');
  }

  return (
    <div className="mx-auto max-w-[480px]">
      <div className="text-[26px] font-extrabold tracking-[-0.03em] text-[#0f172a]">
        Meu Perfil
      </div>

      <div className="mt-4 rounded-[12px] border border-[#e2e8f0] bg-white p-6">
        <div className="mb-5 flex items-center gap-[14px]">
          <div className="flex size-[52px] items-center justify-center rounded-full bg-[#2563eb] text-[20px] font-bold text-white">
            {getInitials(currentUser.name)}
          </div>
          <div>
            <div className="text-[16px] font-bold text-[#0f172a]">{currentUser.name}</div>
            <div className="text-[13px] text-[#64748b]">{currentUser.email}</div>
            <div className="text-[12px] text-[#64748b]">{subtitle}</div>
          </div>
        </div>

        <div className="mb-4 text-[13px] font-bold text-[#0f172a]">Alterar Senha</div>

        <div className="space-y-4">
          <div>
            <label className="mb-[5px] block text-[11px] font-bold tracking-[.06em] text-[#64748b] uppercase">
              Senha Atual <span className="text-[#dc2626]">*</span>
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              placeholder="Senha atual"
              className={fieldClassName()}
            />
          </div>

          <div>
            <label className="mb-[5px] block text-[11px] font-bold tracking-[.06em] text-[#64748b] uppercase">
              Nova Senha <span className="text-[#dc2626]">*</span>
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="Min. 6 caracteres"
              className={fieldClassName()}
            />
          </div>

          <div>
            <label className="mb-[5px] block text-[11px] font-bold tracking-[.06em] text-[#64748b] uppercase">
              Confirmar Nova Senha <span className="text-[#dc2626]">*</span>
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repetir nova senha"
              className={fieldClassName()}
            />
          </div>

          {errorMessage ? (
            <div className="rounded-[8px] border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-[12px] font-medium text-[#dc2626]">
              {errorMessage}
            </div>
          ) : null}

          {message ? (
            <div className="rounded-[8px] border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-2 text-[12px] font-medium text-[#166534]">
              {message}
            </div>
          ) : null}

          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-[8px] rounded-[8px] bg-[#2563eb] px-[16px] py-[10px] text-[13px] font-semibold text-white transition-colors hover:bg-[#1d4ed8]"
          >
            <Save className="size-4" />
            Salvar Nova Senha
          </button>
        </div>
      </div>
    </div>
  );
}
