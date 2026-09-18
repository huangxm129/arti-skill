# MCP 连接故障降级

当 ARTI MCP 已完成工具发现、但调用返回以下基础设施错误时，不要把它解释成“没有数据”：

- `No module named ...`
- `deps not initialized` / `init_deps()`
- HTTP 5xx
- timeout、network error、`fetch failed`

处理顺序：

1. 保留已经成功取得的 ARTi 证据，不重复调用失败工具。
2. 对免费行情问题，优先使用已安装的 Alpha CLI 备用路径：
   `plugins/arti-stock-research/skills/arti-stock-research/scripts/arti scan <SYMBOL> --yes`
3. CLI 需要消耗 Credits 时，必须先向用户说明费用并获得明确确认；未确认时只返回连接故障和重试建议。
4. 结果中明确标注备用数据源、时间戳和缺失字段，不把备用结果称为 MCP 结果。
5. 遇到 401/403、参数错误或证券明确不存在时，不要自动切换数据源，应原样报告错误。

备用路径本身失败时，返回结构化的部分结果和故障原因，不编造行情、财务或技术指标。
