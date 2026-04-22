"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { ChevronRight, CircleDot, LogOut } from "lucide-react";

import { logoutAction } from "@/app/actions/auth";
import { hasModuleAccess, type AccessLevel, type SessionAccess, type UserRole } from "@/lib/auth";
import { cn } from "@/lib/utils";

type GroupId = "comercial" | "financeiro" | "implantacao" | "suporte" | "dev";

type NavLink = {
  type: "link";
  label: string;
  href: string;
  moduleKey?: string;
  accessLevel?: AccessLevel;
};

type NavGroup = {
  type: "group";
  id: GroupId;
  label: string;
  moduleKey?: string;
  accessLevel?: AccessLevel;
  children: NavLink[];
};

type NavSection = { label: string; items: (NavLink | NavGroup)[] };

function isVisibleNavItem(item: NavLink | NavGroup | null): item is NavLink | NavGroup {
  return item !== null;
}

const NAV: NavSection[] = [
  {
    label: "Principal",
    items: [
      { type: "link", label: "Dashboard", href: "/dashboard", moduleKey: "DASHBOARD" },
      { type: "link", label: "Dashboard CRM", href: "/dashboardcrm", moduleKey: "COMMERCIAL" },
      { type: "link", label: "Dashboard Suporte", href: "/dashboardSuporte", moduleKey: "SUPORTE" },
      { type: "link", label: "Dashboard Dev", href: "/dashboardDev", moduleKey: "DESENVOLVIMENTO" },
      { type: "link", label: "Busca Global", href: "/buscaGlobal", moduleKey: "DASHBOARD" },
    ],
  },
  {
    label: "Setores",
    items: [
      {
        type: "group",
        id: "comercial",
        label: "Comercial",
        moduleKey: "COMMERCIAL",
        children: [
          { type: "link", label: "CRM de Venda", href: "/comercial/crm-venda", moduleKey: "COMMERCIAL" },
          { type: "link", label: "Cliente Fechado", href: "/comercial/cliente-fechado", moduleKey: "COMMERCIAL" },
          { type: "link", label: "Tarefas dos Leads", href: "/comercial/tarefas-leads", moduleKey: "COMMERCIAL" },
          { type: "link", label: "Leads Perdidos", href: "/comercial/leads-perdidos", moduleKey: "COMMERCIAL" },
        ],
      },
      {
        type: "group",
        id: "financeiro",
        label: "Financeiro",
        moduleKey: "FINANCEIRO",
        children: [
          { type: "link", label: "Cobrança e Contrato", href: "/financeiro/cobranca-contrato", moduleKey: "FINANCEIRO" },
          { type: "link", label: "Fluxo", href: "/financeiro/fluxo", moduleKey: "FINANCEIRO" },
        ],
      },
      {
        type: "group",
        id: "implantacao",
        label: "Implantação",
        moduleKey: "IMPLANTACAO",
        children: [
          { type: "link", label: "Kanban Implantação", href: "/implantacao/kanban-implantacao", moduleKey: "IMPLANTACAO" },
          { type: "link", label: "Tarefas Implantadores", href: "/implantacao/tarefas-implantadores", moduleKey: "IMPLANTACAO" },
        ],
      },
      {
        type: "group",
        id: "suporte",
        label: "Suporte",
        moduleKey: "SUPORTE",
        children: [{ type: "link", label: "Dashboard Suporte", href: "/dashboardSuporte", moduleKey: "SUPORTE" }],
      },
      {
        type: "group",
        id: "dev",
        label: "Desenvolvimento",
        moduleKey: "DESENVOLVIMENTO",
        children: [
          { type: "link", label: "Kanban Dev", href: "/desenvolvimento/kanban-dev", moduleKey: "DESENVOLVIMENTO" },
          { type: "link", label: "Sprints", href: "/desenvolvimento/sprints", moduleKey: "DESENVOLVIMENTO" },
        ],
      },
    ],
  },
  {
    label: "Biblioteca",
    items: [
      { type: "link", label: "Biblioteca Dev", href: "/biblioteca-dev", moduleKey: "DESENVOLVIMENTO" },
      { type: "link", label: "Instâncias", href: "/instancias", moduleKey: "DESENVOLVIMENTO" },
    ],
  },
  {
    label: "Admin",
    items: [
      { type: "link", label: "Usuários", href: "/usuarios", moduleKey: "USUARIOS", accessLevel: "manage" },
      { type: "link", label: "Integrações", href: "/integracoes", moduleKey: "CADASTROS", accessLevel: "view" },
      { type: "link", label: "Produtos", href: "/produtos", moduleKey: "CADASTROS", accessLevel: "view" },
      { type: "link", label: "Etiquetas", href: "/etiquetas", moduleKey: "CADASTROS", accessLevel: "view" },
      { type: "link", label: "Origens CRM", href: "/origens-crm", moduleKey: "CADASTROS", accessLevel: "view" },
      { type: "link", label: "Indicadores", href: "/indicadores", moduleKey: "CADASTROS", accessLevel: "view" },
      { type: "link", label: "Lixeira", href: "/lixeira", moduleKey: "LIXEIRA", accessLevel: "view" },
    ],
  },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getInitials(label: string) {
  return (
    label
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase())
      .join("") || "?"
  );
}

