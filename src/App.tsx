import React, { useState, useEffect } from 'react';
import './App.css';
import { FileSpreadsheet, Layers, CreditCard, Building2, Briefcase, User, Phone, Mail, CheckCircle2 } from 'lucide-react';
import PrintableReport from './PrintableReport';
import { SAMPLE_SNAPSHOT } from './sampleData';
import CompanyLetterhead from './CompanyLetterhead';
import ProductionWorksheet from './ProductionWorksheet';
import { db } from './firebase';
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import logoSrc from './assets/logo.png';
import { EXISTING_DATA, DEFAULT_FORMULAS } from './constants';
import { calculateThickness, calculateArea, getPrice as getPriceFromCalc, getRowWarnings, getDetailedSheetCosts as getDetailedSheetCostsFromCalc, getProjectTotals as getProjectTotalsFromCalc, getSubtotal as getSubtotalFromCalc, getSheetTotals, setFormulas as setFormulasCalc } from './calculations';

import type { RowData, Sheet, PriceItem, FormulaConfig } from './types';
import MeasurementPage from './pages/MeasurementPage';
import SummaryPage from './pages/SummaryPage';
import InvoicePage from './pages/InvoicePage';
import PriceListPage from './pages/PriceListPage';
import ProductionPage from './pages/ProductionPage';
export type { RowData, Sheet, PriceItem };

