import React from 'react';
import { Trash2 } from 'lucide-react';
import ProductionPartSketch from '../ProductionPartSketch';
import type { RowData, Sheet } from '../types';

function SketchThumb({ type, notes, w = 30, h = 22 }: { type: string; notes?: string; w?: number; h?: number }) {
  const row = { type, notes: notes || '', width1: 0, height1: 0, length: 0, rSmall: 0, rBig: 0, width2: 0, height2: 0, panels: 0, dofan: 0, partNumber: '', acoustic: false, external: false, manualThickness: 0, id: '', flexible: 0, adapterType: 'ללא', adapterQty: 0, shatuzar: false, sharshuriType: 'ללא', rBig2: 0 } as RowData;
  return <ProductionPartSketch row={row} width={w} height={h} />;
}

export interface MeasurementPageProps {
  // Sheet data
  sheets: Sheet[];
  setSheets: React.Dispatch<React.SetStateAction<Sheet[]>>;
  activeSheet: Sheet;
  activeSheetId: string;
  setActiveSheetId: (id: string) => void;

  // Document info
  docDate: string;
  docNumber: string;
  selectedProject: string;

  // Editing state
  editingSheetId: string | null;
  setEditingSheetId: (id: string | null) => void;
  editingSheetName: string;
  setEditingSheetName: (name: string) => void;

  // Add part form state
  isAddingPart: boolean;
  setIsAddingPart: (val: boolean) => void;
  newPartData: RowData;
  setNewPartData: React.Dispatch<React.SetStateAction<RowData>>;
  quickQty: number;
  setQuickQty: (val: number) => void;

  // Row management
  updateRow: (id: string, field: keyof RowData, value: any) => void;
  deleteRow: (id: string) => void;
  duplicateRow: (id: string) => void;
  bulkDelete: () => void;
  bulkCopyToSheet: (targetSheetId: string) => void;

  // Selection state
  selectedRowIds: Set<string>;
  setSelectedRowIds: (val: Set<string>) => void;
  toggleRowSelection: (id: string) => void;
  toggleSelectAll: (rows: RowData[]) => void;
  lastHoveredRowId: string | null;
  setLastHoveredRowId: (id: string | null) => void;

  // Sheet management
  addSheet: () => void;
  deleteSheet: (sheetId: string) => void;

  // Presets
  partPresets: { name: string; data: Omit<RowData, 'id'> }[];
  savePreset: () => void;
  loadPreset: (preset: { name: string; data: Omit<RowData, 'id'> }) => void;
  deletePreset: (idx: number) => void;

  // Form actions
  openAddPartForm: (type: RowData['type'], defaultNotes?: string) => void;
  saveFormPart: () => void;

  // Undo/Redo
  undoStack: Sheet[][];
  redoStack: Sheet[][];
  handleUndo: () => void;
  handleRedo: () => void;
  pushToHistory: (currentSheets: Sheet[]) => void;

  // Export
  handlePrint: () => void;

  // Calculations
  calculateThickness: (w: number, h: number, manual: number) => number;
  calculateArea: (row: RowData) => number;
  getPrice: (name: string) => number;
  getRowWarnings: (row: RowData) => string[];
}

