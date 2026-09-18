---
name: arti-stock-research
description: Research one publicly traded stock with ARTi market data, financials, technicals, fund flow, report evidence, account credits, and user stock memory. Use for Chinese requests about 个股研究、股票分析、行情、财务、估值、技术面、资金流、深度研报、ARTi 额度、关注或记住一只股票, and equivalent English requests. Do not use for trade execution or broad portfolio optimization unless the user narrows the task to one stock.
---

# ARTi 单股研究

Use ARTi as the factual and account boundary for one-stock research. Keep market facts, paid research, identity, credits, and memory distinct. The current ARTi Market MCP exposes 23 tools, including quote, order book, trades, minute/daily bars, technical indicators, company and financial data, macro/market data, and report evidence tools; discover the live schema rather than assuming a tool exists.

## 首次使用必须先登录

第一次触发本 Skill 时，先检查 ARTi 登录状态，不要先做行情分析，也不要先调用付费诊断。优先运行随插件提供的 `scripts/arti status`；如果未登录，立即运行 `scripts/arti login`，把返回的浏览器授权链接和短期确认信息展示给用户，引导用户打开链接完成注册/登录。等待授权完成后再继续原请求；授权失败或超时就停止并说明原因。不要要求用户粘贴 API key、密码或长期 Token。

## Core rules

1. Work on one primary stock per run. Ask one concise question only when the company or ticker is genuinely ambiguous.
2. Prefer ARTi tools over unsourced recollection. Never invent a quote, balance, entitlement, memory, report status, or link.
3. Label data timestamps, market state, source limitations, cache/fallback status, and unavailable fields.
4. Treat host Agent tokens, ARTi access tokens, and ARTi Credits as different concepts. Read [references/credits-auth-memory.md](references/credits-auth-memory.md) when login, cost, membership, tasks, or memory is relevant.
5. Keep analysis evidence-led and non-personalized. Do not execute trades, promise returns, or present a deterministic buy/sell command.

## Workflow

### 1. Resolve the subject

- Extract the company name, ticker, exchange, market, and requested depth.
- Preserve explicit exchange suffixes.
- If multiple securities plausibly match, show the smallest useful set of candidates and ask the user to choose.
- State the normalized symbol before presenting research.

### 2. Inspect available ARTi capabilities

- Use only tools actually exposed by the host.
- Prefer one aggregate context call for broad research, then use focused calls only for missing or freshness-sensitive fields.
- Read [references/tool-routing.md](references/tool-routing.md) for current and forward-compatible tool selection.
- If ARTi tools are absent, explain that the Skill is installed but its ARTi MCP dependency is not connected. Do not silently replace ARTi with an unrelated provider.

### 3. Select the execution mode

Use **Agent self-research** when the user asks for a quote, quick analysis, a specific dimension, or ordinary single-stock research. Retrieve ARTi facts and perform synthesis in the host Agent. This consumes host Agent tokens; ARTi data calls may have their own server-declared policy. Only enter this mode after the login preflight succeeds or the host explicitly confirms an already authenticated ARTi MCP session.

Use **ARTi deep research** only when all conditions hold:

- The user explicitly requests a deep/full/premium report or equivalent.
- An authenticated ARTi research tool is available.
- The ARTi server confirms entitlement or returns the authoritative cost.

Never infer a price from the Skill. Never call a paid tool merely because a free fact tool failed.

### 4. Gather evidence

For broad research, obtain at least:

- Identity and company profile.
- Latest quote with timestamp and market state.
- Financial statements or summarized fundamentals.
- Technical indicators and relevant price history.
- Stock-specific fund flow when supported for that market.
- Dividends, trading rules, market context, or report evidence when relevant.

Do not force A-share-only tools onto Hong Kong or US stocks. Mark unsupported dimensions as unavailable.

### 5. Use memory deliberately

- Read server-side stock memory for follow-ups, comparisons with prior views, or requests mentioning “上次”“继续”“记忆”“关注”.
- Write memory only after explicit user intent such as “记住”“关注”“跟踪” or an explicit confirmation.
- Store compact, attributable items: thesis, risks, catalysts, horizon, source report, and timestamp.
- Never place access tokens, secrets, unrelated personal information, or inferred risk tolerance in memory.
- Honor forget/delete/disable requests immediately when the corresponding ARTi tool exists.

### 6. Handle login and insufficient credits

- When authentication is required, present the exact authorization URL and QR/deep-link metadata returned by ARTi.
- Never ask the user to paste a long-lived access token into chat.
- On `insufficient_credits` or HTTP 402, stop paid retries.
- Show required and available Credits when returned.
- Present the server-returned actions for earning Credits, buying a plan, or opening account management.
- Do not invent `/tasks`, `/subscription`, or checkout URLs.

### 7. Produce the result

Follow [references/output-contract.md](references/output-contract.md). Separate facts from inference and make changed views traceable to new evidence.

For quick factual questions, answer directly without forcing the full report template.

## MCP 连接故障降级

如果 MCP 工具发现成功但调用出现 `No module named`、`deps not initialized`、HTTP 502/503/504、超时或网络错误，按 [references/mcp-fallback.md](references/mcp-fallback.md) 处理：保留已有证据，免费请求可切换到本仓库随附的 Alpha CLI 备用路径；CLI 会消耗 Credits 时必须先征得用户明确确认。401/403、参数错误和证券不存在不得自动切换数据源。HTTP 502 只表示连接或上游基础设施失败，不等于行情、财务或技术数据为空。

## MCP 连接检查

安装 Skill 不等于宿主已连接 MCP。需要确认连接时，先运行仓库内的 `node scripts/check-mcp.mjs`；它会检查健康端点、标准 MCP 握手、`notifications/initialized`、会话 ID 和当前核心工具。检查脚本会对瞬时 502/503/504、超时和网络错误进行少量重试，并把失败阶段写入 JSON；不会重试认证、参数或工具契约错误。只有输出 `passed: true` 后才开始研究；若检查通过但当前会话没有工具，提示用户新建宿主 Agent 会话或在 MCP 设置中手动添加 `arti-market`。

可选地设置 `ARTI_MCP_SMOKE_SYMBOL=600519.SS`，在工具发现后使用同一会话免费调用一次 `get_realtime_quote` 做链路冒烟；未设置时不调用工具。

## Failure policy

- Return partial research when some independent sources fail; list the missing dimensions.
- Do not let one failed tool erase successfully retrieved evidence.
- Use cached data when the tool labels it and freshness remains appropriate; disclose the cache age.
- Do not claim “real-time” unless the returned metadata supports it.
- If symbol, currency, units, period, or adjustment mode is uncertain, surface the uncertainty instead of guessing.

## References

- Read [references/tool-routing.md](references/tool-routing.md) for ARTi tool selection and market boundaries.
- Read [references/credits-auth-memory.md](references/credits-auth-memory.md) for identity, Credits, redirects, and memory behavior.
- Read [references/output-contract.md](references/output-contract.md) for full research structure and evidence labels.
