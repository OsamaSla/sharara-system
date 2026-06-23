import type { RowData } from './types';

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
  if (row.type === 'שתוצר') return 'damper';
  if (row.type === 'מתאם') return 'adapter';
  if (row.type === 'שרשורי') return 'threaded-rod';
  if (row.type === 'חיבור גמיש') return 'flexible';
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
        <linearGradient id="elbowGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#d1d5db" />
          <stop offset="40%" stopColor="#f9fafb" />
          <stop offset="100%" stopColor="#e5e7eb" />
        </linearGradient>
        <marker id="arrowEnd" markerWidth="6" markerHeight="5" refX="5" refY="2.5" orient="auto">
          <polygon points="0 0, 6 2.5, 0 5" fill="#64748b" />
        </marker>
        <marker id="arrowStart" markerWidth="6" markerHeight="5" refX="0" refY="2.5" orient="auto">
          <polygon points="6 0, 0 2.5, 6 5" fill="#64748b" />
        </marker>
      </defs>

      {/* ═══════════ קטע ישר ═══════════ */}
      {key === 'straight' && (
        <>
          <polygon points="20,24 72,24 80,18 28,18" fill="url(#steelGradV)" stroke="#374151" strokeWidth="1.2" />
          <polygon points="20,24 20,62 28,56 28,18" fill="#d1d5db" stroke="#374151" strokeWidth="1.2" />
          <rect x="20" y="24" width="52" height="38" fill="url(#steelGrad)" stroke="#374151" strokeWidth="1.5" rx="1" />
          <line x1="20" y1="36" x2="72" y2="36" stroke="#9ca3af" strokeWidth="0.5" strokeDasharray="3,2" />
          <line x1="20" y1="48" x2="72" y2="48" stroke="#9ca3af" strokeWidth="0.5" strokeDasharray="3,2" />
          <rect x="14" y="22" width="6" height="42" fill="none" stroke="#374151" strokeWidth="1" rx="1" />
          <line x1="17" y1="22" x2="17" y2="64" stroke="#9ca3af" strokeWidth="0.4" />
          <rect x="72" y="22" width="6" height="42" fill="none" stroke="#374151" strokeWidth="1" rx="1" />
          <line x1="75" y1="22" x2="75" y2="64" stroke="#9ca3af" strokeWidth="0.4" />
          <line x1="20" y1="12" x2="72" y2="12" stroke="#64748b" strokeWidth="0.8" markerStart="url(#arrowStart)" markerEnd="url(#arrowEnd)" />
          <text x="46" y="10" textAnchor="middle" fontSize="7" fill="#475569" fontFamily="Rubik, sans-serif" fontWeight="500">רוחב</text>
          <line x1="86" y1="24" x2="86" y2="62" stroke="#64748b" strokeWidth="0.8" markerStart="url(#arrowStart)" markerEnd="url(#arrowEnd)" />
          <text x="96" y="45" textAnchor="middle" fontSize="7" fill="#475569" fontFamily="Rubik, sans-serif" fontWeight="500" transform="rotate(-90,96,45)">אורך</text>
          <line x1="12" y1="24" x2="12" y2="62" stroke="#64748b" strokeWidth="0.8" markerStart="url(#arrowStart)" markerEnd="url(#arrowEnd)" />
          <text x="8" y="45" textAnchor="middle" fontSize="6" fill="#475569" fontFamily="Rubik, sans-serif" fontWeight="500" transform="rotate(-90,8,45)">גבוה</text>
          {row.acoustic && (
            <>
              <rect x="22" y="26" width="48" height="34" fill="none" stroke="#f59e0b" strokeWidth="0.8" strokeDasharray="2,1" rx="1" />
              <text x="46" y="78" textAnchor="middle" fontSize="6" fill="#d97706" fontFamily="Rubik, sans-serif">בידוד</text>
            </>
          )}
          <line x1="20" y1="62" x2="72" y2="62" stroke="#374151" strokeWidth="1.5" />
        </>
      )}

      {/* ═══════════ קשת (מרפק 90°) ═══════════ */}
      {key === 'elbow' && (
        <>
          {/* Center of curvature */}
          <circle cx="20" cy="80" r="1.5" fill="#475569" />

          {/* Inner curve (R-small = tight) */}
          <path d="M20,65 A 15 15 0 0 1 35,80" fill="none" stroke="#374151" strokeWidth="2.2" />

          {/* Outer curve (R-large = wide) */}
          <path d="M20,15 A 65 65 0 0 1 85,80" fill="none" stroke="#374151" strokeWidth="2.2" />

          {/* Fill between curves */}
          <path d="M20,15 A 65 65 0 0 1 85,80 L35,80 A 15 15 0 0 0 20,65 Z" fill="url(#elbowGrad)" stroke="none" opacity="0.5" />

          {/* Re-draw curves clean */}
          <path d="M20,15 A 65 65 0 0 1 85,80" fill="none" stroke="#374151" strokeWidth="2" />
          <path d="M20,65 A 15 15 0 0 1 35,80" fill="none" stroke="#374151" strokeWidth="2" />

          {/* Straight extensions at both ends */}
          {/* Top extension (vertical duct continuing up) */}
          <line x1="20" y1="15" x2="20" y2="6" stroke="#374151" strokeWidth="1.8" />
          <line x1="35" y1="80" x2="35" y2="80" stroke="#374151" strokeWidth="0" />
          {/* Right extension (horizontal duct continuing right) */}
          <line x1="85" y1="80" x2="95" y2="80" stroke="#374151" strokeWidth="1.8" />
          <line x1="20" y1="15" x2="20" y2="6" stroke="#374151" strokeWidth="0" />

          {/* Top straight section walls */}
          <line x1="10" y1="6" x2="10" y2="15" stroke="#374151" strokeWidth="1.5" />
          <line x1="30" y1="6" x2="30" y2="15" stroke="#374151" strokeWidth="0" />

          {/* Bottom straight section walls */}
          <line x1="85" y1="70" x2="95" y2="70" stroke="#374151" strokeWidth="0" />
          <line x1="85" y1="90" x2="95" y2="90" stroke="#374151" strokeWidth="0" />

          {/* Straight duct stubs at ends for flanges */}
          <line x1="10" y1="6" x2="20" y2="6" stroke="#374151" strokeWidth="1.5" />
          <line x1="35" y1="15" x2="85" y2="15" stroke="none" strokeWidth="0" />

          {/* Top flange */}
          <rect x="6" y="3" width="28" height="4" fill="none" stroke="#374151" strokeWidth="0.8" rx="1" />
          <line x1="20" y1="3" x2="20" y2="7" stroke="#9ca3af" strokeWidth="0.3" />

          {/* Right flange */}
          <rect x="95" y="66" width="4" height="28" fill="none" stroke="#374151" strokeWidth="0.8" rx="1" />
          <line x1="95" y1="80" x2="99" y2="80" stroke="#9ca3af" strokeWidth="0.3" />

          {/* Center seam */}
          <path d="M20,40 A 40 40 0 0 1 60,80" fill="none" stroke="#9ca3af" strokeWidth="0.5" strokeDasharray="3,2" />

          {/* 90° angle lines from center */}
          <line x1="20" y1="80" x2="20" y2="65" stroke="#475569" strokeWidth="0.5" strokeDasharray="2,1" />
          <line x1="20" y1="80" x2="35" y2="80" stroke="#475569" strokeWidth="0.5" strokeDasharray="2,1" />

          {/* 90° arc indicator */}
          <path d="M20,72 A 8 8 0 0 1 28,80" fill="none" stroke="#475569" strokeWidth="0.6" />
          <text x="30" y="75" fontSize="5.5" fill="#475569" fontFamily="Rubik, sans-serif" fontWeight="600">90°</text>

          {/* R-small dimension */}
          <path d="M20,72 A 7 7 0 0 1 27,80" fill="none" stroke="#2563eb" strokeWidth="0.7" strokeDasharray="1.5,1" />
          <line x1="20" y1="80" x2="35" y2="80" stroke="#2563eb" strokeWidth="0.7" strokeDasharray="1.5,1" />
          <text x="28" y="88" fontSize="6.5" fill="#2563eb" fontFamily="Rubik, sans-serif" fontWeight="700">Rק</text>

          {/* R-large dimension */}
          <path d="M20,30 A 50 50 0 0 1 70,80" fill="none" stroke="#dc2626" strokeWidth="0.7" strokeDasharray="2,1.5" />
          <line x1="20" y1="80" x2="20" y2="15" stroke="#dc2626" strokeWidth="0.7" strokeDasharray="2,1.5" />
          <text x="40" y="42" fontSize="6.5" fill="#dc2626" fontFamily="Rubik, sans-serif" fontWeight="700">Rג</text>

          {/* Duct width dimension (50 = Rג - Rק) */}
          <line x1="4" y1="15" x2="4" y2="65" stroke="#64748b" strokeWidth="0.6" markerStart="url(#arrowStart)" markerEnd="url(#arrowEnd)" />
          <text x="0" y="44" textAnchor="middle" fontSize="5" fill="#475569" fontFamily="Rubik, sans-serif" transform="rotate(-90,0,44)">רוחב</text>

          {/* Height at right end */}
          <line x1="85" y1="70" x2="85" y2="90" stroke="#64748b" strokeWidth="0.6" markerStart="url(#arrowStart)" markerEnd="url(#arrowEnd)" />
          <text x="90" y="82" fontSize="5" fill="#475569" fontFamily="Rubik, sans-serif">גובה</text>
        </>
      )}

     {/* ═══════════ מעבר ═══════════ */}
{key === 'transition' && (
  <g width="120" height="60">
    <path 
      d="M 25,15 L 95,15 L 80,45 L 40,45 Z" 
      fill="#d1d5db" 
      stroke="#374151" 
      strokeWidth="1.5" 
      strokeLinejoin="round"
    />
  </g>
)}

      {/* ═══════════ לאמד S (היסט גובה) ═══════════ */}
      {key === 'lamed-s' && (
        <>
          {/* Upper horizontal section */}
          <rect x="10" y="24" width="40" height="20" fill="url(#steelGrad)" stroke="#374151" strokeWidth="1.5" />

          {/* Lower horizontal section */}
          <rect x="80" y="52" width="40" height="20" fill="url(#steelGrad)" stroke="#374151" strokeWidth="1.5" />

          {/* Upper transition slope */}
          <polygon points="50,24 50,44 80,52 80,32" fill="url(#steelGradV)" stroke="#374151" strokeWidth="1.2" />
          {/* Lower transition slope */}
          <polygon points="50,44 50,44 80,52 80,52" fill="none" stroke="none" />

          {/* Outer wall (continuous path) */}
          <path d="M10,24 L50,24 L80,52 L120,52" fill="none" stroke="#374151" strokeWidth="1.8" />
          <path d="M10,44 L50,44 L80,72 L120,72" fill="none" stroke="#374151" strokeWidth="1.8" />

          {/* Inner transition lines */}
          <line x1="50" y1="24" x2="80" y2="52" stroke="#374151" strokeWidth="1.5" />
          <line x1="50" y1="44" x2="80" y2="72" stroke="#374151" strokeWidth="1.5" />

          {/* Fill */}
          <path d="M10,24 L50,24 L80,52 L120,52 L120,72 L80,72 L50,44 L10,44 Z" fill="url(#steelGrad)" stroke="none" opacity="0.4" />

          {/* Re-draw walls clean */}
          <path d="M10,24 L50,24 L80,52 L120,52" fill="none" stroke="#374151" strokeWidth="1.8" />
          <path d="M10,44 L50,44 L80,72 L120,72" fill="none" stroke="#374151" strokeWidth="1.8" />

          {/* Vertical end caps */}
          <line x1="10" y1="24" x2="10" y2="44" stroke="#374151" strokeWidth="1.5" />
          <line x1="120" y1="52" x2="120" y2="72" stroke="#374151" strokeWidth="1.5" />

          {/* Left flange */}
          <rect x="4" y="22" width="6" height="24" fill="none" stroke="#374151" strokeWidth="0.8" rx="1" />
          <line x1="7" y1="22" x2="7" y2="46" stroke="#9ca3af" strokeWidth="0.3" />

          {/* Right flange */}
          <rect x="120" y="50" width="6" height="24" fill="none" stroke="#374151" strokeWidth="0.8" rx="1" />
          <line x1="123" y1="50" x2="123" y2="74" stroke="#9ca3af" strokeWidth="0.3" />

          {/* Fold/crease lines at transition */}
          <line x1="50" y1="24" x2="50" y2="44" stroke="#9ca3af" strokeWidth="0.6" strokeDasharray="2,1.5" />
          <line x1="80" y1="52" x2="80" y2="72" stroke="#9ca3af" strokeWidth="0.6" strokeDasharray="2,1.5" />

          {/* Center line showing original duct axis */}
          <line x1="10" y1="34" x2="50" y2="34" stroke="#94a3b8" strokeWidth="0.4" strokeDasharray="4,2" />
          <line x1="80" y1="62" x2="120" y2="62" stroke="#94a3b8" strokeWidth="0.4" strokeDasharray="4,2" />

          {/* Width dimension (upper section) */}
          <line x1="10" y1="16" x2="50" y2="16" stroke="#64748b" strokeWidth="0.6" markerStart="url(#arrowStart)" markerEnd="url(#arrowEnd)" />
          <text x="30" y="14" textAnchor="middle" fontSize="5.5" fill="#475569" fontFamily="Rubik, sans-serif">רוחב</text>

          {/* Height dimension (duct height) */}
          <line x1="3" y1="24" x2="3" y2="44" stroke="#64748b" strokeWidth="0.6" markerStart="url(#arrowStart)" markerEnd="url(#arrowEnd)" />
          <text x="-2" y="36" textAnchor="middle" fontSize="5" fill="#475569" fontFamily="Rubik, sans-serif" transform="rotate(-90,-2,36)">גובה</text>

          {/* Offset distance (clear blue arrow) */}
          <line x1="65" y1="34" x2="65" y2="62" stroke="#2563eb" strokeWidth="1.2" markerStart="url(#arrowStart)" markerEnd="url(#arrowEnd)" />
          <text x="72" y="50" fontSize="7" fill="#2563eb" fontFamily="Rubik, sans-serif" fontWeight="700">סטייה</text>

          {/* Projection lines for offset */}
          <line x1="50" y1="34" x2="68" y2="34" stroke="#2563eb" strokeWidth="0.4" strokeDasharray="1,1" />
          <line x1="80" y1="62" x2="68" y2="62" stroke="#2563eb" strokeWidth="0.4" strokeDasharray="1,1" />
        </>
      )}

      {/* ═══════════ צינור עגול ═══════════ */}
      {key === 'pipe' && (
        <>
          <rect x="37" y="22" width="56" height="50" fill="url(#pipeGrad)" stroke="none" />
          <ellipse cx="65" cy="22" rx="28" ry="10" fill="#e5e7eb" stroke="#374151" strokeWidth="1.5" />
          <ellipse cx="65" cy="22" rx="22" ry="7.5" fill="#d1d5db" stroke="#374151" strokeWidth="0.8" />
          <line x1="37" y1="22" x2="37" y2="72" stroke="#374151" strokeWidth="1.5" />
          <line x1="93" y1="22" x2="93" y2="72" stroke="#374151" strokeWidth="1.5" />
          <ellipse cx="65" cy="72" rx="28" ry="10" fill="url(#pipeGrad)" stroke="#374151" strokeWidth="1.5" />
          <path d="M37,30 C50,28 80,32 93,30" fill="none" stroke="#9ca3af" strokeWidth="0.6" strokeDasharray="3,2" />
          <path d="M37,45 C50,43 80,47 93,45" fill="none" stroke="#9ca3af" strokeWidth="0.6" strokeDasharray="3,2" />
          <path d="M37,60 C50,58 80,62 93,60" fill="none" stroke="#9ca3af" strokeWidth="0.6" strokeDasharray="3,2" />
          <line x1="60" y1="24" x2="60" y2="70" stroke="#ffffff" strokeWidth="1" opacity="0.5" />
          <line x1="37" y1="88" x2="93" y2="88" stroke="#64748b" strokeWidth="0.7" markerStart="url(#arrowStart)" markerEnd="url(#arrowEnd)" />
          <text x="65" y="93" textAnchor="middle" fontSize="6.5" fill="#475569" fontFamily="Rubik, sans-serif" fontWeight="500">קוטר</text>
          <line x1="100" y1="22" x2="100" y2="72" stroke="#64748b" strokeWidth="0.7" markerStart="url(#arrowStart)" markerEnd="url(#arrowEnd)" />
          <text x="110" y="50" textAnchor="middle" fontSize="6" fill="#475569" fontFamily="Rubik, sans-serif" fontWeight="500" transform="rotate(-90,110,50)">אורך</text>
        </>
      )}

      {/* ═══════════ קופסת פיזור ═══════════ */}
      {key === 'plenum' && (
        <>
          <rect x="28" y="34" width="74" height="50" fill="url(#steelGrad)" stroke="#374151" strokeWidth="1.5" rx="2" />
          <polygon points="28,34 40,24 114,24 102,34" fill="#e5e7eb" stroke="#374151" strokeWidth="1.2" />
          <polygon points="102,34 114,24 114,74 102,84" fill="#d1d5db" stroke="#374151" strokeWidth="1.2" />
          <ellipse cx="77" cy="29" rx="18" ry="6" fill="#f9fafb" stroke="#374151" strokeWidth="1.2" />
          <ellipse cx="77" cy="29" rx="13" ry="4.5" fill="#d1d5db" stroke="#9ca3af" strokeWidth="0.8" />
          <rect x="62" y="22" width="30" height="8" fill="none" stroke="#374151" strokeWidth="1" rx="1" />
          <line x1="50" y1="34" x2="50" y2="84" stroke="#9ca3af" strokeWidth="0.6" strokeDasharray="4,2" />
          <line x1="80" y1="34" x2="80" y2="84" stroke="#9ca3af" strokeWidth="0.6" strokeDasharray="4,2" />
          <circle cx="34" cy="42" r="1.5" fill="none" stroke="#9ca3af" strokeWidth="0.6" />
          <circle cx="34" cy="76" r="1.5" fill="none" stroke="#9ca3af" strokeWidth="0.6" />
          <circle cx="96" cy="42" r="1.5" fill="none" stroke="#9ca3af" strokeWidth="0.6" />
          <circle cx="96" cy="76" r="1.5" fill="none" stroke="#9ca3af" strokeWidth="0.6" />
          <line x1="28" y1="90" x2="102" y2="90" stroke="#64748b" strokeWidth="0.7" markerStart="url(#arrowStart)" markerEnd="url(#arrowEnd)" />
          <text x="65" y="95" textAnchor="middle" fontSize="6" fill="#475569" fontFamily="Rubik, sans-serif">רוחב</text>
          <line x1="8" y1="34" x2="8" y2="84" stroke="#64748b" strokeWidth="0.7" markerStart="url(#arrowStart)" markerEnd="url(#arrowEnd)" />
          <text x="4" y="62" textAnchor="middle" fontSize="5.5" fill="#475569" fontFamily="Rubik, sans-serif" fontWeight="500" transform="rotate(-90,4,62)">גובה</text>
        </>
      )}

      {/* ═══════════ מדף אש ═══════════ */}
      {key === 'fire-shelf' && (
        <>
          <rect x="24" y="20" width="80" height="58" fill="url(#steelGrad)" stroke="#374151" strokeWidth="1.5" rx="1" />
          <line x1="24" y1="34" x2="104" y2="34" stroke="#374151" strokeWidth="1.2" />
          <line x1="24" y1="48" x2="104" y2="48" stroke="#374151" strokeWidth="1.5" />
          <line x1="24" y1="62" x2="104" y2="62" stroke="#374151" strokeWidth="1.2" />
          <rect x="24" y="33" width="80" height="2" fill="#ef4444" opacity="0.3" />
          <rect x="24" y="47" width="80" height="3" fill="#ef4444" opacity="0.4" />
          <rect x="24" y="61" width="80" height="2" fill="#ef4444" opacity="0.3" />
          <rect x="14" y="40" width="10" height="18" fill="none" stroke="#374151" strokeWidth="1.2" rx="1" />
          <line x1="14" y1="44" x2="24" y2="44" stroke="#374151" strokeWidth="0.8" />
          <line x1="14" y1="54" x2="24" y2="54" stroke="#374151" strokeWidth="0.8" />
          <circle cx="19" cy="42" r="2" fill="#64748b" stroke="#374151" strokeWidth="0.6" />
          <circle cx="19" cy="56" r="2" fill="#64748b" stroke="#374151" strokeWidth="0.6" />
          <line x1="50" y1="22" x2="50" y2="34" stroke="#f59e0b" strokeWidth="1" />
          <line x1="78" y1="22" x2="78" y2="34" stroke="#f59e0b" strokeWidth="1" />
          <circle cx="50" cy="28" r="2.5" fill="#fef3c7" stroke="#f59e0b" strokeWidth="0.8" />
          <circle cx="78" cy="28" r="2.5" fill="#fef3c7" stroke="#f59e0b" strokeWidth="0.8" />
          <line x1="24" y1="84" x2="104" y2="84" stroke="#64748b" strokeWidth="0.7" markerStart="url(#arrowStart)" markerEnd="url(#arrowEnd)" />
          <text x="64" y="90" textAnchor="middle" fontSize="6" fill="#475569" fontFamily="Rubik, sans-serif">רוחב</text>
          <line x1="112" y1="20" x2="112" y2="78" stroke="#64748b" strokeWidth="0.7" markerStart="url(#arrowStart)" markerEnd="url(#arrowEnd)" />
          <text x="120" y="52" textAnchor="middle" fontSize="5.5" fill="#475569" fontFamily="Rubik, sans-serif" fontWeight="500" transform="rotate(90,120,52)">גובה</text>
          <rect x="38" y="36" width="28" height="8" fill="#fef2f2" stroke="#ef4444" strokeWidth="0.6" rx="2" />
          <text x="52" y="42" textAnchor="middle" fontSize="5" fill="#dc2626" fontFamily="Rubik, sans-serif" fontWeight="600">מדף אש</text>
        </>
      )}

      {/* ═══════════ שתוצר (תריס/מעצר אש) ═══════════ */}
      {key === 'damper' && (
        <>
          {/* Outer frame */}
          <rect x="20" y="18" width="90" height="58" fill="url(#steelGrad)" stroke="#374151" strokeWidth="1.8" rx="2" />
          {/* Inner frame */}
          <rect x="26" y="24" width="78" height="46" fill="none" stroke="#374151" strokeWidth="1" rx="1" />
          {/* Damper blade (rotating plate) */}
          <rect x="30" y="38" width="70" height="4" fill="#d1d5db" stroke="#374151" strokeWidth="1" rx="1" transform="rotate(-15,65,40)" />
          {/* Pivot points */}
          <circle cx="30" cy="40" r="3" fill="#64748b" stroke="#374151" strokeWidth="1" />
          <circle cx="100" cy="40" r="3" fill="#64748b" stroke="#374151" strokeWidth="1" />
          {/* Actuator arm */}
          <line x1="30" y1="40" x2="18" y2="28" stroke="#374151" strokeWidth="1.2" />
          <circle cx="18" cy="28" r="2.5" fill="#fef3c7" stroke="#f59e0b" strokeWidth="0.8" />
          {/* Fire label */}
          <rect x="42" y="56" width="46" height="10" fill="#fef2f2" stroke="#ef4444" strokeWidth="0.6" rx="2" />
          <text x="65" y="64" textAnchor="middle" fontSize="6" fill="#dc2626" fontFamily="Rubik, sans-serif" fontWeight="700">מעצר אש</text>
          {/* Dimension */}
          <line x1="20" y1="82" x2="110" y2="82" stroke="#64748b" strokeWidth="0.7" markerStart="url(#arrowStart)" markerEnd="url(#arrowEnd)" />
          <text x="65" y="88" textAnchor="middle" fontSize="5.5" fill="#475569" fontFamily="Rubik, sans-serif">רוחב</text>
          <line x1="116" y1="18" x2="116" y2="76" stroke="#64748b" strokeWidth="0.7" markerStart="url(#arrowStart)" markerEnd="url(#arrowEnd)" />
          <text x="122" y="50" textAnchor="middle" fontSize="5.5" fill="#475569" fontFamily="Rubik, sans-serif" transform="rotate(90,122,50)">גובה</text>
        </>
      )}

      {/* ═══════════ מתאם (מעבר מרובע לגלגלי) ═══════════ */}
      {key === 'adapter' && (
        <>
          {/* Rectangular side (left) */}
          <rect x="10" y="22" width="24" height="50" fill="url(#steelGrad)" stroke="#374151" strokeWidth="1.5" rx="1" />
          {/* Circular side (right) */}
          <ellipse cx="100" cy="47" rx="18" ry="24" fill="url(#steelGradV)" stroke="#374151" strokeWidth="1.5" />
          <ellipse cx="100" cy="47" rx="14" ry="19" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="0.8" />
          {/* Transition lines connecting rect to circle */}
          <line x1="34" y1="22" x2="82" y2="28" stroke="#374151" strokeWidth="1.2" strokeDasharray="4,2" />
          <line x1="34" y1="72" x2="82" y2="66" stroke="#374151" strokeWidth="1.2" strokeDasharray="4,2" />
          <line x1="34" y1="47" x2="82" y2="47" stroke="#9ca3af" strokeWidth="0.6" strokeDasharray="2,2" />
          {/* Flanges */}
          <rect x="4" y="20" width="6" height="54" fill="none" stroke="#374151" strokeWidth="0.8" rx="1" />
          <line x1="7" y1="20" x2="7" y2="74" stroke="#9ca3af" strokeWidth="0.3" />
          {/* Label */}
          <rect x="42" y="78" width="46" height="10" fill="#f0fdf4" stroke="#22c55e" strokeWidth="0.6" rx="2" />
          <text x="65" y="86" textAnchor="middle" fontSize="5.5" fill="#166534" fontFamily="Rubik, sans-serif" fontWeight="600">מתאם</text>
          {/* Dimension: rect side */}
          <line x1="10" y1="14" x2="34" y2="14" stroke="#64748b" strokeWidth="0.6" markerStart="url(#arrowStart)" markerEnd="url(#arrowEnd)" />
          <text x="22" y="12" textAnchor="middle" fontSize="5" fill="#475569" fontFamily="Rubik, sans-serif">ר×ג</text>
          {/* Dimension: circle */}
          <line x1="100" y1="74" x2="100" y2="82" stroke="#64748b" strokeWidth="0.6" markerStart="url(#arrowStart)" markerEnd="url(#arrowEnd)" />
          <text x="100" y="90" textAnchor="middle" fontSize="5" fill="#475569" fontFamily="Rubik, sans-serif">קוטר</text>
        </>
      )}

      {/* ═══════════ שרשורי (מוט פלדה עם אומים) ═══════════ */}
      {key === 'threaded-rod' && (
        <>
          {/* Upper bracket plate */}
          <rect x="40" y="8" width="50" height="8" fill="#d1d5db" stroke="#374151" strokeWidth="1.2" rx="1" />
          {/* Mounting bolts through bracket */}
          <circle cx="50" cy="12" r="2.5" fill="#64748b" stroke="#374151" strokeWidth="0.8" />
          <circle cx="80" cy="12" r="2.5" fill="#64748b" stroke="#374151" strokeWidth="0.8" />
          {/* Threaded rod body */}
          <rect x="62" y="16" width="6" height="62" fill="#9ca3af" stroke="#374151" strokeWidth="1" />
          {/* Thread markings */}
          <line x1="62" y1="22" x2="68" y2="22" stroke="#374151" strokeWidth="0.6" />
          <line x1="62" y1="26" x2="68" y2="26" stroke="#374151" strokeWidth="0.6" />
          <line x1="62" y1="30" x2="68" y2="30" stroke="#374151" strokeWidth="0.6" />
          <line x1="62" y1="34" x2="68" y2="34" stroke="#374151" strokeWidth="0.6" />
          <line x1="62" y1="38" x2="68" y2="38" stroke="#374151" strokeWidth="0.6" />
          <line x1="62" y1="42" x2="68" y2="42" stroke="#374151" strokeWidth="0.6" />
          <line x1="62" y1="46" x2="68" y2="46" stroke="#374151" strokeWidth="0.6" />
          <line x1="62" y1="50" x2="68" y2="50" stroke="#374151" strokeWidth="0.6" />
          <line x1="62" y1="54" x2="68" y2="54" stroke="#374151" strokeWidth="0.6" />
          <line x1="62" y1="58" x2="68" y2="58" stroke="#374151" strokeWidth="0.6" />
          <line x1="62" y1="62" x2="68" y2="62" stroke="#374151" strokeWidth="0.6" />
          <line x1="62" y1="66" x2="68" y2="66" stroke="#374151" strokeWidth="0.6" />
          <line x1="62" y1="70" x2="68" y2="70" stroke="#374151" strokeWidth="0.6" />
          {/* Upper nut */}
          <rect x="57" y="18" width="16" height="6" fill="#d1d5db" stroke="#374151" strokeWidth="1" rx="1" />
          {/* Lower nut */}
          <rect x="57" y="72" width="16" height="6" fill="#d1d5db" stroke="#374151" strokeWidth="1" rx="1" />
          {/* Bottom bracket plate */}
          <rect x="40" y="80" width="50" height="8" fill="#d1d5db" stroke="#374151" strokeWidth="1.2" rx="1" />
          <circle cx="50" cy="84" r="2.5" fill="#64748b" stroke="#374151" strokeWidth="0.8" />
          <circle cx="80" cy="84" r="2.5" fill="#64748b" stroke="#374151" strokeWidth="0.8" />
          {/* Length dimension */}
          <line x1="82" y1="16" x2="82" y2="78" stroke="#64748b" strokeWidth="0.7" markerStart="url(#arrowStart)" markerEnd="url(#arrowEnd)" />
          <text x="92" y="50" textAnchor="middle" fontSize="6" fill="#475569" fontFamily="Rubik, sans-serif" fontWeight="500" transform="rotate(-90,92,50)">אורך</text>
          {/* Diameter indicator */}
          <line x1="57" y1="46" x2="73" y2="46" stroke="#64748b" strokeWidth="0.5" markerStart="url(#arrowStart)" markerEnd="url(#arrowEnd)" />
          <text x="65" y="44" textAnchor="middle" fontSize="4.5" fill="#475569" fontFamily="Rubik, sans-serif">ø</text>
        </>
      )}

      {/* ═══════════ חיבור גמיש (duct flexible) ═══════════ */}
      {key === 'flexible' && (
        <>
          {/* Left collar */}
          <rect x="12" y="22" width="14" height="50" fill="#d1d5db" stroke="#374151" strokeWidth="1.5" rx="1" />
          <line x1="19" y1="22" x2="19" y2="72" stroke="#9ca3af" strokeWidth="0.4" />
          {/* Right collar */}
          <rect x="104" y="22" width="14" height="50" fill="#d1d5db" stroke="#374151" strokeWidth="1.5" rx="1" />
          <line x1="111" y1="22" x2="111" y2="72" stroke="#9ca3af" strokeWidth="0.4" />
          {/* Flexible body - corrugated curves */}
          <path d="M26,22 C36,22 36,72 46,72 C56,72 56,22 66,22 C76,22 76,72 86,72 C96,72 96,22 104,22" fill="none" stroke="#374151" strokeWidth="1.5" />
          <path d="M26,32 C36,32 36,62 46,62 C56,62 56,32 66,32 C76,32 76,62 86,62 C96,62 96,32 104,32" fill="none" stroke="#9ca3af" strokeWidth="0.6" strokeDasharray="3,2" />
          <path d="M26,42 C36,42 36,52 46,52 C56,52 56,42 66,42 C76,42 76,52 86,52 C96,52 96,42 104,42" fill="none" stroke="#9ca3af" strokeWidth="0.6" strokeDasharray="3,2" />
          <path d="M26,52 C36,52 36,42 46,42 C56,42 56,52 66,52 C76,52 76,42 86,42 C96,42 96,52 104,52" fill="none" stroke="#9ca3af" strokeWidth="0.6" strokeDasharray="3,2" />
          <path d="M26,62 C36,62 36,32 46,32 C56,32 56,62 66,62 C76,62 76,32 86,32 C96,32 96,62 104,62" fill="none" stroke="#9ca3af" strokeWidth="0.6" strokeDasharray="3,2" />
          <path d="M26,72 C36,72 36,22 46,22 C56,22 56,72 66,72 C76,72 76,22 86,22 C96,22 96,72 104,72" fill="none" stroke="#374151" strokeWidth="1.5" />
          {/* Dimension: length */}
          <line x1="19" y1="82" x2="111" y2="82" stroke="#64748b" strokeWidth="0.7" markerStart="url(#arrowStart)" markerEnd="url(#arrowEnd)" />
          <text x="65" y="88" textAnchor="middle" fontSize="6" fill="#475569" fontFamily="Rubik, sans-serif" fontWeight="500">אורך ליח&apos;</text>
          {/* Dimension: diameter */}
          <line x1="6" y1="22" x2="6" y2="72" stroke="#64748b" strokeWidth="0.6" markerStart="url(#arrowStart)" markerEnd="url(#arrowEnd)" />
          <text x="2" y="50" textAnchor="middle" fontSize="5" fill="#475569" fontFamily="Rubik, sans-serif" transform="rotate(-90,2,50)">קוטר</text>
          {/* Label */}
          <rect x="38" y="8" width="54" height="10" fill="#f0f9ff" stroke="#3b82f6" strokeWidth="0.6" rx="2" />
          <text x="65" y="16" textAnchor="middle" fontSize="5.5" fill="#1e40af" fontFamily="Rubik, sans-serif" fontWeight="600">חיבור גמיש</text>
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
  const overrides = row.productionOverrides || {};

  if (row.notes === 'צינור עגול') {
    dims.push({ label: 'קוטר (מ"מ)', reference: overrides.width1 || (row.width1 ? String(row.width1) : undefined) });
    dims.push({ label: 'אורך (מ"מ)', reference: overrides.length || (row.length ? String(row.length) : undefined) });
  } else if (row.notes === 'לאמד S') {
    dims.push({ label: 'רוחב (מ"מ)', reference: overrides.width1 || (row.width1 ? String(row.width1) : undefined) });
    dims.push({ label: 'גובה (מ"מ)', reference: overrides.height1 || (row.height1 ? String(row.height1) : undefined) });
    dims.push({ label: 'אורך (מ"מ)', reference: overrides.length || (row.length ? String(row.length) : undefined) });
    dims.push({ label: 'סטייה (מ"מ)', reference: overrides.rSmall || (row.rSmall ? String(row.rSmall) : undefined) });
  } else if (row.type === 'קשת') {
    dims.push({ label: 'רוחב (מ"מ)', reference: overrides.width1 || (row.width1 ? String(row.width1) : undefined) });
    dims.push({ label: 'גובה (מ"מ)', reference: overrides.height1 || (row.height1 ? String(row.height1) : undefined) });
    dims.push({ label: 'R קטן (מ"מ)', reference: overrides.rSmall || (row.rSmall ? String(row.rSmall) : undefined) });
    dims.push({ label: 'R גדול (מ"מ)', reference: overrides.rBig || (row.rBig ? String(row.rBig) : undefined) });
  } else if (row.type === 'מעבר') {
    // For transition, handles both combined view and split override values if needed
    const section1 = overrides.width1 && overrides.height1 ? `${overrides.width1}×${overrides.height1}` : (row.width1 ? `${row.width1}×${row.height1}` : undefined);
    const section2 = overrides.width2 && overrides.height2 ? `${overrides.width2}×${overrides.height2}` : (row.width2 ? `${row.width2}×${row.height2}` : undefined);
    dims.push({ label: 'חתך 1 ר×ג', reference: section1 });
    dims.push({ label: 'חתך 2 ר×ג', reference: section2 });
    dims.push({ label: 'אורך (מ"מ)', reference: overrides.length || (row.length ? String(row.length) : undefined) });
  } else if (row.notes === 'קופסת פיזור') {
    const sectionPlenum = overrides.width1 && overrides.height1 ? `${overrides.width1}×${overrides.height1}` : (row.width1 ? `${row.width1}×${row.height1}` : undefined);
    dims.push({ label: 'ר×ג (מ"מ)', reference: sectionPlenum });
    dims.push({ label: 'עומק (מ"מ)', reference: overrides.length || (row.length ? String(row.length) : undefined) });
  } else {
    dims.push({ label: 'רוחב (מ"מ)', reference: overrides.width1 || (row.width1 ? String(row.width1) : undefined) });
    dims.push({ label: 'גובה (מ"מ)', reference: overrides.height1 || (row.height1 ? String(row.height1) : undefined) });
    dims.push({ label: 'אורך (מ"מ)', reference: overrides.length || (row.length ? String(row.length) : undefined) });
  }
  
  dims.push({ label: 'עובי פח (מ"מ)', reference: overrides.thickness || (thickness ? thickness.toFixed(2) : undefined) });
  if (row.panels > 0) dims.push({ label: 'דופן (יח\')', reference: overrides.panels || String(row.panels) });
  return dims;
}