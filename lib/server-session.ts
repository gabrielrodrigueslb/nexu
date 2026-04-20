import "server-only";

import { cookies } from "next/headers";

import {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  type SessionData,
} from "@/lib/auth";

const API_BASE_URL =
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://127.0.0.1:3333/api";

const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

function getCookieOptions(maxAge = SESSION_MAX_AGE) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

function buildBackendUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}

function parseSessionCookie(value?: string) {
  if (!value) return null;

  try {
    return JSON.parse(value) as SessionData;
  } catch {
    return null;
  }
}

async function backendFetch(path: string, init?: RequestInit, accessToken?: string) {
  const headers = new Headers(init?.headers);

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  return fetch(buildBackendUrl(path), {
    ...init,
    headers,
    cache: "no-store",
  });
}

export async function storeSessionCookies(payload: {
  accessToken: string;
  refreshToken: string;
  user: SessionData["user"];
  access: SessionData["access"];
}) {
  const cookieStore = await cookies();
  const sessionValue = JSON.stringify({
    user: payload.user,
    access: payload.access,
  } satisfies SessionData);

  cookieStore.set(ACCESS_TOKEN_COOKIE_NAME, payload.accessToken, getCookieOptions(60 * 15));
  cookieStore.set(REFRESH_TOKEN_COOKIE_NAME, payload.refreshToken, getCookieOptions());
  cookieStore.set(SESSION_COOKIE_NAME, sessionValue, getCookieOptions());
}

export async function clearSessionCookies() {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_TOKEN_COOKIE_NAME);
  cookieStore.delete(REFRESH_TOKEN_COOKIE_NAME);
  cookieStore.delete(SESSION_COOKIE_NAME);
}

async function refreshSessionFromBackend() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE_NAME)?.value;

  if (!refreshToken) {
    await clearSessionCookies();
    return null;
  }

  let response: Response;

  try {
    response = await backendFetch("/auth/refresh", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });
  } catch {
    return null;
  }

  if (!response.ok) {
    await clearSessionCookies();
    return null;
  }

  const payload = await response.json();
  await storeSessionCookies(payload);

  return payload.accessToken as string;
}

export async function getValidAccessToken() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE_NAME)?.value;

  if (accessToken) {
    return accessToken;
  }

  return refreshSessionFromBackend();
}

export async function getCurrentSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const storedSession = parseSessionCookie(cookieStore.get(SESSION_COOKIE_NAME)?.value);

  if (storedSession) {
    return storedSession;
  }

  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE_NAME)?.value;

  if (!accessToken) {
    return null;
  }

  let response: Response;

  try {
    response = await backendFetch("/auth/me", { method: "GET" }, accessToken);
  } catch {
    return null;
  }

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as SessionData;
}

export async function proxyAuthenticatedRequest(request: Request, path: string) {
  let accessToken = await getValidAccessToken();

  if (!accessToken) {
    return new Response(JSON.stringify({ error: { message: "Nao autenticado" } }), {
      status: 401,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  const incomingUrl = new URL(request.url);
  const contentType = request.headers.get("content-type");
  const headers = new Headers();

  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  const body =
    request.method === "GET" || request.method === "HEAD"
      ? undefined
      : await request.text();

  let response: Response;

  try {
    response = await backendFetch(
      `${path}${incomingUrl.search}`,
      {
        method: request.method,
        headers,
        body,
      },
      accessToken,
    );
  } catch {
    return new Response(JSON.stringify({ error: { message: "API indisponivel no momento" } }), {
      status: 503,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  if (response.status === 401) {
    accessToken = await refreshSessionFromBackend();

    if (!accessToken) {
      return new Response(JSON.stringify({ error: { message: "Nao autenticado" } }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    try {
      response = await backendFetch(
        `${path}${incomingUrl.search}`,
        {
          method: request.method,
          headers,
          body,
        },
        accessToken,
      );
    } catch {
      return new Response(JSON.stringify({ error: { message: "API indisponivel no momento" } }), {
        status: 503,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
  }

  const responseHeaders = new Headers();
  const responseContentType = response.headers.get("content-type");

  if (responseContentType) {
    responseHeaders.set("Content-Type", responseContentType);
  }

  return new Response(response.body, {
    status: response.status,
    headers: responseHeaders,
  });
}
