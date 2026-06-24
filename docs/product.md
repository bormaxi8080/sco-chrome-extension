# Product Notes

Source Credibility Overlay is a source intelligence assistant for journalists, analysts, researchers, and everyday readers.

The core product value is not automated judgment. It is fast, transparent context:

- domain age
- registration availability
- HTTPS/TLS posture
- basic site structure
- redirects
- social links
- future allow/block/source-list matches

## MVP User Flow

1. User opens a webpage.
2. Extension extracts the hostname.
3. Background worker checks local cache.
4. API returns a risk card.
5. Badge, popup, and optional overlay show the assessment.
6. User can refresh or dismiss the overlay.

## Pro Direction

- custom allowlist/blocklist
- team notes
- exportable risk cards
- MISP/OpenCTI integration
- API keys for editorial teams
- historical risk change tracking
