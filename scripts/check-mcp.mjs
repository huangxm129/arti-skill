#!/usr/bin/env node

const DEFAULT_ENDPOINT = "https://mcp-market-production.up.railway.app/mcp";
const MCP_PROTOCOL_VERSION = "2025-06-18";
const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_RETRIES = 2;
const DEFAULT_RETRY_DELAY_MS = 250;

export const REQUIRED_TOOLS = Object.freeze([
  "get_realtime_quote", "get_order_book", "get_tick_data", "get_minute_bars",
  "get_technical_indicators", "get_sector_flow", "get_north_flow",
  "get_stock_fund_flow", "get_stock_info", "get_company_profile",
  "get_trading_rules", "get_daily_bars", "get_financial_report",
  "get_dividend_history", "get_market_overview", "get_longhu_list",
  "get_margin_data", "get_macro_indicators", "get_trade_calendar",
  "load_stock_context", "get_report_data_review", "get_report_data_trace",
  "validate_report_sources",
]);

let nextRequestId = 1;

export class McpCheckError extends Error {
  constructor(message, { stage, status, body, cause } = {}) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = "McpCheckError";
    this.stage = stage;
    this.status = status;
    this.body = body;
  }
}

function isTransientStatus(status) {
  return status === 502 || status === 503 || status === 504;
}

function isTransientError(error) {
  return error instanceof TypeError || error?.name === "AbortError" || error?.code === "UND_ERR_CONNECT_TIMEOUT";
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function requestHeaders(apiKey, extra = {}) {
  return {
    Accept: "application/json, text/event-stream",
    "Content-Type": "application/json",
    "MCP-Protocol-Version": MCP_PROTOCOL_VERSION,
    ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    ...extra,
  };
}

export function parseMcpPayload(text, contentType = "") {
  if (!text.trim()) return null;
  if (!contentType.toLowerCase().includes("text/event-stream")) return JSON.parse(text);
  const data = text
    .replaceAll("\r\n", "\n")
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trim())
    .find((line) => line && line !== "[DONE]");
  if (!data) throw new Error("MCP SSE 响应缺少 JSON-RPC 结果");
  return JSON.parse(data);
}

async function fetchResponse({ fetchImpl, url, init, stage, retries, retryDelayMs, timeoutMs, sleepImpl }) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetchImpl(url, {
        ...init,
        signal: AbortSignal.timeout(timeoutMs ?? DEFAULT_TIMEOUT_MS),
      });
      const body = await response.text();
      if (response.ok) return { response, body };
      const error = new McpCheckError(
        `MCP ${stage} HTTP ${response.status}: ${body || "空响应"}`,
        { stage, status: response.status, body },
      );
      if (!isTransientStatus(response.status) || attempt === retries) throw error;
      await sleepImpl(retryDelayMs * (attempt + 1));
    } catch (error) {
      if (error instanceof McpCheckError && (!isTransientStatus(error.status) || attempt === retries)) throw error;
      if (!(error instanceof McpCheckError) && (!isTransientError(error) || attempt === retries)) {
        throw new McpCheckError(`MCP ${stage} 网络请求失败: ${error.message}`, { stage, cause: error });
      }
      await sleepImpl(retryDelayMs * (attempt + 1));
    }
  }
  throw new McpCheckError(`MCP ${stage} 请求未完成`, { stage });
}

async function postMcp({ endpoint, apiKey, method, params, sessionId, notification = false, fetchImpl, retries, retryDelayMs, timeoutMs, sleepImpl }) {
  const body = {
    jsonrpc: "2.0",
    ...(notification ? {} : { id: nextRequestId++ }),
    method,
    params,
  };
  const { response, body: text } = await fetchResponse({
    fetchImpl,
    url: endpoint,
    stage: method,
    retries,
    retryDelayMs,
    timeoutMs,
    sleepImpl,
    init: {
      method: "POST",
      headers: requestHeaders(apiKey, sessionId ? { "Mcp-Session-Id": sessionId } : {}),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    },
  });
  const payload = parseMcpPayload(text, response.headers.get("content-type") ?? "");
  if (payload?.error) {
    throw new McpCheckError(
      `MCP ${method} JSON-RPC ${payload.error.code}: ${payload.error.message}`,
      { stage: method, body: text },
    );
  }
  return {
    payload,
    sessionId: response.headers.get("mcp-session-id") || sessionId,
  };
}

