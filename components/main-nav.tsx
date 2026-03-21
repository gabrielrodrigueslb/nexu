"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BriefcaseBusiness,
  Building2,
  LayoutDashboard,
  UsersRound,
} from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    description: "Visao geral do negocio",
    icon: LayoutDashboard,
  },
  {
    href: "/dashboardcrm",
    label: "CRM",
    description: "Leads, funil e relacionamento",
    icon: UsersRound,
  },
  {
    href: "/comercial",
    label: "Comercial",
    description: "CRM de venda, fechamentos e tarefas",
    icon: BriefcaseBusiness,
  },
] as const;

type MainNavProps = {
  className?: string;
  orientation?: "column" | "row";
};

export function MainNav({
  className,
  orientation = "column",
}: MainNavProps) {
  const pathname = usePathname();
  const isRow = orientation === "row";

  return (
    <nav
      className={cn(
        "grid gap-3",
        isRow ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1",
        className
      )}
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group rounded-2xl border px-4 py-3 transition-all",
              isRow
                ? "flex min-h-28 flex-col justify-between"
                : "flex items-start gap-3",
              isActive
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-950 shadow-sm"
                : "border-black/5 bg-white/70 text-zinc-700 hover:border-emerald-500/20 hover:bg-white hover:text-zinc-950"
            )}
          >
            <div
              className={cn(
                "flex items-center justify-center rounded-xl border border-black/5 bg-white text-emerald-700 shadow-sm",
                isRow ? "size-10" : "mt-0.5 size-11"
              )}
            >
              <Icon className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{item.label}</span>
                {isActive ? (
                  <span className="rounded-full bg-emerald-600/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                    Ativo
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-zinc-500">{item.description}</p>
            </div>
            {isRow ? null : <Building2 className="mt-1 size-4 text-zinc-300" />}
          </Link>
        );
      })}
    </nav>
  );
}
