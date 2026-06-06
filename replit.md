# מערכת שרארה — תעלות פח

מערכת ייצור וחישוב כמויות תעלות פח לחברת עלי שרארה בע"מ — אפליקציית React client-side עם דוחות PDF, ריכוז כמויות, והצעות מחיר.

## Run & Operate

- `pnpm --filter @workspace/sharara run dev` — run the web app (port 25643, preview path: `/`)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- Required env: none (fully client-side, data in localStorage)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite
- Fonts: Rubik + Assistant (Google Fonts, Hebrew)
- Excel export: ExcelJS
- Icons: lucide-react
- No Tailwind — custom CSS in App.css / index.css

## Where things live

- `artifacts/sharara/src/App.tsx` — main app (3200+ lines), all state + UI
- `artifacts/sharara/src/PrintableReport.tsx` — printable measurement report
- `artifacts/sharara/src/Logo.tsx` — original SVG logo (kept but unused; replaced by /logo.png)
- `artifacts/sharara/public/logo.png` — real company logo (PNG, used everywhere)
- `artifacts/sharara/public/letterhead.png` — company letterhead reference image
- `artifacts/sharara/src/App.css` — all styles including print CSS

## Architecture decisions

- 100% client-side — all data stored in localStorage (no backend needed)
- Login: hardcoded credentials (username: `sharara`, password: `1970`)
- Logo strategy: `logoDataUrl` (localStorage) takes priority → fallback to `/logo.png` everywhere (no SVG fallback)
- `myCompanyDetails` stored in localStorage with migration logic for old email/mobile values

## Product

- Login screen with company logo
- דפי מדידה (measurement sheets with duct calculations)
- ריכוז כמויות (quantity summary per project)
- חשבון פרופורמה / הצעת מחיר (invoice/quote with company letterhead)
- דף ייצור (production work sheet)
- מחירון (price list)
- PDF/print for all document types
- Excel export for measurements and price list
- Client management (add/edit/select clients and projects)
- Logo upload (stored as base64 in localStorage)

## User preferences

- Hebrew-only UI
- Company email: info@sharara.co.il
- Company phone: 04-6082264, fax: 04-6082263
- Mobile: editable (not yet decided — left blank by default)
- All contact fields (phone, mobile, email) must remain freely editable in the UI

## Gotchas

- App.tsx is ~3200 lines — always use grep + targeted reads, never read the whole file
- Logo: use `logoDataUrl || "/logo.png"` pattern everywhere, never the `<Logo>` SVG component
- `Logo.tsx` SVG component is kept in codebase but NOT imported anywhere — keep it that way
- Print styles are in App.css with `.landscape-print` and `.print-table` classes
- Mobile default is intentionally blank (`""`) — user hasn't decided the number yet

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
