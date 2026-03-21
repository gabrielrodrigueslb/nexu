import Image from "next/image";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/login-form";
import { AUTH_COOKIE_NAME } from "@/lib/auth";

export default async function LoginPage() {
  const hasSession = (await cookies()).has(AUTH_COOKIE_NAME);

  if (hasSession) {
    redirect("/dashboard");
  }

  return (
    <>
      <div className="grid min-h-svh lg:grid-cols-2">
        <div className="flex flex-col gap-4 p-6 md:p-10">
          <div className="flex justify-center gap-2 md:justify-start">
            <a href="#" className="flex items-center gap-2 font-medium">
              <Image
                src="/nexu.png"
                alt="Nexu"
                width={140}
                height={40}
                priority
                className="w-[140px]"
              />
            </a>
          </div>
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-xs">
              <LoginForm />
            </div>
          </div>
        </div>
        <div className="relative hidden bg-muted lg:block">
          <Image
            src="/bg-2.png"
            alt="Image"
            fill
            priority
            className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
          />
        </div>
      </div>
    </>
  );
}
