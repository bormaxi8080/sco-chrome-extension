# Risk Model

The MVP risk model is rule-based and explainable. It should remain conservative: the product reports signals, not conclusions about truthfulness, intent, or legality.

## Levels

```text
0-24    Low
25-54   Medium
55-100  High
Unknown when confidence is low and the score is inconclusive
```

## Current Signals

- Domain age under 90 days: `+30`
- Domain age under 180 days: `+20`
- RDAP unavailable: `+15`
- HTTPS unavailable: `+20`
- TLS certificate issued recently: `+10`
- About page not found: `+10`
- Contact page not found: `+10`
- Privacy page not found: `+5`
- Sparse title/description metadata: `+10`
- Cross-domain redirect: `+15`

## Language Rules

Use:

- "Signals indicate elevated risk."
- "Manual verification recommended."
- "Ownership could not be verified."
- "No major elevated-risk technical signals were detected."

Avoid:

- "Fake site"
- "Scam"
- "Disinformation"
- "Malicious"

Only use stronger terms when quoting an attributed authoritative source.
