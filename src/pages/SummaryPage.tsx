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

interface AggregatedPart {
  partNumber: string;
  displayType: string;
  formatDetail: string;
  thick: number;
  totalQty: number;
  totalPah: number;
  totalBidud: number;
  totalAdapter: number;
  totalDofan: number;
  totalShatuzar: number;
  totalFlexible: number;
  totalSharshuri: number;
  totalPah125: number;
  notes: string;
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

  const renderCellData = (value: string | number | undefined | null) => {
    if (value === undefined || value === null || value === '') {
      return '\u00A0';
    }
    return value;
  };

  // איחוד חלקים ייחודיים מכל דפי המדידה
  const aggregatedMap: Record<string, AggregatedPart> = {};

  sheets.forEach(sheet => {
    sheet.rows.forEach(row => {
      const thick = calculateThickness(row.width1, row.height1, row.manualThickness);
      const area = calculateArea(row);

      let displayType = row.notes && ['לאמד S','צינור עגול','קופסת פיזור','מדף אש'].includes(row.notes) ? row.notes : row.type;
      let formatDetail = `${displayType} ${row.notes === 'צינור עגול' ? `קוטר ${row.width1}` : `${row.width1}x${row.height1}`}`;
      if (row.type === 'מעבר') formatDetail += ` / ${row.width2}x${row.height2}`;
      if (row.length > 0) formatDetail += ` L=${row.length}`;
      if (row.panels > 0) formatDetail += ` [דופן×${row.panels}]`;

      const key = `${row.partNumber || ''}_${row.type}_${row.width1}_${row.height1}_${row.width2}_${row.height2}_${row.length}_${row.rBig}_${row.rSmall}_${row.panels}_${thick}`;

      if (!aggregatedMap[key]) {
        aggregatedMap[key] = {
          partNumber: row.partNumber || '',
          displayType,
          formatDetail,
          thick,
          totalQty: 0,
          totalPah: 0,
          totalBidud: 0,
          totalAdapter: 0,
          totalDofan: 0,
          totalShatuzar: 0,
          totalFlexible: 0,
          totalSharshuri: 0,
          totalPah125: 0,
          notes: row.notes || '',
        };
      }

      const agg = aggregatedMap[key];
      agg.totalQty += 1;
      if (thick !== 1.25 && area > 0) agg.totalPah += area;
      if (thick === 1.25 && area > 0) agg.totalPah125 += area;
      if ((row.acoustic || row.external) && area > 0) agg.totalBidud += area;
      if (row.adapterType !== 'ללא' && row.adapterQty > 0) agg.totalAdapter += row.adapterQty;
      if (row.panels > 0) agg.totalDofan += row.panels;
      if (row.shatuzar) agg.totalShatuzar += 1;
      if (row.flexible > 0 && row.length > 0) agg.totalFlexible += row.flexible * row.length;
      if (row.sharshuriType !== 'ללא' && row.length > 0) agg.totalSharshuri += row.length;
    });
  });

  const aggregatedParts = Object.values(aggregatedMap);

  // חישוב סה"כ גורלי
  const grandTotals = aggregatedParts.reduce((acc, p) => {
    acc.pah += p.totalPah;
    acc.pah125 += p.totalPah125;
    acc.bidud += p.totalBidud;
    acc.adapter += p.totalAdapter;
    acc.dofan += p.totalDofan;
    acc.shatuzar += p.totalShatuzar;
    acc.flexible += p.totalFlexible;
    acc.sharshuri += p.totalSharshuri;
    acc.qty += p.totalQty;
    return acc;
  }, { pah: 0, pah125: 0, bidud: 0, adapter: 0, dofan: 0, shatuzar: 0, flexible: 0, sharshuri: 0, qty: 0 });

  const colWidths = { num: '3.5%', pn: '5%', detail: '22%', pah: '6.5%', bidud: '6.5%', adapter: '5.5%', dofan: '4.5%', shatuzar: '5%', flexible: '6.5%', sharshuri: '6.5%', pah125: '6%', notes: '12.5%' };

