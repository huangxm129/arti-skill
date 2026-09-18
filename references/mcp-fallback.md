# MCP 连接故障降级

当 ARTI MCP 已完成工具发现、但调用返回以下基础设施错误时，不要把它解释成“没有数据”：

- `No module named ...`
- `deps not initialized` / `init_deps()`
- HTTP 502/503/504（502 常见于会话未复用、网关短暂不可用或上游超时）
- timeout、network error、`fetch failed`

处理顺序：

1. 先确认 `node scripts/check-mcp.mjs` 已完成 `initialize → notifications/initialized → tools/list`，并复用了响应中的 `Mcp-Session-Id`；脚本只会对瞬时 502/503/504、超时和网络错误做少量重试。
2. 保留已经成功取得的 ARTi 证据，不重复调用失败工具。
3. 对免费行情问题，优先使用已安装的 Alpha CLI 备用路径：
   `plugins/arti-stock-research/skills/arti-stock-research/scripts/arti scan <SYMBOL> --yes`
4. CLI 需要消耗 Credits 时，必须先向用户说明费用并获得明确确认；未确认时只返回连接故障和重试建议。
5. 结果中明确标注备用数据源、时间戳和缺失字段，不把备用结果称为 MCP 结果。
6. 遇到 401/403、参数错误或证券明确不存在时，不要自动切换数据源，应原样报告错误。

备用路径本身失败时，返回结构化的部分结果和故障原因，不编造行情、财务或技术指标。
