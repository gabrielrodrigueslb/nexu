"use client";

import { useActionState } from "react";

import { loginAction } from "@/app/actions/auth";
import { AppAlert } from "@/components/app-ui-kit";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [state, formAction, isPending] = useActionState(loginAction, {});

  return (
    <form action={formAction} className={cn("flex flex-col gap-6", className)} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center pb-4">
          <h1 className="text-2xl font-bold">Faca login na sua conta</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Insira seu e-mail abaixo para acessar sua conta.
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="m@example.com"
            autoComplete="email"
            required
          />
        </Field>
        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Senha</FieldLabel>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="123456"
            autoComplete="current-password"
            required
          />
        </Field>
        {state.error ? <AppAlert tone="danger">{state.error}</AppAlert> : null}
        <Field className="pt-4">
          <Button className="bg-primary" type="submit" disabled={isPending}>
            {isPending ? "Entrando..." : "Login"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