export default function App() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // סטייטים של אבטחה וכניסה לאתר (sessionStorage לשמירת החיבור)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => sessionStorage.getItem('sharara_isLoggedIn') === 'true');
  const [loginUsername, setLoginUsername] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');

  // שלבי עבודה: false = מסך הגדרת לקוח/פרויקט, true = כניסה לעבודה על הטבלאות
  const [isSessionInitialized, setIsSessionInitialized] = useState<boolean>(false);

  // בסיס נתונים של לקוחות ופרויקטים קיימים במערכת (טעינה מ-localStorage אם קיים)
  const [clientsData, setClientsData] = useState<Record<string, {
    phone: string;
    email: string;
    contact: string;
    regDate: string;
    projects: string[];
  }>>(() => {
    const saved = localStorage.getItem('sharara_clientsData');
    return saved ? JSON.parse(saved) : EXISTING_DATA;
  });

  // סטייט ניהול לקוח
  const [isNewClient, setIsNewClient] = useState<boolean>(false);
  const [selectedClientKey, setSelectedClientKey] = useState<string>("אלקטרה מיזוג אוויר");
  
  // פרטי לקוח (עבור לקוח חדש או מילוי אוטומטי של קיים)
  const [clientDetails, setClientDetails] = useState({
    name: "אלקטרה מיזוג אוויר",
    phone: "03-9404040",
    email: "info@electra.co.il",
    contact: "יוסי לוי",
    regDate: "2025-01-10"
  });

  // סטייט ניהול פרויקט
  const [isNewProject, setIsNewProject] = useState<boolean>(false);
  const [selectedProject, setSelectedProject] = useState<string>("מגדלי עזריאלי קומה 4");
  const [newProjectName, setNewProjectName] = useState<string>('');

  // פרטי מסמך כלליים
  const [docDate, setDocDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [docNumber, setDocNumber] = useState<string>('1001');

  // דפי המדידות והשורות
  const [sheets, setSheets] = useState<Sheet[]>([
    {
      id: '1',
      name: 'דף מדידה #1',
      rows: [{ 
        id: '1', partNumber: 'P001', type: 'קטע ישר', width1: 0.5, height1: 0.4, width2: 0, height2: 0, length: 1.0, rBig: 0, rSmall: 0,
        shatuzar: false, flexible: 0, acoustic: true, external: false, 
        sharshuriType: 'ללא', sharshuriLen: 0, adapterType: 'ללא', adapterQty: 0, notes: '', manualThickness: 0, rBig2: 0, panels: 0, dofan: 0
      }]
    }
  ]);
  const [activeSheetId, setActiveSheetId] = useState<string>('1');
  const [activeTab, setActiveTab] = useState<'measure' | 'summary' | 'invoice' | 'pricelist' | 'production'>('measure');
  const [editingSheetId, setEditingSheetId] = useState<string | null>(null);
  const [editingSheetName, setEditingSheetName] = useState<string>('');

  // מחירון מעודכן הניתן לעריכה בכל עת (טעינה מ-localStorage)
  const [pricesList, setPricesList] = useState<PriceItem[]>(() => {
    const saved = localStorage.getItem('sharara_pricesList');
    return saved ? JSON.parse(saved) : [
      { id: "1", detail: 'פח 0.7', unit: 'מ"ר', price: 100 },
      { id: "2", detail: 'פח 0.8', unit: 'מ"ר', price: 105 },
      { id: "3", detail: 'פח 0.9', unit: 'מ"ר', price: 110 },
      { id: "4", detail: 'פח 1.0', unit: 'מ"ר', price: 140 },
      { id: "5", detail: 'פח 1.25', unit: 'מ"ר', price: 160 },
      { id: "6", detail: 'פח שחור 2מ"מ', unit: 'מ"ר', price: 420 },
      { id: "7", detail: 'התקנת פתח גישה', unit: 'יחידה', price: 200 },
      { id: "8", detail: 'בידוד פנימי 1"', unit: 'מ"ר', price: 45 },
      { id: "9", detail: 'בידוד פנימי 2"', unit: 'מ"ר', price: 90 },
      { id: "10", detail: 'בידוד חיצוני 1"', unit: 'מ"ר', price: 45 },
      { id: "11", detail: 'בידוד חיצוני 2"', unit: 'מ"ר', price: 90 },
      { id: "12", detail: 'בידוד קרמי', unit: 'מ"ר', price: 450 },
      { id: "13", detail: 'חיבור גמיש', unit: 'מ"א', price: 90 },
      { id: "14", detail: 'שתוצר עגול', unit: 'יחידה', price: 50 },
      { id: "15", detail: 'שרשורי 4"', unit: 'מ"א', price: 50 },
      { id: "16", detail: 'שרשורי 6"', unit: 'מ"א', price: 60 },
      { id: "17", detail: 'שרשורי 8"', unit: 'מ"א', price: 70 },
      { id: "18", detail: 'שרשורי 10"', unit: 'מ"א', price: 80 },
      { id: "19", detail: 'שרשורי 12"', unit: 'מ"א', price: 90 },
      { id: "20", detail: 'שרשורי 14"', unit: 'מ"א', price: 100 },
      { id: "21", detail: 'דמפר עגול עד 10"', unit: 'יחידה', price: 125 },
      { id: "22", unit: 'יחידה', detail: 'קופסת ניפוח', price: 250 },
      { id: "23", unit: 'מ"ר', detail: 'חיבור אוגנים', price: 25 },
      { id: "24", unit: 'מ"ר', detail: 'תעלות ספירקל', price: 205 },
      { id: "25", unit: 'מ"ר', detail: 'צבע', price: 50 },
      { id: "26", unit: 'מ"ר', detail: 'איטום', price: 20 },
      { id: "27", unit: 'יחידה', detail: 'התקנת דמפר אש/ווסות', price: 200 },
      { id: "28", unit: 'יחידה', detail: 'מתאם 6"6/"', price: 60 },
      { id: "29", unit: 'יחידה', detail: 'מתאם 8"8/"', price: 80 },
      { id: "30", unit: 'יחידה', detail: 'מתאם 10"10/"', price: 100 },
      { id: "31", unit: 'יחידה', detail: 'מתאם 12"12/"', price: 110 },
      { id: "32", unit: 'יחידה', detail: 'מתאם 14"14/"', price: 120 },
      { id: "33", unit: 'יחידה', detail: 'מתאם 16"16/"', price: 140 },
      { id: "34", unit: 'יחידה', detail: 'מתאם 60/60', price: 180 },
      { id: "35", unit: 'יחידה', detail: 'התקנת מפוח', price: 400 },
      { id: "36", unit: 'יחידה', detail: 'התקנת משתיק', price: 250 }
    ];
  });

  // פרטי העסק שלי (עלי שרארה בע"מ) עבור הלוגו ונייר המכתבים הרשמי
  const [myCompanyDetails, setMyCompanyDetails] = useState(() => {
    const defaultServiceLines = [
      'תכנון וביצוע מערכות מיזוג אוויר ואוורור * פינוי עשן * ייצור תעלות פח',
      'צינורות "ספיראל" ואביזרים * תעלות נירוסטה ומנדפים * תעלות',
      'פח שחור * חיתוך וכיפוף פחים * מכירה והתקנת כל סוגי המזגנים',
    ];
    const saved = localStorage.getItem('sharara_myCompanyDetails');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.email === "sh_ali@netvision.net.il") {
        parsed.email = "info@sharara.co.il";
      }
      if (parsed.mobile === "050-5215192") {
        parsed.mobile = "053-5819466";
      }
      if (!parsed.serviceLines) {
        parsed.serviceLines = defaultServiceLines;
      }
      return parsed;
    }
    return {
      name: "עלי שרארה בע\"מ",
      engName: "Sharara 1970",
      subtitle: "תעשיות פח ומערכות אוורור ומיזוג אוויר",
      website: "www.sharara.co.il",
      email: "info@sharara.co.il",
      address: "אזור תעשייה, נצרת עילית (ריינה) ת.ד. 4174",
      phone: "04-6082264",
      fax: "04-6082263",
      mobile: "053-5819466",
      pobox: "4040/4 שכ' מזרחית מיקוד 16000",
      services: [
        "תכנון וביצוע מערכות מיזוג אוויר ואוורור",
        "פינוי עשן",
        "ייצור תעלות פח",
        "צינורות \"ספיראל\" ואביזרים",
        "תעלות נירוסטה ומנדפים",
        "תעלות פח שחור",
        "חיתוך וכיפוף פחים",
        "מכירה והתקנת כל סוגי המזגנים"
      ],
      serviceLines: defaultServiceLines,
    };
  });
  const [isEditingMyCompany, setIsEditingMyCompany] = useState<boolean>(false);

  // לוגו החברה הדינמי (base64) עם שמירה ב-localStorage
  const [companyLogo, setCompanyLogo] = useState<string>(() => {
    const saved = localStorage.getItem('sharara_companyLogo');
    return saved || '';
  });

  // שמירת מספרי סימוכין ותאריכים ייחודיים לכל שילוב פרויקט ולקוח, כדי לזכור אותם במעבר חוזר
  const [projectDocNumbers, setProjectDocNumbers] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('sharara_projectDocNumbers');
    return saved ? JSON.parse(saved) : {
      "אלקטרה מיזוג אוויר-מגדלי עזריאלי קומה 4": "1001"
    };
  });
  const [projectDocDates, setProjectDocDates] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('sharara_projectDocDates');
    return saved ? JSON.parse(saved) : {
      "אלקטרה מיזוג אוויר-מגדלי עזריאלי קומה 4": new Date().toISOString().split('T')[0]
    };
  });

  // מעקב אחר פרויקטים שהופקו וננעלו
  const [producedProjects, setProducedProjects] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('sharara_producedProjects');
    return saved ? JSON.parse(saved) : {};
  });

  // שמירת סנאפשוט של דפי המדידות ברגע ההפקה
  const [producedSnapshots, setProducedSnapshots] = useState<Record<string, Sheet[]>>(() => {
    const saved = localStorage.getItem('sharara_producedSnapshots');
    return saved ? JSON.parse(saved) : {};
  });

  // מחסניות לטובת ביצוע UNDO ו-REDO
  const [undoStack, setUndoStack] = useState<Sheet[][]>([]);
  const [redoStack, setRedoStack] = useState<Sheet[][]>([]);

  const [lastHoveredRowId, setLastHoveredRowId] = useState<string | null>(null);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [partPresets, setPartPresets] = useState<{name: string, data: Omit<RowData, 'id'>}[]>(() => {
    try { return JSON.parse(localStorage.getItem('sharara-presets') || '[]'); } catch { return []; }
  });

  // שמירת מזהה הלקוח שממנו ייבאנו פרטים בעת יצירת לקוח חדש
  const [importedClientSourceKey, setImportedClientSourceKey] = useState<string>('');

  // מעקב אחר החברה והפרויקט הפעילים כרגע בטבלה כדי לזהות מתי הם הוחלפו ולתחול דפים מחדש
  const [loadedClientProject, setLoadedClientProject] = useState({
    client: "אלקטרה מיזוג אוויר",
    project: "מגדלי עזריאלי קומה 4"
  });

  // סטייטים לעריכת לקוחות ופרויקטים
  const [isEditingClient, setIsEditingClient] = useState<boolean>(false);
  const [isEditingProjectName, setIsEditingProjectName] = useState<boolean>(false);
  const [tempProjectName, setTempProjectName] = useState<string>('');

  // סטייטים להוספת חלקים באמצעות טופס צורות ויזואלי (כמו באפליקציה המקורית)
  const [isAddingPart, setIsAddingPart] = useState<boolean>(false);
  const [newPartData, setNewPartData] = useState<RowData>({
    id: '',
    type: 'קטע ישר',
    width1: 0.5,
    height1: 0.4,
    width2: 0,
    height2: 0,
    length: 1.0,
    rBig: 0,
    rSmall: 0,
    shatuzar: false,
    flexible: 0,
    acoustic: true,
    external: false,
    sharshuriType: 'ללא',
    sharshuriLen: 0,
    adapterType: 'ללא',
    adapterQty: 0,
    notes: '',
    partNumber: '',
    manualThickness: 0,
    rBig2: 0,
    panels: 0,
    dofan: 0
  });
  const [quickQty, setQuickQty] = useState<number>(1);
  const [invoicePriceOverrides, setInvoicePriceOverrides] = useState<Record<string, number>>({});
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportFileName, setExportFileName] = useState('');
  const [backups, setBackups] = useState<{ id: string; name: string; savedAt: string; client: string; project: string; sheetCount: number }[]>([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [showBackupsList, setShowBackupsList] = useState(false);
  const [isAdmin, setIsAdmin] = useState(() => sessionStorage.getItem('sharara_isAdmin') === 'true');
  const [adminPasscode, setAdminPasscode] = useState(() => localStorage.getItem('sharara_adminPasscode') || '1029');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPasscodeInput, setAdminPasscodeInput] = useState('');
  const [showChangeAdminPasscode, setShowChangeAdminPasscode] = useState(false);
  const [newAdminPasscode, setNewAdminPasscode] = useState('');
  const [newAdminPasscodeConfirm, setNewAdminPasscodeConfirm] = useState('');
  const [appLoginUser, setAppLoginUser] = useState(() => localStorage.getItem('sharara_appLoginUser') || '0');
  const [appLoginPass, setAppLoginPass] = useState(() => localStorage.getItem('sharara_appLoginPass') || '0000');
  const [showChangeAppCredentials, setShowChangeAppCredentials] = useState(false);
  const [newAppUser, setNewAppUser] = useState('');
  const [newAppPass, setNewAppPass] = useState('');
  const [newAppPassConfirm, setNewAppPassConfirm] = useState('');
  const [activeAdminSection, setActiveAdminSection] = useState<string | null>(null);

  const [formulas, setFormulas] = useState<FormulaConfig>(() => {
    try {
      const saved = localStorage.getItem('sharara_formulas');
      return saved ? { ...DEFAULT_FORMULAS, ...JSON.parse(saved) } : { ...DEFAULT_FORMULAS };
    } catch { return { ...DEFAULT_FORMULAS }; }
  });

  useEffect(() => {
    setFormulasCalc(formulas);
  }, [formulas]);

  // אפקטים לשמירה אוטומטית בענן (Firestore)
  useEffect(() => {
    if (isLoading) return;
    const saveData = async () => {
      try {
        await setDoc(doc(db, 'appData', 'mainData'), {
          clientsData,
          pricesList,
          myCompanyDetails,
          projectDocNumbers,
          projectDocDates,
          producedProjects,
          producedSnapshots
        });
        setLastSaved(new Date());
      } catch (error) {
        console.error("Error saving to Firestore: ", error);
      }
    };
    const timer = setTimeout(saveData, 1500);
    return () => clearTimeout(timer);
  }, [clientsData, pricesList, myCompanyDetails, projectDocNumbers, projectDocDates, producedProjects, producedSnapshots, isLoading]);

  useEffect(() => {
    const clearPrintTab = () => document.documentElement.removeAttribute('data-print-tab');
    window.addEventListener('afterprint', clearPrintTab);
    return () => window.removeEventListener('afterprint', clearPrintTab);
  }, []);

  const handlePrint = () => {
    document.documentElement.setAttribute('data-print-tab', activeTab);
    window.print();
  };

  // ─── טעינת נתוני דוגמה ───
  const loadSampleData = () => {
    if (!confirm('האם לטעון נתוני דוגמה?\n⚠️ כל הנתונים הנוכחיים יוחלפו.')) return;
    const snap = SAMPLE_SNAPSHOT;
    setSheets(snap.sheets.map(s => ({ ...s, rows: s.rows.map(r => ({ ...r })) })));
    setClientsData(snap.clientsData);
    setProjectDocNumbers(snap.projectDocNumbers);
    setProjectDocDates(snap.projectDocDates);
    setActiveSheetId(snap.sheets[0].id);
    setSelectedClientKey(snap.selectedClient);
    setSelectedProject(snap.selectedProject);
    setClientDetails(snap.clientsData[snap.selectedClient] || { phone: '', email: '', contact: '', regDate: '', projects: [] });
    setUndoStack([]);
    setRedoStack([]);
    setSelectedRowIds(new Set());
    setLastHoveredRowId(null);
    setLastSaved(new Date());
    setLoadedClientProject({ client: snap.selectedClient, project: snap.selectedProject });
    setIsSessionInitialized(true);
    setIsAddingPart(false);
    setActiveTab('measure');
  };

  // ─── ייצוא JSON ───
  const handleExportJSON = () => {
    const defaultName = `sharara-${selectedClientKey || 'project'}-${selectedProject || ''}-${new Date().toISOString().slice(0, 10)}`.replace(/--/g, '-');
    setExportFileName(defaultName);
    setShowExportDialog(true);
  };
  const doExportJSON = async () => {
    // Save to local file
    const data = {
      sheets,
      clientsData,
      pricesList,
      myCompanyDetails,
      projectDocNumbers,
      projectDocDates,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exportFileName || 'sharara-export'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Also save to Firebase
    const saved = await saveToFirebaseBackup(exportFileName);
    if (saved) {
      await loadFirebaseBackups();
    } else {
      alert('⚠️ הקובץ נשמר מקומית אך הגיבוי בענן נכשל.\nבדוק את חיבור האינטרנט או את ההגדרות של חוסם המודעות.');
    }
    setShowExportDialog(false);
  };

  // ─── ייבוא JSON ───
  const importFromJSON = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          if (data.sheets) setSheets(data.sheets);
          if (data.clientsData) setClientsData(data.clientsData);
          if (data.pricesList) setPricesList(data.pricesList);
          if (data.myCompanyDetails) setMyCompanyDetails(data.myCompanyDetails);
          if (data.projectDocNumbers) setProjectDocNumbers(data.projectDocNumbers);
          if (data.projectDocDates) setProjectDocDates(data.projectDocDates);
          setUndoStack([]);
          setRedoStack([]);
          setLastSaved(new Date());
          alert('✅ הנתונים יובאו בהצלחה!');
        } catch (err) {
          alert('❌ שגיאה בקריאת קובץ JSON');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // ─── איפוס מלא ───
  const resetProject = () => {
    if (!confirm('⚠️ האם לאפס את כל הפרויקט?\n\nפעולה זו תמחק את כל נתוני המדידות, הלקוחות והפרויקטים.\nלא ניתן לבטל פעולה זו!')) return;
    const freshSheet: Sheet = { id: '1', name: 'דף מדידה #1', rows: [
      { id: '1', partNumber: 'P001', type: 'קטע ישר', width1: 0.5, height1: 0.4, width2: 0, height2: 0, length: 1.0, rBig: 0, rSmall: 0, shatuzar: false, flexible: 0, acoustic: true, external: false, sharshuriType: 'ללא', sharshuriLen: 0, adapterType: 'ללא', adapterQty: 0, notes: '', manualThickness: 0, rBig2: 0, panels: 0, dofan: 0 }
    ]};
    setSheets([freshSheet]);
    setClientsData({});
    setProjectDocNumbers({});
    setProjectDocDates({});
    setActiveSheetId('1');
    setSelectedClientKey('');
    setSelectedProject('');
    setClientDetails({ phone: '', email: '', contact: '', regDate: '', projects: [] });
    setUndoStack([]);
    setRedoStack([]);
    setLastSaved(new Date());
    setLoadedClientProject({ client: '', project: '' });
    setIsSessionInitialized(false);
    setActiveTab('measure');
    setInvoicePriceOverrides({});
    setPartPresets([]);
    localStorage.removeItem('sharara-presets');
    alert('✅ הפרויקט אופס בהצלחה!');
  };

  // ─── Firebase Backups ───
  const saveToFirebaseBackup = async (backupName?: string) => {
    const name = backupName || `backup-${new Date().toISOString().slice(0, 16).replace('T', '_').replace(/:/g, '-')}`;
    const snapshot = {
      name,
      savedAt: new Date().toISOString(),
      client: selectedClientKey,
      project: selectedProject,
      sheets,
      clientsData,
      pricesList,
      myCompanyDetails,
      projectDocNumbers,
      projectDocDates,
    };
    try {
      await setDoc(doc(db, 'appBackups', name), snapshot);
      return true;
    } catch (error) {
      console.error('Error saving backup:', error);
      return false;
    }
  };

  const loadFirebaseBackups = async () => {
    setLoadingBackups(true);
    try {
      const snapshot = await getDocs(collection(db, 'appBackups'));
      const list = snapshot.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name || d.id,
          savedAt: data.savedAt || '',
          client: data.client || '',
          project: data.project || '',
          sheetCount: data.sheets?.length || 0,
        };
      });
      list.sort((a, b) => (b.savedAt || '').localeCompare(a.savedAt || ''));
      setBackups(list);
    } catch (error) {
      console.error('Error loading backups:', error);
    } finally {
      setLoadingBackups(false);
    }
  };

  const restoreFromFirebaseBackup = async (backupId: string) => {
    if (!confirm('האם לשחזר גיבוי זה?\n⚠️ הנתונים הנוכחיים יוחלפו.')) return;
    try {
      const docSnap = await getDoc(doc(db, 'appBackups', backupId));
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.sheets) setSheets(data.sheets);
        if (data.clientsData) setClientsData(data.clientsData);
        if (data.pricesList) setPricesList(data.pricesList);
        if (data.myCompanyDetails) setMyCompanyDetails(data.myCompanyDetails);
        if (data.projectDocNumbers) setProjectDocNumbers(data.projectDocNumbers);
        if (data.projectDocDates) setProjectDocDates(data.projectDocDates);
        if (data.client) setSelectedClientKey(data.client);
        if (data.project) setSelectedProject(data.project);
        setUndoStack([]);
        setRedoStack([]);
        setLastSaved(new Date());
        setShowBackupsList(false);
        setIsSessionInitialized(true);
        setActiveTab('measure');
      }
    } catch (error) {
      console.error('Error restoring backup:', error);
    }
  };

  const deleteFirebaseBackup = async (backupId: string) => {
    if (!confirm(`למחוק את הגיבוי "${backupId}"?`)) return;
    try {
      await deleteDoc(doc(db, 'appBackups', backupId));
      setBackups(backups.filter(b => b.id !== backupId));
    } catch (error) {
      console.error('Error deleting backup:', error);
    }
  };

  // טעינת נתונים מ-Firestore
  useEffect(() => {
    const loadData = async () => {
      try {
        const docRef = doc(db, 'appData', 'mainData');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.clientsData) setClientsData(data.clientsData);
          if (data.pricesList) setPricesList(data.pricesList);
          if (data.myCompanyDetails) setMyCompanyDetails(data.myCompanyDetails);
        }
      } catch (error) {
        console.error("Error loading from Firestore: ", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginUsername === appLoginUser && loginPassword === appLoginPass) {
      setIsLoggedIn(true);
      sessionStorage.setItem('sharara_isLoggedIn', 'true');
      setLoginError('');
    } else {
      setLoginError('שם משתמש או סיסמה שגויים');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    sessionStorage.removeItem('sharara_isLoggedIn');
    setLoginUsername('');
    setLoginPassword('');
  };

  // מאזין גלובלי למקשי מקלדת Ctrl+Z, Ctrl+Y, Ctrl+D, Delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isSessionInitialized || activeTab !== 'measure') return;
      
      if (e.ctrlKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      }
      if (e.ctrlKey && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
      if (e.ctrlKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        if (lastHoveredRowId) duplicateRow(lastHoveredRowId);
      }
      if (e.key === 'Delete' && !isAddingPart && lastHoveredRowId) {
        e.preventDefault();
        deleteRow(lastHoveredRowId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoStack, redoStack, sheets, isSessionInitialized, activeTab, lastHoveredRowId, isAddingPart]);

  // הצגת מסך טעינה - ממוקם אחרי כל ה-useState וה-useEffect כדי למנוע חריגה מחוקי ה-Hooks

  if (isLoading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>טוען נתונים מהענן...</div>;
  }

  // שחזור או יצירת מספר סימוכין ותאריך עבור לקוח ופרויקט ספציפיים
  const getOrCreateDocDetails = (clientName: string, projectName: string) => {
    const key = `${clientName}-${projectName}`;
    
    // שחזור או יצירת מספר סימוכין
    let docNum = projectDocNumbers[key];
    if (!docNum) {
      docNum = Math.floor(1000 + Math.random() * 9000).toString();
      setProjectDocNumbers(prev => ({ ...prev, [key]: docNum }));
    }
    setDocNumber(docNum);

    // שחזור או יצירת תאריך מסמך
    let docDt = projectDocDates[key];
    if (!docDt) {
      docDt = new Date().toISOString().split('T')[0];
      setProjectDocDates(prev => ({ ...prev, [key]: docDt }));
    }
    setDocDate(docDt);
  };

  // שינוי בחירת לקוח קיים - מעדכן אוטומטית את כל השדות והפרויקטים המשויכים
  const handleClientSelectChange = (clientName: string, updatedData?: typeof clientsData) => {
    setSelectedClientKey(clientName);
    const data = (updatedData || clientsData)[clientName];
    if (data) {
      setClientDetails({
        name: clientName,
        phone: data.phone,
        email: data.email,
        contact: data.contact,
        regDate: data.regDate
      });
      setIsNewProject(false);
      const firstProj = data.projects[0] || '';
      setSelectedProject(firstProj);

      // שחזור או יצירת פרטי סימוכין עבור הפרויקט
      getOrCreateDocDetails(clientName, firstProj);
    }
  };

  // שינוי בחירת פרויקט קיים מהרשימה
  const handleProjectSelectChange = (projectName: string) => {
    setSelectedProject(projectName);
    getOrCreateDocDetails(selectedClientKey, projectName);
  };

  // מעבר למצב לקוח חדש / מחיקת שדות
  const toggleClientMode = (isNew: boolean) => {
    setIsNewClient(isNew);
    setImportedClientSourceKey(''); // איפוס מזהה הייבוא
    if (isNew) {
      setClientDetails({ name: '', phone: '', email: '', contact: '', regDate: new Date().toISOString().split('T')[0] });
      setIsNewProject(true);
      setSelectedProject('');
      getOrCreateDocDetails('', '');
    } else {
      const firstClient = Object.keys(clientsData)[0];
      if (firstClient) {
        handleClientSelectChange(firstClient);
      } else {
        setIsNewClient(true);
        getOrCreateDocDetails('', '');
      }
    }
  };

  // שמירת שינויים בפרטי לקוח קיים
  const saveClientChanges = () => {
    const oldName = selectedClientKey;
    const newName = clientDetails.name.trim();
    if (!newName) {
      alert("שם החברה אינו יכול להיות ריק");
      return;
    }
    
    const updated = { ...clientsData };
    const clientData = updated[oldName];
    if (clientData) {
      if (oldName !== newName) {
        delete updated[oldName];
      }
      updated[newName] = {
        ...clientData,
        phone: clientDetails.phone,
        email: clientDetails.email,
        contact: clientDetails.contact,
        regDate: clientDetails.regDate
      };
      setClientsData(updated);
      setSelectedClientKey(newName);
      setIsEditingClient(false);
    }
  };

  // ביטול עריכת לקוח קיים - מחזיר את הערכים המקוריים
  const cancelClientEditing = () => {
    setIsEditingClient(false);
    handleClientSelectChange(selectedClientKey);
  };

  // מחיקת לקוח קיים
  const deleteClient = () => {
    const clientToDelete = selectedClientKey;
    const confirmDelete = window.confirm(`האם אתה בטוח שברצונך למחוק את הלקוח "${clientToDelete}" ואת כל הפרויקטים שלו?`);
    if (!confirmDelete) return;

    const updated = { ...clientsData };
    delete updated[clientToDelete];
    setClientsData(updated);

    const remainingClients = Object.keys(updated);
    if (remainingClients.length > 0) {
      handleClientSelectChange(remainingClients[0], updated);
    } else {
      setIsNewClient(true);
      setClientDetails({ name: '', phone: '', email: '', contact: '', regDate: new Date().toISOString().split('T')[0] });
      setIsNewProject(true);
      setSelectedProject('');
    }
  };

  // שמירת שינוי שם פרויקט
  const saveProjectNameChanges = () => {
    const newName = tempProjectName.trim();
    const oldName = selectedProject;
    if (!newName) {
      alert("שם הפרויקט אינו יכול להיות ריק");
      return;
    }

    const updated = { ...clientsData };
    const client = updated[selectedClientKey];
    if (client) {
      client.projects = client.projects.map(p => p === oldName ? newName : p);
      setClientsData(updated);
      setSelectedProject(newName);
      setIsEditingProjectName(false);
    }
  };

  // מחיקת פרויקט של לקוח קיים
  const deleteProject = () => {
    const projectToDelete = selectedProject;
    const confirmDelete = window.confirm(`האם אתה בטוח שברצונך למחוק את הפרויקט "${projectToDelete}"?`);
    if (!confirmDelete) return;

    const updated = { ...clientsData };
    const client = updated[selectedClientKey];
    if (client) {
      client.projects = client.projects.filter(p => p !== projectToDelete);
      setClientsData(updated);
      if (client.projects.length > 0) {
        setSelectedProject(client.projects[0]);
      } else {
        setIsNewProject(true);
        setSelectedProject('');
      }
    }
  };

  const activeSheet = sheets.find(s => s.id === activeSheetId) || sheets[0];

  const getPrice = (name: string): number => getPriceFromCalc(name, pricesList);
  const getDetailedSheetCosts = (sheet: Sheet) => getDetailedSheetCostsFromCalc(sheet, pricesList);
  const getProjectTotals = () => getProjectTotalsFromCalc(sheets, pricesList);
  const getSubtotal = () => getSubtotalFromCalc(sheets, pricesList);

  const totals = getProjectTotals();
  const subtotal = getSubtotal();
  const vat = subtotal * 0.18;
  const finalTotal = subtotal + vat;


  const updateRow = (id: string, field: keyof RowData, value: any) => {
    // בדיקה האם פרויקט זה כבר הופק בעבר והנתון היה קיים בזמן ההפקה
    const currentClient = isNewClient ? clientDetails.name : selectedClientKey;
    const currentProject = isNewProject ? newProjectName : selectedProject;
    const key = `${currentClient}-${currentProject}`;
    
    if (producedProjects[key]) {
      const snapshot = producedSnapshots[key];
      const existedBeforeProduction = snapshot?.some(s => s.rows.some(r => r.id === id));
      if (existedBeforeProduction) {
        const confirmEdit = window.confirm("שים לב! נתון זה כבר הופק בעבר. האם אתה בטוח שברצונך לבצע שינויים?");
        if (!confirmEdit) return;
      }
    }

    pushToHistory(sheets);
    setSheets(sheets.map(s => {
      if (s.id === activeSheetId) {
        return {
          ...s,
          rows: s.rows.map(r => {
            if (r.id === id) {
              const updated = { ...r, [field]: value };
              if (updated.type === 'קשת' && (field === 'width1' || field === 'rSmall')) {
                updated.rBig = updated.width1 + updated.rSmall;
              }
              return updated;
            }
            return r;
          })
        };
      }
      return s;
    }));
  };

  const deleteRow = (id: string) => {
    // בדיקה האם פרויקט זה כבר הופק בעבר והנתון היה קיים בזמן ההפקה
    const currentClient = isNewClient ? clientDetails.name : selectedClientKey;
    const currentProject = isNewProject ? newProjectName : selectedProject;
    const key = `${currentClient}-${currentProject}`;
    
    if (producedProjects[key]) {
      const snapshot = producedSnapshots[key];
      const existedBeforeProduction = snapshot?.some(s => s.rows.some(r => r.id === id));
      if (existedBeforeProduction) {
        const confirmDelete = window.confirm("שים לב! נתון זה כבר הופק בעבר. האם אתה בטוח שברצונך למחוק אותו?");
        if (!confirmDelete) return;
      }
    }

    pushToHistory(sheets);
    setSheets(sheets.map(s => s.id === activeSheetId ? { ...s, rows: s.rows.filter(r => r.id !== id) } : s));
  };

  const duplicateRow = (id: string) => {
    pushToHistory(sheets);
    setSheets(sheets.map(s => {
      if (s.id === activeSheetId) {
        const src = s.rows.find(r => r.id === id);
        if (!src) return s;
        const dup = { ...src, id: Date.now().toString(), partNumber: '' };
        const idx = s.rows.findIndex(r => r.id === id);
        const newRows = [...s.rows];
        newRows.splice(idx + 1, 0, dup);
        return { ...s, rows: newRows };
      }
      return s;
    }));
  };

  const toggleRowSelection = (id: string) => {
    setSelectedRowIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = (rows: RowData[]) => {
    if (selectedRowIds.size === rows.length && rows.every(r => selectedRowIds.has(r.id))) {
      setSelectedRowIds(new Set());
    } else {
      setSelectedRowIds(new Set(rows.map(r => r.id)));
    }
  };

  const bulkDelete = () => {
    if (selectedRowIds.size === 0) return;
    if (!window.confirm(`למחוק ${selectedRowIds.size} חלקים נבחרים?`)) return;
    pushToHistory(sheets);
    setSheets(sheets.map(s => s.id === activeSheetId ? { ...s, rows: s.rows.filter(r => !selectedRowIds.has(r.id)) } : s));
    setSelectedRowIds(new Set());
  };

  const bulkCopyToSheet = (targetSheetId: string) => {
    if (selectedRowIds.size === 0 || targetSheetId === activeSheetId) return;
    pushToHistory(sheets);
    const sourceSheet = sheets.find(s => s.id === activeSheetId);
    if (!sourceSheet) return;
    const rowsToCopy = sourceSheet.rows.filter(r => selectedRowIds.has(r.id));
    const newRows = rowsToCopy.map(r => ({ ...r, id: Date.now().toString() + Math.random().toString(36).slice(2, 6), partNumber: '' }));
    setSheets(sheets.map(s => {
      if (s.id === targetSheetId) return { ...s, rows: [...s.rows, ...newRows] };
      return s;
    }));
    alert(`הועתקו ${rowsToCopy.length} חלקים לדף "${sheets.find(s => s.id === targetSheetId)?.name}"`);
  };

  const addSheet = () => {
    pushToHistory(sheets);
    let maxNum = 0;
    sheets.forEach(s => {
      const match = s.name.match(/#(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    const nextNum = maxNum + 1;
    const newId = Date.now().toString();
    setSheets([...sheets, { id: newId, name: `דף מדידה #${nextNum}`, rows: [] }]);
    setActiveSheetId(newId);
  };

  const renameSheet = (sheetId: string) => {
    const sheet = sheets.find(s => s.id === sheetId);
    if (!sheet) return;
    const newName = window.prompt('הכנס שם חדש לדף המדידה:', sheet.name);
    if (newName && newName.trim() !== '') {
      pushToHistory(sheets);
      setSheets(sheets.map(s => s.id === sheetId ? { ...s, name: newName.trim() } : s));
    }
  };

  const deleteSheet = (sheetIdToDelete: string) => {
    if (sheets.length <= 1) {
      alert("חייב להישאר לפחות דף מדידה אחד במערכת.");
      return;
    }
    const confirmDelete = window.confirm("האם אתה בטוח שברצונך למחוק את דף המדידה הנוכחי וכל שורותיו?");
    if (!confirmDelete) return;

    pushToHistory(sheets);
    const remainingSheets = sheets.filter(s => s.id !== sheetIdToDelete);
    setSheets(remainingSheets);
    if (activeSheetId === sheetIdToDelete) {
      setActiveSheetId(remainingSheets[0].id);
    }
  };

  // שמירת מצב נוכחי בהיסטוריית הצעדים (בטל/בצע שוב)
  const pushToHistory = (currentSheets: Sheet[]) => {
    const snapshot = JSON.parse(JSON.stringify(currentSheets));
    setUndoStack(prev => [...prev.slice(-49), snapshot]); // גבול של 50 צעדים
    setRedoStack([]); // איפוס ה-redo בעת פעולה חדשה
  };

  // פעולת בטל (Undo)
  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    const current = JSON.parse(JSON.stringify(sheets));

    setRedoStack(prev => [...prev, current]);
    setSheets(previous);
    setUndoStack(prev => prev.slice(0, -1));
  };

  // פעולת בצע שוב (Redo)
  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    const current = JSON.parse(JSON.stringify(sheets));

    setUndoStack(prev => [...prev, current]);
    setSheets(next);
    setRedoStack(prev => prev.slice(0, -1));
  };

  const savePreset = () => {
    const isRound = newPartData.notes === 'צינור עגול';
    const dimA = newPartData.width1;
    const dimB = isRound ? newPartData.length : newPartData.height1;
    const defaultName = `${newPartData.type} ${dimA}x${dimB}`;
    const name = window.prompt('שם התבנית:', defaultName);
    if (!name) return;
    const { id, ...dataWithoutId } = newPartData;
    const updated = [...partPresets, { name, data: dataWithoutId }];
    setPartPresets(updated);
    localStorage.setItem('sharara-presets', JSON.stringify(updated));
  };

  const loadPreset = (preset: {name: string, data: Omit<RowData, 'id'>}) => {
    setNewPartData({ ...preset.data, id: '' });
  };

  const deletePreset = (idx: number) => {
    const updated = partPresets.filter((_, i) => i !== idx);
    setPartPresets(updated);
    localStorage.setItem('sharara-presets', JSON.stringify(updated));
  };

  // פתיחת טופס להוספת חלק חדש עם ברירות מחדל בהתאם לצורה שנבחרה
  const openAddPartForm = (type: RowData['type'], defaultNotes: string = '') => {
    setIsAddingPart(true);
    
    const defaults: RowData = {
      id: Date.now().toString(),
      partNumber: '',
      type,
      width1: 0.5,
      height1: 0.4,
      width2: 0,
      height2: 0,
      length: 1.0,
      rBig: 0,
      rSmall: 0,
      shatuzar: false,
      flexible: 0,
      acoustic: true,
      external: false,
      sharshuriType: 'ללא',
      sharshuriLen: 0,
      adapterType: 'ללא',
      adapterQty: 0,
      notes: defaultNotes,
      manualThickness: 0,
      rBig2: 0,
      panels: 0,
      dofan: 0
    };

    if (type === 'קשת') {
      defaults.length = 0;
      defaults.rSmall = 0.15;
      defaults.rBig = 0.5 + 0.15; // width1 + rSmall
    } else if (type === 'מעבר') {
      defaults.width2 = 0.4;
      defaults.height2 = 300;
    }

    setNewPartData(defaults);
  };

  // שמירה והוספה של החלק מטופס ההזנה אל טבלת דפי המדידה
  const saveFormPart = () => {
    if (newPartData.width1 <= 0 || newPartData.height1 <= 0) {
      alert("אנא הזן מידות רוחב וגובה תקינות (גדולות מ-0)");
      return;
    }
    if (newPartData.type === 'מעבר' && (newPartData.width2 <= 0 || newPartData.height2 <= 0)) {
      alert("אנא הזן מידות רוחב 2 וגובה 2 תקינות עבור חלק מעבר");
      return;
    }
    if (newPartData.type !== 'קשת' && newPartData.length <= 0) {
      alert("אנא הזן אורך תקין לחלק (גדול מ-0)");
      return;
    }

    // הוספת החלק להיסטוריית בטל/שחזר
    pushToHistory(sheets);

    const qty = Math.max(1, Math.round(quickQty));
    const newRows = Array.from({ length: qty }, (_, i) => ({
      ...newPartData,
      id: (Date.now() + i).toString(),
    }));

    // הוספת שורה חדשה לדף המדידה הפעיל
    setSheets(sheets.map(s => {
      if (s.id === activeSheetId) {
        return {
          ...s,
          rows: [...s.rows, ...newRows]
        };
      }
      return s;
    }));

    setIsAddingPart(false);
    setQuickQty(1);
  };

  if (!isLoggedIn) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a', fontFamily: 'Assistant, Rubik, sans-serif', direction: 'rtl', padding: '20px', boxSizing: 'border-box' }}>
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #334155', padding: '40px 32px', width: '100%', maxWidth: '420px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center', boxSizing: 'border-box' }}>
          
          {/* לוגו החברה הרשמי בראש דף ההתחברות */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginBottom: '24px', textAlign: 'center' }}>
            <img 
              src={logoSrc} 
              alt="לוגו החברה" 
              style={{ 
                maxHeight: '120px', 
                maxWidth: '100%', 
                objectFit: 'contain', 
                borderRadius: '8px', 
                backgroundColor: '#ffffff'
              }} 
            />
            <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#1e293b', margin: '12px 0 0 0', fontFamily: "'David Libre', 'Frank Ruhl Libre', serif", letterSpacing: '1.5px' }}>עלי שרארה בע"מ</h1>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0, fontWeight: '500' }}>מערכת ייצור וחישוב כמויות תעלות פח</p>
          </div>

          {/* טופס התחברות */}
          <form onSubmit={handleLoginSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>שם משתמש:</label>
              <input 
                type="text" 
                value={loginUsername} 
                onChange={(e) => setLoginUsername(e.target.value)} 
                placeholder="הזן שם משתמש..." 
                required 
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px', backgroundColor: '#ffffff', color: '#0f172a', boxSizing: 'border-box', outline: 'none' }} 
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>סיסמה:</label>
              <input 
                type="password" 
                value={loginPassword} 
                onChange={(e) => setLoginPassword(e.target.value)} 
                placeholder="הזן סיסמה..." 
                required 
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px', backgroundColor: '#ffffff', color: '#0f172a', boxSizing: 'border-box', outline: 'none' }} 
              />
            </div>

            {loginError && (
              <div style={{ color: '#ef4444', fontSize: '12px', fontWeight: 'bold', textAlign: 'center', backgroundColor: '#fef2f2', padding: '8px', borderRadius: '4px', border: '1px solid #fca5a5' }}>
                {loginError}
              </div>
            )}

            <button 
              type="submit" 
              style={{ width: '100%', padding: '12px', backgroundColor: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(37,99,235,0.2)', transition: 'all 0.2s', marginTop: '8px' }}
            >
              🔐 התחבר למערכת
            </button>
          </form>


          <div style={{ marginTop: '30px', fontSize: '10px', color: '#94a3b8', borderTop: '1px solid #e2e8f0', width: '100%', paddingTop: '12px', textAlign: 'center' }}>
            מערכת עלי שרארה בע"מ © {new Date().getFullYear()}
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className={`active-tab-${activeTab}`} style={{ direction: 'rtl', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: 'Assistant, Rubik, sans-serif', color: '#1e293b', width: '100%', letterSpacing: '0.2px' }}>
      <div className="app-content-wrapper" style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* כותרת עליונה קבועה */}
      <header style={{ backgroundColor: '#0f172a', borderBottom: '4px solid #475569', padding: '30px 24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '20px', position: 'relative' }}>
        
        {/* כפתור התנתקות מוסתר בהדפסה */}
        <button 
          onClick={handleLogout} 
          className="no-print"
          style={{ 
            position: 'absolute', 
            top: '20px', 
            left: '20px', 
            backgroundColor: 'transparent', 
            color: '#ef4444', 
            border: '1px solid #ef4444', 
            borderRadius: '4px', 
            padding: '6px 12px', 
            cursor: 'pointer', 
            fontSize: '11px', 
            fontWeight: 'bold',
            transition: 'all 0.2s'
          }}
          title="יציאה מהמערכת (נעילת גישה)"
        >
          🔑 התנתק
        </button>

        {/* אינדיקטור שמירה */}
        {lastSaved && (
          <div style={{ position: 'absolute', top: '20px', right: '20px', fontSize: '10px', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4ade80', display: 'inline-block' }}></span>
            נשמר {lastSaved.toLocaleTimeString('he-IL')}
          </div>
        )}

        {/* לוגו באמצע הדף - מוגדל בצורה משמעותית */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
            <div style={{ position: 'relative' }}>
              <img 
                src={logoSrc} 
                alt="לוגו החברה" 
                style={{ 
                  maxHeight: '160px', 
                  maxWidth: '100%', 
                  objectFit: 'contain', 
                  borderRadius: '8px', 
                  backgroundColor: '#ffffff', 
                  padding: '8px',
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)',
                  border: '1px solid #334155'
                }} 
              />
            </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#ffffff', margin: 0, letterSpacing: '1px', fontFamily: 'Rubik, Assistant, sans-serif' }}>
              {myCompanyDetails.name}
            </h1>
            <p style={{ fontSize: '16px', color: '#94a3b8', margin: 0, fontWeight: '500', fontFamily: 'Assistant, sans-serif', letterSpacing: '0.5px' }}>
              מערכת ייצור וחישוב כמויות תעלות פח
            </p>
          </div>
        </div>
        
        {/* טאבים ממוקמים באמצע */}
        {isSessionInitialized && (
          <div style={{ display: 'flex', gap: '8px', backgroundColor: '#1e293b', padding: '6px', borderRadius: '10px', marginTop: '10px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)' }}>
            <button onClick={() => setActiveTab('measure')} style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', backgroundColor: activeTab === 'measure' ? '#3b82f6' : 'transparent', color: activeTab === 'measure' ? '#ffffff' : '#94a3b8' }}>
              <FileSpreadsheet size={16} /> דפי מדידה
            </button>
            <button onClick={() => setActiveTab('summary')} style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', backgroundColor: activeTab === 'summary' ? '#3b82f6' : 'transparent', color: activeTab === 'summary' ? '#ffffff' : '#94a3b8' }}>
              <Layers size={16} /> ריכוז כמויות
            </button>
            <button onClick={() => setActiveTab('invoice')} style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', backgroundColor: activeTab === 'invoice' ? '#3b82f6' : 'transparent', color: activeTab === 'invoice' ? '#ffffff' : '#94a3b8' }}>
              <CreditCard size={16} /> חשבון פרופורמה
            </button>
            <button onClick={() => setActiveTab('pricelist')} style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', backgroundColor: activeTab === 'pricelist' ? '#3b82f6' : 'transparent', color: activeTab === 'pricelist' ? '#ffffff' : '#94a3b8' }}>
              <CreditCard size={16} /> מחירון העסק
            </button>
            <button onClick={() => setActiveTab('production')} style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', backgroundColor: activeTab === 'production' ? '#3b82f6' : 'transparent', color: activeTab === 'production' ? '#ffffff' : '#94a3b8' }}>
              <FileSpreadsheet size={16} /> דפי ייצור
            </button>
          </div>
        )}
      </header>

      {/* שלב 1: מסך הגדרת לקוח ופרויקט (חוסם את הטבלה עד למילוי) */}
      {!isSessionInitialized ? (
        <div style={{ maxWidth: '800px', margin: '40px auto', padding: '32px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #cbd5e1', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
          {/* ─── מנהל: כניסה ─── */}
          {!isAdmin ? (
            <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {!showAdminLogin ? (
                <button onClick={() => setShowAdminLogin(true)} style={{ backgroundColor: '#475569', color: '#fff', border: 'none', padding: '5px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>🔒 מנהל</button>
              ) : (
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', backgroundColor: '#f1f5f9', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  <span style={{ fontSize: '11px', color: '#475569', fontWeight: 'bold' }}>קוד:</span>
                  <input type="password" value={adminPasscodeInput} onChange={(e) => setAdminPasscodeInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { if (adminPasscodeInput === adminPasscode) { setIsAdmin(true); sessionStorage.setItem('sharara_isAdmin', 'true'); setShowAdminLogin(false); setAdminPasscodeInput(''); } else { alert('❌ קוד שגוי'); } } }} maxLength={6} style={{ width: '70px', padding: '4px 6px', border: '1px solid #94a3b8', borderRadius: '3px', fontSize: '12px', textAlign: 'center', letterSpacing: '3px' }} autoFocus />
                  <button onClick={() => { if (adminPasscodeInput === adminPasscode) { setIsAdmin(true); sessionStorage.setItem('sharara_isAdmin', 'true'); setShowAdminLogin(false); setAdminPasscodeInput(''); } else { alert('❌ קוד שגוי'); } }} style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '3px', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}>✓</button>
                  <button onClick={() => { setShowAdminLogin(false); setAdminPasscodeInput(''); }} style={{ backgroundColor: '#94a3b8', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '3px', cursor: 'pointer', fontSize: '10px' }}>✕</button>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* ─── שורת מנהל compact ─── */}
              <div style={{ display: 'flex', gap: '4px', marginBottom: '8px', alignItems: 'center', flexWrap: 'wrap', backgroundColor: '#ecfdf5', padding: '5px 8px', borderRadius: '6px', border: '1px solid #d1fae5' }}>
                <span style={{ fontSize: '10px', color: '#059669', fontWeight: 'bold' }}>✓ מנהל</span>
                <div style={{ width: '1px', height: '14px', backgroundColor: '#a7f3d0', margin: '0 2px' }} />
                <button onClick={loadSampleData} title="טען נתוני דוגמה" style={{ backgroundColor: '#7c3aed', color: '#fff', border: 'none', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}>📋 דוגמה</button>
                <button onClick={importFromJSON} title="ייבוא מקובץ" style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}>📂 ייבוא</button>
                <button onClick={handleExportJSON} title="ייצוא לקובץ + ענן" style={{ backgroundColor: '#0891b2', color: '#fff', border: 'none', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}>💾 ייצוא</button>
                <button onClick={async () => { await loadFirebaseBackups(); setActiveAdminSection(activeAdminSection === 'backups' ? null : 'backups'); }} title="גיבויים בענן" style={{ backgroundColor: activeAdminSection === 'backups' ? '#059669' : '#059669', color: '#fff', border: 'none', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold', outline: activeAdminSection === 'backups' ? '2px solid #166534' : 'none', outlineOffset: '1px' }}>☁️ גיבויים</button>
                <button onClick={resetProject} title="איפוס" style={{ backgroundColor: '#dc2626', color: '#fff', border: 'none', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}>🗑️ איפוס</button>
                <div style={{ width: '1px', height: '14px', backgroundColor: '#a7f3d0', margin: '0 2px' }} />
                <button onClick={() => setActiveAdminSection(activeAdminSection === 'passcode' ? null : 'passcode')} style={{ backgroundColor: activeAdminSection === 'passcode' ? '#475569' : '#94a3b8', color: '#fff', border: 'none', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}>🔑 קוד</button>
                <button onClick={() => setActiveAdminSection(activeAdminSection === 'credentials' ? null : 'credentials')} style={{ backgroundColor: activeAdminSection === 'credentials' ? '#7c3aed' : '#94a3b8', color: '#fff', border: 'none', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}>👤 כניסה</button>
                <button onClick={() => setActiveAdminSection(activeAdminSection === 'business' ? null : 'business')} style={{ backgroundColor: activeAdminSection === 'business' ? '#d97706' : '#94a3b8', color: '#fff', border: 'none', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}>🏢 עסק</button>
                <button onClick={() => { setIsAdmin(false); sessionStorage.removeItem('sharara_isAdmin'); setActiveAdminSection(null); }} title="התנתק" style={{ backgroundColor: '#94a3b8', color: '#fff', border: 'none', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}>🚪</button>
              </div>

              {/* ─── גיבויים בענן ─── */}
              {activeAdminSection === 'backups' && (
                <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '8px 10px', marginBottom: '8px', fontSize: '11px' }}>
                  <div style={{ fontWeight: 'bold', color: '#065f46', marginBottom: '6px', fontSize: '11px' }}>☁️ גיבויים בענן</div>
                  {loadingBackups ? (
                    <span style={{ color: '#64748b', fontSize: '10px' }}>טוען...</span>
                  ) : backups.length === 0 ? (
                    <span style={{ color: '#64748b', fontSize: '10px' }}>לא נמצאו גיבויים</span>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {backups.map((backup) => (
                        <div key={backup.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: '4px 8px', borderRadius: '4px', border: '1px solid #d1fae5' }}>
                          <span style={{ fontSize: '10px', color: '#0f172a' }}>
                            <strong>{backup.name}</strong>
                            <span style={{ color: '#64748b', marginInline: '4px' }}>{backup.client} — {backup.project}</span>
                            <span style={{ color: '#9ca3af' }}>{backup.savedAt ? new Date(backup.savedAt).toLocaleString('he-IL') : ''}</span>
                          </span>
                          <div style={{ display: 'flex', gap: '3px' }}>
                            <button onClick={() => restoreFromFirebaseBackup(backup.id)} style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '2px 6px', borderRadius: '3px', cursor: 'pointer', fontSize: '9px', fontWeight: 'bold' }}>שחזר</button>
                            <button onClick={() => deleteFirebaseBackup(backup.id)} style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '2px 6px', borderRadius: '3px', cursor: 'pointer', fontSize: '9px' }}>✕</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ─── Change admin passcode ─── */}
              {activeAdminSection === 'passcode' && (
                <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px 10px', marginBottom: '8px', display: 'flex', gap: '6px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#475569' }}>🔑 קוד מנהל חדש:</span>
                  <input type="password" value={newAdminPasscode} onChange={(e) => setNewAdminPasscode(e.target.value)} placeholder="קוד" style={{ width: '70px', padding: '3px 6px', border: '1px solid #94a3b8', borderRadius: '3px', fontSize: '11px', textAlign: 'center' }} />
                  <input type="password" value={newAdminPasscodeConfirm} onChange={(e) => setNewAdminPasscodeConfirm(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { if (newAdminPasscode.length >= 4 && newAdminPasscode === newAdminPasscodeConfirm) { setAdminPasscode(newAdminPasscode); localStorage.setItem('sharara_adminPasscode', newAdminPasscode); setActiveAdminSection(null); setNewAdminPasscode(''); setNewAdminPasscodeConfirm(''); alert('✅'); } } }} placeholder="אישור" style={{ width: '70px', padding: '3px 6px', border: '1px solid #94a3b8', borderRadius: '3px', fontSize: '11px', textAlign: 'center' }} />
                  <button onClick={() => { if (newAdminPasscode.length >= 4 && newAdminPasscode === newAdminPasscodeConfirm) { setAdminPasscode(newAdminPasscode); localStorage.setItem('sharara_adminPasscode', newAdminPasscode); setActiveAdminSection(null); setNewAdminPasscode(''); setNewAdminPasscodeConfirm(''); alert('✅'); } else { alert('❌'); } }} style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '3px 10px', borderRadius: '3px', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}>שמור</button>
                  <button onClick={() => { setActiveAdminSection(null); setNewAdminPasscode(''); setNewAdminPasscodeConfirm(''); }} style={{ backgroundColor: '#94a3b8', color: '#fff', border: 'none', padding: '3px 10px', borderRadius: '3px', cursor: 'pointer', fontSize: '10px' }}>ביטול</button>
                </div>
              )}

              {/* ─── Change app credentials ─── */}
              {activeAdminSection === 'credentials' && (
                <div style={{ backgroundColor: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '6px', padding: '8px 10px', marginBottom: '8px', display: 'flex', gap: '6px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#6b21a8' }}>👤 כניסה לאתר:</span>
                  <input type="text" value={newAppUser} onChange={(e) => setNewAppUser(e.target.value)} placeholder="משתמש" style={{ width: '90px', padding: '3px 6px', border: '1px solid #94a3b8', borderRadius: '3px', fontSize: '11px' }} />
                  <input type="password" value={newAppPass} onChange={(e) => setNewAppPass(e.target.value)} placeholder="סיסמה" style={{ width: '80px', padding: '3px 6px', border: '1px solid #94a3b8', borderRadius: '3px', fontSize: '11px', textAlign: 'center' }} />
                  <input type="password" value={newAppPassConfirm} onChange={(e) => setNewAppPassConfirm(e.target.value)} placeholder="אישור" style={{ width: '80px', padding: '3px 6px', border: '1px solid #94a3b8', borderRadius: '3px', fontSize: '11px', textAlign: 'center' }} />
                  <button onClick={() => {
                    if (!newAppUser.trim()) { alert('❌'); return; }
                    if (newAppPass.length < 4) { alert('❌'); return; }
                    if (newAppPass !== newAppPassConfirm) { alert('❌'); return; }
                    setAppLoginUser(newAppUser.trim()); setAppLoginPass(newAppPass);
                    localStorage.setItem('sharara_appLoginUser', newAppUser.trim()); localStorage.setItem('sharara_appLoginPass', newAppPass);
                    setActiveAdminSection(null); setNewAppPass(''); setNewAppPassConfirm(''); alert('✅');
                  }} style={{ backgroundColor: '#7c3aed', color: '#fff', border: 'none', padding: '3px 10px', borderRadius: '3px', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}>שמור</button>
                  <button onClick={() => { setActiveAdminSection(null); setNewAppPass(''); setNewAppPassConfirm(''); }} style={{ backgroundColor: '#94a3b8', color: '#fff', border: 'none', padding: '3px 10px', borderRadius: '3px', cursor: 'pointer', fontSize: '10px' }}>ביטול</button>
                </div>
              )}

              {/* ─── Company details (עסק) ─── */}
              {activeAdminSection === 'business' && (
                <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '12px 16px', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 'bold', color: '#92400e', marginBottom: '12px', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>🏢 פרטי העסק</span>
                    <span style={{ fontSize: '10px', color: '#b45309', fontWeight: 'normal' }}>מצב עריכה — שנה את הפרטים למטה</span>
                  </div>
                  
                  {/* שורה 1: לוגו בצד ימין + פרטים בצד שמאל */}
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    
                    {/* צד ימין: לוגו */}
                    <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <div style={{ padding: '8px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                        <input
                          type="file"
                          accept="image/*"
                          id="logoUpload"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              const base64 = ev.target?.result as string;
                              setCompanyLogo(base64);
                              localStorage.setItem('sharara_companyLogo', base64);
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                        {companyLogo ? (
                          <img
                            src={companyLogo}
                            alt="לוגו נוכחי"
                            style={{ maxHeight: '100px', maxWidth: '180px', objectFit: 'contain', borderRadius: '4px' }}
                          />
                        ) : (
                          <div style={{ width: '180px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '12px', border: '2px dashed #cbd5e1', borderRadius: '4px' }}>
                            אין לוגו
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => document.getElementById('logoUpload')?.click()}
                          style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '5px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                        >
                          {companyLogo ? 'שנה לוגו' : 'העלה לוגו'}
                        </button>
                        {companyLogo && (
                          <button
                            onClick={() => { setCompanyLogo(''); localStorage.removeItem('sharara_companyLogo'); }}
                            style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '5px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                          >
                            מחק
                          </button>
                        )}
                      </div>
                    </div>

                    {/* צד שמאל: שדות פרטים */}
                    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      {([
                        ['שם בעברית', 'name'], ['כיתוב אנגלי', 'engName'],
                        ['טלפון', 'phone'], ['נייד', 'mobile'],
                        ['פקס', 'fax'], ['אימייל', 'email'],
                        ['אתר', 'website'], ['כתובת', 'address'],
                      ] as [string, keyof typeof myCompanyDetails][]).map(([label, key]) => (
                        <div key={key}>
                          <label style={{ fontSize: '12px', color: '#334155', fontWeight: '600', display: 'block', marginBottom: '3px' }}>{label}:</label>
                          <input type="text" value={myCompanyDetails[key] as string} onChange={(e) => setMyCompanyDetails({...myCompanyDetails, [key]: e.target.value})} style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box', backgroundColor: '#ffffff', color: '#0f172a' }} />
                        </div>
                      ))}
                      <div style={{ gridColumn: 'span 2' }}>
                        <label style={{ fontSize: '12px', color: '#334155', fontWeight: '600', display: 'block', marginBottom: '3px' }}>לוגן:</label>
                        <input type="text" value={myCompanyDetails.subtitle} onChange={(e) => setMyCompanyDetails({...myCompanyDetails, subtitle: e.target.value})} style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box', backgroundColor: '#ffffff', color: '#0f172a' }} />
                      </div>
                      <div style={{ gridColumn: 'span 2' }}>
                        <label style={{ fontSize: '12px', color: '#334155', fontWeight: '600', display: 'block', marginBottom: '3px' }}>דואר למשלוחים:</label>
                        <input type="text" value={myCompanyDetails.pobox} onChange={(e) => setMyCompanyDetails({...myCompanyDetails, pobox: e.target.value})} style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box', backgroundColor: '#ffffff', color: '#0f172a' }} />
                      </div>
                      {(myCompanyDetails.serviceLines ?? []).map((line: string, index: number) => (
                        <div key={index} style={{ gridColumn: 'span 2' }}>
                          <label style={{ fontSize: '12px', color: '#334155', fontWeight: '600', display: 'block', marginBottom: '3px' }}>{`שירות ${index + 1}:`}</label>
                          <input type="text" value={line} onChange={(e) => { const next = [...(myCompanyDetails.serviceLines ?? ['', '', ''])]; next[index] = e.target.value; setMyCompanyDetails({ ...myCompanyDetails, serviceLines: next }); }} style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box', backgroundColor: '#ffffff', color: '#0f172a' }} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          {!isAdmin && (<>
          <div style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '16px', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>שלב א': זיהוי והגדרת לקוח ופרויקט</h2>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>יש לבחור או להקים לקוח ופרויקט לפני תחילת הזנת המדידות בטבלה.</p>
          </div>

          {/* בחירת סוג לקוח */}
          <div style={{ display: 'flex', gap: '20px', marginBottom: '24px', backgroundColor: '#f1f5f9', padding: '12px 16px', borderRadius: '8px' }}>
            <label style={{ fontWeight: 'bold', fontSize: '14px', color: '#334155', marginLeft: '10px' }}>סוג לקוח:</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px', color: '#0f172a' }}>
              <input type="radio" name="clientType" checked={!isNewClient} onChange={() => toggleClientMode(false)} style={{ cursor: 'pointer' }} /> לקוח קיים במערכת
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px', color: '#0f172a' }}>
              <input type="radio" name="clientType" checked={isNewClient} onChange={() => toggleClientMode(true)} style={{ cursor: 'pointer' }} /> הקמת לקוח חדש
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            
            {/* פרטי הלקוח */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e3a8a', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '6px' }}><Building2 size={16} /> פרטי לקוח חברה</h3>
              
              {!isNewClient ? (
                isEditingClient ? (
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>ערוך שם חברה/לקוח קיים:</label>
                    <input 
                      type="text" 
                      value={clientDetails.name} 
                      onChange={(e) => setClientDetails({...clientDetails, name: e.target.value})} 
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '14px', backgroundColor: '#ffffff', color: '#0f172a', fontWeight: '600' }} 
                    />
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <button 
                        onClick={saveClientChanges} 
                        style={{ padding: '6px 12px', backgroundColor: '#10b981', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}
                      >
                        שמור שינויים
                      </button>
                      <button 
                        onClick={cancelClientEditing} 
                        style={{ padding: '6px 12px', backgroundColor: '#64748b', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}
                      >
                        בטל
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>בחר לקוח מהרשימה:</label>
                    <select 
                      value={selectedClientKey} 
                      onChange={(e) => handleClientSelectChange(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '14px', backgroundColor: '#ffffff', color: '#0f172a', fontWeight: '600' }}
                    >
                      {Object.keys(clientsData).map((c, idx) => (
                        <option key={idx} value={c} style={{ backgroundColor: '#ffffff', color: '#0f172a' }}>{c}</option>
                      ))}
                    </select>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <button 
                        onClick={() => setIsEditingClient(true)} 
                        style={{ padding: '4px 8px', backgroundColor: '#3b82f6', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}
                      >
                        ערוך לקוח
                      </button>
                      <button 
                        onClick={deleteClient} 
                        style={{ padding: '4px 8px', backgroundColor: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}
                      >
                        מחק לקוח
                      </button>
                    </div>
                  </div>
                )
              ) : (
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>שם חברה/לקוח חדש:</label>
                  <input type="text" placeholder="הקלד שם חברה..." value={clientDetails.name} onChange={(e) => setClientDetails({...clientDetails, name: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box', backgroundColor: '#ffffff', color: '#0f172a' }} />
                  
                  {clientDetails.name.trim() && Object.keys(clientsData).some(c => c.toLowerCase() === clientDetails.name.trim().toLowerCase()) && (
                    <div style={{ color: '#d97706', fontSize: '11px', fontWeight: 'bold', marginTop: '4px' }}>
                      ⚠️ חברה זו כבר קיימת במערכת. פרטיה ייטענו אוטומטית באישור.
                    </div>
                  )}

                  <div style={{ marginTop: '8px', borderTop: '1px dashed #cbd5e1', paddingTop: '6px' }}>
                    <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '2px' }}>או ייבא פרטים מחברה קיימת לעריכה:</label>
                    <select 
                      value=""
                      onChange={(e) => {
                        const comp = e.target.value;
                        if (comp) {
                          const data = clientsData[comp];
                          if (data) {
                            setClientDetails({
                              name: comp,
                              phone: data.phone,
                              email: data.email,
                              contact: data.contact,
                              regDate: data.regDate
                            });
                            setImportedClientSourceKey(comp); // שמירת מזהה המקור לייבוא הפרויקטים
                          }
                        }
                      }}
                      style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px', backgroundColor: '#f1f5f9', color: '#475569', fontWeight: '600' }}
                    >
                      <option value="">-- בחר חברה לייבוא פרטים --</option>
                      {Object.keys(clientsData).map((c, idx) => (
                        <option key={idx} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>איש קשר:</label>
                <div style={{ position: 'relative' }}>
                  <input type="text" placeholder="שם איש קשר..." disabled={!isNewClient && !isEditingClient} value={clientDetails.contact} onChange={(e) => setClientDetails({...clientDetails, contact: e.target.value})} style={{ width: '100%', padding: '8px 12px 8px 32px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box', backgroundColor: (!isNewClient && !isEditingClient) ? '#e2e8f0' : '#ffffff', color: '#0f172a' }} />
                  <User size={14} style={{ position: 'absolute', left: '10px', top: '11px', color: '#94a3b8' }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>טלפון:</label>
                <div style={{ position: 'relative' }}>
                  <input type="text" placeholder="מספר טלפון..." disabled={!isNewClient && !isEditingClient} value={clientDetails.phone} onChange={(e) => setClientDetails({...clientDetails, phone: e.target.value})} style={{ width: '100%', padding: '8px 12px 8px 32px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box', backgroundColor: (!isNewClient && !isEditingClient) ? '#e2e8f0' : '#ffffff', color: '#0f172a' }} />
                  <Phone size={14} style={{ position: 'absolute', left: '10px', top: '11px', color: '#94a3b8' }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>אימייל:</label>
                <div style={{ position: 'relative' }}>
                  <input type="email" placeholder="כתובת מייל..." disabled={!isNewClient && !isEditingClient} value={clientDetails.email} onChange={(e) => setClientDetails({...clientDetails, email: e.target.value})} style={{ width: '100%', padding: '8px 12px 8px 32px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box', backgroundColor: (!isNewClient && !isEditingClient) ? '#e2e8f0' : '#ffffff', color: '#0f172a' }} />
                  <Mail size={14} style={{ position: 'absolute', left: '10px', top: '11px', color: '#94a3b8' }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>תאריך רישום מערכת:</label>
                <input type="date" disabled={!isNewClient && !isEditingClient} value={clientDetails.regDate} onChange={(e) => setClientDetails({...clientDetails, regDate: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box', backgroundColor: (!isNewClient && !isEditingClient) ? '#e2e8f0' : '#ffffff', color: '#0f172a', textAlign: 'center' }} />
              </div>
            </div>

            {/* פרטי הפרויקט */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e3a8a', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '6px' }}><Briefcase size={16} /> שיוך פרויקט עבודה</h3>
              
              {!isNewClient && (
                <div style={{ display: 'flex', gap: '16px', marginBottom: '6px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#475569', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      checked={!isNewProject} 
                      onChange={() => {
                        setIsNewProject(false);
                        const projects = clientsData[selectedClientKey]?.projects || [];
                        if (projects.length > 0) {
                          handleProjectSelectChange(projects[0]);
                        } else {
                          setSelectedProject('');
                        }
                      }} 
                    /> פרויקט קיים
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#475569', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      checked={isNewProject} 
                      onChange={() => {
                        setIsNewProject(true);
                        setSelectedProject('');
                        setDocNumber(Math.floor(1000 + Math.random() * 9000).toString());
                      }} 
                    /> פרויקט חדש ללקוח זה
                  </label>
                </div>
              )}

              {!isNewProject && !isNewClient ? (
                isEditingProjectName ? (
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>ערוך שם פרויקט קיים:</label>
                    <input 
                      type="text" 
                      value={tempProjectName} 
                      onChange={(e) => setTempProjectName(e.target.value)} 
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '14px', backgroundColor: '#ffffff', color: '#0f172a', fontWeight: '600' }} 
                    />
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <button 
                        onClick={saveProjectNameChanges} 
                        style={{ padding: '6px 12px', backgroundColor: '#10b981', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}
                      >
                        שמור פרויקט
                      </button>
                      <button 
                        onClick={() => setIsEditingProjectName(false)} 
                        style={{ padding: '6px 12px', backgroundColor: '#64748b', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}
                      >
                        בטל
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>בחר פרויקט קיים:</label>
                    <select 
                      value={selectedProject} 
                      onChange={(e) => handleProjectSelectChange(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '14px', backgroundColor: '#ffffff', color: '#0f172a' }}
                    >
                      {clientsData[selectedClientKey]?.projects.map((p, idx) => (
                        <option key={idx} value={p} style={{ backgroundColor: '#ffffff', color: '#0f172a' }}>{p}</option>
                      ))}
                    </select>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <button 
                        onClick={() => {
                          setTempProjectName(selectedProject);
                          setIsEditingProjectName(true);
                        }} 
                        style={{ padding: '4px 8px', backgroundColor: '#3b82f6', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}
                      >
                        ערוך שם פרויקט
                      </button>
                      <button 
                        onClick={deleteProject} 
                        style={{ padding: '4px 8px', backgroundColor: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}
                      >
                        מחק פרויקט
                      </button>
                    </div>
                  </div>
                )
              ) : (
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>שם הפרויקט החדש:</label>
                  <input type="text" placeholder="הקלד שם פרויקט/אתר מיועד..." value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box', backgroundColor: '#ffffff', color: '#0f172a' }} />
                  
                  {(() => {
                    const activeClient = isNewClient ? (importedClientSourceKey || clientDetails.name.trim()) : selectedClientKey;
                    const existingProjects = clientsData[activeClient]?.projects || [];
                    if (existingProjects.length > 0) {
                      return (
                        <div style={{ marginTop: '6px', fontSize: '11px', color: '#475569', textAlign: 'right', backgroundColor: '#f1f5f9', padding: '4px 8px', borderRadius: '4px' }}>
                          <b>פרויקטים קיימים ללקוח זה:</b> {existingProjects.join(', ')}
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {(() => {
                    const activeClient = isNewClient ? (importedClientSourceKey || clientDetails.name.trim()) : selectedClientKey;
                    const clientObj = clientsData[activeClient];
                    if (clientObj && newProjectName.trim() && clientObj.projects.includes(newProjectName.trim())) {
                      let seqName = newProjectName.trim();
                      let counter = 2;
                      while (clientObj.projects.includes(seqName)) {
                        seqName = `${newProjectName.trim()} - ${counter}`;
                        counter++;
                      }
                      return (
                        <div style={{ color: '#b45309', fontSize: '11px', fontWeight: 'bold', marginTop: '6px', backgroundColor: '#fffbeb', padding: '6px 8px', borderRadius: '4px', border: '1px solid #fde68a' }}>
                          ⚠️ פרויקט בשם זה כבר קיים! המערכת תיצור סדרה חדשה בשם: <b>"{seqName}"</b>.
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}

            </div>
          </div>

          {/* תאריך מסמך ומספר סימוכין - ממורכזים מתחת לשתי המשבצות */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', marginBottom: '32px', padding: '16px 20px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>תאריך מסמך:</label>
              <input 
                type="date" 
                value={docDate} 
                onChange={(e) => {
                  setDocDate(e.target.value);
                  const currentClient = isNewClient ? clientDetails.name : selectedClientKey;
                  const currentProject = isNewProject ? newProjectName : selectedProject;
                  const key = `${currentClient}-${currentProject}`;
                  setProjectDocDates(prev => ({ ...prev, [key]: e.target.value }));
                }} 
                style={{ padding: '8px 16px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px', backgroundColor: '#ffffff', color: '#0f172a', textAlign: 'center', minWidth: '160px' }} 
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>מספר סימוכין:</label>
              <input 
                type="text" 
                value={docNumber} 
                onChange={(e) => {
                  setDocNumber(e.target.value);
                  const currentClient = isNewClient ? clientDetails.name : selectedClientKey;
                  const currentProject = isNewProject ? newProjectName : selectedProject;
                  const key = `${currentClient}-${currentProject}`;
                  setProjectDocNumbers(prev => ({ ...prev, [key]: e.target.value }));
                }} 
                style={{ padding: '8px 16px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#ffffff', color: '#0f172a', minWidth: '120px' }} 
              />
            </div>
          </div>

          <button 
            onClick={() => {
              if (isNewClient && !clientDetails.name.trim()) {
                alert("אנא הזן שם לקוח חדש");
                return;
              }
              if (isNewProject && !newProjectName.trim()) {
                alert("אנא הזן שם פרויקט חדש");
                return;
              }
              
              let currentClient = (isNewClient ? clientDetails.name : selectedClientKey).trim();
              let currentProject = (isNewProject ? newProjectName : selectedProject).trim();
              
              // 1. בדיקת כפילות חברה בעת יצירת חדש
              if (isNewClient) {
                const existingClientMatch = Object.keys(clientsData).find(c => c.toLowerCase() === currentClient.toLowerCase());
                if (existingClientMatch) {
                  const useExisting = window.confirm(`שים לב: לקוח בשם "${existingClientMatch}" כבר קיים במערכת.\nהאם ברצונך להשתמש בפרטי הלקוח הקיים ולעבור אליו?`);
                  if (useExisting) {
                    currentClient = existingClientMatch;
                    setIsNewClient(false);
                    setSelectedClientKey(existingClientMatch);
                    const clientData = clientsData[existingClientMatch];
                    setClientDetails({
                      name: existingClientMatch,
                      phone: clientData.phone,
                      email: clientData.email,
                      contact: clientData.contact,
                      regDate: clientData.regDate
                    });
                  } else {
                    return; // ביטול ומניעת כניסה לשורות
                  }
                }
              }

              // 2. בדיקת כפילות פרויקט בעת יצירת פרויקט חדש
              if (isNewProject || isNewClient) {
                const clientObj = clientsData[currentClient];
                if (clientObj) {
                  const existingProjMatch = clientObj.projects.find(p => p.toLowerCase() === currentProject.toLowerCase());
                  if (existingProjMatch) {
                    // פרויקט כבר קיים - הצעת שם סדרתי אוטומטי
                    let seqName = currentProject;
                    let counter = 2;
                    while (clientObj.projects.includes(seqName)) {
                      seqName = `${currentProject} - ${counter}`;
                      counter++;
                    }
                    const createSeq = window.confirm(`פרויקט בשם "${currentProject}" כבר קיים עבור הלקוח "${currentClient}".\nהאם ברצונך ליצור פרויקט חדש בשם הסדרתי הבא: "${seqName}"?`);
                    if (createSeq) {
                      currentProject = seqName;
                      const updated = { ...clientsData };
                      updated[currentClient].projects.push(seqName);
                      setClientsData(updated);
                      setIsNewProject(false);
                      setSelectedProject(seqName);
                    } else {
                      return; // ביטול ומניעת כניסה לשורות
                    }
                  } else {
                    // הוספת פרויקט חדש לחברה קיימת
                    const updated = { ...clientsData };
                    updated[currentClient].projects.push(currentProject);
                    setClientsData(updated);
                    setIsNewProject(false);
                    setSelectedProject(currentProject);
                  }
                } else {
                  // החברה וגם הפרויקט חדשים לגמרי - שמירה בבסיס הנתונים
                  const updated = { ...clientsData };
                  updated[currentClient] = {
                    phone: clientDetails.phone,
                    email: clientDetails.email,
                    contact: clientDetails.contact,
                    regDate: clientDetails.regDate,
                    projects: [currentProject]
                  };
                  setClientsData(updated);
                  setIsNewClient(false);
                  setSelectedClientKey(currentClient);
                  setIsNewProject(false);
                  setSelectedProject(currentProject);
                }
              }
              
              if (loadedClientProject.client !== currentClient || loadedClientProject.project !== currentProject) {
                setSheets([
                  {
                    id: '1',
                    name: 'דף מדידה #1',
                    rows: [{ 
                      id: '1', partNumber: 'P001', type: 'קטע ישר', width1: 0.5, height1: 0.4, width2: 0, height2: 0, length: 1.0, rBig: 0, rSmall: 0,
                      shatuzar: false, flexible: 0, acoustic: true, external: false, 
                      sharshuriType: 'ללא', sharshuriLen: 0, adapterType: 'ללא', adapterQty: 0, notes: '', manualThickness: 0, rBig2: 0, panels: 0
                    }]
                  }
                ]);
                setActiveSheetId('1');
                setActiveTab('measure');
                setLoadedClientProject({ client: currentClient, project: currentProject });
                
                // יצירת מספר סימוכין אקראי וייחודי חדש בעת מעבר ללקוח או פרויקט אחר
                const newRandomDocNum = Math.floor(1000 + Math.random() * 9000).toString();
                setDocNumber(newRandomDocNum);
              }
              
              setIsSessionInitialized(true);
              setImportedClientSourceKey('');
            }}
            style={{ width: '100%', padding: '14px', backgroundColor: '#10b981', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 6px -1px rgba(16,185,129,0.2)' }}
          >
            <CheckCircle2 size={20} /> אישור וכניסה לטבלת המדידות
          </button>
          </>)}
        </div>
      ) : (
        /* שלב 2: תצוגת המערכת והטבלאות לאחר נעילת הישות הפיננסית */
        <div>
          {/* סרגל עליון אינפורמטיבי שמציג על מה עובדים כרגע ומאפשר החלפה/נעילה מחדש */}
          <section style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', gap: '32px', alignItems: 'center', fontSize: '13px' }}>
              <div>
                <span style={{ color: '#64748b', marginLeft: '4px' }}>חברה/לקוח:</span>
                <strong style={{ color: '#0f172a', fontSize: '14px' }}>{isNewClient ? clientDetails.name : selectedClientKey}</strong>
                <span style={{ fontSize: '11px', color: '#2563eb', marginRight: '6px', backgroundColor: '#eff6ff', padding: '2px 6px', borderRadius: '4px' }}>{isNewClient ? 'חדש' : 'רשום'}</span>
              </div>
              <div style={{ borderRight: '1px solid #e2e8f0', paddingRight: '24px' }}>
                <span style={{ color: '#64748b', marginLeft: '4px' }}>פרויקט פעיל:</span>
                <strong style={{ color: '#0f172a', fontSize: '14px' }}>{isNewProject ? newProjectName : selectedProject}</strong>
              </div>
              <div style={{ borderRight: '1px solid #e2e8f0', paddingRight: '24px' }}>
                <span style={{ color: '#64748b', marginLeft: '4px' }}>איש קשר:</span>
                <span style={{ color: '#334155' }}>{clientDetails.contact || 'לא הוגדר'}</span>
              </div>
              <div style={{ borderRight: '1px solid #e2e8f0', paddingRight: '24px' }}>
                <span style={{ color: '#64748b', marginLeft: '4px' }}>טלפון:</span>
                <span style={{ color: '#334155' }}>{clientDetails.phone || 'לא הוגדר'}</span>
              </div>
            </div>
            <button 
              onClick={() => setIsSessionInitialized(false)}
              style={{ padding: '6px 12px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', color: '#475569', fontWeight: 600 }}
            >
              החלף לקוח / פרויקט
            </button>
          </section>

          {/* אזור תוכן מרכזי - טבלאות וחישובים */}
          <main style={{ width: '100%', padding: '24px', boxSizing: 'border-box' }}>
            
            {/* טאב דפי מדידה */}
            {activeTab === 'measure' && (
              <MeasurementPage
                sheets={sheets}
                setSheets={setSheets}
                activeSheet={activeSheet}
                activeSheetId={activeSheetId}
                setActiveSheetId={setActiveSheetId}
                clientDetails={clientDetails}
                selectedProject={selectedProject}
                docDate={docDate}
                docNumber={docNumber}
                isAddingPart={isAddingPart}
                setIsAddingPart={setIsAddingPart}
                newPartData={newPartData}
                setNewPartData={setNewPartData}
                quickQty={quickQty}
                setQuickQty={setQuickQty}
                editingSheetId={editingSheetId}
                setEditingSheetId={setEditingSheetId}
                editingSheetName={editingSheetName}
                setEditingSheetName={setEditingSheetName}
                updateRow={updateRow}
                deleteRow={deleteRow}
                duplicateRow={duplicateRow}
                bulkDelete={bulkDelete}
                bulkCopyToSheet={bulkCopyToSheet}
                addSheet={addSheet}
                deleteSheet={deleteSheet}
                partPresets={partPresets}
                savePreset={savePreset}
                loadPreset={loadPreset}
                deletePreset={deletePreset}
                calculateThickness={calculateThickness}
                calculateArea={calculateArea}
                getPrice={getPrice}
                getRowWarnings={getRowWarnings}
                lastHoveredRowId={lastHoveredRowId}
                setLastHoveredRowId={setLastHoveredRowId}
                selectedRowIds={selectedRowIds}
                setSelectedRowIds={setSelectedRowIds}
                toggleRowSelection={toggleRowSelection}
                toggleSelectAll={toggleSelectAll}
                openAddPartForm={openAddPartForm}
                saveFormPart={saveFormPart}
                undoStack={undoStack}
                redoStack={redoStack}
                handleUndo={handleUndo}
                handleRedo={handleRedo}
                pushToHistory={pushToHistory}
                handlePrint={handlePrint}
              />
            )}

            {/* טאב ריכוז כמויות */}
            {activeTab === 'summary' && (
              <SummaryPage
                sheets={sheets}
                clientDetails={clientDetails}
                selectedProject={selectedProject}
                isNewProject={isNewProject}
                newProjectName={newProjectName}
                isNewClient={isNewClient}
                selectedClientKey={selectedClientKey}
                docDate={docDate}
                docNumber={docNumber}
                myCompanyDetails={myCompanyDetails}
                handlePrint={handlePrint}
                calculateThickness={calculateThickness}
                calculateArea={calculateArea}
              />
            )}

            {/* טאב חשבון פרופורמה */}
            {activeTab === 'invoice' && (
              <InvoicePage
                sheets={sheets}
                clientDetails={clientDetails}
                selectedProject={selectedProject}
                isNewProject={isNewProject}
                newProjectName={newProjectName}
                isNewClient={isNewClient}
                selectedClientKey={selectedClientKey}
                docDate={docDate}
                docNumber={docNumber}
                pricesList={pricesList}
                invoicePriceOverrides={invoicePriceOverrides}
                setInvoicePriceOverrides={setInvoicePriceOverrides}
                calculateThickness={calculateThickness}
                calculateArea={calculateArea}
                getPrice={getPrice}
                getSheetTotals={getSheetTotals}
                myCompanyDetails={myCompanyDetails}
                producedProjects={producedProjects}
                setProducedProjects={setProducedProjects}
                setProducedSnapshots={setProducedSnapshots}
                activeSheet={activeSheet}
                handlePrint={handlePrint}
              />
            )}

            {/* טאב מחירון העסק */}
            {activeTab === 'pricelist' && (
              <PriceListPage
                pricesList={pricesList}
                setPricesList={setPricesList}
                handlePrint={handlePrint}
              />
            )}

            {/* טאב דפי ייצור */}
            {activeTab === 'production' && (
              <ProductionPage
                activeSheet={activeSheet}
                selectedProject={selectedProject}
                isNewProject={isNewProject}
                newProjectName={newProjectName}
                isNewClient={isNewClient}
                selectedClientKey={selectedClientKey}
                clientDetails={clientDetails}
                docDate={docDate}
                docNumber={docNumber}
                myCompanyDetails={myCompanyDetails}
                calculateThickness={calculateThickness}
                handlePrint={handlePrint}
              />
            )}
          </main>


      </div>
      )}
      </div>

      {/* דיאלוג שמירת קובץ JSON */}
      {showExportDialog && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={() => setShowExportDialog(false)}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', minWidth: '400px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#0f172a' }}>💾 ייצוא לקובץ JSON</h3>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 12px 0' }}>הקובץ יישמר מקומית + בענן Firebase</p>
            <label style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '6px' }}>שם הקובץ:</label>
            <input
              value={exportFileName}
              onChange={(e) => setExportFileName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') doExportJSON(); }}
              autoFocus
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px', justifyContent: 'flex-start' }}>
              <button onClick={() => doExportJSON()} style={{ backgroundColor: '#10b981', color: '#ffffff', border: 'none', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>💾 שמור קובץ + ענן</button>
              <button onClick={() => setShowExportDialog(false)} style={{ backgroundColor: '#64748b', color: '#ffffff', border: 'none', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>ביטול</button>
            </div>
          </div>
        </div>
      )}
      {isSessionInitialized && (
        <PrintableReport
          sheets={sheets}
          clientDetails={{ name: clientDetails.name, phone: clientDetails.phone, email: clientDetails.email, contact: clientDetails.contact }}
          selectedProject={selectedProject}
          docDate={docDate}
          docNumber={docNumber}
          calculateArea={calculateArea}
          calculateThickness={calculateThickness}
        />
      )}
    </div>
  );
}
