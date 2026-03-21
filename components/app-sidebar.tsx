"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronRight, CircleDot, LogOut } from "lucide-react";

import { logoutAction } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

type SidebarTone = "blue" | "green" | "orange" | "red";
type SidebarGroupId = "comercial" | "financeiro" | "implantacao" | "dev";

type SidebarBadge = {
  tone: SidebarTone;
  value: string;
};

type SidebarLinkItem = {
  type: "link";
  label: string;
  href?: string;
  hidden?: boolean;
  badge?: SidebarBadge;
};

type SidebarGroupItem = {
  type: "group";
  id: SidebarGroupId;
  label: string;
  hidden?: boolean;
  badge?: SidebarBadge;
  children: SidebarLinkItem[];
};

type SidebarSection = {
  label: string;
  hidden?: boolean;
  items: Array<SidebarLinkItem | SidebarGroupItem>;
};

const sidebarSections: SidebarSection[] = [
  {
    label: "Principal",
    items: [
      { type: "link", label: "Dashboard", href: "/dashboard" },
      { type: "link", label: "Dashboard CRM", href: "/dashboardcrm" },
      { type: "link", label: "Dashboard Suporte" },
      { type: "link", label: "Dashboard Dev" },
      { type: "link", label: "Busca Global" },
    ],
  },
  {
    label: "Setores",
    items: [
      {
        type: "group",
        id: "comercial",
        label: "Comercial",
        children: [
          { type: "link", label: "CRM de Venda", href: "/comercial/crm-venda" },
          {
            type: "link",
            label: "Cliente Fechado",
            href: "/comercial/cliente-fechado",
          },
          {
            type: "link",
            label: "Tarefas dos Leads",
            href: "/comercial/tarefas-leads",
          },
          {
            type: "link",
            label: "Leads Perdidos",
            href: "/comercial/leads-perdidos",
          },
        ],
      },
      {
        type: "group",
        id: "financeiro",
        label: "Financeiro",
        children: [
          { type: "link", label: "Cobrança e Contrato" },
          { type: "link", label: "Fluxo" },
        ],
      },
      {
        type: "group",
        id: "implantacao",
        label: "Implantação",
        children: [
          { type: "link", label: "Kanban Implantação" },
          { type: "link", label: "Tarefas Implantadores" },
        ],
      },
      {
        type: "group",
        id: "dev",
        label: "Desenvolvimento",
        children: [
          { type: "link", label: "Kanban Dev" },
          { type: "link", label: "Sprints" },
        ],
      },
    ],
  },
  {
    label: "Biblioteca",
    items: [
      { type: "link", label: "Biblioteca Dev" },
      { type: "link", label: "Instâncias" },
    ],
  },
  {
    label: "Admin",
    items: [
      { type: "link", label: "Usuários" },
      { type: "link", label: "Integrações" },
      { type: "link", label: "Produtos" },
      { type: "link", label: "Etiquetas" },
      { type: "link", label: "Origens CRM" },
      { type: "link", label: "SDRs" },
      { type: "link", label: "Indicadores" },
      { type: "link", label: "Lixeira" },
    ],
  },
];

const badgeToneClassName: Record<SidebarTone, string> = {
  blue: "bg-[#2563eb]",
  green: "bg-[#059669]",
  orange: "bg-[#d97706]",
  red: "bg-[#dc2626]",
};

const defaultOpenGroups: Record<SidebarGroupId, boolean> = {
  comercial: false,
  financeiro: false,
  implantacao: false,
  dev: false,
};