export default function MeasurementPage({
  sheets,
  setSheets,
  activeSheet,
  activeSheetId,
  setActiveSheetId,
  editingSheetId,
  setEditingSheetId,
  editingSheetName,
  setEditingSheetName,
  isAddingPart,
  setIsAddingPart,
  newPartData,
  setNewPartData,
  quickQty,
  setQuickQty,
  updateRow,
  deleteRow,
  duplicateRow,
  bulkDelete,
  bulkCopyToSheet,
  selectedRowIds,
  setSelectedRowIds,
  toggleRowSelection,
  toggleSelectAll,
  lastHoveredRowId,
  setLastHoveredRowId,
  addSheet,
  deleteSheet,
  partPresets,
  savePreset,
  loadPreset,
  deletePreset,
  openAddPartForm,
  saveFormPart,
  undoStack,
  redoStack,
  handleUndo,
  handleRedo,
  pushToHistory,
  handlePrint,
  calculateThickness,
  calculateArea,
  getPrice,
  getRowWarnings,
}: MeasurementPageProps) {
  return (
    <div className="print-document" style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', width: '100%' }}>

      <div style={{ backgroundColor: '#1e293b', color: '#ffffff', padding: '12px 16px', borderTopLeftRadius: '7px', borderTopRightRadius: '7px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'nowrap' }}>

        {/* קבוצה שמאלית: ניהול דפים */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={addSheet} style={{ backgroundColor: '#475569', color: '#ffffff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>+ דף חדש</button>
            {sheets.length > 1 && (
              <button
                onClick={() => deleteSheet(activeSheetId)}
                style={{ backgroundColor: '#ef4444', color: '#ffffff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '3px' }}
                title="מחק דף נוכחי"
              >
                <Trash2 size={12} /> מחק
              </button>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'nowrap' }}>
            {sheets.length <= 1 ? (
              sheets.map(s => (
                editingSheetId === s.id ? (
                  <input
                    key={s.id}
                    autoFocus
                    value={editingSheetName}
                    onChange={(e) => setEditingSheetName(e.target.value)}
                    onBlur={() => {
                      if (editingSheetName.trim() !== '') {
                        pushToHistory(sheets);
                        setSheets(sheets.map(sh => sh.id === s.id ? { ...sh, name: editingSheetName.trim() } : sh));
                      }
                      setEditingSheetId(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                      else if (e.key === 'Escape') setEditingSheetId(null);
                    }}
                    style={{ padding: '3px 6px', borderRadius: '4px', backgroundColor: '#ffffff', color: '#0f172a', border: '2px solid #60a5fa', fontWeight: 'bold', fontSize: '11px', width: '80px', outline: 'none' }}
                  />
                ) : (
                  <div
                    key={s.id}
                    onClick={() => setActiveSheetId(s.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: '2px', padding: '4px 6px', borderRadius: '4px', backgroundColor: s.id === activeSheetId ? '#3b82f6' : '#475569', color: '#ffffff', border: s.id === activeSheetId ? '2px solid #60a5fa' : '1px solid #64748b', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    <span>{s.name}</span>
                    <span style={{ fontSize: '9px', opacity: 0.7, backgroundColor: 'rgba(255,255,255,0.15)', padding: '0 4px', borderRadius: '8px' }}>{s.rows.length}</span>
                    <span onClick={(e) => { e.stopPropagation(); setEditingSheetId(s.id); setEditingSheetName(s.name); }} title="עריכת שם" style={{ cursor: 'pointer', fontSize: '10px', opacity: 0.7, marginLeft: '2px', padding: '0 2px' }}>&#9998;</span>
                  </div>
                )
              ))
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <select
                  value={activeSheetId}
                  onChange={(e) => setActiveSheetId(e.target.value)}
                  style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: '#334155', color: '#ffffff', border: '1px solid #475569', fontWeight: 'bold', fontSize: '11px' }}
                >
                  {sheets.map(s => <option key={s.id} value={s.id}>{s.name} ({s.rows.length})</option>)}
                </select>
                <span
                  onClick={() => { setEditingSheetId(activeSheetId); setEditingSheetName(sheets.find(s => s.id === activeSheetId)?.name || ''); }}
                  title="עריכת שם הדף הפעיל"
                  style={{ cursor: 'pointer', fontSize: '12px', color: '#94a3b8', padding: '2px' }}
                >
                  &#9998;
                </span>
              </div>
            )}
          </div>
        </div>

        {/* קבוצה מרכזית: צורות החלקים */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center', flexGrow: 1 }}>
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#94a3b8' }}>הוסף חלק:</span>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, auto)', gap: '6px', border: '2px solid #3b82f6', borderRadius: '8px', padding: '6px' }}>
              <button onClick={() => openAddPartForm('קטע ישר')} style={{ backgroundColor: '#334155', border: '1px solid #475569', borderRadius: '4px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: '#ffffff', fontSize: '12px', fontWeight: 'bold' }}>
                <SketchThumb type="קטע ישר" />
                <span>קטע ישר</span>
              </button>
              <button onClick={() => openAddPartForm('קשת')} style={{ backgroundColor: '#334155', border: '1px solid #475569', borderRadius: '4px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: '#ffffff', fontSize: '12px', fontWeight: 'bold' }}>
                <SketchThumb type="קשת" />
                <span>קשת</span>
              </button>
              <button onClick={() => openAddPartForm('מעבר')} style={{ backgroundColor: '#334155', border: '1px solid #475569', borderRadius: '4px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: '#ffffff', fontSize: '12px', fontWeight: 'bold' }}>
                <SketchThumb type="מעבר" />
                <span>מעבר</span>
              </button>
              <button onClick={() => openAddPartForm('קטע ישר', 'לאמד S')} style={{ backgroundColor: '#334155', border: '1px solid #475569', borderRadius: '4px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: '#ffffff', fontSize: '12px', fontWeight: 'bold' }}>
                <SketchThumb type="קטע ישר" notes="לאמד S" />
                <span>לאמד S</span>
              </button>
              <button onClick={() => openAddPartForm('קטע ישר', 'צינור עגול')} style={{ backgroundColor: '#334155', border: '1px solid #475569', borderRadius: '4px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: '#ffffff', fontSize: '12px', fontWeight: 'bold' }}>
                <SketchThumb type="קטע ישר" notes="צינור עגול" />
                <span>צינור</span>
              </button>
              <button onClick={() => openAddPartForm('קטע ישר', 'קופסת פיזור')} style={{ backgroundColor: '#334155', border: '1px solid #475569', borderRadius: '4px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: '#ffffff', fontSize: '12px', fontWeight: 'bold' }}>
                <SketchThumb type="קטע ישר" notes="קופסת פיזור" />
                <span>קופסה</span>
              </button>
              <button onClick={() => openAddPartForm('קטע ישר', 'מדף אש')} style={{ backgroundColor: '#334155', border: '1px solid #475569', borderRadius: '4px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: '#ffffff', fontSize: '12px', fontWeight: 'bold', gridColumn: 'span 2', justifyContent: 'center' }}>
                <SketchThumb type="קטע ישר" notes="מדף אש" />
                <span>מדף אש</span>
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, auto)', gap: '6px', border: '2px solid #10b981', borderRadius: '8px', padding: '6px' }}>
              <button onClick={() => openAddPartForm('שתוצר')} style={{ backgroundColor: '#334155', border: '1px solid #475569', borderRadius: '4px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: '#ffffff', fontSize: '12px', fontWeight: 'bold' }}>
                <svg width="30" height="22" viewBox="0 0 60 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="5" y="8" width="50" height="28" rx="2" fill="#e5e7eb" stroke="#374151" strokeWidth="1.5"/>
                  <line x1="30" y1="8" x2="30" y2="36" stroke="#ef4444" strokeWidth="1.2"/>
                  <rect x="22" y="16" width="16" height="12" rx="1" fill="#fef2f2" stroke="#ef4444" strokeWidth="0.8"/>
                  <line x1="26" y1="22" x2="34" y2="22" stroke="#ef4444" strokeWidth="0.8"/>
                </svg>
                <span>שתוצר</span>
              </button>
              <button onClick={() => openAddPartForm('מתאם')} style={{ backgroundColor: '#334155', border: '1px solid #475569', borderRadius: '4px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: '#ffffff', fontSize: '12px', fontWeight: 'bold' }}>
                <svg width="30" height="22" viewBox="0 0 60 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="5" y="10" width="20" height="24" rx="2" fill="#e5e7eb" stroke="#374151" strokeWidth="1.5"/>
                  <ellipse cx="45" cy="22" rx="10" ry="12" fill="#e5e7eb" stroke="#374151" strokeWidth="1.5"/>
                  <line x1="25" y1="14" x2="35" y2="12" stroke="#374151" strokeWidth="1" strokeDasharray="2,1.5"/>
                  <line x1="25" y1="30" x2="35" y2="32" stroke="#374151" strokeWidth="1" strokeDasharray="2,1.5"/>
                </svg>
                <span>מתאם</span>
              </button>
              <button onClick={() => openAddPartForm('שרשורי')} style={{ backgroundColor: '#334155', border: '1px solid #475569', borderRadius: '4px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: '#ffffff', fontSize: '12px', fontWeight: 'bold' }}>
                <svg width="30" height="22" viewBox="0 0 60 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <line x1="30" y1="4" x2="30" y2="40" stroke="#374151" strokeWidth="2.5"/>
                  <line x1="27" y1="8" x2="33" y2="8" stroke="#9ca3af" strokeWidth="0.8"/>
                  <line x1="27" y1="12" x2="33" y2="12" stroke="#9ca3af" strokeWidth="0.8"/>
                  <line x1="27" y1="16" x2="33" y2="16" stroke="#9ca3af" strokeWidth="0.8"/>
                  <line x1="27" y1="20" x2="33" y2="20" stroke="#9ca3af" strokeWidth="0.8"/>
                  <line x1="27" y1="24" x2="33" y2="24" stroke="#9ca3af" strokeWidth="0.8"/>
                  <line x1="27" y1="28" x2="33" y2="28" stroke="#9ca3af" strokeWidth="0.8"/>
                  <line x1="27" y1="32" x2="33" y2="32" stroke="#9ca3af" strokeWidth="0.8"/>
                  <rect x="22" y="2" width="16" height="5" rx="1" fill="#d1d5db" stroke="#374151" strokeWidth="1"/>
                  <rect x="22" y="37" width="16" height="5" rx="1" fill="#d1d5db" stroke="#374151" strokeWidth="1"/>
                </svg>
                <span>שרשורי</span>
              </button>
              <button onClick={() => openAddPartForm('חיבור גמיש')} style={{ backgroundColor: '#334155', border: '1px solid #475569', borderRadius: '4px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: '#ffffff', fontSize: '12px', fontWeight: 'bold' }}>
                <svg width="30" height="22" viewBox="0 0 60 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="10" width="12" height="24" rx="1" fill="#e5e7eb" stroke="#374151" strokeWidth="1.2"/>
                  <rect x="46" y="10" width="12" height="24" rx="1" fill="#e5e7eb" stroke="#374151" strokeWidth="1.2"/>
                  <path d="M14,14 C20,14 20,34 26,34 C32,34 32,14 38,14 C42,14 44,14 46,14" fill="none" stroke="#374151" strokeWidth="1.2"/>
                  <path d="M14,18 C20,18 20,30 26,30 C32,30 32,18 38,18 C42,18 44,18 46,18" fill="none" stroke="#9ca3af" strokeWidth="0.6" strokeDasharray="2,1.5"/>
                  <path d="M14,22 C20,22 20,26 26,26 C32,26 32,22 38,22 C42,22 44,22 46,22" fill="none" stroke="#9ca3af" strokeWidth="0.6" strokeDasharray="2,1.5"/>
                </svg>
                <span>גמיש</span>
              </button>
            </div>
          </div>
        </div>

        {/* קבוצה ימנית: ביטול/שחזור + ייצוא */}
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexShrink: 0 }}>
          <button onClick={handleUndo} disabled={undoStack.length === 0} title="בטל (Ctrl+Z)" style={{ backgroundColor: undoStack.length === 0 ? '#0f172a' : '#475569', color: undoStack.length === 0 ? '#64748b' : '#ffffff', border: 'none', padding: '5px 8px', borderRadius: '4px', cursor: undoStack.length === 0 ? 'not-allowed' : 'pointer', fontSize: '11px', fontWeight: 'bold' }}>↩</button>
          <button onClick={handleRedo} disabled={redoStack.length === 0} title="שחזור (Ctrl+Y)" style={{ backgroundColor: redoStack.length === 0 ? '#0f172a' : '#475569', color: redoStack.length === 0 ? '#64748b' : '#ffffff', border: 'none', padding: '5px 8px', borderRadius: '4px', cursor: redoStack.length === 0 ? 'not-allowed' : 'pointer', fontSize: '11px', fontWeight: 'bold' }}>↪</button>
          <button onClick={handlePrint} style={{ backgroundColor: '#2563eb', color: '#ffffff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>הדפסה / PDF</button>
        </div>


      </div>

      {/* טופס הוספת חלק ויזואלי נוח ורחב */}
      {isAddingPart && (
        <div style={{ backgroundColor: '#f8fafc', padding: '24px', borderBottom: '2.5px solid #cbd5e1', borderTop: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', gap: '20px', position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #334155', paddingBottom: '10px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#1e3a8a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              ✨ טופס הזנת חלק חדש: <span style={{ color: '#10b981' }}>{newPartData.notes || newPartData.type}</span>
            </h3>
            <button onClick={() => setIsAddingPart(false)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b', fontWeight: 'bold' }}>✕</button>
          </div>



          <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>

            {/* שורת נתונים אופקית קומפקטית */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: '#ffffff', padding: '12px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #cbd5e1', paddingBottom: '6px', marginBottom: '4px' }}>
                <h4 style={{ margin: 0, color: '#0f172a', fontWeight: 'bold', fontSize: '14px', flexShrink: 0 }}>
                  {['שתוצר','מתאם','שרשורי','חיבור גמיש'].includes(newPartData.type) ? '🛠️ נתוני אביזר' : '📏 מידות החלק (מטר)'}
                </h4>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: '15px' }}>

                {/* מס' חלק - תמיד מופיע */}
                <div style={{ width: '90px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '2px' }}>מס' חלק:</label>
                  <input type="text" value={newPartData.partNumber} onChange={(e) => setNewPartData({...newPartData, partNumber: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#f8fafc', color: '#0f172a', textAlign: 'center' }} placeholder="P001" />
                </div>

                {/* -------------------- 4 החלקים המיוחדים -------------------- */}

                {newPartData.type === 'שתוצר' && (
                   <div style={{ width: '120px' }}>
                     <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '2px' }}>כמות שתוצרים:</label>
                      <input type="number" min="1" step="1" value={newPartData.panels || 1} onChange={(e) => setNewPartData({...newPartData, panels: Math.max(1, Math.round(Number(e.target.value)))})} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', textAlign: 'center', color: '#0f172a' }} />
                   </div>
                )}

                {newPartData.type === 'חיבור גמיש' && (
                   <div style={{ width: '120px' }}>
                     <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '2px' }}>מס' חלקים:</label>
                      <input type="number" min="1" step="1" value={newPartData.flexible || 1} onChange={(e) => setNewPartData({...newPartData, flexible: Math.max(1, Math.round(Number(e.target.value)))})} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', textAlign: 'center', color: '#0f172a' }} />
                   </div>
                )}

                {newPartData.type === 'שרשורי' && (
                   <>
                     <div style={{ width: '100px' }}>
                       <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '2px' }}>קוטר שרשורי:</label>
                       <select value={newPartData.sharshuriType} onChange={(e) => setNewPartData({...newPartData, sharshuriType: e.target.value as RowData['sharshuriType']})} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontWeight: '600' }}>
                         <option value="ללא">ללא</option>
                         <option value='"4'>"4</option>
                         <option value='"6'>"6</option>
                         <option value='"8'>"8</option>
                         <option value='"10'>"10</option>
                         <option value='"12'>"12</option>
                         <option value='"14'>"14</option>
                       </select>
                     </div>
                      <div style={{ width: '120px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '2px' }}>אורך (מטר):</label>
                        <input type="number" disabled={newPartData.sharshuriType === 'ללא'} value={newPartData.length || ''} onChange={(e) => setNewPartData({...newPartData, length: Number(e.target.value)})} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: newPartData.sharshuriType === 'ללא' ? '#e2e8f0' : '#ffffff', textAlign: 'center', color: '#0f172a' }} />
                      </div>
                   </>
                )}

                {newPartData.type === 'מתאם' && (
                   <>
                     <div style={{ width: '120px' }}>
                       <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '2px' }}>סוג מתאם:</label>
                       <select value={newPartData.adapterType} onChange={(e) => setNewPartData({...newPartData, adapterType: e.target.value as RowData['adapterType']})} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontWeight: '600' }}>
                         <option value="ללא">ללא</option>
                         <option value='"6 מתאם'>"6 מתאם'</option>
                         <option value='8/8 מתאם'>8/8 מתאם</option>
                         <option value='10/10 מתאם'>10/10 מתאם</option>
                         <option value='12/12 מתאם'>12/12 מתאם</option>
                         <option value='14/14 מתאם'>14/14 מתאם</option>
                         <option value='16/16 מתאם'>16/16 מתאם</option>
                         <option value='60/60 מתאם'>60/60 מתאם</option>
                       </select>
                     </div>
                     <div style={{ width: '100px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '2px' }}>כמות:</label>
                        <input type="number" min="1" step="1" disabled={newPartData.adapterType === 'ללא'} value={newPartData.adapterQty || ''} onChange={(e) => setNewPartData({...newPartData, adapterQty: Math.max(1, Math.round(Number(e.target.value)))})} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: newPartData.adapterType === 'ללא' ? '#e2e8f0' : '#ffffff', textAlign: 'center', color: '#0f172a' }} />
                     </div>
                   </>
                )}

                {newPartData.type === 'חיבור גמיש' && (
                   <div style={{ width: '120px' }}>
                     <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '2px' }}>אורך ליח' (מטר):</label>
                     <input type="number" min="0" step="1" value={newPartData.length || ''} onChange={(e) => { const v = Math.max(0, Math.round(Number(e.target.value))); setNewPartData({...newPartData, length: v}); }} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', textAlign: 'center', color: '#0f172a' }} />
                   </div>
                )}

                {/* -------------------- החלקים הרגילים -------------------- */}

                {newPartData.notes === 'צינור עגול' && !['שתוצר','מתאם','שרשורי','חיבור גמיש'].includes(newPartData.type) && (
                  <>
                    <div style={{ width: '100px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '2px' }}>קוטר (מטר):</label>
                      <input type="number" min="0" step="1" value={newPartData.width1 || ''} onChange={(e) => setNewPartData({...newPartData, width1: Math.max(0, Math.round(Number(e.target.value))), height1: Math.max(0, Math.round(Number(e.target.value)))})} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', textAlign: 'center', color: '#0f172a' }} />
                    </div>
                    <div style={{ width: '100px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '2px' }}>אורך (מטר):</label>
                      <input type="number" min="0" step="1" value={newPartData.length || ''} onChange={(e) => setNewPartData({...newPartData, length: Math.max(0, Math.round(Number(e.target.value)))})} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', textAlign: 'center', color: '#0f172a' }} />
                    </div>
                  </>
                )}

                {newPartData.notes === 'לאמד S' && !['שתוצר','מתאם','שרשורי','חיבור גמיש'].includes(newPartData.type) && (
                  <>
                    <div style={{ width: '70px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '2px' }}>רוחב:</label>
                      <input type="number" value={newPartData.width1 || ''} onChange={(e) => setNewPartData({...newPartData, width1: Number(e.target.value)})} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'center' }} />
                    </div>
                    <div style={{ width: '70px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '2px' }}>גובה:</label>
                      <input type="number" value={newPartData.height1 || ''} onChange={(e) => setNewPartData({...newPartData, height1: Number(e.target.value)})} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'center' }} />
                    </div>
                    <div style={{ width: '70px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '2px' }}>אורך:</label>
                      <input type="number" value={newPartData.length || ''} onChange={(e) => setNewPartData({...newPartData, length: Number(e.target.value)})} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'center' }} />
                    </div>
                    <div style={{ width: '80px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '2px' }}>סטייה עליונה:</label>
                      <input type="number" value={newPartData.rSmall || ''} onChange={(e) => setNewPartData({...newPartData, rSmall: Number(e.target.value)})} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'center' }} />
                    </div>
                    <div style={{ width: '80px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '2px' }}>סטייה תחתונה:</label>
                      <input type="number" value={newPartData.rBig2 || ''} onChange={(e) => setNewPartData({...newPartData, rBig2: Number(e.target.value)})} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'center' }} />
                    </div>
                  </>
                )}

                {['קופסת פיזור', 'מדף אש'].includes(newPartData.notes || '') && !['שתוצר','מתאם','שרשורי','חיבור גמיש'].includes(newPartData.type) && (
                  <>
                    <div style={{ width: '80px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '2px' }}>רוחב (מטר):</label>
                      <input type="number" value={newPartData.width1 || ''} onChange={(e) => setNewPartData({...newPartData, width1: Number(e.target.value)})} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'center' }} />
                    </div>
                    <div style={{ width: '80px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '2px' }}>גובה (מטר):</label>
                      <input type="number" value={newPartData.height1 || ''} onChange={(e) => setNewPartData({...newPartData, height1: Number(e.target.value)})} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'center' }} />
                    </div>
                    <div style={{ width: '80px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '2px' }}>עומק (מטר):</label>
                      <input type="number" value={newPartData.length || ''} onChange={(e) => setNewPartData({...newPartData, length: Number(e.target.value)})} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'center' }} />
                    </div>
                  </>
                )}

                {newPartData.type === 'קטע ישר' && !['לאמד S','צינור עגול','קופסת פיזור','מדף אש'].includes(newPartData.notes || '') && (
                  <>
                    <div style={{ width: '80px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '2px' }}>רוחב (מטר):</label>
                      <input type="number" value={newPartData.width1 || ''} onChange={(e) => setNewPartData({...newPartData, width1: Number(e.target.value)})} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'center' }} />
                    </div>
                    <div style={{ width: '80px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '2px' }}>גובה (מטר):</label>
                      <input type="number" value={newPartData.height1 || ''} onChange={(e) => setNewPartData({...newPartData, height1: Number(e.target.value)})} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'center' }} />
                    </div>
                    <div style={{ width: '80px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '2px' }}>אורך (מטר):</label>
                      <input type="number" value={newPartData.length || ''} onChange={(e) => setNewPartData({...newPartData, length: Number(e.target.value)})} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'center' }} />
                    </div>
                  </>
                )}

                {newPartData.type === 'קשת' && (
                  <>
                    <div style={{ width: '80px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '2px' }}>רוחב:</label>
                      <input type="number" value={newPartData.width1 || ''} onChange={(e) => { const w = Number(e.target.value); setNewPartData({...newPartData, width1: w, rBig: w + newPartData.rSmall}); }} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'center' }} />
                    </div>
                    <div style={{ width: '80px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '2px' }}>גובה:</label>
                      <input type="number" value={newPartData.height1 || ''} onChange={(e) => setNewPartData({...newPartData, height1: Number(e.target.value)})} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'center' }} />
                    </div>
                    <div style={{ width: '80px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '2px' }}>R קטן:</label>
                      <input type="number" value={newPartData.rSmall || ''} onChange={(e) => { const r = Number(e.target.value); setNewPartData({...newPartData, rSmall: r, rBig: newPartData.width1 + r}); }} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'center' }} />
                    </div>
                    <div style={{ width: '80px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '2px' }}>R גדול:</label>
                      <input type="number" disabled value={newPartData.rBig || ''} style={{ width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', backgroundColor: '#e2e8f0', color: '#475569', fontWeight: 'bold', textAlign: 'center' }} />
                    </div>
                  </>
                )}

                {newPartData.type === 'מעבר' && (
                  <>
                    <div style={{ width: '70px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '2px' }}>רוחב 1:</label>
                      <input type="number" value={newPartData.width1 || ''} onChange={(e) => setNewPartData({...newPartData, width1: Number(e.target.value)})} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'center' }} />
                    </div>
                    <div style={{ width: '70px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '2px' }}>גובה 1:</label>
                      <input type="number" value={newPartData.height1 || ''} onChange={(e) => setNewPartData({...newPartData, height1: Number(e.target.value)})} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'center' }} />
                    </div>
                    <div style={{ width: '70px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '2px' }}>רוחב 2:</label>
                      <input type="number" value={newPartData.width2 || ''} onChange={(e) => setNewPartData({...newPartData, width2: Number(e.target.value)})} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'center' }} />
                    </div>
                    <div style={{ width: '70px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '2px' }}>גובה 2:</label>
                      <input type="number" value={newPartData.height2 || ''} onChange={(e) => setNewPartData({...newPartData, height2: Number(e.target.value)})} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'center' }} />
                    </div>
                    <div style={{ width: '70px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '2px' }}>אורך:</label>
                      <input type="number" value={newPartData.length || ''} onChange={(e) => setNewPartData({...newPartData, length: Number(e.target.value)})} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'center' }} />
                    </div>
                  </>
                )}

                {/* דופן - עבור חלקים סטנדרטיים */}
                {!['שתוצר','מתאם','שרשורי','חיבור גמיש'].includes(newPartData.type) && (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '5px 8px', backgroundColor: '#fefce8', borderRadius: '4px', border: '1px solid #facc15', height: '30px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#854d0e', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', margin: 0 }}>
                      <input type="checkbox" checked={newPartData.panels > 0} onChange={(e) => setNewPartData({...newPartData, panels: e.target.checked ? 1 : 0})} style={{ cursor: 'pointer' }} />
                      דופן
                    </label>
                    {newPartData.panels > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontSize: '11px', color: '#854d0e' }}>כמות:</span>
                         <input type="number" min="1" step="1" value={newPartData.panels} onChange={(e) => setNewPartData({...newPartData, panels: Math.max(1, Math.round(Number(e.target.value)))})} style={{ width: '40px', padding: '2px 4px', border: '1px solid #facc15', borderRadius: '4px', textAlign: 'center', fontSize: '12px', backgroundColor: '#ffffff', color: '#0f172a' }} />
                      </div>
                    )}
                  </div>
                )}

                {/* הערות */}
                <div style={{ flexGrow: 1, minWidth: '150px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '2px' }}>הערות:</label>
                  <input type="text" value={newPartData.notes} onChange={(e) => setNewPartData({...newPartData, notes: e.target.value})} style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', color: '#0f172a' }} placeholder="..." />
                </div>

              </div>
            </div>
          </div>

          {/* כפתורי שמירה וביטול */}
          <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '10px', borderTop: '1px solid #cbd5e1', paddingTop: '15px', alignItems: 'center' }}>
            <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#334155' }}>כמות:</label>
            <input type="number" min={1} step={1} value={quickQty} onChange={(e) => setQuickQty(Math.max(1, Math.round(Number(e.target.value))))} style={{ width: '50px', padding: '6px', textAlign: 'center', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', color: '#0f172a', fontWeight: 'bold', fontSize: '13px' }} />
            <button
              onClick={saveFormPart}
              style={{
                padding: '10px 24px',
                backgroundColor: '#10b981',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px',
                boxShadow: '0 4px 6px -1px rgba(16,185,129,0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              ✅ שמור והוסף לטבלה
            </button>
            <button
              onClick={() => setIsAddingPart(false)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#64748b',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px'
              }}
            >
              בטל
            </button>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginRight: 'auto' }}>
              <button onClick={savePreset} style={{ padding: '6px 12px', backgroundColor: '#8b5cf6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }} title="שמור כתבנית">💾 שמור תבנית</button>
              {partPresets.length > 0 && (
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {partPresets.map((p, i) => (
                    <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', border: '1px solid #c4b5fd', borderRadius: '4px', overflow: 'hidden', fontSize: '11px' }}>
                      <button onClick={() => loadPreset(p)} style={{ padding: '3px 8px', backgroundColor: '#f5f3ff', border: 'none', borderRight: '1px solid #c4b5fd', cursor: 'pointer', color: '#6b21a8', fontWeight: 'bold' }} title={`טען: ${p.name}`}>📋 {p.name}</button>
                      <button onClick={() => { if (confirm(`למחוק את התבנית "${p.name}"?`)) deletePreset(i); }} style={{ padding: '3px 5px', backgroundColor: '#fef2f2', border: 'none', cursor: 'pointer', color: '#dc2626', fontWeight: 'bold' }} title="מחק תבנית">🗑️</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div style={{ overflowX: 'auto', width: '100%', backgroundColor: '#ffffff' }}>
        {(() => {
          const accessoryTypes = ['שתוצר','מתאם','שרשורי','חיבור גמיש'];
          const regularRows = activeSheet.rows.filter(r => !accessoryTypes.includes(r.type));
          const accessoryRows = activeSheet.rows.filter(r => accessoryTypes.includes(r.type));

          const hasTransition = regularRows.some(r => r.type === 'מעבר');
          const hasElbow = regularRows.some(r => r.type === 'קשת');
          const hasRound = regularRows.some(r => r.notes === 'צינור עגול');
          const hasInsulation = regularRows.some(r => r.acoustic || r.external);

          return (<>
            {/* ─── סרגל פעולות מרובות ─── */}
            {selectedRowIds.size > 0 && (
              <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', marginBottom: '16px', backgroundColor: '#eff6ff', border: '2px solid #93c5fd', borderRadius: '8px', fontSize: '13px' }}>
                <span style={{ fontWeight: 'bold', color: '#1e40af' }}>{selectedRowIds.size} חלקים נבחרים</span>
                <button onClick={bulkDelete} style={{ padding: '5px 12px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>🗑 מחק נבחרים</button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ color: '#475569' }}>העתק לדף:</span>
                  <select id="bulkCopyTarget" style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #93c5fd', fontSize: '12px' }}>
                    {sheets.filter(s => s.id !== activeSheetId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <button onClick={() => { const sel = document.getElementById('bulkCopyTarget') as HTMLSelectElement; if (sel) bulkCopyToSheet(sel.value); }} style={{ padding: '5px 12px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>📋 העתק</button>
                </div>
                <button onClick={() => setSelectedRowIds(new Set())} style={{ padding: '5px 12px', backgroundColor: '#64748b', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>ביטול בחירה</button>
              </div>
            )}

            {/* ─── טבלה 1: חלקים רגילים ─── */}
            {regularRows.length > 0 && (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '13px', minWidth: hasTransition || hasElbow ? '1700px' : '1200px', marginBottom: '24px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', color: '#475569', fontWeight: 'bold', borderBottom: '2px solid #cbd5e1' }}>
                    <th style={{ padding: '12px 8px', textAlign: 'center', width: '32px' }}><input type="checkbox" checked={regularRows.length > 0 && regularRows.every(r => selectedRowIds.has(r.id))} onChange={() => toggleSelectAll(regularRows)} style={{ cursor: 'pointer' }} /></th>
                    <th style={{ padding: '12px 8px', textAlign: 'center', width: '40px' }}>מס'</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center', width: '60px' }}>מס' חלק</th>
                    <th style={{ padding: '12px 8px', width: '140px' }}>סוג חלק</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center', backgroundColor: '#f8fafc' }}>רוחב</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center', backgroundColor: '#f8fafc' }}>גובה</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center', backgroundColor: hasTransition ? '#e2f5ec' : 'transparent', width: hasTransition ? '65px' : undefined }}>{hasTransition ? 'רוחב 2' : ''}</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center', backgroundColor: hasTransition ? '#e2f5ec' : 'transparent', width: hasTransition ? '65px' : undefined }}>{hasTransition ? 'גובה 2' : ''}</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center' }}>אורך (מטר)</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center', backgroundColor: hasElbow ? '#fff7ed' : 'transparent', width: hasElbow ? '65px' : undefined }}>{hasElbow ? 'רדיוס גדול' : ''}</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center', backgroundColor: hasElbow ? '#fff7ed' : 'transparent', width: hasElbow ? '65px' : undefined }}>{hasElbow ? 'רדיוס קטן' : ''}</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center', backgroundColor: hasInsulation ? '#faf5ff' : 'transparent' }}>{hasInsulation ? 'אקוסטי' : ''}</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center', backgroundColor: hasInsulation ? '#faf5ff' : 'transparent' }}>{hasInsulation ? 'חיצוני' : ''}</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center' }}>עובי פח</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center', backgroundColor: '#fefce8', color: '#854d0e', fontWeight: 'bold' }}>דופן</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center', backgroundColor: '#fefce8', color: '#854d0e', fontWeight: 'bold' }}>מס' חלקים</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center', color: '#1d4ed8', fontWeight: 'bold' }}>שטח (מ"ר)</th>
                    <th style={{ padding: '12px 8px', width: '160px' }}>הערות</th>
                    <th style={{ padding: '12px 8px', width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {regularRows.map((row, idx) => (
                    <tr key={row.id} onMouseEnter={() => setLastHoveredRowId(row.id)} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '8px', textAlign: 'center' }}><input type="checkbox" checked={selectedRowIds.has(row.id)} onChange={() => toggleRowSelection(row.id)} style={{ cursor: 'pointer' }} /></td>
                      <td style={{ padding: '8px', textAlign: 'center', color: '#94a3b8' }}>{idx + 1}</td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <input type="text" value={row.partNumber} onChange={(e) => updateRow(row.id, 'partNumber', e.target.value)} style={{ width: '50px', padding: '4px', textAlign: 'center', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', color: '#0f172a', fontWeight: 600, fontSize: '12px' }} />
                      </td>
                      <td style={{ padding: '8px', fontWeight: 500, color: '#0f172a' }}>
                        {row.notes && ['לאמד S','צינור עגול','קופסת פיזור','מדף אש'].includes(row.notes) ? row.notes : row.type}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center', backgroundColor: '#f8fafc' }}><input type="number" value={row.width1 || ''} onChange={(e) => updateRow(row.id, 'width1', Number(e.target.value))} style={{ width: '65px', padding: '6px', textAlign: 'center', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', color: '#0f172a' }} /></td>
                      <td style={{ padding: '8px', textAlign: 'center', backgroundColor: '#f8fafc' }}><input type="number" value={row.height1 || ''} onChange={(e) => updateRow(row.id, 'height1', Number(e.target.value))} style={{ width: '65px', padding: '6px', textAlign: 'center', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', color: '#0f172a' }} /></td>
                      <td style={{ padding: '8px', textAlign: 'center', backgroundColor: hasTransition ? '#f4fbf7' : 'transparent' }}>
                        {hasTransition && <input type="number" value={row.width2 || ''} disabled={row.type !== 'מעבר'} onChange={(e) => updateRow(row.id, 'width2', Number(e.target.value))} style={{ width: '65px', padding: '6px', textAlign: 'center', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: row.type !== 'מעבר' ? '#e2e8f0' : '#ffffff', color: '#0f172a' }} />}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center', backgroundColor: hasTransition ? '#f4fbf7' : 'transparent' }}>
                        {hasTransition && <input type="number" value={row.height2 || ''} disabled={row.type !== 'מעבר'} onChange={(e) => updateRow(row.id, 'height2', Number(e.target.value))} style={{ width: '65px', padding: '6px', textAlign: 'center', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: row.type !== 'מעבר' ? '#e2e8f0' : '#ffffff', color: '#0f172a' }} />}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}><input type="number" value={['קשת'].includes(row.type) ? '' : (row.length || '')} disabled={['קשת'].includes(row.type)} onChange={(e) => updateRow(row.id, 'length', Number(e.target.value))} style={{ width: '65px', padding: '6px', textAlign: 'center', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: ['קשת'].includes(row.type) ? '#e2e8f0' : '#ffffff', color: '#0f172a', cursor: ['קשת'].includes(row.type) ? 'not-allowed' : 'auto' }} /></td>
                      <td style={{ padding: '8px', textAlign: 'center', backgroundColor: hasElbow ? '#fffaf3' : 'transparent' }}>
                        {hasElbow && <input type="number" value={row.rBig || ''} disabled={row.type !== 'קשת'} onChange={(e) => updateRow(row.id, 'rBig', Number(e.target.value))} style={{ width: '65px', padding: '6px', textAlign: 'center', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: row.type !== 'קשת' ? '#e2e8f0' : '#ffffff', color: '#0f172a' }} />}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center', backgroundColor: hasElbow ? '#fffaf3' : 'transparent' }}>
                        {hasElbow && <input type="number" value={row.type === 'קשת' && row.rSmall ? row.rSmall : ''} disabled={row.type !== 'קשת'} onChange={(e) => updateRow(row.id, 'rSmall', Number(e.target.value))} style={{ width: '65px', padding: '6px', textAlign: 'center', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: row.type !== 'קשת' ? '#e2e8f0' : '#ffffff', color: '#0f172a' }} />}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center', backgroundColor: hasInsulation ? '#faf5ff' : 'transparent' }}>
                        {hasInsulation && <input type="checkbox" checked={row.acoustic} onChange={(e) => updateRow(row.id, 'acoustic', e.target.checked)} style={{ cursor: 'pointer' }} />}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center', backgroundColor: hasInsulation ? '#faf5ff' : 'transparent' }}>
                        {hasInsulation && <input type="checkbox" checked={row.external} onChange={(e) => updateRow(row.id, 'external', e.target.checked)} style={{ cursor: 'pointer' }} />}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <input type="number" step="0.05" value={row.manualThickness > 0 ? row.manualThickness : calculateThickness(row.width1, row.height1, row.manualThickness)} onChange={(e) => updateRow(row.id, 'manualThickness', Number(e.target.value))}
                          style={{ width: '55px', padding: '4px', textAlign: 'center', border: row.manualThickness > 0 ? '2px solid #d97706' : '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: row.manualThickness > 0 ? '#fffbeb' : '#ffffff', color: '#0f172a', fontWeight: row.manualThickness > 0 ? 700 : 500 }} />
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center', backgroundColor: '#fefce8' }}>
                        <input type="number" min="0" step="1" value={row.dofan || ''} onChange={(e) => updateRow(row.id, 'dofan', Math.max(0, Math.round(Number(e.target.value))))}
                          style={{ width: '40px', padding: '4px', textAlign: 'center', border: '1px solid #facc15', borderRadius: '4px', backgroundColor: row.dofan > 0 ? '#fffbeb' : '#ffffff', color: '#854d0e', fontWeight: row.dofan > 0 ? 700 : 400 }} placeholder="0" />
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center', backgroundColor: '#fefce8' }}>
                        <input type="number" min="1" step="1" value={row.panels || 1} onChange={(e) => updateRow(row.id, 'panels', Math.max(1, Math.round(Number(e.target.value))))} style={{ width: '40px', padding: '4px', textAlign: 'center', border: '1px solid #facc15', borderRadius: '4px', backgroundColor: '#ffffff', color: '#854d0e', fontWeight: 700 }} placeholder="1" />
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold', color: '#1d4ed8', backgroundColor: '#eff6ff' }}>{calculateArea(row).toFixed(3)}</td>
                      <td style={{ padding: '8px' }}>
                        <input type="text" value={row.notes} onChange={(e) => updateRow(row.id, 'notes', e.target.value)}
                          style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box', backgroundColor: '#ffffff', color: '#0f172a' }} />
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center', display: 'flex', gap: '4px', justifyContent: 'center', flexDirection: 'column', alignItems: 'center' }}>
                        {getRowWarnings(row).length > 0 && <span title={getRowWarnings(row).join('\n')} style={{ color: '#f59e0b', fontSize: '12px', cursor: 'help' }}>⚠️</span>}
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button onClick={() => duplicateRow(row.id)} title="שכפל חלק" style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button>
                          <button onClick={() => deleteRow(row.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* ─── טבלה 2: אביזרים ─── */}
            {accessoryRows.length > 0 && (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '13px', minWidth: '900px', marginBottom: '24px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', color: '#475569', fontWeight: 'bold', borderBottom: '2px solid #cbd5e1' }}>
                    <th style={{ padding: '12px 8px', textAlign: 'center', width: '32px' }}><input type="checkbox" checked={accessoryRows.length > 0 && accessoryRows.every(r => selectedRowIds.has(r.id))} onChange={() => toggleSelectAll(accessoryRows)} style={{ cursor: 'pointer' }} /></th>
                    <th style={{ padding: '12px 8px', textAlign: 'center', width: '40px' }}>מס'</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center', width: '60px' }}>מס' חלק</th>
                    <th style={{ padding: '12px 8px', width: '120px' }}>סוג אביזר</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center' }}>פירוט</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center' }}>אורך (מטר)</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center' }}>כמות</th>
                    <th style={{ padding: '12px 8px', width: '160px' }}>הערות</th>
                    <th style={{ padding: '12px 8px', width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {accessoryRows.map((row, idx) => (
                    <tr key={row.id} onMouseEnter={() => setLastHoveredRowId(row.id)} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
                      <td style={{ padding: '8px', textAlign: 'center' }}><input type="checkbox" checked={selectedRowIds.has(row.id)} onChange={() => toggleRowSelection(row.id)} style={{ cursor: 'pointer' }} /></td>
                      <td style={{ padding: '8px', textAlign: 'center', color: '#94a3b8' }}>{idx + 1}</td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <input type="text" value={row.partNumber} onChange={(e) => updateRow(row.id, 'partNumber', e.target.value)} style={{ width: '50px', padding: '4px', textAlign: 'center', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', color: '#0f172a', fontWeight: 600, fontSize: '12px' }} />
                      </td>
                      <td style={{ padding: '8px', fontWeight: 500, color: '#0f172a' }}>
                        {row.type}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center', backgroundColor: '#ffffff', fontWeight: 'bold', color: '#334155' }}>
                        {row.type === 'שתוצר' && 'יחידות'}
                        {row.type === 'מתאם' && (row.adapterType || 'ללא')}
                        {row.type === 'שרשורי' && `קוטר ${row.sharshuriType}`}
                        {row.type === 'חיבור גמיש' && `${row.flexible || 0} יחידות`}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        {row.type === 'שרשורי' || row.type === 'חיבור גמיש' ? (
                          <input type="number" min="0" step="1" value={row.length || ''} onChange={(e) => updateRow(row.id, 'length', Math.max(0, Math.round(Number(e.target.value))))} style={{ width: '65px', padding: '6px', textAlign: 'center', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '13px' }} />
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center', backgroundColor: '#ffffff', fontWeight: 'bold', color: '#334155' }}>
                        {row.type === 'מתאם' ? (
                          <input type="number" min="1" step="1" value={row.adapterQty || ''} onChange={(e) => updateRow(row.id, 'adapterQty', Math.max(1, Math.round(Number(e.target.value))))} style={{ width: '50px', padding: '4px', textAlign: 'center', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', color: '#0f172a', fontWeight: 700 }} />
                        ) : row.type === 'שתוצר' ? (
                          <input type="number" min="1" step="1" value={row.panels || 1} onChange={(e) => updateRow(row.id, 'panels', Math.max(1, Math.round(Number(e.target.value))))} style={{ width: '50px', padding: '4px', textAlign: 'center', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', color: '#0f172a', fontWeight: 700 }} placeholder="1" />
                        ) : row.type === 'חיבור גמיש' ? (
                          <input type="number" min="1" step="1" value={row.flexible || ''} onChange={(e) => updateRow(row.id, 'flexible', Math.max(1, Math.round(Number(e.target.value))))} style={{ width: '50px', padding: '4px', textAlign: 'center', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', color: '#0f172a', fontWeight: 700 }} />
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '8px' }}>
                        <input type="text"
                          value={
                            row.type === 'שתוצר' ? 'שתוצר' :
                            row.type === 'מתאם' ? `מתאם: ${row.adapterType}` :
                            row.type === 'שרשורי' ? `שרשורי: קוטר ${row.sharshuriType}, אורך ${row.length}` :
                            row.type === 'חיבור גמיש' ? `גמיש: ${row.flexible} יח', אורך ${row.length} מ'` :
                            row.notes
                          }
                          onChange={(e) => updateRow(row.id, 'notes', e.target.value)}
                          readOnly
                          style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box', backgroundColor: '#f8fafc', color: '#0f172a', cursor: 'not-allowed' }} />
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center', display: 'flex', gap: '4px', justifyContent: 'center' }}>
                        <button onClick={() => duplicateRow(row.id)} title="שכפל חלק" style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button>
                        <button onClick={() => deleteRow(row.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>);
        })()}
      </div>

      <div style={{ backgroundColor: '#0f172a', color: '#ffffff', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold', borderBottomLeftRadius: '7px', borderBottomRightRadius: '7px' }}>
        <span>סך הכל: {activeSheet.rows.length} חלקים | שטח בדף הנוכחי:</span>
        <span style={{ color: '#3b82f6', fontSize: '16px' }}>{activeSheet.rows.reduce((s, r) => s + calculateArea(r), 0).toFixed(3)} מ"ר</span>
      </div>
    </div>
  );
}
