import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LogOut, Sparkles } from "lucide-react";

import { logoutAction } from "@/app/actions/auth";
import { AppSidebar } from "@/components/app-sidebar";
import { MainNav } from "@/components/main-nav";
import { Button } from "@/components/ui/button";
import { AUTH_COOKIE_NAME, formatUserLabel } from "@/lib/auth";

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const sessionCookie = (await cookies()).get(AUTH_COOKIE_NAME);

  if (!sessionCookie?.value) {
    redirect("/");
  }

  const userEmail = sessionCookie.value;
  const userLabel = formatUserLabel(userEmail);

  return (
    <div className="min-h-svh bg-[linear-gradient(180deg,#f4f7fb_0%,#eef6f3_46%,#f8fafc_100%)] text-zinc-950">
      <div className="mx-auto flex min-h-svh w-full  flex-col lg:flex-row">
        <AppSidebar userLabel={userLabel} userEmail={userEmail} />

        <div className="flex min-h-svh flex-1 flex-col">
          <header className="border-b border-black/5 bg-white/65 px-4 py-4 backdrop-blur md:px-6 lg:px-8">
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/8 px-3 py-1 text-xs font-medium text-emerald-800">
                    <Sparkles className="size-3.5" />
                    Ambiente interno protegido
                  </div>
                  <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950">
                    Bem-vindo, {userLabel || "time Nexu"}
                  </h1>
                  <p className="mt-1 text-sm text-zinc-500">
                    Seus modulos internos estao organizados dentro do grupo
                    <code className="ml-1 rounded bg-black/5 px-1.5 py-0.5 text-[12px]">
                      (main)
                    </code>
                    sem alterar as URLs publicas.
                  </p>
                </div>

                <form action={logoutAction} className="hidden lg:block">
                  <Button
                    type="submit"
                    variant="outline"
                    className="border-black/10 bg-white"
                  >
                    <LogOut className="size-4" />
                    Sair
                  </Button>
                </form>
              </div>

              <div className="lg:hidden">
                <MainNav orientation="row" />
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 md:px-6 lg:px-8 lg:py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
