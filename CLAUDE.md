# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Internal production/quoting tool for Ali Sharara Ltd (עלי שרארה בע"מ), a sheet-metal HVAC duct (תעלות פח) fabricator. A single-page React app where staff enter duct measurements and get back fabricated quantities, quotes/proforma invoices, price lists, and a production worksheet — all printable to A4 and exportable to Excel. UI is **Hebrew, right-to-left only**.

## Commands

```bash
npm run dev       # Vite dev server
npm run build     # vite build → dist/
npm run lint      # eslint .
npm run preview   # serve the production build
npm run deploy    # gh-pages -d dist  (predeploy runs build first)
```

Deploy target is GitHub Pages: `https://OsamaSla.github.io/sharara-system/`. Because of this, `vite.config.ts` sets `base: './'` — keep asset references relative. There are **no tests** in this project.

## Repository layout

The active, deployed application is the repo root (`package.json`, `src/`, `index.html`, npm scripts). Work here.

Supporting files:
- `public/` — static assets served at root (`logo.png`, `favicon.svg`, `icons.svg`)
- `src/firebase.ts` — Firestore configuration and initialization
- `.github/workflows/deploy.yml` — GitHub Pages deployment via GitHub Actions

## Architecture

Almost the entire app is **`src/App.tsx` (~3000 lines)** — one default-exported `App` component holding all state (dozens of `useState`), all business logic, and all JSX with **inline styles**. There is no router, no state library, no component tree to speak of.

> `App.tsx` is huge. Always navigate it with Grep + targeted Read; never read the whole file.

Supporting components (all rendered from within `App.tsx`):
- `PrintableReport.tsx` — A4 measurement report
- `CompanyLetterhead.tsx` — header block for invoices/quotes (imports `Logo.tsx`)
- `ProductionWorksheet.tsx` + `ProductionPartSketch.tsx` — the production tab's printable sheet and per-part SVG sketch
- `Logo.tsx` — original SVG logo, imported by `CompanyLetterhead.tsx` for invoices and production worksheets

### The five tabs

`activeTab` is `'measure' | 'summary' | 'invoice' | 'pricelist' | 'production'`. Each is a distinct document/view over the same project data: measurement entry → quantity summary → proforma/quote → price list → production worksheet.

### Core domain types (defined at top of `App.tsx`)

- `RowData` — one duct part: type (`קטע ישר`/`קשת`/`מעבר`), dimensions, panels, accessories (sharshuri, adapter, acoustic/external flags), etc.
- `Sheet` — a named list of `RowData` rows. The app holds an array of `sheets`.
- `PriceItem` — a price-list line.

The calculation core is `calculateThickness(...)` and `calculateArea(row)` (around `App.tsx:554`), which derive sheet-metal gauge and surface area from a part's dimensions/type. This is the domain heart — change it carefully.

### Persistence (Firestore)

State is synced to a **single Firestore document `appData/mainData`** via `src/firebase.ts`:
- On mount, one `getDoc` loads `clientsData`, `pricesList`, `myCompanyDetails`, doc numbers/dates, and production snapshots into state.
- A debounced-by-dependency `useEffect` calls `setDoc` (full overwrite) whenever any of those slices change.

So the whole app shares one cloud blob — there is no per-user or per-document separation. `sessionStorage` only holds the `sharara_isLoggedIn` flag. **Login is currently bypassed**: `handleLoginSubmit` always succeeds regardless of credentials.

### Printing & Excel

- **Print**: `handlePrint` sets `data-print-tab` on `<html>` then calls `window.print()`; print CSS in `App.css` keys off that attribute and `active-tab-*` / `preview-mode` classes on the root to render the correct A4 layout. An `afterprint` listener clears the attribute.
- **Excel**: uses **ExcelJS** (not the `xlsx` package). Each tab has its own export builder (`exportMeasurements`/summary/invoice/pricelist around `App.tsx:998+`) that builds a `Workbook`, styles header/data rows via `styleHeaderRow`/`styleDataRow`, and downloads through `downloadWorkbook`.

## Conventions

- React 19 + TypeScript, Vite — styling is inline styles + `App.css`/`index.css`. Fonts are Assistant/Rubik (Hebrew).
- Keep all UI strings Hebrew and the layout RTL (`direction: 'rtl'`).
- TypeScript has `noUnusedLocals: false` and `noUnusedParameters: false` in `tsconfig.app.json` — unused symbols won't block the build.
