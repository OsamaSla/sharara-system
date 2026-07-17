import type { RowData } from './types';
import type { CompanyDetails } from './CompanyLetterhead';
import CompanyLetterhead from './CompanyLetterhead';
import ProductionPartSketch, { getPartDisplayName } from './ProductionPartSketch';
import { formatDate } from './utils';

interface ProductionWorksheetProps {
  rows: RowData[];
  sheetName: string;
  projectLabel: string;
  docDate: string;
  docNumber: string;
  companyDetails: CompanyDetails;
  calculateThickness: (w: number, h: number, manual?: number) => number;
}

export default function ProductionWorksheet({
  rows,
  sheetName,
  projectLabel,
  docDate,
  docNumber,
  companyDetails,
  calculateThickness,
}: ProductionWorksheetProps) {
  if (rows.length === 0) {
    return (
      <div className="production-empty">
        אין נתונים להצגה. אנא הוסף חלקים בדפי המדידה תחילה.
      </div>
    );
  }

  // 1. חלוקת השורות לקבוצות לפי סוג האביזר
  const groupedRows = rows.reduce((acc, row) => {
    const typeName = getPartDisplayName(row);
    if (!acc[typeName]) acc[typeName] = [];
    acc[typeName].push(row);
    return acc;
  }, {} as Record<string, RowData[]>);

  let globalRowCounter = 1;

  return (
    <div className="production-print-page">
      <div className="screen-hide-print-show">
        <CompanyLetterhead
          details={companyDetails}
          subtitleOverride="דף עבודה לייצור תעלות ואביזרים"
          className="company-letterhead--production"
        />
      </div>

      {/* Screen-only compact metadata */}
      <div className="no-print" style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#475569', marginBottom: '10px', padding: '4px 8px', backgroundColor: '#f8fafc', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
        <span><b>פרויקט:</b> {projectLabel}</span>
        <span><b>דף:</b> {sheetName}</span>
        <span><b>תאריך:</b> {formatDate(docDate)}</span>
        <span><b>מסמך:</b> <span dir="ltr">#{docNumber}</span></span>
      </div>

      {/* Print-only metadata */}
      <div className="screen-hide-print-show">
        <div className="production-meta">
          <div>
            <div><b>פרויקט:</b> {projectLabel}</div>
            <div><b>דף עבודה:</b> {sheetName}</div>
          </div>
          <div className="production-meta-dates">
            <div><b>תאריך:</b> {formatDate(docDate)}</div>
            <div><b>מסמך סימוכין:</b> <span dir="ltr">#{docNumber}</span></div>
          </div>
        </div>
      </div>

      {Object.entries(groupedRows).map(([partName, partRows]) => {
        const isRound = partName === 'צינור עגול';
        const isLamedS = partName === 'לאמד S';
        const isElbow = partName === 'קשת' || partName === 'קשת (מרפק)';
        const isTransition = partName === 'מעבר' || partName === 'מעבר עם דופן';
        const isPlenum = partName === 'קופסת פיזור';
        const isStraight = !isRound && !isLamedS && !isElbow && !isTransition && !isPlenum;

        // 2. איחוד פריטים בעלי מידות זהות בתוך אותה הקבוצה
        const aggregatedMap: Record<string, {
          row: RowData;
          partNumbers: string[];
          quantity: number;
          thick: number;
        }> = {};

        partRows.forEach((row) => {
          const thick = calculateThickness(row.width1, row.height1, row.manualThickness);
          const key = `${row.width1 || 0}_${row.height1 || 0}_${row.width2 || 0}_${row.height2 || 0}_${row.length || 0}_${row.rBig || 0}_${row.rSmall || 0}_${row.panels || ''}_${thick.toFixed(2)}`;

          if (!aggregatedMap[key]) {
            aggregatedMap[key] = {
              row,
              partNumbers: row.partNumber ? [row.partNumber] : [],
              quantity: 1,
              thick,
            };
          } else {
            aggregatedMap[key].quantity += 1;
            if (row.partNumber && !aggregatedMap[key].partNumbers.includes(row.partNumber)) {
              aggregatedMap[key].partNumbers.push(row.partNumber);
            }
          }
        });

        const uniquePartRows = Object.values(aggregatedMap);

        return (
          <div key={partName} className="production-group-section" style={{ marginBottom: '30px', overflowX: 'auto' }}>
            <h3 className="production-group-title" style={{ borderBottom: '2px solid #111', paddingBottom: '4px', marginTop: '20px', color: '#111' }}>
              {partName} ({partRows.length} יח&apos; סה"כ)
            </h3>
            
            <table className="production-table" style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ fontSize: '11px' }}>
                  <th style={{ textAlign: 'center', width: '4%', padding: '3px 2px' }}>#</th>
                  <th style={{ textAlign: 'center', width: '12%', padding: '3px 2px' }}>מס&apos; חלק</th>
                  <th style={{ textAlign: 'center', width: '10%', backgroundColor: '#f9f9f9', padding: '3px 2px' }}>יח&apos; לייצור</th>
                  <th style={{ textAlign: 'center', width: '22%', padding: '3px 2px' }}>סקיצה</th>
                  
                  {isRound && (
                    <>
                      <th style={{ textAlign: 'center', padding: '3px 2px' }}>קוטר</th>
                      <th style={{ textAlign: 'center', padding: '3px 2px' }}>אורך</th>
                    </>
                  )}
                  {isLamedS && (
                    <>
                      <th style={{ textAlign: 'center', padding: '3px 2px' }}>רוחב</th>
                      <th style={{ textAlign: 'center', padding: '3px 2px' }}>גובה</th>
                      <th style={{ textAlign: 'center', padding: '3px 2px' }}>סטייה</th>
                    </>
                  )}
                  {isElbow && (
                    <>
                      <th style={{ textAlign: 'center', padding: '3px 2px' }}>רוחב</th>
                      <th style={{ textAlign: 'center', padding: '3px 2px' }}>גובה</th>
                      <th style={{ textAlign: 'center', padding: '3px 2px' }}>R גדול</th>
                      <th style={{ textAlign: 'center', padding: '3px 2px' }}>R קטן</th>
                    </>
                  )}
                  {isTransition && (
                    <>
                      <th style={{ textAlign: 'center', padding: '3px 2px' }}>רוחב 1</th>
                      <th style={{ textAlign: 'center', padding: '3px 2px' }}>גובה 1</th>
                      <th style={{ textAlign: 'center', padding: '3px 2px' }}>רוחב 2</th>
                      <th style={{ textAlign: 'center', padding: '3px 2px' }}>גובה 2</th>
                      <th style={{ textAlign: 'center', padding: '3px 2px' }}>אורך</th>
                    </>
                  )}
                  {isPlenum && (
                    <>
                      <th style={{ textAlign: 'center', padding: '3px 2px' }}>רוחב</th>
                      <th style={{ textAlign: 'center', padding: '3px 2px' }}>גובה</th>
                      <th style={{ textAlign: 'center', padding: '3px 2px' }}>עומק</th>
                    </>
                  )}
                  {isStraight && (
                    <>
                      <th style={{ textAlign: 'center', padding: '3px 2px' }}>רוחב</th>
                      <th style={{ textAlign: 'center', padding: '3px 2px' }}>גובה</th>
                      <th style={{ textAlign: 'center', padding: '3px 2px' }}>אורך</th>
                    </>
                  )}
                  
                  <th style={{ textAlign: 'center', padding: '3px 2px' }}>מס' חלקים</th>
                  <th style={{ textAlign: 'center', width: '10%', padding: '3px 2px' }}>עובי פח</th>
                  {isStraight && <th style={{ textAlign: 'center', width: '8%', padding: '3px 2px' }}>דופן</th>}
                </tr>
              </thead>
              <tbody>
                {uniquePartRows.map((item, index) => {
                  const currentIdx = globalRowCounter++;
                  const { row, partNumbers, quantity, thick } = item;

                  // Generating automatic part number
                  const generatedPartNumber = `${sheetName}-${currentIdx}`;

                  // סטייל אחיד ומודגש לכל תאי הנתונים בשורה לדרישת אחידות הגודל
                  const cellDataStyle: React.CSSProperties = {
                    textAlign: 'center',
                    padding: '3px 2px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  };

                  return (
                    <tr key={row.id} className="production-table-row">
                      <td style={{ textAlign: 'center', padding: '3px 2px', fontSize: '12px' }}>{currentIdx}</td>
                      <td style={{ textAlign: 'center', padding: '3px 2px', fontWeight: 'bold', fontSize: '12px' }} dir="ltr">
                        {generatedPartNumber}
                      </td>
                      <td style={{ textAlign: 'center', padding: '3px 2px', fontWeight: 'bold', fontSize: '12px', backgroundColor: '#f9f9f9', color: '#000' }}>
                        {quantity}
                      </td>
                      <td style={{ padding: '2px', textAlign: 'center', printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' as any }}>
                        <div style={{
                          display: 'flex',
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          minWidth: '40px',
                          minHeight: '30px',
                        }}>
                          <ProductionPartSketch row={row} width={40} height={30} />
                          
                          <span style={{ 
                            fontSize: '11px', 
                            fontWeight: 'bold', 
                            color: '#333',
                            backgroundColor: '#f4f4f4',
                            padding: '2px 6px',
                            borderRadius: '3px',
                            border: '1px solid #ddd',
                            whiteSpace: 'nowrap'
                          }}>
                            {partName}
                          </span>
                        </div>
                      </td>

                      {/* נתוני המידות בגופן מוגדל ומודגש */}
                      {isRound && (
                        <>
                          <td style={cellDataStyle}>{row.width1 || '—'}</td>
                          <td style={cellDataStyle}>{row.length || '—'}</td>
                        </>
                      )}
                      {isLamedS && (
                        <>
                          <td style={cellDataStyle}>{row.width1 || '—'}</td>
                          <td style={cellDataStyle}>{row.height1 || '—'}</td>
                          <td style={cellDataStyle}>{row.rSmall || '—'}</td>
                        </>
                      )}
                      {isElbow && (
                        <>
                          <td style={cellDataStyle}>{row.width1 || '—'}</td>
                          <td style={cellDataStyle}>{row.height1 || '—'}</td>
                          <td style={cellDataStyle}>{row.rBig || '—'}</td>
                          <td style={cellDataStyle}>{row.rSmall || '—'}</td>
                        </>
                      )}
                      {isTransition && (
                        <>
                          <td style={cellDataStyle}>{row.width1 || '—'}</td>
                          <td style={cellDataStyle}>{row.height1 || '—'}</td>
                          <td style={row.width2 ? cellDataStyle : {textAlign: 'center', color: '#ccc', fontWeight: 'bold'}}>{row.width2 || '—'}</td>
                          <td style={row.height2 ? cellDataStyle : {textAlign: 'center', color: '#ccc', fontWeight: 'bold'}}>{row.height2 || '—'}</td>
                          <td style={cellDataStyle}>{row.length || '—'}</td>
                        </>
                      )}
                      {isPlenum && (
                        <>
                          <td style={cellDataStyle}>{row.width1 || '—'}</td>
                          <td style={cellDataStyle}>{row.height1 || '—'}</td>
                          <td style={cellDataStyle}>{row.length || '—'}</td>
                        </>
                      )}
                      {isStraight && (
                        <>
                          <td style={cellDataStyle}>{row.width1 || '—'}</td>
                          <td style={cellDataStyle}>{row.height1 || '—'}</td>
                          <td style={cellDataStyle}>{row.length || '—'}</td>
                        </>
                      )}

                      {/* נתון מס' חלקים */}
                      <td style={cellDataStyle}>{row.panels || '—'}</td>

                      {/* תיקון עובי הפח שיופיע באותו הגודל המודגש */}
                      <td style={cellDataStyle} dir="ltr">
                        {thick ? thick.toFixed(2) : '—'}
                      </td>
                      
                      {isStraight && (
                        <td style={cellDataStyle}>{row.panels || '—'}</td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}

      <div className="production-page-footer screen-hide-print-show" style={{ marginTop: '40px' }}>
        <div>
          <div><b>דואר למשלוח:</b> {companyDetails.pobox}</div>
          <div>
            <b>טלפון:</b> <span dir="ltr">{companyDetails.phone}</span>
            {' | '}
            <b>פקס:</b> <span dir="ltr">{companyDetails.fax}</span>
            {' | '}
            <b>נייד:</b> <span dir="ltr">{companyDetails.mobile}</span>
          </div>
          <div>
            <b>אתר:</b> {companyDetails.website}
            {' | '}
            <b>מייל:</b> <span dir="ltr">{companyDetails.email}</span>
          </div>
        </div>
        <div className="production-footer-sign">
          <div><b>משרד ראשי ומפעל:</b> {companyDetails.address}</div>
          <div className="production-sign-box">חתימת מנהל עבודה</div>
        </div>
      </div>
    </div>
  );
}