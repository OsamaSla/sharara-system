import type { RowData } from './App';

interface ProductionPartSketchProps {
  row: RowData;
  width?: number;
  height?: number;
}

function getSketchKey(row: RowData): string {
  if (row.notes === 'צינור עגול') return 'pipe';
  if (row.notes === 'לאמד S') return 'lamed-s';
  if (row.notes === 'קופסת פיזור') return 'plenum';
  if (row.notes === 'מדף אש') return 'fire-shelf';
  if (row.type === 'קשת') return 'elbow';
  if (row.type === 'מעבר') return 'transition';
  return 'straight';
}

export function getPartDisplayName(row: RowData): string {
  if (row.notes && ['לאמד S', 'צינור עגול', 'קופסת פיזור', 'מדף אש'].includes(row.notes)) {
    return row.notes;
  }
  return row.type;
}

export default function ProductionPartSketch({ row, width = 130, height = 95 }: ProductionPartSketchProps) {
  const key = getSketchKey(row);

  return (
    <svg
      className="prod-sketch"
      width={width}
      height={height}
      viewBox="0 0 130 95"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {key === 'straight' && (
        <>
          <rect x="18" y="22" width="52" height="38" fill="none" stroke="#111" strokeWidth="1.8" />
          <line x1="18" y1="60" x2="10" y2="68" stroke="#111" strokeWidth="1.8" />
          <line x1="70" y1="60" x2="78" y2="68" stroke="#111" strokeWidth="1.8" />
          <line x1="10" y1="68" x2="78" y2="68" stroke="#111" strokeWidth="1.8" />
          <line x1="45" y1="12" x2="45" y2="22" stroke="#111" strokeWidth="1" />
          <line x1="38" y1="12" x2="52" y2="12" stroke="#111" strokeWidth="1" />
          <line x1="45" y1="68" x2="45" y2="82" stroke="#111" strokeWidth="1" />
          <line x1="30" y1="82" x2="60" y2="82" stroke="#111" strokeWidth="1" />
        </>
      )}
      {key === 'elbow' && (
        <>
          <path d="M22 78 L22 38 L78 38" fill="none" stroke="#111" strokeWidth="1.8" />
          <path d="M22 78 L22 70 L78 70 L78 38" fill="none" stroke="#111" strokeWidth="6" strokeLinecap="square" opacity="0.15" />
          <path d="M22 78 A 40 40 0 0 0 78 38" fill="none" stroke="#111" strokeWidth="1.8" />
          <line x1="14" y1="58" x2="22" y2="58" stroke="#111" strokeWidth="1" />
          <line x1="48" y1="30" x2="78" y2="30" stroke="#111" strokeWidth="1" />
        </>
      )}
      {key === 'transition' && (
        <>
          <polygon points="24,28 106,28 92,68 38,68" fill="none" stroke="#111" strokeWidth="1.8" />
          <line x1="24" y1="20" x2="106" y2="20" stroke="#111" strokeWidth="1" />
          <line x1="24" y1="16" x2="24" y2="20" stroke="#111" strokeWidth="1" />
          <line x1="106" y1="16" x2="106" y2="20" stroke="#111" strokeWidth="1" />
          <line x1="38" y1="76" x2="92" y2="76" stroke="#111" strokeWidth="1" />
          <line x1="38" y1="76" x2="38" y2="80" stroke="#111" strokeWidth="1" />
          <line x1="92" y1="76" x2="92" y2="80" stroke="#111" strokeWidth="1" />
          <line x1="112" y1="48" x2="118" y2="48" stroke="#111" strokeWidth="1" />
        </>
      )}
      {key === 'lamed-s' && (
        <>
          <path d="M20 24 L20 48 L110 48 L110 72" fill="none" stroke="#111" strokeWidth="1.8" />
          <path d="M20 24 L20 48 L110 48 L110 72" fill="none" stroke="#111" strokeWidth="8" opacity="0.12" />
          <line x1="12" y1="36" x2="20" y2="36" stroke="#111" strokeWidth="1" />
          <line x1="110" y1="60" x2="118" y2="60" stroke="#111" strokeWidth="1" />
        </>
      )}
      {key === 'pipe' && (
        <>
          <ellipse cx="65" cy="28" rx="28" ry="9" fill="none" stroke="#111" strokeWidth="1.8" />
          <line x1="37" y1="28" x2="37" y2="72" stroke="#111" strokeWidth="1.8" />
          <line x1="93" y1="28" x2="93" y2="72" stroke="#111" strokeWidth="1.8" />
          <ellipse cx="65" cy="72" rx="28" ry="9" fill="none" stroke="#111" strokeWidth="1.8" />
          <line x1="65" y1="14" x2="65" y2="18" stroke="#111" strokeWidth="1" />
          <line x1="52" y1="14" x2="78" y2="14" stroke="#111" strokeWidth="1" />
        </>
      )}
      {key === 'plenum' && (
        <>
          <rect x="32" y="38" width="66" height="42" fill="none" stroke="#111" strokeWidth="1.8" />
          <ellipse cx="65" cy="30" rx="18" ry="6" fill="none" stroke="#111" strokeWidth="1.8" />
          <line x1="47" y1="30" x2="47" y2="38" stroke="#111" strokeWidth="1.8" />
          <line x1="83" y1="30" x2="83" y2="38" stroke="#111" strokeWidth="1.8" />
        </>
      )}
      {key === 'fire-shelf' && (
        <>
          <rect x="28" y="24" width="74" height="52" fill="none" stroke="#111" strokeWidth="1.8" />
          <line x1="28" y1="36" x2="102" y2="36" stroke="#111" strokeWidth="1" />
          <line x1="28" y1="48" x2="102" y2="48" stroke="#111" strokeWidth="1.2" />
          <line x1="28" y1="60" x2="102" y2="60" stroke="#111" strokeWidth="1" />
          <rect x="18" y="44" width="8" height="16" fill="none" stroke="#111" strokeWidth="1.5" />
        </>
      )}
    </svg>
  );
}

