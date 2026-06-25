import type { RowData, Sheet } from './types';
import logoSrc from './assets/logo.png';
import { formatDate, todayFormatted } from './utils';

const ACCESSORY_TYPES = ['שתוצר','מתאם','שרשורי','חיבור גמיש'];

interface PrintableReportProps {
  sheets: Sheet[];
  clientDetails: { name: string; phone: string; email: string; contact: string };
  selectedProject: string;
  docDate: string;
  docNumber: string;
  calculateArea: (row: RowData) => number;
  calculateThickness: (w: number, h: number, manual?: number) => number;
  companySignature?: string;
}

export default function PrintableReport({
  sheets,
  clientDetails,
  selectedProject,
  docDate,
  docNumber,
  calculateArea,
  calculateThickness,
  companySignature,
}: PrintableReportProps) {
  const today = todayFormatted();

  const regularHeaders = [
    { label: '#', w: '3%' },
    { label: "מס' חלק", w: '6%' },
    { label: 'סוג חלק', w: '12%' },
    { label: 'רוחב', w: '5%' },
    { label: 'גובה', w: '5%' },
    { label: 'רוחב 2', w: '5%' },
    { label: 'גובה 2', w: '5%' },
    { label: 'אורך', w: '6%' },
    { label: 'רדיוס ג\'', w: '5%' },
    { label: 'רדיוס ק\'', w: '5%' },
    { label: 'אקוסטי', w: '4%' },
    { label: 'חיצוני', w: '4%' },
    { label: 'עובי', w: '4%' },
    { label: 'דופן', w: '4%' },
    { label: 'מס\' חלקים', w: '5%' },
    { label: 'שטח', w: '5%' },
    { label: 'הערות', w: '7%' },
  ];

  const accessoryHeaders = [
    { label: '#', w: '4%' },
    { label: "מס' חלק", w: '10%' },
    { label: 'סוג אביזר', w: '14%' },
    { label: 'פירוט', w: '18%' },
    { label: 'אורך', w: '10%' },
    { label: 'כמות', w: '10%' },
    { label: 'הערות', w: '34%' },
  ];

  return (
    <div className="printable-report landscape-print" dir="rtl" lang="he">
      {sheets.map((sheet, si) => {
        const regularRows = sheet.rows.filter(r => !ACCESSORY_TYPES.includes(r.type));
        const accessoryRows = sheet.rows.filter(r => ACCESSORY_TYPES.includes(r.type));
        const hasTransition = regularRows.some(r => r.type === 'מעבר');
        const hasElbow = regularRows.some(r => r.type === 'קשת');
        const hasInsulation = regularRows.some(r => r.acoustic || r.external);

        const activeRegularHeaders = regularHeaders.filter(h => {
          if ((h.label === 'רוחב 2' || h.label === 'גובה 2') && !hasTransition) return false;
          if ((h.label === 'רדיוס ג\'' || h.label === 'רדיוס ק\'') && !hasElbow) return false;
          if ((h.label === 'אקוסטי' || h.label === 'חיצוני') && !hasInsulation) return false;
          return true;
        });

        return (
          <div key={sheet.id} className="pt-sheet-section">
            <div className="pt-header-block">
              <div className="pt-header">
                <img src={logoSrc} alt="לוגו" className="pt-logo" style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }} />
                <span className="pt-title">שרארה — דוח מדידות תעלות פח</span>
              </div>
              <div className="pt-info">
                <span>לקוח: {clientDetails.name}</span>
                <span>טל: <span dir="ltr">{clientDetails.phone}</span></span>
                <span>איש קשר: {clientDetails.contact}</span>
                <span>פרויקט: {selectedProject}</span>
                <span>תאריך: {formatDate(docDate)}</span>
                <span>מס': <span dir="ltr">{docNumber}</span></span>
              </div>
              <div className="pt-sheet-title">גיליון: {sheet.name}</div>
            </div>

            {regularRows.length > 0 && (
              <table className="print-table pt-table-regular">
                <thead>
                  <tr className="pt-col-headers pt-regular-header">
                    {activeRegularHeaders.map(h => (
                      <th key={h.label} style={{ width: h.w }}>{h.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {regularRows.map((row, idx) => {
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
                        <td><span dir="ltr">{row.partNumber}</span></td>
                        <td className="pt-detail"><bdi>{detail}</bdi></td>
                        <td>{row.width1}</td>
                        <td>{row.height1}</td>
                        <td>{hasTransition ? (row.type === 'מעבר' ? row.width2 : '–') : ''}</td>
                        <td>{hasTransition ? (row.type === 'מעבר' ? row.height2 : '–') : ''}</td>
                        <td>{row.type === 'קשת' ? '–' : row.length}</td>
                        <td>{hasElbow ? (row.type === 'קשת' ? row.rBig : '–') : ''}</td>
                        <td>{hasElbow ? (row.type === 'קשת' ? row.rSmall : '–') : ''}</td>
                        <td>{hasInsulation ? (row.acoustic ? '✓' : '–') : ''}</td>
                        <td>{hasInsulation ? (row.external ? '✓' : '–') : ''}</td>
                        <td>{thick.toFixed(2)}</td>
                        <td>{row.dofan || '–'}</td>
                        <td>{row.panels || 1}</td>
                        <td>{area.toFixed(3)}</td>
                        <td>{row.notes}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ fontWeight: 'bold', backgroundColor: '#dbeafe', borderTop: '2px solid #3b82f6', fontSize: '11px' }}>
                    <td colSpan={15} style={{ textAlign: 'left', padding: '4px 6px' }}>
                      סה"כ: {regularRows.length} חלקים
                    </td>
                    <td style={{ textAlign: 'center', padding: '4px 6px' }}>
                      {regularRows.reduce((sum, row) => sum + calculateArea(row), 0).toFixed(2)} מ"ר
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            )}

            {accessoryRows.length > 0 && (
              <div className="pt-accessory-section accessories-group-section">
                <div className="pt-accessory-subtitle accessories-title">אביזרים</div>
                <table className="print-table pt-table-accessory">
                  <thead>
                    <tr className="pt-col-headers pt-accessory-header">
                      {accessoryHeaders.map(h => (
                        <th key={h.label} style={{ width: h.w }}>{h.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {accessoryRows.map((row, idx) => {
                      let detail = '';
                      if (row.type === 'שתוצר') {
                        detail = 'יחידות';
                      } else if (row.type === 'מתאם') {
                        detail = row.adapterType || 'ללא';
                      } else if (row.type === 'שרשורי') {
                        detail = `קוטר ${row.sharshuriType}`;
                      } else if (row.type === 'חיבור גמיש') {
                        detail = `${row.flexible || 0} יחידות`;
                      }

                      const qty = row.type === 'מתאם' ? row.adapterQty
                        : row.type === 'שתוצר' ? (row.panels || 1)
                        : row.type === 'חיבור גמיש' ? row.flexible
                        : 1;

                      const lengthVal = (row.type === 'שרשורי' || row.type === 'חיבור גמיש') && row.length > 0
                        ? row.length
                        : '–';

                      const autoNotes = row.type === 'שתוצר' ? 'שתוצר'
                        : row.type === 'מתאם' ? `מתאם: ${row.adapterType}`
                        : row.type === 'שרשורי' ? `שרשורי: קוטר ${row.sharshuriType}, אורך ${row.length}`
                        : row.type === 'חיבור גמיש' ? `גמיש: ${row.flexible} יח\', אורך ${row.length} מ\'`
                        : row.notes;

                      return (
                        <tr key={row.id} className={idx % 2 === 0 ? 'pt-even' : 'pt-odd'}>
                          <td>{idx + 1}</td>
                          <td><span dir="ltr">{row.partNumber}</span></td>
                          <td>{row.type}</td>
                          <td className="pt-detail"><bdi>{detail}</bdi></td>
                          <td style={{ textAlign: 'center' }}>{lengthVal}</td>
                          <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{qty}</td>
                          <td className="pt-detail"><bdi>{autoNotes}</bdi></td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ fontWeight: 'bold', backgroundColor: '#dbeafe', borderTop: '2px solid #3b82f6', fontSize: '11px' }}>
                      <td colSpan={5} style={{ textAlign: 'left', padding: '4px 6px' }}>
                        סה"כ: {accessoryRows.length} אביזרים
                      </td>
                      <td style={{ textAlign: 'center', padding: '4px 6px' }}>
                        {accessoryRows.reduce((sum, row) => {
                          const q = row.type === 'מתאם' ? row.adapterQty
                            : row.type === 'שתוצר' ? (row.panels || 1)
                            : row.type === 'חיבור גמיש' ? row.flexible
                            : 1;
                          return sum + (q || 0);
                        }, 0)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {regularRows.length === 0 && accessoryRows.length === 0 && (
              <div className="pt-empty-sheet">גיליון ריק — אין חלקים</div>
            )}

            <div className="pt-footer-block">
              <div className="pt-footer">
                <span className="pt-footer-sign">
                  {companySignature ? (
                    <img src={companySignature} alt="חתימה" style={{ maxHeight: '40px', maxWidth: '150px', objectFit: 'contain', verticalAlign: 'middle' }} />
                  ) : (
                    <>חתימת מנהל עבודה: _________________________</>
                  )}
                </span>
                <span className="pt-footer-date">תאריך הפקה: {today}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
