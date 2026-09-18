#!/usr/bin/env node

const endpoint = (process.env.ARTI_MCP_URL || "https://mcp-market-production.up.railway.app/mcp").replace(/\/$/u, "");
const healthUrl = process.env.ARTI_MCP_HEALTH_URL || new URL("/health", endpoint).toString();
const apiKey = process.env.ARTI_MCP_API_KEY?.trim();
const requiredTools = ["load_stock_context", "get_realtime_quote", "get_technical_indicators", "get_financial_report"];

function headers(extra = {}) {
  return { Accept: "application/json, text/event-stream", "Content-Type": "application/json", "MCP-Protocol-Version": "2025-06-18", ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}), ...extra };
}
async function readJson(response) {
  const text = await response.text();
  const line = text.split(/\r?\n/u).find((item) => item.startsWith("data:") && item.slice(5).trim() !== "[DONE]");
  return JSON.parse(line ? line.slice(5).trim() : text);
}
async function post(method, params, sessionId) {
  const response = await fetch(endpoint, { method: "POST", headers: headers(sessionId ? { "Mcp-Session-Id": sessionId } : {}), body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method, params }) });
  if (!response.ok) throw new Error(`MCP ${method} HTTP ${response.status}: ${await response.text()}`);
  return { payload: await readJson(response), sessionId: response.headers.get("mcp-session-id") || sessionId };
}
const health = await fetch(healthUrl);
if (!health.ok) throw new Error(`健康检查失败：HTTP ${health.status}`);
const healthPayload = await health.json();
const initialized = await post("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "arti-skill-check", version: "1" } });
const listed = await post("tools/list", {}, initialized.sessionId);
const tools = listed.payload?.result?.tools;
if (!Array.isArray(tools)) throw new Error("tools/list 未返回工具数组");
const names = new Set(tools.map((tool) => tool.name));
const missing = requiredTools.filter((name) => !names.has(name));
if (missing.length > 0) throw new Error(`缺少核心工具：${missing.join(", ")}`);
console.log(JSON.stringify({ endpoint, health: healthPayload, server: initialized.payload?.result?.serverInfo ?? null, session: Boolean(listed.sessionId), requiredTools: requiredTools.length, toolCount: tools.length, passed: true }, null, 2));
