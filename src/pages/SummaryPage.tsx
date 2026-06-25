import React from 'react';
import CompanyLetterhead from '../CompanyLetterhead';
import type { CompanyDetails } from '../CompanyLetterhead';
import { getSheetTotals } from '../calculations';
import type { Sheet, RowData } from '../types';
import { formatDate } from '../utils';

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
  companySignature?: string;
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

const W = { num: '30px', pn: '46px', pah: '52px', bidud: '52px', adapter: '42px', dofan: '42px', shatuzar: '42px', flexible: '52px', sharshuri: '52px', pah125: '52px' };

const TH: React.CSSProperties = { padding: '4px 3px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', fontSize: '11px', fontWeight: 700 };
const TD: React.CSSProperties = { padding: '2px 2px', textAlign: 'center', borderLeft: '1px solid #cbd5e1', fontSize: '11px' };
const TDR: React.CSSProperties = { padding: '2px 2px', textAlign: 'right', borderLeft: '1px solid #cbd5e1', fontSize: '11px' };
const TDE: React.CSSProperties = { padding: '2px 2px', textAlign: 'right', fontSize: '11px' };

const fmt = (v: string | number | undefined | null) => {
  if (v === undefined || v === null || v === '') return '\u00A0';
  return v;
};

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
  companySignature,
}: SummaryPageProps) {

  const [overrides, setOverrides] = React.useState<Record<string, number>>({});

  const handleOverride = (key: string, field: string, rawValue: string) => {
    const num = rawValue === '' ? undefined : Number(rawValue);
    setOverrides(prev => {
      const next = { ...prev };
      if (num === undefined || isNaN(num)) {
        delete next[key];
      } else {
        const row = next[key] !== undefined ? { ...(next[key] as any) } : {};
        row[field] = num;
        next[key] = row;
      }
      return next;
    });
  };

  const getOverrideVal = (key: string, field: string, fallback: number): number => {
    const entry = overrides[key] as any;
    if (entry && entry[field] !== undefined) return entry[field];
    return fallback;
  };

  const aggregatedMap: Record<string, AggregatedPart> = {};

  sheets.forEach(sheet => {
    sheet.rows.forEach(row => {
      const thick = calculateThickness(row.width1, row.height1, row.manualThickness);
      const area = calculateArea(row);

      let displayType = row.notes && ['לאמד S', 'צינור עגול', 'קופסת פיזור', 'מדף אש'].includes(row.notes) ? row.notes : row.type;
      let formatDetail = `${displayType} ${row.notes === 'צינור עגול' ? `קוטר ${row.width1}` : `${row.width1}x${row.height1}`}`;
      if (row.type === 'מעבר') formatDetail += ` / ${row.width2}x${row.height2}`;
      if (row.length > 0) formatDetail += ` L=${row.length}`;
      if (row.panels > 0) formatDetail += ` [דופן×${row.panels}]`;

      const key = `${row.partNumber || ''}_${row.type}_${row.width1}_${row.height1}_${row.width2}_${row.height2}_${row.length}_${row.rBig}_${row.rSmall}_${row.panels}_${thick}`;

      if (!aggregatedMap[key]) {
        aggregatedMap[key] = {
          partNumber: row.partNumber || '', displayType, formatDetail, thick,
          totalQty: 0, totalPah: 0, totalBidud: 0, totalAdapter: 0, totalDofan: 0,
          totalShatuzar: 0, totalFlexible: 0, totalSharshuri: 0, totalPah125: 0,
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

  const computedGrand = aggregatedParts.reduce(
    (acc, p) => {
      acc.pah += p.totalPah; acc.pah125 += p.totalPah125; acc.bidud += p.totalBidud;
      acc.adapter += p.totalAdapter; acc.dofan += p.totalDofan; acc.shatuzar += p.totalShatuzar;
      acc.flexible += p.totalFlexible; acc.sharshuri += p.totalSharshuri;
      acc.qty += p.totalQty; return acc;
    },
    { pah: 0, pah125: 0, bidud: 0, adapter: 0, dofan: 0, shatuzar: 0, flexible: 0, sharshuri: 0, qty: 0 }
  );

  const gPah = aggregatedParts.reduce((s, p) => s + getOverrideVal(`${p.partNumber}_${p.formatDetail}_${p.thick}`, 'pah', p.totalPah), 0);
  const gPah125 = aggregatedParts.reduce((s, p) => s + getOverrideVal(`${p.partNumber}_${p.formatDetail}_${p.thick}`, 'pah125', p.totalPah125), 0);
  const gBidud = aggregatedParts.reduce((s, p) => s + getOverrideVal(`${p.partNumber}_${p.formatDetail}_${p.thick}`, 'bidud', p.totalBidud), 0);
  const gAdapter = aggregatedParts.reduce((s, p) => s + getOverrideVal(`${p.partNumber}_${p.formatDetail}_${p.thick}`, 'adapter', p.totalAdapter), 0);
  const gDofan = aggregatedParts.reduce((s, p) => s + getOverrideVal(`${p.partNumber}_${p.formatDetail}_${p.thick}`, 'dofan', p.totalDofan), 0);
  const gShatuzar = aggregatedParts.reduce((s, p) => s + getOverrideVal(`${p.partNumber}_${p.formatDetail}_${p.thick}`, 'shatuzar', p.totalShatuzar), 0);
  const gFlexible = aggregatedParts.reduce((s, p) => s + getOverrideVal(`${p.partNumber}_${p.formatDetail}_${p.thick}`, 'flexible', p.totalFlexible), 0);
  const gSharshuri = aggregatedParts.reduce((s, p) => s + getOverrideVal(`${p.partNumber}_${p.formatDetail}_${p.thick}`, 'sharshuri', p.totalSharshuri), 0);

  const EditCell = ({ aggKey, field, computed }: { aggKey: string; field: string; computed: number }) => {
    const entry = overrides[aggKey] as any;
    const overridden = entry && entry[field] !== undefined;
    const displayVal = overridden ? entry[field] : (computed > 0 ? Number(computed.toFixed(2)) : '');
    const bgColor = overridden ? '#fef08a' : 'transparent';
    return (
      <td style={TD}>
        <input
          type="number"
          step="any"
          value={displayVal}
          onChange={(e) => handleOverride(aggKey, field, e.target.value)}
          className="summary-edit-input"
          style={{
            width: '100%',
            boxSizing: 'border-box',
            border: 'none',
            borderBottom: overridden ? '1px solid #ca8a04' : 'none',
            borderRadius: '2px',
            textAlign: 'center',
            fontSize: '11px',
            fontWeight: 600,
            padding: '2px 1px',
            backgroundColor: bgColor,
            color: overridden ? '#854d0e' : '#1e293b',
            outline: 'none',
            font: 'inherit',
          }}
        />
      </td>
    );
  };

  const renderSheetTable = (sheet: Sheet) => {
    const s = getSheetTotals(sheet);
    const sharshuriTotal = s.sharshuri4 + s.sharshuri6 + s.sharshuri8 + s.sharshuri10 + s.sharshuri12 + s.sharshuri14;
    const pahTotal = s.t08 + s.t10;
    const bidudTotal = s.acoustic + s.external;

    return (
      <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', textAlign: 'right', fontSize: '11px', border: '1.5px solid #cbd5e1' }}>
        <thead style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #475569' }}>
          <tr style={{ color: '#0f172a', fontWeight: 'bold', fontSize: '10px' }}>
            <th style={{ ...TH, width: W.num }}>#</th>
            <th style={{ ...TH, width: W.pn }}>מס' חלק</th>
            <th style={{ ...TH, textAlign: 'right' }}>פירוט</th>
            <th style={{ ...TH, width: W.pah }}>פח מ"ר</th>
            <th style={{ ...TH, width: W.bidud }}>בידוד</th>
            <th style={{ ...TH, width: W.adapter }}>מתאם</th>
            <th style={{ ...TH, width: W.dofan }}>דופן</th>
            <th style={{ ...TH, width: W.shatuzar }}>שתוצר</th>
            <th style={{ ...TH, width: W.flexible }}>גמיש</th>
            <th style={{ ...TH, width: W.sharshuri }}>שרשורי</th>
            <th style={{ ...TH, width: W.pah125 }}>פח 1.25</th>
            <th style={{ ...TDE, fontWeight: 'bold' }}>הערות</th>
          </tr>
        </thead>
        <tbody>
          {sheet.rows.map((row, rIdx) => {
            const thick = calculateThickness(row.width1, row.height1, row.manualThickness);
            const area = calculateArea(row);

            let displayType = row.notes && ['לאמד S', 'צינור עגול', 'קופסת פיזור', 'מדף אש'].includes(row.notes) ? row.notes : row.type;
            let fd = `${displayType} ${row.notes === 'צינור עגול' ? `קוטר ${row.width1}` : `${row.width1}x${row.height1}`}`;
            if (row.type === 'מעבר') fd += ` / ${row.width2}x${row.height2}`;
            if (row.length > 0) fd += ` L=${row.length}`;
            if (row.panels > 0) fd += ` [דופן×${row.panels}]`;

            return (
              <tr key={row.id} style={{ borderBottom: '1px solid #cbd5e1', backgroundColor: rIdx % 2 === 0 ? '#ffffff' : '#f8fafc', fontSize: '10px' }}>
                <td style={{ ...TD, fontWeight: 'bold', color: '#64748b' }}>{rIdx + 1}</td>
                <td style={{ ...TD, fontWeight: 600, color: '#1e293b' }}>{fmt(row.partNumber)}</td>
                <td style={{ ...TDR, fontWeight: 600, color: '#1e293b' }}>{fmt(fd)}</td>
                <td style={TD}>{fmt(thick !== 1.25 && area > 0 ? area.toFixed(2) : '')}</td>
                <td style={TD}>{fmt((row.acoustic || row.external) && area > 0 ? area.toFixed(2) : '')}</td>
                <td style={TD}>{fmt(row.adapterType !== 'ללא' && row.adapterQty > 0 ? row.adapterQty : '')}</td>
                <td style={{ ...TD, fontWeight: 600 }}>{fmt(row.panels > 0 ? row.panels : '')}</td>
                <td style={TD}>{fmt(row.shatuzar ? '1' : '')}</td>
                <td style={TD}>{fmt(row.flexible > 0 && row.length > 0 ? (row.flexible * row.length).toFixed(2) : '')}</td>
                <td style={TD}>{fmt(row.sharshuriType !== 'ללא' && row.length > 0 ? row.length.toFixed(2) : '')}</td>
                <td style={TD}>{fmt(thick === 1.25 && area > 0 ? area.toFixed(2) : '')}</td>
                <td style={{ ...TDE, color: '#64748b', fontSize: '10px' }}>{fmt(row.notes)}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr style={{ fontWeight: 'bold', borderTop: '2px solid #475569', fontSize: '10px', backgroundColor: '#ffffff', color: '#000000', printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' as any }}>
            <td style={{ ...TD, backgroundColor: '#ffffff' }} colSpan={3}>סה"כ דף:</td>
            <td style={{ ...TD, backgroundColor: '#ffffff' }}>{fmt(pahTotal > 0 ? pahTotal.toFixed(2) : '')}</td>
            <td style={{ ...TD, backgroundColor: '#ffffff' }}>{fmt(bidudTotal > 0 ? bidudTotal.toFixed(2) : '')}</td>
            <td style={{ ...TD, backgroundColor: '#ffffff' }}>{fmt(s.adapterQty > 0 ? s.adapterQty : '')}</td>
            <td style={{ ...TD, backgroundColor: '#ffffff' }}>{'\u00A0'}</td>
            <td style={{ ...TD, backgroundColor: '#ffffff' }}>{fmt(s.shatuzar > 0 ? s.shatuzar : '')}</td>
            <td style={{ ...TD, backgroundColor: '#ffffff' }}>{fmt(s.flexible > 0 ? s.flexible.toFixed(2) : '')}</td>
            <td style={{ ...TD, backgroundColor: '#ffffff' }}>{fmt(sharshuriTotal > 0 ? sharshuriTotal.toFixed(2) : '')}</td>
            <td style={{ ...TD, backgroundColor: '#ffffff' }}>{fmt(s.t125 > 0 ? s.t125.toFixed(2) : '')}</td>
            <td style={{ ...TDE, backgroundColor: '#ffffff' }}>{'\u00A0'}</td>
          </tr>
        </tfoot>
      </table>
    );
  };

  const renderGlobalTable = (parts: AggregatedPart[], showGrand: boolean) => (
    <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', textAlign: 'right', fontSize: '11px', border: '1.5px solid #cbd5e1' }}>
      <thead style={{ backgroundColor: '#e0e7ff', borderBottom: '2px solid #475569' }}>
        <tr style={{ color: '#0f172a', fontWeight: 'bold', fontSize: '10px' }}>
          <th style={{ ...TH, width: W.num }}>#</th>
          <th style={{ ...TH, width: W.pn }}>מס' חלק</th>
          <th style={{ ...TH, textAlign: 'right' }}>פירוט</th>
          <th style={{ ...TH, width: W.pah }}>פח מ"ר</th>
          <th style={{ ...TH, width: W.bidud }}>בידוד</th>
          <th style={{ ...TH, width: W.adapter }}>מתאם</th>
          <th style={{ ...TH, width: W.dofan }}>דופן</th>
          <th style={{ ...TH, width: W.shatuzar }}>שתוצר</th>
          <th style={{ ...TH, width: W.flexible }}>גמיש</th>
          <th style={{ ...TH, width: W.sharshuri }}>שרשורי</th>
          <th style={{ ...TH, width: W.pah125 }}>פח 1.25</th>
          <th style={TDE}>הערות</th>
        </tr>
      </thead>
      <tbody>
        {parts.map((p, i) => {
          const aggKey = `${p.partNumber}_${p.formatDetail}_${p.thick}`;
          return (
            <tr key={i} style={{ borderBottom: '1px solid #cbd5e1', backgroundColor: i % 2 === 0 ? '#ffffff' : '#f8fafc', fontSize: '10px' }}>
              <td style={{ ...TD, fontWeight: 'bold', color: '#64748b' }}>{i + 1}</td>
              <td style={{ ...TD, fontWeight: 600, color: '#1e293b' }}>{fmt(p.partNumber)}</td>
              <td style={{ ...TDR, fontWeight: 600, color: '#1e293b' }}>{fmt(p.formatDetail)}</td>
              <EditCell aggKey={aggKey} field="pah" computed={p.totalPah} />
              <EditCell aggKey={aggKey} field="bidud" computed={p.totalBidud} />
              <EditCell aggKey={aggKey} field="adapter" computed={p.totalAdapter} />
              <EditCell aggKey={aggKey} field="dofan" computed={p.totalDofan} />
              <EditCell aggKey={aggKey} field="shatuzar" computed={p.totalShatuzar} />
              <EditCell aggKey={aggKey} field="flexible" computed={p.totalFlexible} />
              <EditCell aggKey={aggKey} field="sharshuri" computed={p.totalSharshuri} />
              <EditCell aggKey={aggKey} field="pah125" computed={p.totalPah125} />
              <td style={{ ...TDE, color: '#64748b', fontSize: '10px' }}>{fmt(p.notes)}</td>
            </tr>
          );
        })}
        {showGrand && (
          <tr className="grand-total-row" style={{ backgroundColor: '#dbeafe', fontWeight: 'bold', borderTop: '2px solid #475569', fontSize: '10px', printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' as any }}>
            <td style={{ ...TD, backgroundColor: '#dbeafe', color: '#1e40af' }} colSpan={3}>סה"כ כללי ({computedGrand.qty} חלקים):</td>
            <td style={{ ...TD, backgroundColor: '#dbeafe', color: '#1e40af' }}>{gPah > 0 ? gPah.toFixed(2) : '\u00A0'}</td>
            <td style={{ ...TD, backgroundColor: '#dbeafe', color: '#1e40af' }}>{gBidud > 0 ? gBidud.toFixed(2) : '\u00A0'}</td>
            <td style={{ ...TD, backgroundColor: '#dbeafe', color: '#1e40af' }}>{gAdapter > 0 ? gAdapter : '\u00A0'}</td>
            <td style={{ ...TD, backgroundColor: '#dbeafe', color: '#1e40af' }}>{gDofan > 0 ? gDofan : '\u00A0'}</td>
            <td style={{ ...TD, backgroundColor: '#dbeafe', color: '#1e40af' }}>{gShatuzar > 0 ? gShatuzar : '\u00A0'}</td>
            <td style={{ ...TD, backgroundColor: '#dbeafe', color: '#1e40af' }}>{gFlexible > 0 ? gFlexible.toFixed(2) : '\u00A0'}</td>
            <td style={{ ...TD, backgroundColor: '#dbeafe', color: '#1e40af' }}>{gSharshuri > 0 ? gSharshuri.toFixed(2) : '\u00A0'}</td>
            <td style={{ ...TD, backgroundColor: '#dbeafe', color: '#1e40af' }}>{gPah125 > 0 ? gPah125.toFixed(2) : '\u00A0'}</td>
            <td style={{ ...TDE, backgroundColor: '#dbeafe' }}>{'\u00A0'}</td>
          </tr>
        )}
      </tbody>
    </table>
  );

  return (
    <div className="landscape-print summary-print-page print-document" style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '32px', width: '100%', maxWidth: '100%', margin: '0 auto', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
      <div className="print-orientation-spacer landscape-print" aria-hidden="true" />

      <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '8px', gap: '6px' }}>
        <button onClick={handlePrint} style={{ padding: '5px 12px', backgroundColor: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}>
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
          <div><b>תאריך:</b> {formatDate(docDate)}</div>
        </div>
      </div>

      {sheets.map((sheet, sIdx) => (
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
            {renderSheetTable(sheet)}
          </div>
        </div>
      ))}

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
        <span>
          {companySignature ? (
            <img src={companySignature} alt="חתימה" style={{ maxHeight: '50px', maxWidth: '180px', objectFit: 'contain' }} />
          ) : (
            'חתימת העסק ומבצע הריכוז'
          )}
        </span>
      </div>
    </div>
  );
}
