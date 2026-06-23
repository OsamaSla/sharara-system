import React from 'react';
import type { RowData } from './types';
import { getProductionDimensions } from './ProductionPartSketch';

interface ProductionOverridesPanelProps {
  row: RowData;
  updateRow: (id: string, field: keyof RowData, value: any) => void;
  calculateThickness: (w: number, h: number, manual?: number) => number;
}

export default function ProductionOverridesPanel({
  row,
  updateRow,
  calculateThickness: calcThickness,
}: ProductionOverridesPanelProps) {
  const autoThickness = calcThickness(row.width1, row.height1, row.manualThickness);

  const calcAutoDims = (r: RowData, th: number) => {
    const cleanRow = { ...r, productionOverrides: {}, productionMode: 'automatic' as const };
    const dims = getProductionDimensions(cleanRow, th);
    const result: Record<string, number> = {};
    for (const d of dims) {
      const val = parseFloat(d.reference || '0');
      if (!isNaN(val)) {
        if (d.label.includes('רוחב') && !d.label.includes('חתך') && !d.label.includes('ר×ג') && !d.label.includes('R')) result.width1 = val;
        else if (d.label.includes('גובה') && !d.label.includes('חתך') && !d.label.includes('ר×ג')) result.height1 = val;
        else if (d.label.includes('חתך 2')) { result.width2 = val; }
        else if (d.label.includes('חתך 1')) { result.width1 = val; }
        else if (d.label.includes('אורך')) result.length = val;
        else if (d.label.includes('R קטן')) result.rSmall = val;
        else if (d.label.includes('R גדול')) result.rBig = val;
        else if (d.label.includes('עובי')) result.thickness = val;
        else if (d.label.includes('קוטר')) { result.width1 = val; }
        else if (d.label.includes('סטייה')) result.rSmall = val;
      }
      if (d.label.includes('ר×ג') && d.reference) {
        const parts = d.reference.split('×');
        if (parts.length === 2) {
          if (d.label.includes('חתך 1')) {
            result.width1 = parseFloat(parts[0]) || 0;
            result.height1 = parseFloat(parts[1]) || 0;
          } else {
            result.width2 = parseFloat(parts[0]) || 0;
            result.height2 = parseFloat(parts[1]) || 0;
          }
        }
      }
    }
    return result;
  };

  const autoDims = calcAutoDims(row, autoThickness);
  const isManual = row.productionMode === 'manual';
  const overrides = row.productionOverrides || {};

  const effectiveWidth1 = isManual ? (overrides.width1 ?? autoDims.width1 ?? 0) : (autoDims.width1 ?? 0);
  const effectiveHeight1 = isManual ? (overrides.height1 ?? autoDims.height1 ?? 0) : (autoDims.height1 ?? 0);
  const effectiveWidth2 = isManual ? (overrides.width2 ?? autoDims.width2 ?? 0) : (autoDims.width2 ?? 0);
  const effectiveHeight2 = isManual ? (overrides.height2 ?? autoDims.height2 ?? 0) : (autoDims.height2 ?? 0);
  const effectiveLength = isManual ? (overrides.length ?? autoDims.length ?? 0) : (autoDims.length ?? 0);
  const effectiveRSmall = isManual ? (overrides.rSmall ?? autoDims.rSmall ?? 0) : (autoDims.rSmall ?? 0);
  const effectiveRBig = isManual ? (overrides.rBig ?? autoDims.rBig ?? 0) : (autoDims.rBig ?? 0);
  const effectiveThickness = isManual ? (overrides.thickness ?? autoDims.thickness ?? autoThickness) : autoThickness;

  const handleToggle = () => {
    if (isManual) {
      updateRow(row.id, 'productionMode', 'automatic');
      updateRow(row.id, 'productionOverrides', {});
    } else {
      updateRow(row.id, 'productionMode', 'manual');
      updateRow(row.id, 'productionOverrides', { ...autoDims });
    }
  };

  const updateOverride = (field: string, value: number) => {
    updateRow(row.id, 'productionOverrides', { ...overrides, [field]: value });
  };

  const inputStyle = (overrideVal: number | undefined, autoVal: number): React.CSSProperties => ({
    width: '65px',
    padding: '4px 6px',
    textAlign: 'center',
    border: isManual ? '2px solid #2563eb' : '1px solid #e2e8f0',
    borderRadius: '4px',
    backgroundColor: isManual ? '#eff6ff' : '#f8fafc',
    color: isManual ? '#1e40af' : '#64748b',
    fontWeight: isManual ? 700 : 400,
    fontSize: '12px',
    cursor: isManual ? 'text' : 'default',
  });

  const readonlyStyle: React.CSSProperties = {
    width: '65px',
    padding: '4px 6px',
    textAlign: 'center',
    border: '1px solid #e2e8f0',
    borderRadius: '4px',
    backgroundColor: '#f8fafc',
    color: '#64748b',
    fontSize: '12px',
  };

  const showWidth2Height2 = row.type === 'מעבר';
  const showRadii = row.type === 'קשת';
  const showRound = row.notes === 'צינור עגול';
  const showSLamed = row.notes === 'לאמד S';
  const showPlenum = row.notes === 'קופסת פיזור';

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '4px 8px',
      borderRadius: '6px',
      backgroundColor: isManual ? '#eff6ff' : '#f8fafc',
      border: isManual ? '1px solid #93c5fd' : '1px solid #e2e8f0',
      fontSize: '11px',
      direction: 'rtl',
    }}>
      <button
        onClick={handleToggle}
        title={isManual ? 'חישוב אוטומטי' : 'עריכה ידנית'}
        style={{
          padding: '3px 8px',
          borderRadius: '4px',
          border: 'none',
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: '10px',
          backgroundColor: isManual ? '#2563eb' : '#94a3b8',
          color: '#ffffff',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        {isManual ? '✏️ ידני' : '🔄 אוטו'}
      </button>

      <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'nowrap' }}>
        {(showRound || showSLamed || showPlenum || true) && (
          <>
            <span style={{ fontSize: '10px', color: '#94a3b8' }}>ר:</span>
            {isManual ? (
              <input type="number" value={effectiveWidth1 || ''} onChange={(e) => updateOverride('width1', Number(e.target.value))} style={inputStyle(overrides.width1, autoDims.width1 || 0)} />
            ) : (
              <span style={readonlyStyle}>{effectiveWidth1 || '—'}</span>
            )}
          </>
        )}

        {(!showRound && !showSLamed && !showPlenum) && (
          <>
            <span style={{ fontSize: '10px', color: '#94a3b8' }}>ג:</span>
            {isManual ? (
              <input type="number" value={effectiveHeight1 || ''} onChange={(e) => updateOverride('height1', Number(e.target.value))} style={inputStyle(overrides.height1, autoDims.height1 || 0)} />
            ) : (
              <span style={readonlyStyle}>{effectiveHeight1 || '—'}</span>
            )}
          </>
        )}

        {showWidth2Height2 && (
          <>
            <span style={{ fontSize: '10px', color: '#94a3b8' }}>ר2:</span>
            {isManual ? (
              <input type="number" value={effectiveWidth2 || ''} onChange={(e) => updateOverride('width2', Number(e.target.value))} style={inputStyle(overrides.width2, autoDims.width2 || 0)} />
            ) : (
              <span style={readonlyStyle}>{effectiveWidth2 || '—'}</span>
            )}
            <span style={{ fontSize: '10px', color: '#94a3b8' }}>ג2:</span>
            {isManual ? (
              <input type="number" value={effectiveHeight2 || ''} onChange={(e) => updateOverride('height2', Number(e.target.value))} style={inputStyle(overrides.height2, autoDims.height2 || 0)} />
            ) : (
              <span style={readonlyStyle}>{effectiveHeight2 || '—'}</span>
            )}
          </>
        )}

        {!['קשת'].includes(row.type) && (
          <>
            <span style={{ fontSize: '10px', color: '#94a3b8' }}>א:</span>
            {isManual ? (
              <input type="number" value={effectiveLength || ''} onChange={(e) => updateOverride('length', Number(e.target.value))} style={inputStyle(overrides.length, autoDims.length || 0)} />
            ) : (
              <span style={readonlyStyle}>{effectiveLength || '—'}</span>
            )}
          </>
        )}

        {showRadii && (
          <>
            <span style={{ fontSize: '10px', color: '#94a3b8' }}>Rק:</span>
            {isManual ? (
              <input type="number" value={effectiveRSmall || ''} onChange={(e) => updateOverride('rSmall', Number(e.target.value))} style={inputStyle(overrides.rSmall, autoDims.rSmall || 0)} />
            ) : (
              <span style={readonlyStyle}>{effectiveRSmall || '—'}</span>
            )}
            <span style={{ fontSize: '10px', color: '#94a3b8' }}>Rג:</span>
            {isManual ? (
              <input type="number" value={effectiveRBig || ''} onChange={(e) => updateOverride('rBig', Number(e.target.value))} style={inputStyle(overrides.rBig, autoDims.rBig || 0)} />
            ) : (
              <span style={readonlyStyle}>{effectiveRBig || '—'}</span>
            )}
          </>
        )}

        {showSLamed && (
          <>
            <span style={{ fontSize: '10px', color: '#94a3b8' }}>סטייה:</span>
            {isManual ? (
              <input type="number" value={effectiveRSmall || ''} onChange={(e) => updateOverride('rSmall', Number(e.target.value))} style={inputStyle(overrides.rSmall, autoDims.rSmall || 0)} />
            ) : (
              <span style={readonlyStyle}>{effectiveRSmall || '—'}</span>
            )}
          </>
        )}

        <span style={{ fontSize: '10px', color: '#94a3b8' }}>עב:</span>
        {isManual ? (
          <input type="number" step="0.05" value={effectiveThickness || ''} onChange={(e) => updateOverride('thickness', Number(e.target.value))} style={{ ...inputStyle(overrides.thickness, autoThickness), width: '50px' }} />
        ) : (
          <span style={{ ...readonlyStyle, width: '50px' }}>{effectiveThickness || '—'}</span>
        )}
      </div>
    </div>
  );
}