function isActivePath(pathname: string, href?: string) {
  if (!href) {
    return false;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function getInitials(label: string) {
  const initials = label
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return initials || "?";
}

type AppSidebarProps = {
  userEmail: string;
  userLabel: string;
};

export function AppSidebar({ userEmail, userLabel }: AppSidebarProps) {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] =
    useState<Record<SidebarGroupId, boolean>>({
      ...defaultOpenGroups,
      comercial: pathname.startsWith("/comercial"),
    });

  return (
    <aside className="hidden w-[240px] shrink-0 bg-[#0f172a] lg:flex lg:min-h-svh lg:flex-col lg:overflow-y-auto">
      <Image
        src="/nexu_branco.png"
        alt="Nexu"
        width={130}
        height={37}
        priority
        className="w-[130px] pl-4 py-[10px]"
      />
      <div className="border-b border-white/[0.07] px-4" />

      {sidebarSections.map((section) => {
        if (section.hidden) {
          return null;
        }

        return (
          <div key={section.label} className="px-3 pb-[6px] pt-[14px]">
            <div className="mb-1 px-2 text-[10px] font-bold tracking-[0.1em] text-[#475569] uppercase">
              {section.label}
            </div>

            {section.items.map((item) => {
              if (item.hidden) {
                return null;
              }

              if (item.type === "group") {
                const isGroupActive = item.children.some((child) =>
                  isActivePath(pathname, child.href)
                );
                const isOpen = openGroups[item.id] || isGroupActive;

                return (
                  <div key={item.id}>
                    <button
                      type="button"
                      onClick={() =>
                        setOpenGroups((current) => ({
                          ...current,
                          [item.id]: !current[item.id],
                        }))
                      }
                      className={cn(
                        "flex w-full cursor-pointer items-center gap-[10px] rounded-[8px] px-[10px] py-[9px] text-left text-[13.5px] font-medium select-none transition-colors duration-150",
                        isGroupActive
                          ? "bg-[rgba(37,99,235,0.25)] font-semibold text-[#93c5fd]"
                          : "text-[#94a3b8] hover:bg-[#1e293b] hover:text-[#f1f5f9]"
                      )}
                    >
                      <span
                        aria-hidden
                        className="w-5 shrink-0 text-center text-[15px]"
                      />
                      <span>{item.label}</span>
                      {item.badge ? (
                        <span
                          className={cn(
                            "ml-auto inline-flex min-w-[18px] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white",
                            badgeToneClassName[item.badge.tone]
                          )}
                        >
                          {item.badge.value}
                        </span>
                      ) : null}
                      <ChevronRight
                        className={cn(
                          "ml-auto size-3 shrink-0 text-current opacity-45 transition-transform duration-200",
                          isOpen && "rotate-90"
                        )}
                      />
                    </button>

                    {isOpen ? (
                      <div className="px-3 pb-1">
                        {item.children.map((child) => {
                          if (child.hidden) {
                            return null;
                          }

                          const isChildActive = isActivePath(pathname, child.href);
                          const childClassName = cn(
                            "group relative flex w-full cursor-pointer items-center gap-2 rounded-[6px] px-[10px] py-[7px] pl-[22px] text-left text-[13px] font-medium select-none transition-colors duration-150",
                            isChildActive
                              ? "bg-[rgba(37,99,235,0.2)] font-semibold text-[#93c5fd]"
                              : "text-[#94a3b8] hover:bg-[#1e293b] hover:text-[#f1f5f9]"
                          );
                          const dotClassName = cn(
                            "absolute left-[9px] top-1/2 size-[6px] -translate-y-1/2 rounded-full transition-opacity duration-150",
                            isChildActive
                              ? "bg-[#93c5fd] opacity-100"
                              : "bg-[#94a3b8] opacity-30 group-hover:opacity-70"
                          );

                          if (child.href) {
                            return (
                              <Link
                                key={child.label}
                                href={child.href}
                                className={childClassName}
                                aria-current={isChildActive ? "page" : undefined}
                              >
                                <span aria-hidden className={dotClassName} />
                                <span>{child.label}</span>
                              </Link>
                            );
                          }

                          return (
                            <button
                              key={child.label}
                              type="button"
                              className={childClassName}
                            >
                              <span aria-hidden className={dotClassName} />
                              <span>{child.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              }

              const isItemActive = isActivePath(pathname, item.href);
              const itemClassName = cn(
                "flex w-full cursor-pointer items-center gap-[10px] rounded-[8px] px-[10px] py-[9px] text-left text-[13.5px] font-medium select-none transition-colors duration-150",
                isItemActive
                  ? "bg-[rgba(37,99,235,0.25)] font-semibold text-[#93c5fd]"
                  : "text-[#94a3b8] hover:bg-[#1e293b] hover:text-[#f1f5f9]"
              );

              if (item.href) {
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={itemClassName}
                    aria-current={isItemActive ? "page" : undefined}
                  >
                    <span
                      aria-hidden
                      className="w-5 shrink-0 text-center text-[15px]"
                    />
                    <span>{item.label}</span>
                    {item.badge ? (
                      <span
                        className={cn(
                          "ml-auto inline-flex min-w-[18px] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white",
                          badgeToneClassName[item.badge.tone]
                        )}
                      >
                        {item.badge.value}
                      </span>
                    ) : null}
                  </Link>
                );
              }

              return (
                <button key={item.label} type="button" className={itemClassName}>
                  <span
                    aria-hidden
                    className="w-5 shrink-0 text-center text-[15px]"
                  />
                  <span>{item.label}</span>
                  {item.badge ? (
                    <span
                      className={cn(
                        "ml-auto inline-flex min-w-[18px] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white",
                        badgeToneClassName[item.badge.tone]
                      )}
                    >
                      {item.badge.value}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        );
      })}

      <div className="mt-auto flex items-center gap-[10px] border-t border-white/[0.07] px-4 py-[14px]">
        <div className="flex size-[34px] shrink-0 items-center justify-center rounded-full bg-[#2563eb] text-[13px] font-bold text-white">
          {getInitials(userLabel)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate text-[12.5px] font-semibold text-[#f1f5f9]">
            {userLabel || "-"}
          </div>
          <div className="truncate text-[10.5px] text-[#64748b]">
            {userEmail || "-"}
          </div>
        </div>

        <button
          type="button"
          title="Meu Perfil"
          aria-label="Meu Perfil"
          className="flex size-7 shrink-0 items-center justify-center rounded-[6px] border border-white/10 bg-transparent text-[#64748b] transition-all duration-150 hover:bg-white/[0.08] hover:text-[#94a3b8]"
        >
          <CircleDot className="size-[14px]" />
        </button>

        <form action={logoutAction}>
          <button
            type="submit"
            title="Sair"
            aria-label="Sair"
            className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-[6px] border border-white/10 bg-transparent text-[#64748b] transition-all duration-150 hover:bg-white/[0.08] hover:text-[#94a3b8]"
          >
            <LogOut className="size-[14px]" />
          </button>
        </form>
      </div>
    </aside>
  );
}
