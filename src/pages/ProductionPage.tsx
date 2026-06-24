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
    <div className="no-shadow landscape-print print-document production-print-document" style={{ width: '100%', maxWidth: '100%', margin: '0 auto' }}>
      <div className="print-orientation-spacer landscape-print" aria-hidden="true" />

      {/* סרגל כפתורי ניהול מוסתר בהדפסה */}
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
            fontSize: '11px',
          }}
        >
          הדפס דפי ייצור / שמור PDF
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
