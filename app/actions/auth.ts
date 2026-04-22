"use server";

import { redirect } from "next/navigation";

import { clearSessionCookies, storeSessionCookies } from "@/lib/server-session";

const API_BASE_URL =
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://127.0.0.1:3333/api";

export type LoginFormState = {
  error?: string;
};

export async function loginAction(
  _previousState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return {
      error: "Informe e-mail e senha.",
    };
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });
  } catch {
    return {
      error: "Não foi possível conectar com a API. Confirme se o backend está rodando em http://127.0.0.1:3333.",
    };
  }

  if (!response.ok) {
    let message = "Falha ao autenticar.";

    try {
      const payload = await response.json();
      message = payload?.error?.message || message;
    } catch {
      // Keep fallback message.
    }

    return {
      error: message,
    };
  }

  const payload = await response.json();
  await storeSessionCookies(payload);

  redirect("/dashboard");
}

export async function logoutAction() {
  await clearSessionCookies();
  redirect("/");
}
