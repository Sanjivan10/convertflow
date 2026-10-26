import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { callTool, isToolName, toolDefinitions } from "@/lib/mcp/blog-tools";

/*
 * MCP server (Streamable HTTP, stateless JSON responses) so Claude can manage
 * ConvertFlow blog posts.
 *
 * Auth: set MCP_SECRET in the environment, then either
 *   - send header  `Authorization: Bearer <MCP_SECRET>`  (Claude Code), or
 *   - use the URL  `/api/mcp?key=<MCP_SECRET>`            (claude.ai connector)
 * Without MCP_SECRET the endpoint is disabled.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SUPPORTED_VERSIONS = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"];
const SERVER_INFO = { name: "convertflow", version: "1.0.0" };

type JsonRpcRequest = {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
};

function authorized(request: Request) {
  const secret = process.env.MCP_SECRET;
  if (!secret || secret.length < 16) return false;
  const header = request.headers.get("authorization") ?? "";
  const given =
    (header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "") ||
    new URL(request.url).searchParams.get("key") ||
    "";
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

const result = (id: JsonRpcRequest["id"], value: unknown) => ({ jsonrpc: "2.0", id, result: value });
const error = (id: JsonRpcRequest["id"], code: number, message: string) => ({
  jsonrpc: "2.0",
  id: id ?? null,
  error: { code, message },
});

async function handle(msg: JsonRpcRequest) {
  const { id, method, params } = msg;
  switch (method) {
    case "initialize": {
      const requested = String(params?.protocolVersion ?? "");
      return result(id, {
        protocolVersion: SUPPORTED_VERSIONS.includes(requested) ? requested : SUPPORTED_VERSIONS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions:
          "Manage blog posts on the ConvertFlow website. Write content as HTML. New posts are drafts unless status is PUBLISHED. Each result includes the post's public url.",
      });
    }
    case "ping":
      return result(id, {});
    case "tools/list":
      return result(id, { tools: toolDefinitions });
    case "tools/call": {
      const name = String(params?.name ?? "");
      if (!isToolName(name)) return error(id, -32602, `Unknown tool: ${name}`);
      try {
        const output = await callTool(name, params?.arguments);
        return result(id, {
          content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
        });
      } catch (e) {
        const message =
          e instanceof ZodError
            ? `Invalid arguments: ${e.issues.map((i) => `${i.path.join(".") || "input"}: ${i.message}`).join("; ")}`
            : e instanceof Error
              ? e.message
              : String(e);
        return result(id, { content: [{ type: "text", text: message }], isError: true });
      }
    }
    default:
      return error(id, -32601, `Method not found: ${method}`);
  }
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json(error(null, -32001, "Unauthorized"), { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(error(null, -32700, "Parse error"), { status: 400 });
  }

  const messages = (Array.isArray(body) ? body : [body]) as JsonRpcRequest[];
  const responses = [];
  for (const msg of messages) {
    if (!msg || typeof msg.method !== "string") {
      responses.push(error(msg?.id, -32600, "Invalid request"));
      continue;
    }
    // Notifications (no id) get no response.
    if (msg.id === undefined || msg.id === null) continue;
    responses.push(await handle(msg));
  }

  if (responses.length === 0) return new NextResponse(null, { status: 202 });
  return NextResponse.json(Array.isArray(body) ? responses : responses[0]);
}

// Stateless server: no server-initiated stream and no sessions to end.
export function GET() {
  return new NextResponse(null, { status: 405, headers: { Allow: "POST" } });
}

export function DELETE() {
  return new NextResponse(null, { status: 405, headers: { Allow: "POST" } });
}
