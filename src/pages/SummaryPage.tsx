import React from 'react';
import CompanyLetterhead from '../CompanyLetterhead';
import type { CompanyDetails } from '../CompanyLetterhead';
import { getSheetTotals } from '../calculations';
import type { Sheet, RowData } from '../types';

export interface SummaryPageProps {
  sheets: Sheet[];
  selectedProject: string;
  isNewProject: boolean;
  newProjectName: string;
  isNewClient: boolean;
  selectedClientKey: string;
  clientDetails: {
    name: string;
    phone: string;
    email: string;
    contact: string;
  };
  docNumber: string;
  docDate: string;
  myCompanyDetails: CompanyDetails;
  handlePrint: () => void;
  calculateThickness: (w1: number, h1: number, manual?: number) => number;
  calculateArea: (row: RowData) => number;
}

export default function SummaryPage({
  sheets,
  selectedProject,
  isNewProject,
  newProjectName,
  isNewClient,
  selectedClientKey,
  clientDetails,
  docNumber,
  docDate,
  myCompanyDetails,
  handlePrint,
  calculateThickness,
  calculateArea,
}: SummaryPageProps) {
  return (
    <div className="landscape-print summary-print-page print-document" style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '32px', maxWidth: '1400px', margin: '0 auto', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
      <div className="print-orientation-spacer landscape-print" aria-hidden="true" />

      {/* סרגל כפתורי ניהול נייר המכתבים - מוסתר בהדפסה */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '20px', borderBottom: '1px solid #cbd5e1', paddingBottom: '10px', gap: '8px' }}>
        <button
          onClick={handlePrint}
          style={{
            padding: '8px 16px',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '13px'
          }}
        >
          הדפס ריכוז כמויות / שמור כ-PDF
        </button>
      </div>

      {/* כותרת רשמית של החברה בריכוז כמויות */}
      <CompanyLetterhead details={myCompanyDetails} />

      {/* פרטי הפרויקט והריכוז */}
      <div className="summary-project-info" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '25px', paddingBottom: '10px', borderBottom: '1px solid #cbd5e1', fontSize: '14px', textAlign: 'right' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div><b>פרויקט:</b> {isNewProject ? newProjectName : selectedProject} - {isNewClient ? clientDetails.name : selectedClientKey}</div>
          <div><b>ריכוז:</b> ריכוז מס' - {docNumber}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
          <div><b>תאריך:</b> {docDate}</div>
        </div>
      </div>

      {/* מעבר על כל דפי המדידות ורינדור טבלה מפורטת לכל דף (דף ריכוז בהתאם ל-PDF) */}
      {sheets.map((sheet, sIdx) => {
        const shTotals = getSheetTotals(sheet);

        return (
          <div key={sheet.id} className="summary-sheet-block" style={{ marginBottom: '50px', paddingBottom: '30px', borderBottom: sIdx < sheets.length - 1 ? '2px dashed #cbd5e1' : 'none', pageBreakAfter: sIdx < sheets.length - 1 ? 'always' : 'auto' }}>

            {/* כותרת דף הריכוז עבור הדף הנוכחי */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e3a8a', margin: 0, fontFamily: 'Rubik, sans-serif' }}>
                דף ריכוז - {sheet.name}
              </h2>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>
                טבלה {sIdx + 1} מתוך {sheets.length}
              </span>
            </div>

            {/* טבלת הריכוז המפורטת לכל שורה בדף המדידה */}
            <div className="print-table-wrapper" style={{ overflowX: 'auto', width: '100%', backgroundColor: '#ffffff', marginBottom: '15px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '11px', border: '1.5px solid #cbd5e1', minWidth: '1100px' }}>
                <thead style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #475569' }}>
                  <tr style={{ color: '#0f172a', fontWeight: 'bold' }}>
                    <th style={{ padding: '8px 6px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', width: '50px' }}>מספר</th>
                    <th style={{ padding: '8px 6px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', width: '60px', fontWeight: 'bold' }}>מס' חלק</th>
                    <th style={{ padding: '8px 10px', borderLeft: '1px solid #cbd5e1', textAlign: 'right' }}>פירוט</th>
                    <th style={{ padding: '8px 6px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', width: '100px' }}>פח (מ"ר)</th>
                    <th style={{ padding: '8px 6px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', width: '100px' }}>בידוד (מ"ר)</th>
                    <th style={{ padding: '8px 6px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', width: '100px' }}>מתאם (יח')</th>
                    <th style={{ padding: '8px 6px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', width: '70px', backgroundColor: '#fefce8', color: '#854d0e' }}>דופן</th>
                    <th style={{ padding: '8px 6px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', width: '100px' }}>שתוצר (יח')</th>
                    <th style={{ padding: '8px 6px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', width: '100px' }}>גמיש (מ"א)</th>
                    <th style={{ padding: '8px 6px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', width: '100px' }}>שרשורי (מ"א)</th>
                    <th style={{ padding: '8px 6px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', width: '100px' }}>פח 1.25 (מ"ר)</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', width: '160px' }}>הערות</th>
                  </tr>
                </thead>
                <tbody>
                  {sheet.rows.map((row, rIdx) => {
                    const thick = calculateThickness(row.width1, row.height1, row.manualThickness);
                    const area = calculateArea(row);

                    let displayType = row.notes && ['לאמד S','צינור עגול','קופסת פיזור','מדף אש'].includes(row.notes) ? row.notes : row.type;
                    let formatDetail = `${displayType} ${row.notes === 'צינור עגול' ? `קוטר ${row.width1}` : `${row.width1}x${row.height1}`}`;
                    if (row.type === 'מעבר') formatDetail += ` / ${row.width2}x${row.height2}`;
                    if (row.length > 0) formatDetail += ` L=${row.length}`;
                    if (row.panels > 0) formatDetail += ` [דופן×${row.panels}]`;

                    return (
                      <tr key={row.id} style={{ borderBottom: '1px solid #cbd5e1', backgroundColor: rIdx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                        <td style={{ padding: '8px 6px', textAlign: 'center', borderLeft: '1px solid #cbd5e1', fontWeight: 'bold', color: '#64748b' }}>{rIdx + 1}</td>
                        <td style={{ padding: '8px 6px', textAlign: 'center', borderLeft: '1px solid #cbd5e1', fontWeight: 600, color: '#1e293b', fontSize: '11px' }}>{row.partNumber || ''}</td>
                        <td style={{ padding: '8px 10px', borderLeft: '1px solid #cbd5e1', fontWeight: 600, color: '#1e293b' }}>{formatDetail}</td>

                        {/* פח רגיל */}
                        <td style={{ padding: '8px 6px', textAlign: 'center', borderLeft: '1px solid #cbd5e1' }}>
                          {thick !== 1.25 && area > 0 ? area.toFixed(2) : ''}
                        </td>

                        {/* בידוד */}
                        <td style={{ padding: '8px 6px', textAlign: 'center', borderLeft: '1px solid #cbd5e1' }}>
                          {(row.acoustic || row.external) && area > 0 ? area.toFixed(2) : ''}
                        </td>

                        {/* מתאם */}
                        <td style={{ padding: '8px 6px', textAlign: 'center', borderLeft: '1px solid #cbd5e1' }}>
                          {row.adapterType !== 'ללא' && row.adapterQty > 0 ? row.adapterQty : ''}
                        </td>

                        {/* דופן */}
                        <td style={{ padding: '8px 6px', textAlign: 'center', borderLeft: '1px solid #cbd5e1', backgroundColor: '#fefce8', color: '#854d0e', fontWeight: 600 }}>
                          {row.panels > 0 ? row.panels : ''}
                        </td>

                        {/* שתוצר */}
                        <td style={{ padding: '8px 6px', textAlign: 'center', borderLeft: '1px solid #cbd5e1' }}>
                          {row.shatuzar ? '1' : ''}
                        </td>

                        {/* גמיש */}
                        <td style={{ padding: '8px 6px', textAlign: 'center', borderLeft: '1px solid #cbd5e1' }}>
                          {row.flexible > 0 && row.length > 0 ? (row.flexible * row.length).toFixed(2) : ''}
                        </td>

                        {/* שרשורי */}
                        <td style={{ padding: '8px 6px', textAlign: 'center', borderLeft: '1px solid #cbd5e1' }}>
                          {row.sharshuriType !== 'ללא' && row.length > 0 ? row.length.toFixed(2) : ''}
                        </td>

                        {/* פח 1.25 */}
                        <td style={{ padding: '8px 6px', textAlign: 'center', borderLeft: '1px solid #cbd5e1' }}>
                          {thick === 1.25 && area > 0 ? area.toFixed(2) : ''}
                        </td>

                        <td style={{ padding: '8px 10px', color: '#64748b', fontSize: '11px' }}>{row.notes}</td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* רגל הטבלה - סה"כ כמויות */}
                <tfoot>
                  <tr style={{ backgroundColor: '#f1f5f9', fontWeight: 'bold', borderTop: '2px solid #cbd5e1' }}>
                    <td style={{ padding: '8px 6px', textAlign: 'center', borderLeft: '1px solid #cbd5e1' }} colSpan={3}>סה"כ כמות:</td>
                    <td style={{ padding: '8px 6px', textAlign: 'center', borderLeft: '1px solid #cbd5e1' }}>{(shTotals.t08 + shTotals.t10) > 0 ? (shTotals.t08 + shTotals.t10).toFixed(2) : ''}</td>
                    <td style={{ padding: '8px 6px', textAlign: 'center', borderLeft: '1px solid #cbd5e1' }}>{(shTotals.acoustic + shTotals.external) > 0 ? (shTotals.acoustic + shTotals.external).toFixed(2) : ''}</td>
                    <td style={{ padding: '8px 6px', textAlign: 'center', borderLeft: '1px solid #cbd5e1' }}>{shTotals.adapterQty > 0 ? shTotals.adapterQty : ''}</td>
                    <td style={{ padding: '8px 6px', textAlign: 'center', borderLeft: '1px solid #cbd5e1' }}>{''}</td>
                    <td style={{ padding: '8px 6px', textAlign: 'center', borderLeft: '1px solid #cbd5e1' }}>{shTotals.shatuzar > 0 ? shTotals.shatuzar : ''}</td>
                    <td style={{ padding: '8px 6px', textAlign: 'center', borderLeft: '1px solid #cbd5e1' }}>{shTotals.flexible > 0 ? shTotals.flexible.toFixed(2) : ''}</td>
                    <td style={{ padding: '8px 6px', textAlign: 'center', borderLeft: '1px solid #cbd5e1' }}>{(shTotals.sharshuri4 + shTotals.sharshuri6 + shTotals.sharshuri8 + shTotals.sharshuri10 + shTotals.sharshuri12 + shTotals.sharshuri14) > 0 ? (shTotals.sharshuri4 + shTotals.sharshuri6 + shTotals.sharshuri8 + shTotals.sharshuri10 + shTotals.sharshuri12 + shTotals.sharshuri14).toFixed(2) : ''}</td>
                    <td style={{ padding: '8px 6px', textAlign: 'center', borderLeft: '1px solid #cbd5e1' }}>{shTotals.t125 > 0 ? shTotals.t125.toFixed(2) : ''}</td>
                    <td style={{ padding: '8px 10px' }}></td>
                  </tr>
                </tfoot>
              </table>
            </div>

          </div>
        );
      })}

      {/* הערה חוקית קבועה למטה בתחתית הדף */}
      <div className="summary-footer" style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', color: '#64748b', paddingTop: '10px', borderTop: '1px solid #cbd5e1' }}>
        <span>הופק באמצעות מערכת עלי שרארה בע"מ - ממוחשב</span>
        <span>חתימת העסק ומבצע הריכוז</span>
      </div>

    </div>
  );
}
