import { handleMcpPost, methodNotAllowed } from "@/lib/mcp/server";

// MCP endpoint for Claude: /api/mcp?key=<MCP_SECRET> or Bearer header.
// Logic lives in src/lib/mcp/server.ts.

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export function POST(request: Request) {
  return handleMcpPost(request);
}

export const GET = methodNotAllowed;
export const DELETE = methodNotAllowed;
