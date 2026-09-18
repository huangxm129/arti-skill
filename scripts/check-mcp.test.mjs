import assert from "node:assert/strict";
import test from "node:test";
import {
  REQUIRED_TOOLS,
  runMcpCheck,
} from "./check-mcp.mjs";

const tools = REQUIRED_TOOLS.map((name) => ({ name }));

function sse(payload) {
  return `event: message\ndata: ${JSON.stringify(payload)}\n\n`;
}

function response(body, status = 200, headers = { "content-type": "application/json" }) {
  return new Response(body, { status, headers });
}

test("MCP 检查按标准握手建立会话并复用 session ID", async () => {
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    const body = init.body ? JSON.parse(init.body) : null;
    calls.push({ url, body, headers: new Headers(init.headers) });
    if (url.endsWith("/health")) return response(JSON.stringify({ status: "ok" }));
    if (body.method === "initialize") {
      return response(sse({
        jsonrpc: "2.0",
        id: body.id,
        result: { serverInfo: { name: "arti-market", version: "test" } },
      }), 200, { "content-type": "text/event-stream", "mcp-session-id": "session-1" });
    }
    if (body.method === "notifications/initialized") return new Response(null, { status: 202 });
    if (body.method === "tools/list") {
      assert.equal(calls.at(-1).headers.get("mcp-session-id"), "session-1");
      return response(sse({ jsonrpc: "2.0", id: body.id, result: { tools } }), 200, {
        "content-type": "text/event-stream",
        "mcp-session-id": "session-1",
      });
    }
    throw new Error(`unexpected method: ${body.method}`);
  };

  const result = await runMcpCheck({
    endpoint: "https://example.test/mcp",
    healthUrl: "https://example.test/health",
    fetchImpl,
    retryDelayMs: 0,
  });

  assert.equal(result.passed, true);
  assert.equal(result.session, true);
  assert.equal(result.toolCount, REQUIRED_TOOLS.length);
  assert.deepEqual(calls.map(({ body }) => body?.method ?? "health"), [
    "health",
    "initialize",
    "notifications/initialized",
    "tools/list",
  ]);
  assert.equal(calls[2].body.id, undefined);
  assert.equal(calls[3].headers.get("mcp-session-id"), "session-1");
});

test("MCP 检查只对瞬时 502 重试并在恢复后继续握手", async () => {
  let initializeAttempts = 0;
  const fetchImpl = async (url, init = {}) => {
    const body = init.body ? JSON.parse(init.body) : null;
    if (url.endsWith("/health")) return response(JSON.stringify({ status: "ok" }));
    if (body.method === "initialize") {
      initializeAttempts++;
      if (initializeAttempts === 1) return response("bad gateway", 502);
      return response(sse({ jsonrpc: "2.0", id: body.id, result: {} }), 200, {
        "content-type": "text/event-stream",
        "mcp-session-id": "session-2",
      });
    }
    if (body.method === "notifications/initialized") return new Response(null, { status: 202 });
    return response(sse({ jsonrpc: "2.0", id: body.id, result: { tools } }), 200, {
      "content-type": "text/event-stream",
      "mcp-session-id": "session-2",
    });
  };

  const result = await runMcpCheck({
    endpoint: "https://example.test/mcp",
    healthUrl: "https://example.test/health",
    fetchImpl,
    retryDelayMs: 0,
  });

  assert.equal(result.passed, true);
  assert.equal(initializeAttempts, 2);
});

test("MCP 检查保留缺少 session 的 HTTP 错误阶段", async () => {
  const fetchImpl = async (url, init = {}) => {
    if (url.endsWith("/health")) return response(JSON.stringify({ status: "ok" }));
    const body = JSON.parse(init.body);
    if (body.method === "initialize") {
      return response(sse({ jsonrpc: "2.0", id: body.id, result: {} }), 200, {
        "content-type": "text/event-stream",
        "mcp-session-id": "session-3",
      });
    }
    if (body.method === "notifications/initialized") return new Response(null, { status: 202 });
    return response(JSON.stringify({ error: "Missing session ID" }), 400);
  };

  await assert.rejects(
    () => runMcpCheck({
      endpoint: "https://example.test/mcp",
      healthUrl: "https://example.test/health",
      fetchImpl,
      retryDelayMs: 0,
    }),
    /tools\/list HTTP 400/,
  );
});

test("超时重试为每次请求创建新的 AbortSignal", async () => {
  const signals = [];
  let attempts = 0;
  const fetchImpl = async (url, init = {}) => {
    signals.push(init.signal);
    if (url.endsWith("/health")) {
      attempts++;
      if (attempts === 1) throw new DOMException("timed out", "AbortError");
      return response(JSON.stringify({ status: "ok" }));
    }
    const body = JSON.parse(init.body);
    if (body.method === "initialize") return response(sse({ jsonrpc: "2.0", id: body.id, result: {} }), 200, {
      "content-type": "text/event-stream",
      "mcp-session-id": "session-4",
    });
    if (body.method === "notifications/initialized") return new Response(null, { status: 202 });
    return response(sse({ jsonrpc: "2.0", id: body.id, result: { tools } }), 200, {
      "content-type": "text/event-stream",
      "mcp-session-id": "session-4",
    });
  };

  const result = await runMcpCheck({
    endpoint: "https://example.test/mcp",
    healthUrl: "https://example.test/health",
    fetchImpl,
    retryDelayMs: 0,
  });

  assert.equal(result.passed, true);
  assert.notEqual(signals[0], signals[1]);
});

test("行情冒烟调用返回业务错误时不报告检查通过", async () => {
  const fetchImpl = async (url, init = {}) => {
    if (url.endsWith("/health")) return response(JSON.stringify({ status: "ok" }));
    const body = JSON.parse(init.body);
    if (body.method === "initialize") return response(sse({ jsonrpc: "2.0", id: body.id, result: {} }), 200, {
      "content-type": "text/event-stream",
      "mcp-session-id": "session-5",
    });
    if (body.method === "notifications/initialized") return new Response(null, { status: 202 });
    if (body.method === "tools/list") return response(sse({ jsonrpc: "2.0", id: body.id, result: { tools } }), 200, {
      "content-type": "text/event-stream",
      "mcp-session-id": "session-5",
    });
    return response(sse({ jsonrpc: "2.0", id: body.id, result: { isError: true, content: [{ type: "text", text: "upstream unavailable" }] } }), 200, {
      "content-type": "text/event-stream",
      "mcp-session-id": "session-5",
    });
  };

  await assert.rejects(
    () => runMcpCheck({
      endpoint: "https://example.test/mcp",
      healthUrl: "https://example.test/health",
      smokeSymbol: "600519.SS",
      fetchImpl,
      retryDelayMs: 0,
    }),
    /tools\/call 返回 isError/,
  );
});
