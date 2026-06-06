export const Logo = ({ width = 180, height = 70 }: { width?: number, height?: number }) => (
  <svg width={width} height={height} viewBox="0 0 180 70" xmlns="http://www.w3.org/2000/svg">
    {/* Wavy lines for ventilation/airflow */}
    <path d="M10 20 C 50 10, 100 30, 140 20" fill="none" stroke="#94a3b8" strokeWidth="2.5" />
    <path d="M10 32 C 50 22, 100 42, 140 32" fill="none" stroke="#475569" strokeWidth="2.5" />
    <path d="M10 44 C 50 34, 100 54, 140 44" fill="none" stroke="#d97706" strokeWidth="2.5" />
    
    {/* Monogram */}
    <g transform="translate(140, 5)">
      <path d="M20 35 C 20 22, 45 22, 45 31 C 45 40, 15 37, 15 49 C 15 60, 40 60, 40 49" fill="none" stroke="#d97706" strokeWidth="5.5" strokeLinecap="round" />
      <path d="M30 18 L 15 52 M 30 18 L 45 52 M 19 40 L 41 40" fill="none" stroke="#475569" strokeWidth="4.5" strokeLinecap="round" />
    </g>
  </svg>
);
