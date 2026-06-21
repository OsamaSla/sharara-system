import type { PriceItem } from '../types';

interface PriceListPageProps {
  pricesList: PriceItem[];
  setPricesList: React.Dispatch<React.SetStateAction<PriceItem[]>>;
  handlePrint: () => void;
  isAdmin: boolean;
}

export default function PriceListPage({
  pricesList,
  setPricesList,
  handlePrint,
}: PriceListPageProps) {
  return (
    <div className="portrait-print print-document pricelist-print-page" style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '32px', maxWidth: '800px', margin: '0 auto', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
      <div className="print-orientation-spacer portrait-print" aria-hidden="true" />
      <div style={{ borderBottom: '3px solid #0f172a', paddingBottom: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>מחירון העסק</h2>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>מחירון מעודכן הניתן לעדכון ועריכה בכל עת. השינויים משפיעים ישירות על כל הדוחות והחישובים במערכת.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handlePrint}
            className="no-print"
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
            הדפס מחירון / שמור כ-PDF
          </button>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '14px', border: '1px solid #cbd5e1' }}>
          <thead>
            <tr style={{ backgroundColor: '#f1f5f9', color: '#0f172a', fontWeight: 'bold', borderBottom: '2px solid #cbd5e1' }}>
              <th style={{ padding: '10px 12px', borderLeft: '1px solid #cbd5e1', width: '60px', textAlign: 'center' }}>מספר</th>
              <th style={{ padding: '10px 12px', borderLeft: '1px solid #cbd5e1' }}>פירוט פריט</th>
              <th style={{ padding: '10px 12px', borderLeft: '1px solid #cbd5e1', width: '100px', textAlign: 'center' }}>יחידה</th>
              <th style={{ padding: '10px 12px', width: '150px', textAlign: 'center' }}>מחיר (₪)</th>
            </tr>
          </thead>
          <tbody>
            {pricesList.map((item, index) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                <td style={{ padding: '8px 12px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold', color: '#64748b' }}>
                  {item.id}
                </td>
                <td style={{ padding: '8px 12px', borderLeft: '1px solid #cbd5e1', fontWeight: 600, color: '#1e293b' }}>
                  {item.detail}
                </td>
                <td style={{ padding: '8px 12px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', color: '#475569', fontWeight: 'bold' }}>
                  {item.unit}
                </td>
                <td style={{ padding: '6px 12px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setPricesList(pricesList.map(p => p.id === item.id ? { ...p, price: val } : p));
                      }}
                      style={{
                        width: '100px',
                        padding: '6px',
                        textAlign: 'center',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        backgroundColor: '#ffffff',
                        color: '#0f172a'
                      }}
                    />
                    <span style={{ fontWeight: 'bold', color: '#64748b' }}>₪</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
