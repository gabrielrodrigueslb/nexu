'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ChevronRight, CircleDot, LogOut } from 'lucide-react';

import { logoutAction } from '@/app/actions/auth';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

type GroupId = 'comercial' | 'financeiro' | 'implantacao' | 'dev';

type NavLink = { type: 'link'; label: string; href: string };
type NavGroup = {
  type: 'group';
  id: GroupId;
  label: string;
  children: NavLink[];
};
type NavSection = { label: string; items: (NavLink | NavGroup)[] };

// ─── Data ────────────────────────────────────────────────────────────────────

const NAV: NavSection[] = [
  {
    label: 'Principal',
    items: [
      { type: 'link', label: 'Dashboard', href: '/dashboard' },
      { type: 'link', label: 'Dashboard CRM', href: '/dashboardcrm' },
      { type: 'link', label: 'Dashboard Suporte', href: '/dashboardSuporte' },
      { type: 'link', label: 'Dashboard Dev', href: '/dashboardDev' },
      { type: 'link', label: 'Busca Global', href: '/buscaGlobal' },
    ],
  },
  {
    label: 'Setores',
    items: [
      {
        type: 'group',
        id: 'comercial',
        label: 'Comercial',
        children: [
          { type: 'link', label: 'CRM de Venda', href: '/comercial/crm-venda' },
          {
            type: 'link',
            label: 'Cliente Fechado',
            href: '/comercial/cliente-fechado',
          },
          {
            type: 'link',
            label: 'Tarefas dos Leads',
            href: '/comercial/tarefas-leads',
          },
          {
            type: 'link',
            label: 'Leads Perdidos',
            href: '/comercial/leads-perdidos',
          },
        ],
      },
      {
        type: 'group',
        id: 'financeiro',
        label: 'Financeiro',
        children: [
          {
            type: 'link',
            label: 'Cobranca e Contrato',
            href: '/financeiro/cobranca-contrato',
          },
          { type: 'link', label: 'Fluxo', href: '/financeiro/fluxo' },
        ],
      },
      {
        type: 'group',
        id: 'implantacao',
        label: 'Implantacao',
        children: [
          {
            type: 'link',
            label: 'Kanban Implantacao',
            href: '/implantacao/kanban-implantacao',
          },
          {
            type: 'link',
            label: 'Tarefas Implantadores',
            href: '/implantacao/tarefas-implantadores',
          },
        ],
      },
      {
        type: 'group',
        id: 'dev',
        label: 'Desenvolvimento',
        children: [
          {
            type: 'link',
            label: 'Kanban Dev',
            href: '/desenvolvimento/kanban-dev',
          },
          { type: 'link', label: 'Sprints', href: '/desenvolvimento/sprints' },
        ],
      },
    ],
  },
  {
    label: 'Biblioteca',
    items: [
      { type: 'link', label: 'Biblioteca Dev', href: '/biblioteca-dev' },
      { type: 'link', label: 'Instancias', href: '/instancias' },
    ],
  },
  {
    label: 'Admin',
    items: [
      { type: 'link', label: 'Usuarios', href: '/usuarios' },
      { type: 'link', label: 'Integracoes', href: '/integracoes' },
      { type: 'link', label: 'Produtos', href: '/produtos' },
      { type: 'link', label: 'Etiquetas', href: '/etiquetas' },
      { type: 'link', label: 'Origens CRM', href: '/origens-crm' },
      { type: 'link', label: 'SDRs', href: '/sdrs' },
      { type: 'link', label: 'Indicadores', href: '/indicadores' },
      { type: 'link', label: 'Lixeira', href: '/lixeira' },
    ],
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getInitials(label: string) {
  return (
    label
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('') || '?'
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function NavItem({ item, pathname }: { item: NavLink; pathname: string }) {
  const active = isActive(pathname, item.href);
  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex w-full items-center gap-[10px] rounded-[8px] px-[10px] py-[9px] text-[13.5px] font-medium select-none transition-colors duration-150',
        active
          ? 'bg-[rgba(37,99,235,0.25)] font-semibold text-[#93c5fd]'
          : 'text-[#94a3b8] hover:bg-[#1e293b] hover:text-[#f1f5f9]',
      )}
    >
      <span aria-hidden className="w-5 shrink-0" />
      <span>{item.label}</span>
    </Link>
  );
}

function NavGroupItem({
  item,
  pathname,
  isOpen,
  onToggle,
}: {
  item: NavGroup;
  pathname: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const active = item.children.some((c) => isActive(pathname, c.href));
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'flex w-full cursor-pointer items-center gap-[10px] rounded-[8px] px-[10px] py-[9px] text-[13.5px] font-medium select-none transition-colors duration-150',
          active
            ? 'bg-[rgba(37,99,235,0.25)] font-semibold text-[#93c5fd]'
            : 'text-[#94a3b8] hover:bg-[#1e293b] hover:text-[#f1f5f9]',
        )}
      >
        <span aria-hidden className="w-5 shrink-0" />
        <span>{item.label}</span>
        <ChevronRight
          className={cn(
            'ml-auto size-3 shrink-0 opacity-45 transition-transform duration-200',
            isOpen && 'rotate-90',
          )}
        />
      </button>

      {isOpen && (
        <div className="px-3 pb-1 flex flex-col gap-1 mt-1">
          {item.children.map((child) => {
            const childActive = isActive(pathname, child.href);
            return (
              <Link
                key={child.href}
                href={child.href}
                aria-current={childActive ? 'page' : undefined}
                className={cn(
                  'group relative flex w-full items-center rounded-[6px] px-[10px] py-[7px] pl-[22px] text-[13px] font-medium select-none transition-colors duration-150',
                  childActive
                    ? 'bg-[rgba(37,99,235,0.2)] font-semibold text-[#93c5fd]'
                    : 'text-[#94a3b8] hover:bg-[#1e293b] hover:text-[#f1f5f9]',
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    'absolute left-[9px] top-1/2 size-[6px] -translate-y-1/2 rounded-full transition-opacity duration-150',
                    childActive
                      ? 'bg-[#93c5fd] opacity-100'
                      : 'bg-[#94a3b8] opacity-30 group-hover:opacity-70',
                  )}
                />
                {child.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type AppSidebarProps = { userEmail: string; userLabel: string };

export function AppSidebar({ userEmail, userLabel }: AppSidebarProps) {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Record<GroupId, boolean>>({
    comercial: pathname.startsWith('/comercial'),
    financeiro: pathname.startsWith('/financeiro'),
    implantacao: pathname.startsWith('/implantacao'),
    dev: pathname.startsWith('/desenvolvimento'),
  });

  const toggle = (id: GroupId) =>
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <aside className="scrollbar-minimal hidden w-[240px] shrink-0 bg-[#0f172a] lg:flex lg:min-h-svh lg:flex-col lg:overflow-y-auto">
      <Image
        src="/nexu_branco.png"
        alt="Nexu"
        width={130}
        height={37}
        priority
        className="w-[130px] pl-4 py-[10px]"
      />
      <div className="border-b border-white/[0.07]" />

      {NAV.map((section) => (
        <div key={section.label} className="px-3 pb-[px] pt-[14px]">
          <div className="mb-1 px-2 text-[10px] font-bold tracking-[0.1em] text-[#475569] uppercase">
            {section.label}
          </div>
          {section.items.map((item) =>
            item.type === 'group' ? (
              <NavGroupItem
                key={item.id}
                item={item}
                pathname={pathname}
                isOpen={openGroups[item.id]}
                onToggle={() => toggle(item.id)}
              />
            ) : (
              <NavItem key={item.href} item={item} pathname={pathname} />
            ),
          )}
        </div>
      ))}

      <div className="mt-auto flex items-center gap-[10px] border-t border-white/[0.07] px-4 py-[14px]">
        <div className="flex size-[34px] shrink-0 items-center justify-center rounded-full bg-[#2563eb] text-[13px] font-bold text-white">
          {getInitials(userLabel)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12.5px] font-semibold text-[#f1f5f9]">
            {userLabel || '-'}
          </div>
          <div className="truncate text-[10.5px] text-[#64748b]">
            {userEmail || '-'}
          </div>
        </div>
        <Link
          href="/perfil"
          title="Meu Perfil"
          aria-label="Meu Perfil"
          className="flex size-7 shrink-0 items-center justify-center rounded-[6px] border border-white/10 text-[#64748b] transition-all duration-150 hover:bg-white/[0.08] hover:text-[#94a3b8]"
        >
          <CircleDot className="size-[14px]" />
        </Link>
        <form action={logoutAction}>
          <button
            type="submit"
            title="Sair"
            aria-label="Sair"
            className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-[6px] border border-white/10 text-[#64748b] transition-all duration-150 hover:bg-white/[0.08] hover:text-[#94a3b8]"
          >
            <LogOut className="size-[14px]" />
          </button>
        </form>
      </div>
    </aside>
  );
}
