import { handleMcpPost, methodNotAllowed } from "@/lib/mcp/server";

// Same MCP endpoint with the secret in the path: /api/mcp/<MCP_SECRET>.

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key } = await params;
  return handleMcpPost(request, decodeURIComponent(key));
}

export const GET = methodNotAllowed;
export const DELETE = methodNotAllowed;
