"use client";

import { createContext, useContext } from "react";

import type { SessionData } from "@/lib/auth";

const SessionContext = createContext<SessionData | null>(null);

export function SessionProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session: SessionData;
}) {
  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return useContext(SessionContext);
}
