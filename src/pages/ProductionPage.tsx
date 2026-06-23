import type { Sheet } from '../types';
import type { CompanyDetails } from '../CompanyLetterhead';
import ProductionWorksheet from '../ProductionWorksheet';

interface ProductionPageProps {
  activeSheet: Sheet;
  selectedProject: string;
  isNewProject: boolean;
  newProjectName: string;
  isNewClient: boolean;
  selectedClientKey: string;
  clientDetails: { name: string };
  docDate: string;
  docNumber: string;
  myCompanyDetails: CompanyDetails;
  calculateThickness: (w: number, h: number, manual?: number) => number;
  handlePrint: () => void;
}

export default function ProductionPage({
  activeSheet,
  selectedProject,
  isNewProject,
  newProjectName,
  isNewClient,
  selectedClientKey,
  clientDetails,
  docDate,
  docNumber,
  myCompanyDetails,
  calculateThickness,
  handlePrint,
}: ProductionPageProps) {
  return (
    <div className="no-shadow landscape-print print-document production-print-document" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div className="print-orientation-spacer landscape-print" aria-hidden="true" />

      {/* סרגל כפתורי ניהול מוסתר בהדפסה */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '20px', backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #cbd5e1', gap: '8px' }}>
        <button
          onClick={handlePrint}
          style={{
            padding: '10px 24px',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          הדפס דפי ייצור / שמור כ-PDF
        </button>
      </div>

      <ProductionWorksheet
        rows={activeSheet.rows}
        sheetName={activeSheet.name}
        projectLabel={`${isNewProject ? newProjectName : selectedProject} - ${isNewClient ? clientDetails.name : selectedClientKey}`}
        docDate={docDate}
        docNumber={docNumber}
        companyDetails={myCompanyDetails}
        calculateThickness={calculateThickness}
      />
    </div>
  );
}
