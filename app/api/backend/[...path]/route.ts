import { proxyAuthenticatedRequest } from "@/lib/server-session";

async function handle(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  return proxyAuthenticatedRequest(request, `/${path.join("/")}`);
}

export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  return handle(request, context);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  return handle(request, context);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  return handle(request, context);
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  return handle(request, context);
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  return handle(request, context);
}