export interface ProductionDimension {
  label: string;
  reference?: string;
}

export function getProductionDimensions(row: RowData, thickness: number): ProductionDimension[] {
  const dims: ProductionDimension[] = [];

  if (row.notes === 'צינור עגול') {
    dims.push({ label: 'קוטר (מ"מ)', reference: row.width1 ? String(row.width1) : undefined });
    dims.push({ label: 'אורך (מ"מ)', reference: row.length ? String(row.length) : undefined });
  } else if (row.notes === 'לאמד S') {
    dims.push({ label: 'רוחב (מ"מ)', reference: row.width1 ? String(row.width1) : undefined });
    dims.push({ label: 'גובה (מ"מ)', reference: row.height1 ? String(row.height1) : undefined });
    dims.push({ label: 'אורך (מ"מ)', reference: row.length ? String(row.length) : undefined });
    dims.push({ label: 'סטייה (מ"מ)', reference: row.rSmall ? String(row.rSmall) : undefined });
  } else if (row.type === 'קשת') {
    dims.push({ label: 'רוחב (מ"מ)', reference: row.width1 ? String(row.width1) : undefined });
    dims.push({ label: 'גובה (מ"מ)', reference: row.height1 ? String(row.height1) : undefined });
    dims.push({ label: 'R קטן (מ"מ)', reference: row.rSmall ? String(row.rSmall) : undefined });
    dims.push({ label: 'R גדול (מ"מ)', reference: row.rBig ? String(row.rBig) : undefined });
  } else if (row.type === 'מעבר') {
    dims.push({ label: 'חתך 1 ר×ג', reference: row.width1 ? `${row.width1}×${row.height1}` : undefined });
    dims.push({ label: 'חתך 2 ר×ג', reference: row.width2 ? `${row.width2}×${row.height2}` : undefined });
    dims.push({ label: 'אורך (מ"מ)', reference: row.length ? String(row.length) : undefined });
  } else if (row.notes === 'קופסת פיזור') {
    dims.push({ label: 'ר×ג (מ"מ)', reference: row.width1 ? `${row.width1}×${row.height1}` : undefined });
    dims.push({ label: 'עומק (מ"מ)', reference: row.length ? String(row.length) : undefined });
  } else {
    dims.push({ label: 'רוחב (מ"מ)', reference: row.width1 ? String(row.width1) : undefined });
    dims.push({ label: 'גובה (מ"מ)', reference: row.height1 ? String(row.height1) : undefined });
    dims.push({ label: 'אורך (מ"מ)', reference: row.length ? String(row.length) : undefined });
  }

  dims.push({ label: 'עובי פח (מ"מ)', reference: thickness ? thickness.toFixed(2) : undefined });
  if (row.panels > 0) dims.push({ label: 'דופן (יח\')', reference: String(row.panels) });
  return dims;
}
