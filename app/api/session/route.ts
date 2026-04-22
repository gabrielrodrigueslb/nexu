import { NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/server-session";

export async function GET() {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ error: { message: "Não autenticado" } }, { status: 401 });
  }

  return NextResponse.json(session);
}
