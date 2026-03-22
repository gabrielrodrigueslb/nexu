import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
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
    <div className="h-svh overflow-hidden bg-[linear-gradient(180deg,#f4f7fb_0%,#eef6f3_46%,#f8fafc_100%)] text-zinc-950">
      <div className="mx-auto flex h-full w-full flex-col overflow-hidden lg:flex-row">
        <AppSidebar userLabel={userLabel} userEmail={userEmail} />

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <main className="scrollbar-minimal flex-1 overflow-y-auto px-4 py-6 md:px-6 lg:px-8 lg:py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
