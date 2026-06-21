import React from 'react';
import CompanyLetterhead from '../CompanyLetterhead';
import type { CompanyDetails } from '../CompanyLetterhead';
import { getProjectTotals } from '../calculations';
import type { Sheet, RowData, PriceItem } from '../types';

export interface InvoicePageProps {
  sheets: Sheet[];
  clientDetails: {
    name: string;
    phone: string;
    email: string;
    contact: string;
  };
  selectedProject: string;
  docDate: string;
  docNumber: string;
  pricesList: PriceItem[];
  invoicePriceOverrides: Record<string, number>;
  setInvoicePriceOverrides: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  calculateThickness: (w1: number, h1: number, manual?: number) => number;
  calculateArea: (row: RowData) => number;
  getPrice: (name: string) => number;
  getSheetTotals: (sheet: Sheet) => any;
  myCompanyDetails: CompanyDetails;
  isNewClient: boolean;
  isNewProject: boolean;
  newProjectName: string;
  selectedClientKey: string;
  producedProjects: Record<string, boolean>;
  setProducedProjects: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setProducedSnapshots: React.Dispatch<React.SetStateAction<Record<string, Sheet[]>>>;
  handlePrint: () => void;
}

export default function InvoicePage({
  sheets,
  clientDetails,
  selectedProject,
  docDate,
  docNumber,
  pricesList,
  invoicePriceOverrides,
  setInvoicePriceOverrides,
  myCompanyDetails,
  isNewClient,
  isNewProject,
  newProjectName,
  selectedClientKey,
  producedProjects,
  setProducedProjects,
  setProducedSnapshots,
  handlePrint,
}: InvoicePageProps) {
  const totals = getProjectTotals(sheets, pricesList);

  const getInvoicePrice = (key: string) => {
    if (invoicePriceOverrides[key] !== undefined) return invoicePriceOverrides[key];
    const exact = pricesList.find(p => p.detail === key);
    if (exact) return exact.price;
    const partial = pricesList.find(p => p.detail.includes(key) || key.includes(p.detail));
    return partial?.price ?? 0;
  };

  const setInvoicePrice = (key: string, value: number) =>
    setInvoicePriceOverrides({ ...invoicePriceOverrides, [key]: value });

  const adapterPriceKeyMap: Record<string, string> = {
    '"6 מתאם': 'מתאם 6"6/"',
    '8/8 מתאם': 'מתאם 8"8/"',
    '10/10 מתאם': 'מתאם 10"10/"',
    '12/12 מתאם': 'מתאם 12"12/"',
    '14/14 מתאם': 'מתאם 14"14/"',
    '16/16 מתאם': 'מתאם 16"16/"',
    '60/60 מתאם': 'מתאם 60/60',
  };

  return (
    <div className="portrait-print print-document invoice-print-page" style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '32px', maxWidth: '750px', margin: '0 auto', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
      <div className="print-orientation-spacer portrait-print" aria-hidden="true" />

      {/* סרגל כפתורי ניהול נייר המכתבים - מוסתר בהדפסה */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px', borderBottom: '1px solid #cbd5e1', paddingBottom: '10px', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {/* כפתור הפקה ונעילת שינויים */}
          <button
            onClick={() => {
              const currentClient = isNewClient ? clientDetails.name : selectedClientKey;
              const currentProject = isNewProject ? newProjectName : selectedProject;
              const key = `${currentClient}-${currentProject}`;

              setProducedProjects(prev => ({ ...prev, [key]: true }));
              setProducedSnapshots(prev => ({ ...prev, [key]: JSON.parse(JSON.stringify(sheets)) }));
              alert("החשבון והמדידות לפרויקט זה הופקו וננעלו בהצלחה!\nמעתה, כל ניסיון לשנות או למחוק שורות שהופקו יציג התראה.");
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: producedProjects[`${isNewClient ? clientDetails.name : selectedClientKey}-${isNewProject ? newProjectName : selectedProject}`] ? '#10b981' : '#1e3a8a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '13px'
            }}
          >
            {producedProjects[`${isNewClient ? clientDetails.name : selectedClientKey}-${isNewProject ? newProjectName : selectedProject}`] ? "✅ הופק וננעל" : "⚡ הפק מסמך ונעל"}
          </button>

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
            הדפס חשבון / שמור כ-PDF
          </button>
        </div>
      </div>

      <CompanyLetterhead details={myCompanyDetails} />

      {/* פרטי המסמך עצמו - קטן ומכובד למטה */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', fontSize: '14px', borderBottom: '1px solid #cbd5e1', paddingBottom: '8px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>חשבון פרופורמה</h2>
          <span style={{ fontSize: '12px', color: '#64748b' }}>מספר מסמך: <b>#{docNumber}</b></span>
        </div>
        <div style={{ textAlign: 'left', fontSize: '12px', color: '#64748b' }}>
          תאריך: <b>{docDate}</b>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', backgroundColor: '#f8fafc', padding: '14px 18px', borderRadius: '6px', marginBottom: '24px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
        <div>
          <span style={{ color: '#64748b' }}>לכבוד הלקוח:</span>
          <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#0f172a', marginTop: '2px' }}>{isNewClient ? clientDetails.name : selectedClientKey}</div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>טלפון: {clientDetails.phone} | מייל: {clientDetails.email}</div>
        </div>
        <div>
          <span style={{ color: '#64748b' }}>עבור הפרויקט:</span>
          <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#0f172a', marginTop: '2px' }}>{isNewProject ? newProjectName : selectedProject}</div>
        </div>
      </div>

      {/* טבלת פירוט החשבון - עם כמות, מחיר יחידה והסכום */}
      <div style={{ overflowX: 'auto', width: '100%', backgroundColor: '#ffffff', marginBottom: '15px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '13px', border: '1.5px solid #cbd5e1' }}>
          <thead>
            <tr style={{ backgroundColor: '#f1f5f9', fontWeight: 'bold', borderBottom: '2.5px solid #475569', color: '#0f172a' }}>
              <th style={{ padding: '10px 8px', borderLeft: '1px solid #cbd5e1' }}>פירוט פריט</th>
              <th style={{ padding: '10px 8px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', width: '80px' }}>כמות</th>
              <th style={{ padding: '10px 8px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', width: '60px' }}>יחידה</th>
              <th style={{ padding: '10px 8px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', width: '110px' }}>מחיר ליחידה</th>
              <th style={{ padding: '10px 8px', textAlign: 'center', width: '120px' }}>הסכום</th>
            </tr>
          </thead>
          <tbody>
            {/* 1. פח מגולוון 0.8 */}
            {(totals[0.8] || 0) > 0 && (
              <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                <td style={{ padding: '10px 8px', borderLeft: '1px solid #cbd5e1', fontWeight: 600, color: '#1e293b' }}>פח מגולוון עובי 0.8 מ"מ</td>
                <td style={{ padding: '10px 8px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold' }}>{totals[0.8].toFixed(2)}</td>
                <td style={{ padding: '10px 8px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', color: '#64748b' }}>מ"ר</td>
                <td style={{ padding: '10px 8px', borderLeft: '1px solid #cbd5e1', textAlign: 'center' }}>
                  <input type="number" step="0.01" value={getInvoicePrice('פח 0.8')} onChange={(e) => setInvoicePrice('פח 0.8', Number(e.target.value))} style={{ width: '70px', padding: '4px', textAlign: 'center', border: invoicePriceOverrides['פח 0.8'] !== undefined ? '2px solid #d97706' : '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: invoicePriceOverrides['פח 0.8'] !== undefined ? '#fffbeb' : '#ffffff', color: '#0f172a', fontWeight: invoicePriceOverrides['פח 0.8'] !== undefined ? 700 : 400 }} /> ₪
                </td>
                <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 'bold', color: '#1d4ed8' }}>{(totals[0.8] * getInvoicePrice('פח 0.8')).toFixed(2)} ₪</td>
              </tr>
            )}
            {/* 2. פח מגולוון 1.0 */}
            {(totals[1.0] || 0) > 0 && (
              <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                <td style={{ padding: '10px 8px', borderLeft: '1px solid #cbd5e1', fontWeight: 600, color: '#1e293b' }}>פח מגולוון עובי 1.0 מ"מ</td>
                <td style={{ padding: '10px 8px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold' }}>{totals[1.0].toFixed(2)}</td>
                <td style={{ padding: '10px 8px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', color: '#64748b' }}>מ"ר</td>
                <td style={{ padding: '10px 8px', borderLeft: '1px solid #cbd5e1', textAlign: 'center' }}>
                  <input type="number" step="0.01" value={getInvoicePrice('פח 1.0')} onChange={(e) => setInvoicePrice('פח 1.0', Number(e.target.value))} style={{ width: '70px', padding: '4px', textAlign: 'center', border: invoicePriceOverrides['פח 1.0'] !== undefined ? '2px solid #d97706' : '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: invoicePriceOverrides['פח 1.0'] !== undefined ? '#fffbeb' : '#ffffff', color: '#0f172a', fontWeight: invoicePriceOverrides['פח 1.0'] !== undefined ? 700 : 400 }} /> ₪
                </td>
                <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 'bold', color: '#1d4ed8' }}>{(totals[1.0] * getInvoicePrice('פח 1.0')).toFixed(2)} ₪</td>
              </tr>
            )}
            {/* 3. פח מגולוון 1.25 */}
            {(totals[1.25] || 0) > 0 && (
              <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                <td style={{ padding: '10px 8px', borderLeft: '1px solid #cbd5e1', fontWeight: 600, color: '#1e293b' }}>פח מגולוון עובי 1.25 מ"מ</td>
                <td style={{ padding: '10px 8px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold' }}>{totals[1.25].toFixed(2)}</td>
                <td style={{ padding: '10px 8px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', color: '#64748b' }}>מ"ר</td>
                <td style={{ padding: '10px 8px', borderLeft: '1px solid #cbd5e1', textAlign: 'center' }}>
                  <input type="number" step="0.01" value={getInvoicePrice('פח 1.25')} onChange={(e) => setInvoicePrice('פח 1.25', Number(e.target.value))} style={{ width: '70px', padding: '4px', textAlign: 'center', border: invoicePriceOverrides['פח 1.25'] !== undefined ? '2px solid #d97706' : '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: invoicePriceOverrides['פח 1.25'] !== undefined ? '#fffbeb' : '#ffffff', color: '#0f172a', fontWeight: invoicePriceOverrides['פח 1.25'] !== undefined ? 700 : 400 }} /> ₪
                </td>
                <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 'bold', color: '#1d4ed8' }}>{(totals[1.25] * getInvoicePrice('פח 1.25')).toFixed(2)} ₪</td>
              </tr>
            )}
            {/* 4. שתוצר עגול */}
            {(totals.shatuzar || 0) > 0 && (
              <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                <td style={{ padding: '10px 8px', borderLeft: '1px solid #cbd5e1', fontWeight: 600, color: '#1e293b' }}>שתוצר עגול לתעלות</td>
                <td style={{ padding: '10px 8px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold' }}>{totals.shatuzar}</td>
                <td style={{ padding: '10px 8px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', color: '#64748b' }}>יח'</td>
                <td style={{ padding: '10px 8px', borderLeft: '1px solid #cbd5e1', textAlign: 'center' }}>
                  <input type="number" step="0.01" value={getInvoicePrice('שתוצר עגול')} onChange={(e) => setInvoicePrice('שתוצר עגול', Number(e.target.value))} style={{ width: '70px', padding: '4px', textAlign: 'center', border: invoicePriceOverrides['שתוצר עגול'] !== undefined ? '2px solid #d97706' : '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: invoicePriceOverrides['שתוצר עגול'] !== undefined ? '#fffbeb' : '#ffffff', color: '#0f172a', fontWeight: invoicePriceOverrides['שתוצר עגול'] !== undefined ? 700 : 400 }} /> ₪
                </td>
                <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 'bold', color: '#1d4ed8' }}>{(totals.shatuzar * getInvoicePrice('שתוצר עגול')).toFixed(2)} ₪</td>
              </tr>
            )}
            {/* 5. חיבור גמיש */}
            {(totals.flexible || 0) > 0 && (
              <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                <td style={{ padding: '10px 8px', borderLeft: '1px solid #cbd5e1', fontWeight: 600, color: '#1e293b' }}>חיבור גמיש מונע רעידות</td>
                <td style={{ padding: '10px 8px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold' }}>{totals.flexible.toFixed(2)}</td>
                <td style={{ padding: '10px 8px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', color: '#64748b' }}>מ"א</td>
                <td style={{ padding: '10px 8px', borderLeft: '1px solid #cbd5e1', textAlign: 'center' }}>
                  <input type="number" step="0.01" value={getInvoicePrice('חיבור גמיש')} onChange={(e) => setInvoicePrice('חיבור גמיש', Number(e.target.value))} style={{ width: '70px', padding: '4px', textAlign: 'center', border: invoicePriceOverrides['חיבור גמיש'] !== undefined ? '2px solid #d97706' : '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: invoicePriceOverrides['חיבור גמיש'] !== undefined ? '#fffbeb' : '#ffffff', color: '#0f172a', fontWeight: invoicePriceOverrides['חיבור גמיש'] !== undefined ? 700 : 400 }} /> ₪
                </td>
                <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 'bold', color: '#1d4ed8' }}>{(totals.flexible * getInvoicePrice('חיבור גמיש')).toFixed(2)} ₪</td>
              </tr>
            )}
            {/* 6. בידוד אקוסטי */}
            {(totals.acoustic || 0) > 0 && (
              <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                <td style={{ padding: '10px 8px', borderLeft: '1px solid #cbd5e1', fontWeight: 600, color: '#1e293b' }}>בידוד פנימי אקוסטי 1"</td>
                <td style={{ padding: '10px 8px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold' }}>{totals.acoustic.toFixed(2)}</td>
                <td style={{ padding: '10px 8px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', color: '#64748b' }}>מ"ר</td>
                <td style={{ padding: '10px 8px', borderLeft: '1px solid #cbd5e1', textAlign: 'center' }}>
                  <input type="number" step="0.01" value={getInvoicePrice('בידוד פנימי 1"')} onChange={(e) => setInvoicePrice('בידוד פנימי 1"', Number(e.target.value))} style={{ width: '70px', padding: '4px', textAlign: 'center', border: invoicePriceOverrides['בידוד פנימי 1"'] !== undefined ? '2px solid #d97706' : '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: invoicePriceOverrides['בידוד פנימי 1"'] !== undefined ? '#fffbeb' : '#ffffff', color: '#0f172a', fontWeight: invoicePriceOverrides['בידוד פנימי 1"'] !== undefined ? 700 : 400 }} /> ₪
                </td>
                <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 'bold', color: '#1d4ed8' }}>{(totals.acoustic * getInvoicePrice('בידוד פנימי 1"')).toFixed(2)} ₪</td>
              </tr>
            )}
            {/* 7. בידוד חיצוני */}
            {(totals.external || 0) > 0 && (
              <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                <td style={{ padding: '10px 8px', borderLeft: '1px solid #cbd5e1', fontWeight: 600, color: '#1e293b' }}>בידוד חיצוני תעלות 1"</td>
                <td style={{ padding: '10px 8px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold' }}>{totals.external.toFixed(2)}</td>
                <td style={{ padding: '10px 8px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', color: '#64748b' }}>מ"ר</td>
                <td style={{ padding: '10px 8px', borderLeft: '1px solid #cbd5e1', textAlign: 'center' }}>
                  <input type="number" step="0.01" value={getInvoicePrice('בידוד חיצוני 1"')} onChange={(e) => setInvoicePrice('בידוד חיצוני 1"', Number(e.target.value))} style={{ width: '70px', padding: '4px', textAlign: 'center', border: invoicePriceOverrides['בידוד חיצוני 1"'] !== undefined ? '2px solid #d97706' : '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: invoicePriceOverrides['בידוד חיצוני 1"'] !== undefined ? '#fffbeb' : '#ffffff', color: '#0f172a', fontWeight: invoicePriceOverrides['בידוד חיצוני 1"'] !== undefined ? 700 : 400 }} /> ₪
                </td>
                <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 'bold', color: '#1d4ed8' }}>{(totals.external * getInvoicePrice('בידוד חיצוני 1"')).toFixed(2)} ₪</td>
              </tr>
            )}
            {/* 8. שרשורי */}
            {Object.keys(totals.sharshuri).map(k => {
              const qty = totals.sharshuri[k as keyof typeof totals.sharshuri];
              if (qty <= 0) return null;
              const priceKey = 'שרשורי ' + k;
              return (
                <tr key={k} style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ padding: '10px 8px', borderLeft: '1px solid #cbd5e1', fontWeight: 600, color: '#1e293b' }}>צינור שרשורי קוטר {k}</td>
                  <td style={{ padding: '10px 8px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold' }}>{qty.toFixed(2)}</td>
                  <td style={{ padding: '10px 8px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', color: '#64748b' }}>מ"א</td>
                  <td style={{ padding: '10px 8px', borderLeft: '1px solid #cbd5e1', textAlign: 'center' }}>
                    <input type="number" step="0.01" value={getInvoicePrice(priceKey)} onChange={(e) => setInvoicePrice(priceKey, Number(e.target.value))} style={{ width: '70px', padding: '4px', textAlign: 'center', border: invoicePriceOverrides[priceKey] !== undefined ? '2px solid #d97706' : '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: invoicePriceOverrides[priceKey] !== undefined ? '#fffbeb' : '#ffffff', color: '#0f172a', fontWeight: invoicePriceOverrides[priceKey] !== undefined ? 700 : 400 }} /> ₪
                  </td>
                  <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 'bold', color: '#1d4ed8' }}>{(qty * getInvoicePrice(priceKey)).toFixed(2)} ₪</td>
                </tr>
              );
            })}
            {/* 9. מתאמים */}
            {Object.keys(totals.adapter).map(k => {
              const qty = totals.adapter[k as keyof typeof totals.adapter];
              if (qty <= 0) return null;
              let adapterPriceKey = adapterPriceKeyMap[k] || k;

              return (
                <tr key={k} style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ padding: '10px 8px', borderLeft: '1px solid #cbd5e1', fontWeight: 600, color: '#1e293b' }}>מתאם / קופסת פיזור סוג {k}</td>
                  <td style={{ padding: '10px 8px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold' }}>{qty}</td>
                  <td style={{ padding: '10px 8px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', color: '#64748b' }}>יח'</td>
                  <td style={{ padding: '10px 8px', borderLeft: '1px solid #cbd5e1', textAlign: 'center' }}>
                    <input type="number" step="0.01" value={getInvoicePrice(adapterPriceKey)} onChange={(e) => setInvoicePrice(adapterPriceKey, Number(e.target.value))} style={{ width: '70px', padding: '4px', textAlign: 'center', border: invoicePriceOverrides[adapterPriceKey] !== undefined ? '2px solid #d97706' : '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: invoicePriceOverrides[adapterPriceKey] !== undefined ? '#fffbeb' : '#ffffff', color: '#0f172a', fontWeight: invoicePriceOverrides[adapterPriceKey] !== undefined ? 700 : 400 }} /> ₪
                  </td>
                  <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 'bold', color: '#1d4ed8' }}>{(qty * getInvoicePrice(adapterPriceKey)).toFixed(2)} ₪</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '20px', backgroundColor: '#f1f5f9', padding: '16px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
        {(() => {
          const invSubtotal = (totals[0.8] * getInvoicePrice('פח 0.8')) + (totals[1.0] * getInvoicePrice('פח 1.0')) + (totals[1.25] * getInvoicePrice('פח 1.25')) + (totals.shatuzar * getInvoicePrice('שתוצר עגול')) + (totals.flexible * getInvoicePrice('חיבור גמיש')) + (totals.acoustic * getInvoicePrice('בידוד פנימי 1"')) + (totals.external * getInvoicePrice('בידוד חיצוני 1"')) + Object.keys(totals.sharshuri).reduce((s, k) => s + (totals.sharshuri[k as keyof typeof totals.sharshuri] * getInvoicePrice('שרשורי ' + k)), 0) + Object.keys(totals.adapter).reduce((s, k) => {
            const qty = totals.adapter[k as keyof typeof totals.adapter];
            const adapterPriceKey = adapterPriceKeyMap[k] || k;
            return s + qty * getInvoicePrice(adapterPriceKey);
          }, 0);
          const invVat = invSubtotal * 0.18;
          const invTotal = invSubtotal + invVat;
          return (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}><span>סך הכל נטו (ללא מע"מ):</span><span style={{ fontWeight: 600 }}>{invSubtotal.toFixed(2)} ₪</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#475569' }}><span>מס ערך מוסף (18%):</span><span>{invVat.toFixed(2)} ₪</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '2px dashed #94a3b8', fontSize: '18px', fontWeight: 'bold', color: '#0f172a' }}>
                <span>לתשלום כולל מע"מ:</span>
                <span style={{ color: '#1e40af', borderBottom: '2px double #1e40af' }}>{invTotal.toFixed(2)} ₪</span>
              </div>
            </>
          );
        })()}
      </div>

      <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#64748b', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
        <span>מערכת עלי שרארה בע"מ - הפקה ממוחשבת</span>
        <div style={{ textAlign: 'center', borderTop: '1px dashed #cbd5e1', width: '150px', paddingTop: '6px' }}>חתימה וחותמת העסק</div>
      </div>
    </div>
  );
}
