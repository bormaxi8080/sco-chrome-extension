# API

## Health

```http
GET /health
```

Returns service status.

## Risk Card

```http
GET /v1/domains/:domain/risk-card
```

Returns a cached or freshly generated `RiskCard`.

## Refresh

```http
POST /v1/domains/:domain/refresh
```

Forces a new analysis and stores a fresh snapshot.

## Privacy

The extension sends only the hostname by default. It does not send full URLs or page content in the current MVP.
