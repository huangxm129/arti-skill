# Single-stock research output

Use the full structure for broad research. Compress or omit irrelevant sections for focused questions.

## Full structure

1. **研究对象**
   - Company, normalized symbol, exchange, currency, market state, data time.
2. **结论摘要**
   - Three to five evidence-backed findings.
   - State uncertainty and the most important missing fact.
3. **行情与估值快照**
   - Price/change, relevant valuation fields, timestamp, source/cache labels.
4. **业务与基本面**
   - Business model, revenue/profit/cash-flow trends, balance-sheet issues.
5. **技术面与资金行为**
   - Trend, volatility, key levels as observations, fund flow when supported.
6. **催化剂与风险**
   - Separate known events from inferred scenarios.
7. **记忆对比**
   - Prior thesis, new evidence, changed/unchanged conclusion. Include only when memory exists.
8. **证据缺口**
   - Failed tools, stale periods, unsupported market dimensions, conflicting fields.
9. **研究结论**
   - Balanced thesis, conditions that would strengthen or falsify it, and monitoring items.

## Evidence labels

Use compact labels when useful:

- `事实` — directly returned by a source/tool.
- `推断` — reasoned from stated facts.
- `用户记忆` — previously saved user-authored or user-confirmed context.
- `缺口` — unavailable, stale, conflicting, or unsupported information.

Never blend these categories into an unqualified statement.

## Freshness and units

- Display the returned timestamp and timezone for price-sensitive facts.
- Preserve currency and units; do not combine raw yuan, thousands, millions, and billions silently.
- Name the fiscal period for financial facts.
- State daily-bar adjustment mode when it affects comparisons.
- Call data “real-time” only when response metadata supports that claim.

## Recommendation boundary

Frame the conclusion as research, not individualized investment advice. Do not provide guaranteed outcomes, personalized position sizing, or trade execution instructions. If the user asks for a buy/sell command, convert it into conditions, evidence, uncertainties, and factors requiring personal judgment.