function canRender(access: SessionAccess, item: NavLink | NavGroup) {
  return !item.moduleKey || hasModuleAccess(access, item.moduleKey, item.accessLevel || "view");
}

function NavItem({ item, pathname }: { item: NavLink; pathname: string }) {
  const active = isActive(pathname, item.href);

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex w-full items-center gap-[10px] rounded-[8px] px-[10px] py-[9px] text-[13.5px] font-medium select-none transition-colors duration-150",
        active
          ? "bg-[rgba(37,99,235,0.25)] font-semibold text-[#93c5fd]"
          : "text-[#94a3b8] hover:bg-[#1e293b] hover:text-[#f1f5f9]",
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
  const active = item.children.some((child) => isActive(pathname, child.href));

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "flex w-full cursor-pointer items-center gap-[10px] rounded-[8px] px-[10px] py-[9px] text-[13.5px] font-medium select-none transition-colors duration-150",
          active
            ? "bg-[rgba(37,99,235,0.25)] font-semibold text-[#93c5fd]"
            : "text-[#94a3b8] hover:bg-[#1e293b] hover:text-[#f1f5f9]",
        )}
      >
        <span aria-hidden className="w-5 shrink-0" />
        <span>{item.label}</span>
        <ChevronRight
          className={cn(
            "ml-auto size-3 shrink-0 opacity-45 transition-transform duration-200",
            isOpen && "rotate-90",
          )}
        />
      </button>

      {isOpen ? (
        <div className="mt-1 flex flex-col gap-1 px-3 pb-1">
          {item.children.map((child) => {
            const childActive = isActive(pathname, child.href);

            return (
              <Link
                key={child.href}
                href={child.href}
                aria-current={childActive ? "page" : undefined}
                className={cn(
                  "group relative flex w-full items-center rounded-[6px] px-[10px] py-[7px] pl-[22px] text-[13px] font-medium select-none transition-colors duration-150",
                  childActive
                    ? "bg-[rgba(37,99,235,0.2)] font-semibold text-[#93c5fd]"
                    : "text-[#94a3b8] hover:bg-[#1e293b] hover:text-[#f1f5f9]",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "absolute left-[9px] top-1/2 size-[6px] -translate-y-1/2 rounded-full transition-opacity duration-150",
                    childActive
                      ? "bg-[#93c5fd] opacity-100"
                      : "bg-[#94a3b8] opacity-30 group-hover:opacity-70",
                  )}
                />
                {child.label}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

type AppSidebarProps = {
  userEmail: string;
  userLabel: string;
  access: SessionAccess;
  role: UserRole;
};

export function AppSidebar({ userEmail, userLabel, access, role }: AppSidebarProps) {
  const pathname = usePathname();

  const visibleNav = useMemo(
    () =>
      NAV.map((section) => ({
        ...section,
        items: section.items
          .map((item) => {
            if (item.type === "group") {
              const children = item.children.filter((child) => canRender(access, child));

              if (!children.length || !canRender(access, item)) {
                return null;
              }

              return {
                ...item,
                children,
              };
            }

            return canRender(access, item) ? item : null;
          })
          .filter(isVisibleNavItem),
      })).filter((section) => section.items.length),
    [access],
  );

  const [openGroups, setOpenGroups] = useState<Record<GroupId, boolean>>({
    comercial: pathname.startsWith("/comercial"),
    financeiro: pathname.startsWith("/financeiro"),
    implantacao: pathname.startsWith("/implantacao"),
    suporte: pathname.startsWith("/dashboardSuporte"),
    dev: pathname.startsWith("/desenvolvimento"),
  });

  const toggle = (id: GroupId) => {
    setOpenGroups((current) => ({ ...current, [id]: !current[id] }));
  };

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

      {visibleNav.map((section) => (
        <div key={section.label} className="px-3 pb-[px] pt-[14px]">
          <div className="mb-1 px-2 text-[10px] font-bold tracking-[0.1em] text-[#475569] uppercase">
            {section.label}
          </div>
          {section.items.map((item) =>
            item.type === "group" ? (
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
            {userLabel || "-"}
          </div>
          <div className="truncate text-[10.5px] text-[#64748b]">
            {userEmail || "-"} · {role}
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
