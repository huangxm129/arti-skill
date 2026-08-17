# ARTi tool routing

Use semantic capability first; tool availability varies by host and ARTi deployment.

## Current market tools

| Need | Preferred tool | Notes |
|---|---|---|
| Broad single-stock context | `load_stock_context` | Prefer for initial research; request only needed modules when supported |
| Latest quote | `get_realtime_quote` | Check timestamp, cache and fallback metadata |
| Order book | `get_order_book` | Market/source support varies |
| Recent trades | `get_tick_data` | Treat fallback approximations explicitly |
| Intraday bars | `get_minute_bars` | Use only when intraday behavior matters |
| Technical indicators | `get_technical_indicators` | Interpret indicators; do not turn one signal into a recommendation |
| Stock fund flow | `get_stock_fund_flow` | Primarily A-share oriented unless response proves otherwise |
| Identity | `get_stock_info` | Use for exchange, industry, shares and listing facts |
| Business profile | `get_company_profile` | Use for business scope, location and controller when available |
| Trading rules | `get_trading_rules` | Important for limit rules and market-specific mechanics |
| Daily history | `get_daily_bars` | Record days and adjustment mode |
| Financial statements | `get_financial_report` | Request `income`, `balance`, and `cashflow` as needed |
| Dividend history | `get_dividend_history` | Preserve currency and period |
| Market overview | `get_market_overview` | A-share market context |
| Macro context | `get_macro_indicators` | Use only when material to the thesis |
| Trading calendar | `get_trade_calendar` | Use to interpret stale/closed-market data |
| Report source review | `get_report_data_review` | Requires an existing report task ID |
| Report trace | `get_report_data_trace` | Use to inspect field-level provenance |
| Validate report evidence | `validate_report_sources` | Use before relying on a report with uncertain provenance |

## Authenticated and forward-compatible tools

Use these only if the host exposes them. Their exact names may differ; match by described capability and schema.

| Capability | Expected semantic name | Required behavior |
|---|---|---|
| Account state | `get_account_status` | Return authentication, plan, Credits and capabilities |
| Research price quote | `quote_research_cost` | Return server-authoritative cost without charging |
| Paid deep research | `research_stock` | Enforce identity, idempotency, debit and failure refund server-side |
| Research status/result | `get_stock_research` | Return task state and final evidence-backed report |
| Read stock memory | `get_stock_memory` | Scope to authenticated ARTi user and symbol |
| Save thesis | `remember_stock_thesis` | Require explicit user intent and return saved fields |
| Delete memory | `forget_stock` | Delete or disable memory for the requested symbol |

Do not simulate a missing authenticated tool with shell calls, raw database access, or an internal service token.

## Call minimization

1. Call `load_stock_context` once for broad requests.
2. Inspect returned modules and freshness.
3. Call focused tools only for missing detail or fresher data.
4. Avoid duplicate calls with identical parameters.
5. Use `force_refresh` only when the user needs current data and accepts the extra latency or server policy.

## Market boundaries

- Apply A-share-only capabilities such as northbound flow, longhu, margin, or China market overview only to relevant symbols.
- Do not assume a US/HK fallback has the same field quality as the canonical ARTi internal data route.
- Preserve the response currency, unit, timezone, fiscal period, and price adjustment method.
