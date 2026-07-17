# MEMORY.md — Critical Rules for Sharara System

## Reporting Architecture: HTML-to-PDF / Print View

The official reporting system uses **HTML-to-PDF via `window.print()`**. Excel export has been completely removed.

### How It Works
1. Each page component renders a print-optimized HTML layout with CSS classes: `print-document`, `landscape-print` / `portrait-print`, and page-specific classes.
2. User clicks "הדפסה / שמור כ-PDF" button → calls `handlePrint()` → stamps `data-print-tab` on `<html>` → triggers `window.print()`.
3. Browser's `@media print` CSS controls visibility, layout, page orientation, and page breaks.
4. User selects "Save as PDF" in the print dialog to get a perfect PDF file.

### Print Layout Rules
- Each page has a dedicated HTML/CSS print layout — no external PDF libraries needed.
- Tables use clean CSS table structures. Stacked tables use standard HTML block flow (top table pushes bottom table down naturally).
- Company logo and header details appear at the top via `CompanyLetterhead` component.
- Summary page has a grand summary section at the very end of the document.
- Page orientation: landscape for measurement/summary/production, portrait for invoice/pricelist.
- `@media print` CSS in `App.css` handles all print-specific styling.

### Price Lookup Rules
- **Partial matching is required**: `שתוצר` must match `שתוצר עגול` from the prices list.
- Use `p.detail.includes(key) || key.includes(p.detail)` as fallback in `getPrice()` (calculations.ts).
- Invoice page has its own `getInvoicePrice()` with the same partial matching logic.

### Key Files
- `src/App.tsx` — main component, `handlePrint()` function, tab routing
- `src/App.css` — all `@media print` CSS rules (~300 lines)
- `src/pages/*.tsx` — 5 page components with print-optimized HTML layouts
- `src/PrintableReport.tsx` — measurement tab print layout
- `src/CompanyLetterhead.tsx` — reusable company letterhead component
- `src/ProductionWorksheet.tsx` — production tab print layout
- `src/calculations.ts` — pure calculation functions (no React dependencies)

### Removed (No Longer Used)
- `src/utils/excelExporter.ts` — deleted
- `src/utils/logoLoader.ts` — deleted
- `src/utils/downloadHelper.ts` — deleted
- `src/ExcelExportUtils.ts` — deleted
- `src/assets/templates/*.xlsx` — still exist but no longer used by export logic
- `handleExportExcel` function — removed from App.tsx
- `isPreviewMode` / `setIsPreviewMode` state — removed (preview overlay deleted)
- All Excel buttons — replaced with "הדפסה / שמור כ-PDF" buttons
