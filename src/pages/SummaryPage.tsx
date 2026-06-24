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
  
  // פונקציית עזר להבטחת תא יציב שלא קורס בהדפסה
  const renderCellData = (value: string | number | undefined | null) => {
    if (value === undefined || value === null || value === '') {
      return '\u00A0'; // תו רווח קשיח המונע קריסת תא ריק במנוע ה-PDF
    }
    return value;
  };

  return (
    <div className="landscape-print summary-print-page print-document" style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '32px', width: '100%', maxWidth: '100%', margin: '0 auto', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
      <div className="print-orientation-spacer landscape-print" aria-hidden="true" />

      {/* סרגל כפתורי ניהול נייר המכתבים - מוסתר בהדפסה */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '8px', gap: '6px' }}>
        <button
          onClick={handlePrint}
          style={{
            padding: '5px 12px',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '11px'
          }}
        >
          הדפס ריכוז / שמור PDF
        </button>
      </div>

      <div className="screen-hide-print-show">
        <CompanyLetterhead details={myCompanyDetails} />
      </div>

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

      {/* מעבר על כל דפי המדידות ורינדור טבלה מפורטת לכל דף */}
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
            <div className="print-table-wrapper" style={{ width: '100%', backgroundColor: '#ffffff', marginBottom: '15px' }}>
              <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', textAlign: 'right', fontSize: '11px', border: '1.5px solid #cbd5e1' }}>
                <thead style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #475569' }}>
                  <tr style={{ color: '#0f172a', fontWeight: 'bold', fontSize: '10px' }}>
                    <th style={{ padding: '3px 2px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', width: '3.5%' }}>מס'</th>
                    <th style={{ padding: '3px 2px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', width: '5%', fontWeight: 'bold' }}>מס' חלק</th>
                    <th style={{ padding: '3px 2px', borderLeft: '1px solid #cbd5e1', textAlign: 'right', width: '23%' }}>פירוט</th>
                    <th style={{ padding: '3px 2px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', width: '6.5%' }}>פח (מ"ר)</th>
                    <th style={{ padding: '3px 2px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', width: '6.5%' }}>בידוד (מ"ר)</th>
                    <th style={{ padding: '3px 2px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', width: '6%' }}>מתאם</th>
                    <th style={{ padding: '3px 2px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', width: '4.5%', backgroundColor: '#fefce8', color: '#854d0e' }}>דופן</th>
                    <th style={{ padding: '3px 2px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', width: '5.5%' }}>שתוצר</th>
                    <th style={{ padding: '3px 2px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', width: '6.5%' }}>גמיש</th>
                    <th style={{ padding: '3px 2px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', width: '6.5%' }}>שרשורי</th>
                    <th style={{ padding: '3px 2px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', width: '6%' }}>פח 1.25</th>
                    <th style={{ padding: '3px 2px', textAlign: 'right', width: '16%' }}>הערות</th>
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
                      <tr key={row.id} style={{ borderBottom: '1px solid #cbd5e1', backgroundColor: rIdx % 2 === 0 ? '#ffffff' : '#f8fafc', fontSize: '10px' }}>
                        <td style={{ padding: '2px 2px', textAlign: 'center', borderLeft: '1px solid #cbd5e1', fontWeight: 'bold', color: '#64748b' }}>{rIdx + 1}</td>
                        <td style={{ padding: '2px 2px', textAlign: 'center', borderLeft: '1px solid #cbd5e1', fontWeight: 600, color: '#1e293b', fontSize: '10px' }}>{renderCellData(row.partNumber)}</td>
                        <td style={{ padding: '2px 2px', borderLeft: '1px solid #cbd5e1', fontWeight: 600, color: '#1e293b' }}>{renderCellData(formatDetail)}</td>

                        <td style={{ padding: '2px 2px', textAlign: 'center', borderLeft: '1px solid #cbd5e1' }}>
                          {renderCellData(thick !== 1.25 && area > 0 ? area.toFixed(2) : '')}
                        </td>
                        <td style={{ padding: '2px 2px', textAlign: 'center', borderLeft: '1px solid #cbd5e1' }}>
                          {renderCellData((row.acoustic || row.external) && area > 0 ? area.toFixed(2) : '')}
                        </td>
                        <td style={{ padding: '2px 2px', textAlign: 'center', borderLeft: '1px solid #cbd5e1' }}>
                          {renderCellData(row.adapterType !== 'ללא' && row.adapterQty > 0 ? row.adapterQty : '')}
                        </td>
                        <td style={{ padding: '2px 2px', textAlign: 'center', borderLeft: '1px solid #cbd5e1', backgroundColor: '#fefce8', color: '#854d0e', fontWeight: 600 }}>
                          {renderCellData(row.panels > 0 ? row.panels : '')}
                        </td>
                        <td style={{ padding: '2px 2px', textAlign: 'center', borderLeft: '1px solid #cbd5e1' }}>
                          {renderCellData(row.shatuzar ? '1' : '')}
                        </td>
                        <td style={{ padding: '2px 2px', textAlign: 'center', borderLeft: '1px solid #cbd5e1' }}>
                          {renderCellData(row.flexible > 0 && row.length > 0 ? (row.flexible * row.length).toFixed(2) : '')}
                        </td>
                        <td style={{ padding: '2px 2px', textAlign: 'center', borderLeft: '1px solid #cbd5e1' }}>
                          {renderCellData(row.sharshuriType !== 'ללא' && row.length > 0 ? row.length.toFixed(2) : '')}
                        </td>
                        <td style={{ padding: '2px 2px', textAlign: 'center', borderLeft: '1px solid #cbd5e1' }}>
                          {renderCellData(thick === 1.25 && area > 0 ? area.toFixed(2) : '')}
                        </td>
                        <td style={{ padding: '2px 2px', color: '#64748b', fontSize: '10px' }}>{renderCellData(row.notes)}</td>
                      </tr>
                    );
                  })}
                </tbody>

                <tfoot>
                  <tr style={{ backgroundColor: '#f1f5f9', fontWeight: 'bold', borderTop: '2px solid #cbd5e1', fontSize: '10px' }}>
                    <td style={{ padding: '2px 2px', textAlign: 'center', borderLeft: '1px solid #cbd5e1' }} colSpan={3}>סה"כ:</td>
                    <td style={{ padding: '2px 2px', textAlign: 'center', borderLeft: '1px solid #cbd5e1' }}>{renderCellData((shTotals.t08 + shTotals.t10) > 0 ? (shTotals.t08 + shTotals.t10).toFixed(2) : '')}</td>
                    <td style={{ padding: '2px 2px', textAlign: 'center', borderLeft: '1px solid #cbd5e1' }}>{renderCellData((shTotals.acoustic + shTotals.external) > 0 ? (shTotals.acoustic + shTotals.external).toFixed(2) : '')}</td>
                    <td style={{ padding: '2px 2px', textAlign: 'center', borderLeft: '1px solid #cbd5e1' }}>{renderCellData(shTotals.adapterQty > 0 ? shTotals.adapterQty : '')}</td>
                    <td style={{ padding: '2px 2px', textAlign: 'center', borderLeft: '1px solid #cbd5e1' }}>{'\u00A0'}</td>
                    <td style={{ padding: '2px 2px', textAlign: 'center', borderLeft: '1px solid #cbd5e1' }}>{renderCellData(shTotals.shatuzar > 0 ? shTotals.shatuzar : '')}</td>
                    <td style={{ padding: '2px 2px', textAlign: 'center', borderLeft: '1px solid #cbd5e1' }}>{renderCellData(shTotals.flexible > 0 ? shTotals.flexible.toFixed(2) : '')}</td>
                    <td style={{ padding: '2px 2px', textAlign: 'center', borderLeft: '1px solid #cbd5e1' }}>{renderCellData((shTotals.sharshuri4 + shTotals.sharshuri6 + shTotals.sharshuri8 + shTotals.sharshuri10 + shTotals.sharshuri12 + shTotals.sharshuri14) > 0 ? (shTotals.sharshuri4 + shTotals.sharshuri6 + shTotals.sharshuri8 + shTotals.sharshuri10 + shTotals.sharshuri12 + shTotals.sharshuri14).toFixed(2) : '')}</td>
                    <td style={{ padding: '2px 2px', textAlign: 'center', borderLeft: '1px solid #cbd5e1' }}>{renderCellData(shTotals.t125 > 0 ? shTotals.t125.toFixed(2) : '')}</td>
                    <td style={{ padding: '2px 2px' }}>{'\u00A0'}</td>
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