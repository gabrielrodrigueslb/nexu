import { redirect } from "next/navigation";

import { AppSidebar } from "@/components/app-sidebar";
import { SessionProvider } from "@/components/providers/session-provider";
import { formatUserLabel } from "@/lib/auth";
import { getCurrentSession } from "@/lib/server-session";

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/");
  }

  const userEmail = session.user.email;
  const userLabel = formatUserLabel(userEmail, session.user.name);

  return (
    <div className="h-svh overflow-hidden bg-[linear-gradient(180deg,#f4f7fb_0%,#eef6f3_46%,#f8fafc_100%)] text-zinc-950">
      <div className="mx-auto flex h-full w-full flex-col overflow-hidden lg:flex-row">
        <SessionProvider session={session}>
          <AppSidebar
            userLabel={userLabel}
            userEmail={userEmail}
            access={session.access}
            role={session.user.role}
          />

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <main className="scrollbar-minimal flex-1 overflow-y-auto px-4 py-6 md:px-6 lg:px-8 lg:py-8">
              {children}
            </main>
          </div>
        </SessionProvider>
      </div>
    </div>
  );
}
