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
      <defs>
        <linearGradient id="steelGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#d1d5db" />
          <stop offset="50%" stopColor="#f3f4f6" />
          <stop offset="100%" stopColor="#d1d5db" />
        </linearGradient>
        <linearGradient id="steelGradV" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#d1d5db" />
          <stop offset="50%" stopColor="#f9fafb" />
          <stop offset="100%" stopColor="#d1d5db" />
        </linearGradient>
        <linearGradient id="pipeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#9ca3af" />
          <stop offset="30%" stopColor="#e5e7eb" />
          <stop offset="70%" stopColor="#e5e7eb" />
          <stop offset="100%" stopColor="#9ca3af" />
        </linearGradient>
        <linearGradient id="elbowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e5e7eb" />
          <stop offset="40%" stopColor="#f9fafb" />
          <stop offset="100%" stopColor="#d1d5db" />
        </linearGradient>
        <marker id="arrowEnd" markerWidth="6" markerHeight="5" refX="5" refY="2.5" orient="auto">
          <polygon points="0 0, 6 2.5, 0 5" fill="#64748b" />
        </marker>
        <marker id="arrowStart" markerWidth="6" markerHeight="5" refX="0" refY="2.5" orient="auto">
          <polygon points="6 0, 0 2.5, 6 5" fill="#64748b" />
        </marker>
      </defs>

      {key === 'straight' && (
        <>
          {/* 3D perspective duct body */}
          <polygon points="20,24 72,24 80,18 28,18" fill="url(#steelGradV)" stroke="#374151" strokeWidth="1.2" />
          <polygon points="20,24 20,62 28,56 28,18" fill="#d1d5db" stroke="#374151" strokeWidth="1.2" />
          <rect x="20" y="24" width="52" height="38" fill="url(#steelGrad)" stroke="#374151" strokeWidth="1.5" rx="1" />

          {/* Seam lines */}
          <line x1="20" y1="36" x2="72" y2="36" stroke="#9ca3af" strokeWidth="0.5" strokeDasharray="3,2" />
          <line x1="20" y1="48" x2="72" y2="48" stroke="#9ca3af" strokeWidth="0.5" strokeDasharray="3,2" />

          {/* Left flange */}
          <rect x="14" y="22" width="6" height="42" fill="none" stroke="#374151" strokeWidth="1" rx="1" />
          <line x1="17" y1="22" x2="17" y2="64" stroke="#9ca3af" strokeWidth="0.4" />

          {/* Right flange */}
          <rect x="72" y="22" width="6" height="42" fill="none" stroke="#374151" strokeWidth="1" rx="1" />
          <line x1="75" y1="22" x2="75" y2="64" stroke="#9ca3af" strokeWidth="0.4" />

          {/* Width dimension */}
          <line x1="20" y1="12" x2="72" y2="12" stroke="#64748b" strokeWidth="0.8" markerStart="url(#arrowStart)" markerEnd="url(#arrowEnd)" />
          <text x="46" y="10" textAnchor="middle" fontSize="7" fill="#475569" fontFamily="Rubik, sans-serif" fontWeight="500">רוחב</text>

          {/* Length dimension */}
          <line x1="86" y1="24" x2="86" y2="62" stroke="#64748b" strokeWidth="0.8" markerStart="url(#arrowStart)" markerEnd="url(#arrowEnd)" />
          <text x="96" y="45" textAnchor="middle" fontSize="7" fill="#475569" fontFamily="Rubik, sans-serif" fontWeight="500" transform="rotate(-90,96,45)">אורך</text>

          {/* Height dimension */}
          <line x1="12" y1="24" x2="12" y2="62" stroke="#64748b" strokeWidth="0.8" markerStart="url(#arrowStart)" markerEnd="url(#arrowEnd)" />
          <text x="8" y="45" textAnchor="middle" fontSize="6" fill="#475569" fontFamily="Rubik, sans-serif" fontWeight="500" transform="rotate(-90,8,45)">גבוה</text>

          {/* ACoustic insulation indicator */}
          {row.acoustic && (
            <>
              <rect x="22" y="26" width="48" height="34" fill="none" stroke="#f59e0b" strokeWidth="0.8" strokeDasharray="2,1" rx="1" />
              <text x="46" y="78" textAnchor="middle" fontSize="6" fill="#d97706" fontFamily="Rubik, sans-serif">בידוד</text>
            </>
          )}

          {/* Bottom 3D edge */}
          <line x1="20" y1="62" x2="72" y2="62" stroke="#374151" strokeWidth="1.5" />
        </>
      )}

      {key === 'elbow' && (
        <>
          {/* Outer arc */}
          <path d="M25 75 L25 42 A 40 40 0 0 1 75 18" fill="none" stroke="#374151" strokeWidth="2" />
          {/* Inner arc */}
          <path d="M25 65 L25 38 A 30 30 0 0 1 65 18" fill="none" stroke="#374151" strokeWidth="2" />

          {/* Fill between arcs - gradient */}
          <path d="M25 75 L25 42 A 40 40 0 0 1 75 18 L65 18 A 30 30 0 0 0 25 38 L25 65 Z" fill="url(#elbowGrad)" stroke="none" />

          {/* Re-draw arcs on top */}
          <path d="M25 75 L25 42 A 40 40 0 0 1 75 18" fill="none" stroke="#374151" strokeWidth="1.8" />
          <path d="M25 65 L25 38 A 30 30 0 0 1 65 18" fill="none" stroke="#374151" strokeWidth="1.8" />

          {/* Seam lines along curve */}
          <path d="M25 70 L25 40 A 35 35 0 0 1 70 18" fill="none" stroke="#9ca3af" strokeWidth="0.5" strokeDasharray="3,2" />

          {/* End flanges */}
          <rect x="18" y="65" width="7" height="12" fill="none" stroke="#374151" strokeWidth="1" rx="1" />
          <rect x="65" y="12" width="12" height="7" fill="none" stroke="#374151" strokeWidth="1" rx="1" />

          {/* R small dimension */}
          <path d="M25 58 A 20 20 0 0 1 42 18" fill="none" stroke="#2563eb" strokeWidth="0.7" strokeDasharray="2,1.5" />
          <text x="30" y="38" fontSize="6.5" fill="#2563eb" fontFamily="Rubik, sans-serif" fontWeight="600">R קטן</text>

          {/* R big dimension */}
          <path d="M25 82 A 50 50 0 0 1 82 18" fill="none" stroke="#dc2626" strokeWidth="0.7" strokeDasharray="2,1.5" />
          <text x="58" y="82" fontSize="6.5" fill="#dc2626" fontFamily="Rubik, sans-serif" fontWeight="600">R גדול</text>

          {/* Width labels at ends */}
          <line x1="18" y1="65" x2="18" y2="77" stroke="#64748b" strokeWidth="0.6" markerStart="url(#arrowStart)" markerEnd="url(#arrowEnd)" />
          <text x="13" y="73" textAnchor="middle" fontSize="5.5" fill="#475569" fontFamily="Rubik, sans-serif" transform="rotate(-90,13,73)">גובה</text>

          <line x1="65" y1="12" x2="77" y2="12" stroke="#64748b" strokeWidth="0.6" markerStart="url(#arrowStart)" markerEnd="url(#arrowEnd)" />
          <text x="71" y="10" textAnchor="middle" fontSize="5.5" fill="#475569" fontFamily="Rubik, sans-serif">רוחב</text>
        </>
      )}

      {key === 'transition' && (
        <>
          {/* Main body - larger opening to smaller */}
          <polygon points="18,28 102,28 90,70 30,70" fill="url(#steelGradV)" stroke="#374151" strokeWidth="1.5" />

          {/* Left side (larger) */}
          <line x1="18" y1="28" x2="30" y2="70" stroke="#374151" strokeWidth="1.5" />
          {/* Right side (smaller) */}
          <line x1="102" y1="28" x2="90" y2="70" stroke="#374151" strokeWidth="1.5" />

          {/* Top seam */}
          <line x1="18" y1="28" x2="102" y2="28" stroke="#374151" strokeWidth="1.5" />
          {/* Bottom seam */}
          <line x1="30" y1="70" x2="90" y2="70" stroke="#374151" strokeWidth="1.5" />

          {/* Dashed fold lines */}
          <line x1="40" y1="30" x2="38" y2="68" stroke="#9ca3af" strokeWidth="0.5" strokeDasharray="3,2" />
          <line x1="70" y1="30" x2="72" y2="68" stroke="#9ca3af" strokeWidth="0.5" strokeDasharray="3,2" />

          {/* Left flanges */}
          <rect x="12" y="26" width="6" height="4" fill="none" stroke="#374151" strokeWidth="0.8" rx="0.5" />
          <rect x="24" y="68" width="6" height="4" fill="none" stroke="#374151" strokeWidth="0.8" rx="0.5" />

          {/* Right flanges */}
          <rect x="102" y="26" width="6" height="4" fill="none" stroke="#374151" strokeWidth="0.8" rx="0.5" />
          <rect x="90" y="68" width="6" height="4" fill="none" stroke="#374151" strokeWidth="0.8" rx="0.5" />

          {/* Dimension: Opening 1 */}
          <line x1="14" y1="28" x2="14" y2="70" stroke="#64748b" strokeWidth="0.7" markerStart="url(#arrowStart)" markerEnd="url(#arrowEnd)" />
          <text x="8" y="50" textAnchor="middle" fontSize="5.5" fill="#475569" fontFamily="Rubik, sans-serif" fontWeight="500" transform="rotate(-90,8,50)">פתח 1</text>

          {/* Dimension: Opening 2 */}
          <line x1="112" y1="28" x2="112" y2="70" stroke="#64748b" strokeWidth="0.7" markerStart="url(#arrowStart)" markerEnd="url(#arrowEnd)" />
          <text x="118" y="50" textAnchor="middle" fontSize="5.5" fill="#475569" fontFamily="Rubik, sans-serif" fontWeight="500" transform="rotate(90,118,50)">פתח 2</text>

          {/* Length */}
          <line x1="55" y1="18" x2="55" y2="24" stroke="#2563eb" strokeWidth="0.7" />
          <line x1="55" y1="76" x2="55" y2="82" stroke="#2563eb" strokeWidth="0.7" />
          <line x1="55" y1="24" x2="55" y2="76" stroke="#2563eb" strokeWidth="0.7" strokeDasharray="2,1.5" />
          <text x="60" y="52" fontSize="6" fill="#2563eb" fontFamily="Rubik, sans-serif" fontWeight="600">אורך</text>

          {/* Arrow showing flow direction */}
          <polygon points="120,46 124,48 120,50" fill="#94a3b8" />
          <line x1="106" y1="48" x2="120" y2="48" stroke="#94a3b8" strokeWidth="0.6" />
        </>
      )}

      {key === 'lamed-s' && (
        <>
          {/* S-shaped offset duct */}
          <path d="M16,22 L16,44 C16,44 16,50 26,50 L104,50 C114,50 114,56 114,56 L114,76" fill="none" stroke="#374151" strokeWidth="1.8" />
          <path d="M26,22 L26,38 C26,38 26,44 36,44 L94,44 C104,44 104,50 104,50 L104,76" fill="none" stroke="#374151" strokeWidth="1.8" />

          {/* Fill */}
          <path d="M16,22 L16,44 C16,44 16,50 26,50 L104,50 C114,50 114,56 114,56 L114,76 L104,76 L104,50 C104,50 104,44 94,44 L36,44 C26,44 26,38 26,38 L26,22 Z" fill="url(#steelGrad)" stroke="none" opacity="0.5" />

          {/* Re-draw edges */}
          <path d="M16,22 L16,44 C16,44 16,50 26,50 L104,50 C114,50 114,56 114,56 L114,76" fill="none" stroke="#374151" strokeWidth="1.5" />
          <path d="M26,22 L26,38 C26,38 26,44 36,44 L94,44 C104,44 104,50 104,50 L104,76" fill="none" stroke="#374151" strokeWidth="1.5" />

          {/* Top/bottom edges */}
          <line x1="16" y1="22" x2="26" y2="22" stroke="#374151" strokeWidth="1.5" />
          <line x1="114" y1="76" x2="104" y2="76" stroke="#374151" strokeWidth="1.5" />

          {/* Flanges */}
          <rect x="10" y="20" width="6" height="4" fill="none" stroke="#374151" strokeWidth="0.8" rx="0.5" />
          <rect x="108" y="74" width="6" height="4" fill="none" stroke="#374151" strokeWidth="0.8" rx="0.5" />

          {/* Width dimension */}
          <line x1="16" y1="12" x2="26" y2="12" stroke="#64748b" strokeWidth="0.7" markerStart="url(#arrowStart)" markerEnd="url(#arrowEnd)" />
          <text x="21" y="10" textAnchor="middle" fontSize="6" fill="#475569" fontFamily="Rubik, sans-serif" fontWeight="500">רוחב</text>

          {/* Height dimension */}
          <line x1="8" y1="22" x2="8" y2="76" stroke="#64748b" strokeWidth="0.7" markerStart="url(#arrowStart)" markerEnd="url(#arrowEnd)" />
          <text x="4" y="52" textAnchor="middle" fontSize="5.5" fill="#475569" fontFamily="Rubik, sans-serif" fontWeight="500" transform="rotate(-90,4,52)">אורך</text>

          {/* Offset dimension */}
          <line x1="32" y1="32" x2="32" y2="62" stroke="#2563eb" strokeWidth="0.7" markerStart="url(#arrowStart)" markerEnd="url(#arrowEnd)" />
          <text x="38" y="50" fontSize="5.5" fill="#2563eb" fontFamily="Rubik, sans-serif" fontWeight="600">סטייה</text>

          {/* Seam/fold lines */}
          <line x1="26" y1="36" x2="36" y2="44" stroke="#9ca3af" strokeWidth="0.5" strokeDasharray="2,1.5" />
          <line x1="94" y1="44" x2="104" y2="50" stroke="#9ca3af" strokeWidth="0.5" strokeDasharray="2,1.5" />
        </>
      )}

      {key === 'pipe' && (
        <>
          {/* 3D cylinder - body */}
          <rect x="37" y="22" width="56" height="50" fill="url(#pipeGrad)" stroke="none" />

          {/* Top ellipse (opening) */}
          <ellipse cx="65" cy="22" rx="28" ry="10" fill="#e5e7eb" stroke="#374151" strokeWidth="1.5" />
          <ellipse cx="65" cy="22" rx="22" ry="7.5" fill="#d1d5db" stroke="#374151" strokeWidth="0.8" />

          {/* Side lines */}
          <line x1="37" y1="22" x2="37" y2="72" stroke="#374151" strokeWidth="1.5" />
          <line x1="93" y1="22" x2="93" y2="72" stroke="#374151" strokeWidth="1.5" />

          {/* Bottom ellipse */}
          <ellipse cx="65" cy="72" rx="28" ry="10" fill="url(#pipeGrad)" stroke="#374151" strokeWidth="1.5" />

          {/* Spiral seam line */}
          <path d="M37,30 C50,28 80,32 93,30" fill="none" stroke="#9ca3af" strokeWidth="0.6" strokeDasharray="3,2" />
          <path d="M37,45 C50,43 80,47 93,45" fill="none" stroke="#9ca3af" strokeWidth="0.6" strokeDasharray="3,2" />
          <path d="M37,60 C50,58 80,62 93,60" fill="none" stroke="#9ca3af" strokeWidth="0.6" strokeDasharray="3,2" />

          {/* Highlight */}
          <line x1="60" y1="24" x2="60" y2="70" stroke="#ffffff" strokeWidth="1" opacity="0.5" />

          {/* Diameter dimension */}
          <line x1="37" y1="88" x2="93" y2="88" stroke="#64748b" strokeWidth="0.7" markerStart="url(#arrowStart)" markerEnd="url(#arrowEnd)" />
          <text x="65" y="93" textAnchor="middle" fontSize="6.5" fill="#475569" fontFamily="Rubik, sans-serif" fontWeight="500">קוטר</text>

          {/* Length dimension */}
          <line x1="100" y1="22" x2="100" y2="72" stroke="#64748b" strokeWidth="0.7" markerStart="url(#arrowStart)" markerEnd="url(#arrowEnd)" />
          <text x="110" y="50" textAnchor="middle" fontSize="6" fill="#475569" fontFamily="Rubik, sans-serif" fontWeight="500" transform="rotate(-90,110,50)">אורך</text>
        </>
      )}

      {key === 'plenum' && (
        <>
          {/* 3D box body */}
          <rect x="28" y="34" width="74" height="50" fill="url(#steelGrad)" stroke="#374151" strokeWidth="1.5" rx="2" />

          {/* Top face (3D) */}
          <polygon points="28,34 40,24 114,24 102,34" fill="#e5e7eb" stroke="#374151" strokeWidth="1.2" />

          {/* Right face (3D) */}
          <polygon points="102,34 114,24 114,74 102,84" fill="#d1d5db" stroke="#374151" strokeWidth="1.2" />

          {/* Circle opening on top */}
          <ellipse cx="77" cy="29" rx="18" ry="6" fill="#f9fafb" stroke="#374151" strokeWidth="1.2" />
          <ellipse cx="77" cy="29" rx="13" ry="4.5" fill="#d1d5db" stroke="#9ca3af" strokeWidth="0.8" />

          {/* Connection stub */}
          <rect x="62" y="22" width="30" height="8" fill="none" stroke="#374151" strokeWidth="1" rx="1" />

          {/* Internal baffles */}
          <line x1="50" y1="34" x2="50" y2="84" stroke="#9ca3af" strokeWidth="0.6" strokeDasharray="4,2" />
          <line x1="80" y1="34" x2="80" y2="84" stroke="#9ca3af" strokeWidth="0.6" strokeDasharray="4,2" />

          {/* Screw holes */}
          <circle cx="34" cy="42" r="1.5" fill="none" stroke="#9ca3af" strokeWidth="0.6" />
          <circle cx="34" cy="76" r="1.5" fill="none" stroke="#9ca3af" strokeWidth="0.6" />
          <circle cx="96" cy="42" r="1.5" fill="none" stroke="#9ca3af" strokeWidth="0.6" />
          <circle cx="96" cy="76" r="1.5" fill="none" stroke="#9ca3af" strokeWidth="0.6" />

          {/* Dimensions */}
          <line x1="28" y1="90" x2="102" y2="90" stroke="#64748b" strokeWidth="0.7" markerStart="url(#arrowStart)" markerEnd="url(#arrowEnd)" />
          <text x="65" y="95" textAnchor="middle" fontSize="6" fill="#475569" fontFamily="Rubik, sans-serif">רוחב</text>

          <line x1="8" y1="34" x2="8" y2="84" stroke="#64748b" strokeWidth="0.7" markerStart="url(#arrowStart)" markerEnd="url(#arrowEnd)" />
          <text x="4" y="62" textAnchor="middle" fontSize="5.5" fill="#475569" fontFamily="Rubik, sans-serif" fontWeight="500" transform="rotate(-90,4,62)">גובה</text>
        </>
      )}

      {key === 'fire-shelf' && (
        <>
          {/* Main body */}
          <rect x="24" y="20" width="80" height="58" fill="url(#steelGrad)" stroke="#374151" strokeWidth="1.5" rx="1" />

          {/* Internal shelf partitions */}
          <line x1="24" y1="34" x2="104" y2="34" stroke="#374151" strokeWidth="1.2" />
          <line x1="24" y1="48" x2="104" y2="48" stroke="#374151" strokeWidth="1.5" />
          <line x1="24" y1="62" x2="104" y2="62" stroke="#374151" strokeWidth="1.2" />

          {/* Fire-rated seal indicators */}
          <rect x="24" y="33" width="80" height="2" fill="#ef4444" opacity="0.3" />
          <rect x="24" y="47" width="80" height="3" fill="#ef4444" opacity="0.4" />
          <rect x="24" y="61" width="80" height="2" fill="#ef4444" opacity="0.3" />

          {/* Side bracket */}
          <rect x="14" y="40" width="10" height="18" fill="none" stroke="#374151" strokeWidth="1.2" rx="1" />
          <line x1="14" y1="44" x2="24" y2="44" stroke="#374151" strokeWidth="0.8" />
          <line x1="14" y1="54" x2="24" y2="54" stroke="#374151" strokeWidth="0.8" />

          {/* Mounting bolts */}
          <circle cx="19" cy="42" r="2" fill="#64748b" stroke="#374151" strokeWidth="0.6" />
          <circle cx="19" cy="56" r="2" fill="#64748b" stroke="#374151" strokeWidth="0.6" />

          {/* Dampers */}
          <line x1="50" y1="22" x2="50" y2="34" stroke="#f59e0b" strokeWidth="1" />
          <line x1="78" y1="22" x2="78" y2="34" stroke="#f59e0b" strokeWidth="1" />
          <circle cx="50" cy="28" r="2.5" fill="#fef3c7" stroke="#f59e0b" strokeWidth="0.8" />
          <circle cx="78" cy="28" r="2.5" fill="#fef3c7" stroke="#f59e0b" strokeWidth="0.8" />

          {/* Width dimension */}
          <line x1="24" y1="84" x2="104" y2="84" stroke="#64748b" strokeWidth="0.7" markerStart="url(#arrowStart)" markerEnd="url(#arrowEnd)" />
          <text x="64" y="90" textAnchor="middle" fontSize="6" fill="#475569" fontFamily="Rubik, sans-serif">רוחב</text>

          {/* Height dimension */}
          <line x1="112" y1="20" x2="112" y2="78" stroke="#64748b" strokeWidth="0.7" markerStart="url(#arrowStart)" markerEnd="url(#arrowEnd)" />
          <text x="120" y="52" textAnchor="middle" fontSize="5.5" fill="#475569" fontFamily="Rubik, sans-serif" fontWeight="500" transform="rotate(90,120,52)">גובה</text>

          {/* Fire label */}
          <rect x="38" y="36" width="28" height="8" fill="#fef2f2" stroke="#ef4444" strokeWidth="0.6" rx="2" />
          <text x="52" y="42" textAnchor="middle" fontSize="5" fill="#dc2626" fontFamily="Rubik, sans-serif" fontWeight="600">מדף אש</text>
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