  const renderGlobalTable = (parts: AggregatedPart[], showGrandTotal: boolean) => (
    <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', textAlign: 'right', fontSize: '11px', border: '1.5px solid #cbd5e1' }}>
      <thead style={{ backgroundColor: '#e0e7ff', borderBottom: '2px solid #475569' }}>
        <tr style={{ color: '#0f172a', fontWeight: 'bold', fontSize: '10px' }}>
          <th style={{ padding: '3px 2px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', width: colWidths.num }}>מס'</th>
          <th style={{ padding: '3px 2px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', width: colWidths.pn, fontWeight: 'bold' }}>מס' חלק</th>
          <th style={{ padding: '3px 2px', borderLeft: '1px solid #cbd5e1', textAlign: 'right', width: colWidths.detail }}>פירוט</th>
          <th style={{ padding: '3px 2px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', width: colWidths.pah }}>פח (מ"ר)</th>
          <th style={{ padding: '3px 2px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', width: colWidths.bidud }}>בידוד (מ"ר)</th>
          <th style={{ padding: '3px 2px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', width: colWidths.adapter }}>מתאם</th>
          <th style={{ padding: '3px 2px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', width: colWidths.dofan, backgroundColor: '#fefce8', color: '#854d0e' }}>דופן</th>
          <th style={{ padding: '3px 2px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', width: colWidths.shatuzar }}>שתוצר</th>
          <th style={{ padding: '3px 2px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', width: colWidths.flexible }}>גמיש</th>
          <th style={{ padding: '3px 2px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', width: colWidths.sharshuri }}>שרשורי</th>
          <th style={{ padding: '3px 2px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', width: colWidths.pah125 }}>פח 1.25</th>
          <th style={{ padding: '3px 2px', textAlign: 'right', width: colWidths.notes }}>הערות</th>
        </tr>
      </thead>
      <tbody>
        {parts.map((p, idx) => (
          <tr key={idx} style={{ borderBottom: '1px solid #cbd5e1', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc', fontSize: '10px' }}>
            <td style={{ padding: '2px 2px', textAlign: 'center', borderLeft: '1px solid #cbd5e1', fontWeight: 'bold', color: '#64748b' }}>{idx + 1}</td>
            <td style={{ padding: '2px 2px', textAlign: 'center', borderLeft: '1px solid #cbd5e1', fontWeight: 600, color: '#1e293b', fontSize: '10px' }}>{renderCellData(p.partNumber)}</td>
            <td style={{ padding: '2px 2px', borderLeft: '1px solid #cbd5e1', fontWeight: 600, color: '#1e293b' }}>{renderCellData(p.formatDetail)}</td>
            <td style={{ padding: '2px 2px', textAlign: 'center', borderLeft: '1px solid #cbd5e1' }}>{renderCellData(p.totalPah > 0 ? p.totalPah.toFixed(2) : '')}</td>
            <td style={{ padding: '2px 2px', textAlign: 'center', borderLeft: '1px solid #cbd5e1' }}>{renderCellData(p.totalBidud > 0 ? p.totalBidud.toFixed(2) : '')}</td>
            <td style={{ padding: '2px 2px', textAlign: 'center', borderLeft: '1px solid #cbd5e1' }}>{renderCellData(p.totalAdapter > 0 ? p.totalAdapter : '')}</td>
            <td style={{ padding: '2px 2px', textAlign: 'center', borderLeft: '1px solid #cbd5e1', backgroundColor: '#fefce8', color: '#854d0e', fontWeight: 600 }}>{renderCellData(p.totalDofan > 0 ? p.totalDofan : '')}</td>
            <td style={{ padding: '2px 2px', textAlign: 'center', borderLeft: '1px solid #cbd5e1' }}>{renderCellData(p.totalShatuzar > 0 ? p.totalShatuzar : '')}</td>
            <td style={{ padding: '2px 2px', textAlign: 'center', borderLeft: '1px solid #cbd5e1' }}>{renderCellData(p.totalFlexible > 0 ? p.totalFlexible.toFixed(2) : '')}</td>
            <td style={{ padding: '2px 2px', textAlign: 'center', borderLeft: '1px solid #cbd5e1' }}>{renderCellData(p.totalSharshuri > 0 ? p.totalSharshuri.toFixed(2) : '')}</td>
            <td style={{ padding: '2px 2px', textAlign: 'center', borderLeft: '1px solid #cbd5e1' }}>{renderCellData(p.totalPah125 > 0 ? p.totalPah125.toFixed(2) : '')}</td>
            <td style={{ padding: '2px 2px', color: '#64748b', fontSize: '10px' }}>{renderCellData(p.notes)}</td>
          </tr>
        ))}
      </tbody>
      {showGrandTotal && (
        <tfoot>
          <tr style={{ backgroundColor: '#dbeafe', fontWeight: 'bold', borderTop: '2px solid #475569', fontSize: '10px' }}>
            <td style={{ padding: '3px 2px', textAlign: 'center', borderLeft: '1px solid #cbd5e1' }} colSpan={3}>סה"כ כללי ({grandTotals.qty} חלקים):</td>
            <td style={{ padding: '3px 2px', textAlign: 'center', borderLeft: '1px solid #cbd5e1', color: '#1e40af' }}>{grandTotals.pah > 0 ? grandTotals.pah.toFixed(2) : '\u00A0'}</td>
            <td style={{ padding: '3px 2px', textAlign: 'center', borderLeft: '1px solid #cbd5e1', color: '#1e40af' }}>{grandTotals.bidud > 0 ? grandTotals.bidud.toFixed(2) : '\u00A0'}</td>
            <td style={{ padding: '3px 2px', textAlign: 'center', borderLeft: '1px solid #cbd5e1', color: '#1e40af' }}>{grandTotals.adapter > 0 ? grandTotals.adapter : '\u00A0'}</td>
            <td style={{ padding: '3px 2px', textAlign: 'center', borderLeft: '1px solid #cbd5e1', backgroundColor: '#fefce8', color: '#854d0e' }}>{grandTotals.dofan > 0 ? grandTotals.dofan : '\u00A0'}</td>
            <td style={{ padding: '3px 2px', textAlign: 'center', borderLeft: '1px solid #cbd5e1', color: '#1e40af' }}>{grandTotals.shatuzar > 0 ? grandTotals.shatuzar : '\u00A0'}</td>
            <td style={{ padding: '3px 2px', textAlign: 'center', borderLeft: '1px solid #cbd5e1', color: '#1e40af' }}>{grandTotals.flexible > 0 ? grandTotals.flexible.toFixed(2) : '\u00A0'}</td>
            <td style={{ padding: '3px 2px', textAlign: 'center', borderLeft: '1px solid #cbd5e1', color: '#1e40af' }}>{grandTotals.sharshuri > 0 ? grandTotals.sharshuri.toFixed(2) : '\u00A0'}</td>
            <td style={{ padding: '3px 2px', textAlign: 'center', borderLeft: '1px solid #cbd5e1', color: '#1e40af' }}>{grandTotals.pah125 > 0 ? grandTotals.pah125.toFixed(2) : '\u00A0'}</td>
            <td style={{ padding: '3px 2px' }}>{'\u00A0'}</td>
          </tr>
        </tfoot>
      )}
    </table>
  );

  return (
    <div className="landscape-print summary-print-page print-document" style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '32px', width: '100%', maxWidth: '100%', margin: '0 auto', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
      <div className="print-orientation-spacer landscape-print" aria-hidden="true" />

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

      <div className="summary-project-info" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '25px', paddingBottom: '10px', borderBottom: '1px solid #cbd5e1', fontSize: '14px', textAlign: 'right' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div><b>פרויקט:</b> {isNewProject ? newProjectName : selectedProject} - {isNewClient ? clientDetails.name : selectedClientKey}</div>
          <div><b>ריכוז:</b> ריכוז מס' - {docNumber}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
          <div><b>תאריך:</b> {docDate}</div>
        </div>
      </div>

      {/* טבלאות ריכוז פרטניות לכל דף מדידה */}
      {sheets.map((sheet, sIdx) => {
        const shTotals = getSheetTotals(sheet);

        return (
          <div key={sheet.id} className="summary-sheet-block" style={{ marginBottom: '50px', paddingBottom: '30px', borderBottom: sIdx < sheets.length - 1 ? '2px dashed #cbd5e1' : 'none', pageBreakAfter: sIdx < sheets.length - 1 ? 'always' : 'auto' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e3a8a', margin: 0, fontFamily: 'Rubik, sans-serif' }}>
                דף ריכוז - {sheet.name}
              </h2>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>
                טבלה {sIdx + 1} מתוך {sheets.length}
              </span>
            </div>

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

      {/* ═══ ריכוז כללי — כל החלקים הייחודיים מכל דפי המדידה ═══ */}
      <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '3px double #1e3a8a', pageBreakBefore: 'always' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e3a8a', margin: '0 0 10px 0', fontFamily: 'Rubik, sans-serif' }}>
          ריכוז כללי — כל הפרויקט ({sheets.length} דפי מדידה, {aggregatedParts.length} סוגי חלקים ייחודיים)
        </h2>
        <div className="print-table-wrapper" style={{ width: '100%', backgroundColor: '#ffffff', marginBottom: '15px' }}>
          {renderGlobalTable(aggregatedParts, true)}
        </div>
      </div>

      <div className="summary-footer" style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', color: '#64748b', paddingTop: '10px', borderTop: '1px solid #cbd5e1' }}>
        <span>הופק באמצעות מערכת עלי שרארה בע"מ - ממוחשב</span>
        <span>חתימת העסק ומבצע הריכוז</span>
      </div>

    </div>
  );
}
