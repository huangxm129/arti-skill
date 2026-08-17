# Authentication, Credits, and memory

## Three distinct concepts

| Concept | Owner | Meaning |
|---|---|---|
| Host Agent tokens | Codex, WorkBuddy, or another host | Model usage for understanding, tool orchestration, and synthesis |
| ARTi access token | ARTi identity system | OAuth credential; never treat it as spendable balance |
| ARTi Credits | ARTi billing system | Spendable entitlement for server-declared premium capabilities |

Do not claim that a Skill can eliminate host Agent token usage. Even ARTi deep research requires some host orchestration and rendering.

## Authentication flow

1. Call the ARTi account or protected tool.
2. If authentication is required, use the authorization URL returned by ARTi.
3. Show QR data only when returned by ARTi; the QR should represent the same short-lived authorization flow.
4. Let the OAuth client store and refresh credentials.
5. Resume the original request after the host confirms account linking.

Never request passwords, one-time codes intended for another screen, service-role credentials, or long-lived access tokens in chat.

## Paid-call decision

Call a premium capability only after an explicit premium-depth request. Use server-side cost and entitlement responses as authoritative.

Expected preflight fields when available:

```json
{
  "action": "research_stock",
  "requiredCredits": 50,
  "availableCredits": 80,
  "entitled": true
}
```

Do not hardcode `50` or any other example price.

## Insufficient Credits

On a structured `insufficient_credits` response or HTTP 402:

1. Stop the paid call and all automatic paid retries.
2. State the required and available amounts only when returned.
3. Present each server-returned action with its label and URL.
4. Offer a free/host-analysis alternative only when ARTi fact tools remain available.
5. Recheck status only after the user says the task, purchase, or subscription action is complete.

Never construct account, task, subscription, or checkout URLs from assumptions.

## Memory policy

Read memory when it materially improves continuity. Write only on explicit intent.

Safe memory fields include:

- Normalized symbol and market.
- User-stated thesis and horizon.
- User-stated risks and catalysts.
- Source report/task IDs.
- Observation timestamp and evidence timestamp.
- A compact summary of what changed.

Do not store:

- Access tokens, passwords, payment details, or private keys.
- Inferred wealth, risk tolerance, health, identity, or other sensitive traits.
- A generated recommendation presented as if it were the user's belief.

When memory is unavailable, say so. Do not use local files as a silent replacement for ARTi account memory.
