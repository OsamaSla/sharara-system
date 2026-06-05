import type { RowData, Sheet } from './App';

interface PrintableReportProps {
  sheets: Sheet[];
  clientDetails: { name: string; phone: string; email: string; contact: string };
  selectedProject: string;
  docDate: string;
  docNumber: string;
  logoUrl: string;
  calculateArea: (row: RowData) => number;
  calculateThickness: (w: number, h: number, manual?: number) => number;
}

export default function PrintableReport({
  sheets,
  clientDetails,
  selectedProject,
  docDate,
  docNumber,
  logoUrl,
  calculateArea,
  calculateThickness,
}: PrintableReportProps) {
  const today = new Date().toLocaleDateString('he-IL');
  const headers = [
    { label: '#', w: '3%' },
    { label: "מס' חלק", w: '7%' },
    { label: 'סוג/פירוט', w: '16%' },
    { label: 'רוחב', w: '5%' },
    { label: 'גובה', w: '5%' },
    { label: 'רוחב 2', w: '5%' },
    { label: 'גובה 2', w: '5%' },
    { label: 'אורך', w: '6%' },
    { label: 'רדיוס ג\'', w: '5%' },
    { label: 'רדיוס ק\'', w: '5%' },
    { label: 'שתוצר', w: '4%' },
    { label: 'גמיש', w: '4%' },
    { label: 'אקוסטי', w: '4%' },
    { label: 'חיצוני', w: '4%' },
    { label: 'שרשורי', w: '6%' },
    { label: 'מתאם', w: '6%' },
    { label: 'עובי', w: '4%' },
    { label: 'דופן', w: '4%' },
    { label: 'שטח', w: '5%' },
    { label: 'הערות', w: '7%' },
  ];

  return (
    <div className="printable-report landscape-print">
      {sheets.map((sheet, si) => (
        <table key={sheet.id} className="print-table">
          <thead>
            <tr className="pt-logo-row">
              <th colSpan={headers.length}>
                  <div className="pt-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '10px', marginBottom: '15px' }}>
                    {logoUrl ? (
                      <img src={logoUrl} alt="לוגו" className="pt-logo" style={{ maxHeight: '70px', width: 'auto', objectFit: 'contain' }} />
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                        {/* סמל הלוגו הרשמי של עלי שרארה */}
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', width: '100%', position: 'relative' }}>
                          <span style={{ fontSize: '15px', fontFamily: '"Times New Roman", Times, serif', color: '#1e293b', fontWeight: 'bold' }}>
                            Sharara 1970
                          </span>
                          <svg width="150" height="55" viewBox="0 0 180 70">
                            <path d="M10 20 C 50 10, 100 30, 140 20" fill="none" stroke="#94a3b8" strokeWidth="2.5" />
                            <path d="M10 32 C 50 22, 100 42, 140 32" fill="none" stroke="#475569" strokeWidth="2.5" />
                            <path d="M10 44 C 50 34, 100 54, 140 44" fill="none" stroke="#d97706" strokeWidth="2.5" />
                            <g transform="translate(140, 5)">
                              <path d="M20 35 C 20 22, 45 22, 45 31 C 45 40, 15 37, 15 49 C 15 60, 40 60, 40 49" fill="none" stroke="#d97706" strokeWidth="5.5" strokeLinecap="round" />
                              <path d="M30 18 L 15 52 M 30 18 L 45 52 M 19 40 L 41 40" fill="none" stroke="#475569" strokeWidth="4.5" strokeLinecap="round" />
                            </g>
                          </svg>
                        </div>
                        <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#1e293b', margin: '4px 0 0 0', fontFamily: '"Times New Roman", Times, serif' }}>עלי שרארה בע"מ</h2>
                        <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', margin: '2px 0 0 0' }}>תעשיות פח ומערכות אוורור ומיזוג אוויר</p>
                      </div>
                    )}
                    <span className="pt-title" style={{ fontSize: '16pt', fontWeight: 'bold', color: '#1f4e79', fontFamily: 'Rubik, sans-serif', marginTop: '10px' }}>שרארה — דוח מדידות תעלות פח</span>
                  </div>
              </th>
            </tr>
            <tr className="pt-info-row">
              <th colSpan={headers.length}>
                <div className="pt-info">
                  <span>לקוח: {clientDetails.name}</span>
                  <span>טל: {clientDetails.phone}</span>
                  <span>איש קשר: {clientDetails.contact}</span>
                  <span>פרויקט: {selectedProject}</span>
                  <span>תאריך: {docDate}</span>
                  <span>מס\': {docNumber}</span>
                </div>
              </th>
            </tr>
            <tr className="pt-sheet-title-row">
              <th colSpan={headers.length}>גיליון: {sheet.name}</th>
            </tr>
            <tr className="pt-col-headers">
              {headers.map(h => (
                <th key={h.label} style={{ width: h.w }}>{h.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sheet.rows.map((row, idx) => {
              const thick = calculateThickness(row.width1, row.height1, row.manualThickness);
              const area = calculateArea(row);
              const displayType = row.notes && ['לאמד S','צינור עגול','קופסת פיזור','מדף אש'].includes(row.notes) ? row.notes : row.type;
              let detail = `${displayType}`;
              if (row.notes === 'צינור עגול') {
                detail += ` קוטר ${row.width1}`;
              } else {
                detail += ` ${row.width1}x${row.height1}`;
              }
              if (row.type === 'מעבר') detail += ` / ${row.width2}x${row.height2}`;
              if (row.length > 0) detail += ` L=${row.length}`;

              return (
                <tr key={row.id} className={idx % 2 === 0 ? 'pt-even' : 'pt-odd'}>
                  <td>{idx + 1}</td>
                  <td>{row.partNumber}</td>
                  <td className="pt-detail">{detail}</td>
                  <td>{row.width1}</td>
                  <td>{row.height1}</td>
                  <td>{row.width2 || '–'}</td>
                  <td>{row.height2 || '–'}</td>
                  <td>{row.length}</td>
                  <td>{row.rBig || '–'}</td>
                  <td>{row.rSmall || '–'}</td>
                  <td>{row.shatuzar ? '✓' : '–'}</td>
                  <td>{row.flexible || '–'}</td>
                  <td>{row.acoustic ? '✓' : '–'}</td>
                  <td>{row.external ? '✓' : '–'}</td>
                  <td>{row.sharshuriType !== 'ללא' ? row.sharshuriType : '–'}</td>
                  <td>{row.adapterType !== 'ללא' ? row.adapterType : '–'}</td>
                  <td>{thick.toFixed(2)}</td>
                  <td>{row.panels || '–'}</td>
                  <td>{area.toFixed(2)}</td>
                  <td>{row.notes}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="pt-footer-row">
              <td colSpan={headers.length}>
                <div className="pt-footer">
                  <span className="pt-footer-date">תאריך הפקה: {today}</span>
                  <span className="pt-footer-sign">חתימת מנהל עבודה: _________________________</span>
                </div>
              </td>
            </tr>
          </tfoot>
          {si < sheets.length - 1 && (
            <tbody className="pt-page-break"><tr><td colSpan={headers.length} /></tr></tbody>
          )}
        </table>
      ))}
    </div>
  );
}
