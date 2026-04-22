'use client';

import { useMemo, useState } from 'react';
import { Save } from 'lucide-react';

import {
  AppAlert,
  AppFormLabel,
  AppInput,
  AppPageIntro,
  AppPrimaryButton,
  AppSurface,
} from '@/components/app-ui-kit';
import { useCurrentAdminUser } from '@/components/admin-users-storage';
import { apiRequest } from '@/lib/api-client';

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
  if (role === 'leader') return 'Lider';
  return 'Básico';
}

export function ProfilePage() {
  const { currentUser } = useCurrentAdminUser();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const subtitle = useMemo(
    () =>
      currentUser ? `${roleLabel(currentUser.role)} · ${currentUser.sector}` : '',
    [currentUser],
  );

  async function handleSave() {
    if (!currentUser) {
      setErrorMessage('Sessão não encontrada.');
      setMessage('');
      return;
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMessage('Preencha todos os campos.');
      setMessage('');
      return;
    }

    if (newPassword.length < 10) {
      setErrorMessage('Nova senha com no minimo 10 caracteres.');
      setMessage('');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Senhas não coincidem.');
      setMessage('');
      return;
    }

    setIsSaving(true);
    setErrorMessage('');
    setMessage('');

    try {
      await apiRequest('/api/backend/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      await fetch('/api/session/logout', {
        method: 'POST',
      });

      setMessage('Senha alterada com sucesso. Entrando novamente...');
      window.location.assign('/');
    } catch (nextError) {
      setErrorMessage(nextError instanceof Error ? nextError.message : 'Falha ao alterar senha.');
    } finally {
      setIsSaving(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  }

  if (!currentUser) {
    return <AppAlert tone="danger">Sessão indisponível.</AppAlert>;
  }

  return (
    <div className="mx-auto max-w-[480px]">
      <AppPageIntro title="Meu Perfil" subtitle="Gerencie seus dados de acesso." />

      <AppSurface className="mt-4 p-6">
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
            <div className="mb-[5px]">
              <AppFormLabel required>Senha Atual</AppFormLabel>
            </div>
            <AppInput
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              placeholder="Senha atual"
            />
          </div>

          <div>
            <div className="mb-[5px]">
              <AppFormLabel required>Nova Senha</AppFormLabel>
            </div>
            <AppInput
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="Min. 10 caracteres"
            />
          </div>

          <div>
            <div className="mb-[5px]">
              <AppFormLabel required>Confirmar Nova Senha</AppFormLabel>
            </div>
            <AppInput
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repetir nova senha"
            />
          </div>

          {errorMessage ? <AppAlert tone="danger">{errorMessage}</AppAlert> : null}
          {message ? <AppAlert tone="success">{message}</AppAlert> : null}

          <AppPrimaryButton
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-[8px] px-[16px] py-[10px] text-[13px]"
          >
            <Save className="size-4" />
            {isSaving ? 'Salvando...' : 'Salvar Nova Senha'}
          </AppPrimaryButton>
        </div>
      </AppSurface>
    </div>
  );
}
