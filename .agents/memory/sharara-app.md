---
name: Sharara app architecture
description: Key decisions and gotchas for the מערכת שרארה React app at artifacts/sharara
---

## Logo strategy
Use `logoDataUrl || "/logo.png"` everywhere. The `Logo` SVG component (Logo.tsx) is kept but NOT imported — don't bring it back. `/logo.png` is the real company PNG logo in `public/`.

## App.tsx size
~3200 lines. Always grep first and read targeted line ranges. Never read the full file.

## localStorage keys
- `sharara_myCompanyDetails` — company contact info (JSON)
- `sharara_logoDataUrl` — base64 uploaded logo (overrides /logo.png)
- `sharara_clientsData`, `sharara_pricesList`, etc.

## Mobile default
Intentionally blank `""` — user hasn't decided the mobile number yet. Do NOT hardcode a number.

## Login
Hardcoded: username=`sharara`, password=`1970`

**Why:** Client-only app, no backend auth needed.

## Print
Print CSS in App.css with `.landscape-print` and `.print-table`. PrintableReport.tsx is the component for the measurement report; invoice/summary/production sheets are rendered inline in App.tsx.