export async function runMcpCheck({
  endpoint = DEFAULT_ENDPOINT,
  healthUrl = new URL("/health", endpoint).toString(),
  apiKey,
  smokeSymbol,
  fetchImpl = fetch,
  retries = DEFAULT_RETRIES,
  retryDelayMs = DEFAULT_RETRY_DELAY_MS,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  sleepImpl = sleep,
} = {}) {
  const healthResponse = await fetchResponse({
    fetchImpl,
    url: healthUrl,
    stage: "health",
    retries,
    retryDelayMs,
    timeoutMs,
    sleepImpl,
    init: {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(timeoutMs),
    },
  });
  let healthPayload;
  try {
    healthPayload = JSON.parse(healthResponse.body);
  } catch (error) {
    throw new McpCheckError(`健康检查返回无效 JSON: ${error.message}`, { stage: "health", body: healthResponse.body, cause: error });
  }

  const initialized = await postMcp({
    endpoint,
    apiKey,
    method: "initialize",
    params: {
      protocolVersion: MCP_PROTOCOL_VERSION,
      capabilities: {},
      clientInfo: { name: "arti-skill-check", version: "2" },
    },
    fetchImpl,
    retries,
    retryDelayMs,
    timeoutMs,
    sleepImpl,
  });
  if (!initialized.sessionId) {
    throw new McpCheckError("MCP initialize 未返回 session ID", { stage: "initialize" });
  }

  await postMcp({
    endpoint,
    apiKey,
    method: "notifications/initialized",
    params: {},
    sessionId: initialized.sessionId,
    notification: true,
    fetchImpl,
    retries,
    retryDelayMs,
    timeoutMs,
    sleepImpl,
  });

  const listed = await postMcp({
    endpoint,
    apiKey,
    method: "tools/list",
    params: {},
    sessionId: initialized.sessionId,
    fetchImpl,
    retries,
    retryDelayMs,
    timeoutMs,
    sleepImpl,
  });
  const tools = listed.payload?.result?.tools;
  if (!Array.isArray(tools)) throw new McpCheckError("tools/list 未返回工具数组", { stage: "tools/list" });
  const names = new Set(tools.map((tool) => tool.name));
  const missing = REQUIRED_TOOLS.filter((name) => !names.has(name));
  if (missing.length > 0) {
    throw new McpCheckError(`缺少核心工具: ${missing.join(", ")}`, { stage: "tools/list" });
  }

  let smoke = null;
  if (smokeSymbol) {
    const called = await postMcp({
      endpoint,
      apiKey,
      method: "tools/call",
      params: { name: "get_realtime_quote", arguments: { symbol: smokeSymbol } },
      sessionId: initialized.sessionId,
      fetchImpl,
      retries,
      retryDelayMs,
      timeoutMs,
      sleepImpl,
    });
    if (called.payload?.result?.isError === true) {
      throw new McpCheckError("MCP tools/call 返回 isError", { stage: "tools/call", body: JSON.stringify(called.payload) });
    }
    smoke = { tool: "get_realtime_quote", symbol: smokeSymbol, isError: called.payload?.result?.isError === true };
  }

  return {
    endpoint,
    health: healthPayload,
    server: initialized.payload?.result?.serverInfo ?? null,
    session: Boolean(listed.sessionId),
    requiredTools: REQUIRED_TOOLS.length,
    toolCount: tools.length,
    tools: tools.map((tool) => tool.name),
    ...(smoke ? { smoke } : {}),
    passed: true,
  };
}

function optionsFromEnv() {
  const endpoint = (process.env.ARTI_MCP_URL || DEFAULT_ENDPOINT).replace(/\/$/u, "");
  return {
    endpoint,
    healthUrl: process.env.ARTI_MCP_HEALTH_URL || new URL("/health", endpoint).toString(),
    apiKey: process.env.ARTI_MCP_API_KEY?.trim(),
    smokeSymbol: process.env.ARTI_MCP_SMOKE_SYMBOL?.trim() || undefined,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    console.log(JSON.stringify(await runMcpCheck(optionsFromEnv()), null, 2));
  } catch (error) {
    console.error(JSON.stringify({
      passed: false,
      stage: error.stage ?? "unknown",
      status: error.status ?? null,
      error: error.message,
    }, null, 2));
    process.exitCode = 1;
  }
}
