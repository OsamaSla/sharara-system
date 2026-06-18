import React, { useState, useEffect } from 'react';
import './App.css';
import { Trash2, FileSpreadsheet, Layers, CreditCard, Building2, Briefcase, User, Phone, Mail, CheckCircle2, FileDown } from 'lucide-react';
import ExcelJS from 'exceljs';
import PrintableReport from './PrintableReport';
import CompanyLetterhead from './CompanyLetterhead';
import ProductionWorksheet from './ProductionWorksheet';
import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';


export interface RowData {
  id: string;
  partNumber: string;
  type: 'קטע ישר' | 'קשת' | 'מעבר';
  panels: number;
  dofan: number;
  width1: number;
  height1: number;
  width2: number;
  height2: number;
  length: number;
  rBig: number;
  rSmall: number;
  shatuzar: boolean;
  flexible: number;
  acoustic: boolean;
  external: boolean;
  sharshuriType: 'ללא' | '"4' | '"6' | '"8' | '"10' | '"12' | '"14';
  sharshuriLen: number;
  adapterType: 'ללא' | '"6 מתאם' | '8/8 מתאם' | '10/10 מתאם' | '12/12 מתאם' | '14/14 מתאם' | '16/16 מתאם' | '60/60 מתאם';
  adapterQty: number;
  notes: string;
  manualThickness: number;
  rBig2: number;
}

export interface Sheet {
  id: string;
  name: string;
  rows: RowData[];
}

export interface PriceItem {
  id: string;
  detail: string;
  unit: string;
  price: number;
}

// בסיס נתונים פיקטיבי ראשוני של לקוחות ופרויקטים קיימים במערכת
const EXISTING_DATA = {
  "אלקטרה מיזוג אוויר": {
    phone: "03-9404040", email: "info@electra.co.il", contact: "יוסי לוי", regDate: "2025-01-10",
    projects: ["מגדלי עזריאלי קומה 4", "בית חולים שיבא - מחלקה ד'"]
  },
  "תדיראן פרויקטים": {
    phone: "04-8203030", email: "pro@tadiran.co.il", contact: "אבי כהן", regDate: "2025-03-15",
    projects: ["קניון עופר פתח תקווה", "משרדי הייטק הרצליה"]
  },
  "משב הנדסה": {
    phone: "02-5607080", email: "mashav@mashav.co.il", contact: "רוני לוין", regDate: "2025-06-01",
    projects: ["מגדל פלטינום תל אביב"]
  }
};

export default function App() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // סטייטים של אבטחה וכניסה לאתר (sessionStorage לשמירת החיבור)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => sessionStorage.getItem('sharara_isLoggedIn') === 'true');
  const [loginUsername, setLoginUsername] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');

  // טעינת נתונים מ-Firestore
  useEffect(() => {
    const loadData = async () => {
      try {
        const docRef = doc(db, 'appData', 'mainData');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          // עדכון הסטייטים מהענן
          if (data.clientsData) setClientsData(data.clientsData);
          if (data.pricesList) setPricesList(data.pricesList);
          if (data.myCompanyDetails) setMyCompanyDetails(data.myCompanyDetails);
          // וכן הלאה לכל השאר...
        }
      } catch (error) {
        console.error("Error loading from Firestore: ", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // הצגת מסך טעינה
  // (הועבר למטה אחרי כל ה-Hooks)



  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Bypass authentication check
    setIsLoggedIn(true);
    sessionStorage.setItem('sharara_isLoggedIn', 'true');
    setLoginError('');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    sessionStorage.removeItem('sharara_isLoggedIn');
    setLoginUsername('');
    setLoginPassword('');
  };

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
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // דפי המדידות והשורות
  const [sheets, setSheets] = useState<Sheet[]>([
    {
      id: '1',
      name: 'דף מדידה #1',
      rows: [{ 
        id: '1', partNumber: 'P001', type: 'קטע ישר', width1: 500, height1: 400, width2: 0, height2: 0, length: 1000, rBig: 0, rSmall: 150,
        shatuzar: false, flexible: 0, acoustic: false, external: false, 
        sharshuriType: 'ללא', sharshuriLen: 0, adapterType: 'ללא', adapterQty: 0, notes: '', manualThickness: 0, rBig2: 0, panels: 0, dofan: 0
      }]
    }
  ]);
  const [activeSheetId, setActiveSheetId] = useState<string>('1');
  const [activeTab, setActiveTab] = useState<'measure' | 'summary' | 'invoice' | 'pricelist' | 'production'>('measure');

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
      } catch (error) {
        console.error("Error saving to Firestore: ", error);
      }
    };
    saveData();
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

  // מאזין גלובלי למקשי מקלדת Ctrl+Z ו-Ctrl+Y לביצוע UNDO/REDO בזמן עריכה
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
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoStack, redoStack, sheets, isSessionInitialized, activeTab]);

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
    width1: 500,
    height1: 400,
    width2: 0,
    height2: 0,
    length: 1000,
    rBig: 0,
    rSmall: 150,
    shatuzar: false,
    flexible: 0,
    acoustic: false,
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

  const [invoicePriceOverrides, setInvoicePriceOverrides] = useState<Record<string, number>>({});
  const getInvoicePrice = (key: string) => invoicePriceOverrides[key] !== undefined ? invoicePriceOverrides[key] : getPrice(key);
  const setInvoicePrice = (key: string, value: number) => setInvoicePriceOverrides({...invoicePriceOverrides, [key]: value});

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



  const calculateThickness = (w1: number, h1: number, manual?: number): number => {
    if (manual && manual > 0) return manual;
    const max = Math.max(w1, h1);
    if (max <= 600) return 0.8;
    if (max <= 1000) return 1.0;
    return 1.25;
  };

  const calculateArea = (row: RowData): number => {
    const { type, width1, height1, width2, height2, length, rBig, rSmall, notes, rBig2, dofan = 0 } = row;
    const panels = row.panels || 1;
    
    let areaBase = 0;
    let dofanArea = 0;

    if (notes && notes.includes('צינור עגול')) {
      areaBase = Math.PI * width1 * length;
      dofanArea = dofan * width1 * 2;
    } else if (notes === 'לאמד S') {
      const r2 = rBig2 || rSmall;
      const totalLen = length + (Math.PI / 2) * (rSmall + r2);
      areaBase = 2 * (width1 + height1) * totalLen;
      dofanArea = dofan * width1 * height1;
    } else if (type === 'קטע ישר') {
      areaBase = 2 * (width1 + height1) * length;
      dofanArea = dofan * width1 * height1;
    } else if (type === 'קשת') {
      areaBase = 2 * (width1 + height1) * (rBig + rSmall);
      dofanArea = dofan * width1 * height1;
    } else if (type === 'מעבר') {
      areaBase = ((width1 + width2) + (height1 + height2)) * length;
      dofanArea = dofan * width1 * height1;
    }
    
    return ((areaBase + dofanArea) * panels) / 1000000;
  };

  // שליפת מחיר פריט מהמחירון הדינמי לפי שמו
  const getPrice = (name: string): number => {
    const item = pricesList.find(p => p.detail === name);
    return item ? item.price : 0;
  };

  // חישוב מפורט של עלויות עבור דף מדידה בודד (לפי מחירון דינמי)
  const getDetailedSheetCosts = (sheet: Sheet) => {
    let sheetPahSum = 0;
    let sheetPah125Sum = 0;
    let sheetBidudSum = 0;
    let sheetMatamSum = 0;
    let sheetShatuzarSum = 0;
    let sheetFlexibleSum = 0;
    let sheetSharshuriSum = 0;

    sheet.rows.forEach(row => {
      const thick = calculateThickness(row.width1, row.height1, row.manualThickness);
      const area = calculateArea(row);

      // 1. פח רגיל (0.8 ו-1.0) או פח 1.25
      if (thick === 0.8) {
        sheetPahSum += area * getPrice('פח 0.8');
      } else if (thick === 1.0) {
        sheetPahSum += area * getPrice('פח 1.0');
      } else if (thick === 1.25) {
        sheetPah125Sum += area * getPrice('פח 1.25');
      }

      // 2. בידוד (פנימי אקוסטי או חיצוני טרמי)
      if (row.acoustic) {
        sheetBidudSum += (area / (row.panels || 1)) * getPrice('בידוד פנימי 1"');
      }
      if (row.external) {
        sheetBidudSum += area * getPrice('בידוד חיצוני 1"');
      }

      // 3. מתאמים
      if (row.adapterType !== 'ללא' && row.adapterQty > 0) {
        let adapterPriceKey = 'מתאם 6"6/"';
        if (row.adapterType === '8/8 מתאם') adapterPriceKey = 'מתאם 8"8/"';
        else if (row.adapterType === '10/10 מתאם') adapterPriceKey = 'מתאם 10"10/"';
        else if (row.adapterType === '12/12 מתאם') adapterPriceKey = 'מתאם 12"12/"';
        else if (row.adapterType === '14/14 מתאם') adapterPriceKey = 'מתאם 14"14/"';
        else if (row.adapterType === '16/16 מתאם') adapterPriceKey = 'מתאם 16"16/"';
        else if (row.adapterType === '60/60 מתאם') adapterPriceKey = 'מתאם 60/60';
        
        sheetMatamSum += row.adapterQty * getPrice(adapterPriceKey);
      }

      // 4. שתוצר עגול
      if (row.shatuzar) {
        sheetShatuzarSum += 1 * getPrice('שתוצר עגול');
      }

      // 5. גמיש
      if (row.flexible > 0) {
        sheetFlexibleSum += row.flexible * getPrice('חיבור גמיש');
      }

      // 6. שרשורי
      if (row.sharshuriType !== 'ללא' && row.sharshuriLen > 0) {
        let sharshuriPriceKey = 'שרשורי 6"';
        if (row.sharshuriType === '"4') sharshuriPriceKey = 'שרשורי 4"';
        else if (row.sharshuriType === '"8') sharshuriPriceKey = 'שרשורי 8"';
        else if (row.sharshuriType === '"10') sharshuriPriceKey = 'שרשורי 10"';
        else if (row.sharshuriType === '"12') sharshuriPriceKey = 'שרשורי 12"';
        else if (row.sharshuriType === '"14') sharshuriPriceKey = 'שרשורי 14"';

        sheetSharshuriSum += row.sharshuriLen * getPrice(sharshuriPriceKey);
      }
    });

    const subtotal = sheetPahSum + sheetPah125Sum + sheetBidudSum + sheetMatamSum + sheetShatuzarSum + sheetFlexibleSum + sheetSharshuriSum;
    const vat = subtotal * 0.18;
    const total = subtotal + vat;

    return {
      pahCost: sheetPahSum,
      pah125Cost: sheetPah125Sum,
      bidudCost: sheetBidudSum,
      matamCost: sheetMatamSum,
      shatuzarCost: sheetShatuzarSum,
      flexibleCost: sheetFlexibleSum,
      sharshuriCost: sheetSharshuriSum,
      subtotal,
      vat,
      total
    };
  };

  const getProjectTotals = () => {
    let t08 = 0; let t10 = 0; let t125 = 0;
    let totalShatuzar = 0; let totalFlexible = 0;
    let totalAcousticArea = 0; let totalExternalArea = 0;
    
    const sharshuriTotals = { '"4': 0, '"6': 0, '"8': 0, '"10': 0, '"12': 0, '"14': 0 };
    const adapterTotals = { '"6 מתאם': 0, '8/8 מתאם': 0, '10/10 מתאם': 0, '12/12 מתאם': 0, '14/14 מתאם': 0, '16/16 מתאם': 0, '60/60 מתאם': 0 };

    sheets.forEach(sheet => {
      sheet.rows.forEach(row => {
        const thick = calculateThickness(row.width1, row.height1, row.manualThickness);
        const area = calculateArea(row);
        
        if (thick === 0.8) t08 += area;
        else if (thick === 1.0) t10 += area;
        else if (thick === 1.25) t125 += area;

        if (row.shatuzar) totalShatuzar += 1;
        if (row.flexible) totalFlexible += row.flexible;
        if (row.acoustic) totalAcousticArea += area;
        if (row.external) totalExternalArea += area;

        if (row.sharshuriType !== 'ללא') sharshuriTotals[row.sharshuriType] += row.sharshuriLen;
        if (row.adapterType !== 'ללא') adapterTotals[row.adapterType] += row.adapterQty;
      });
    });

    return { 
      0.8: t08, 1.0: t10, 1.25: t125, 
      shatuzar: totalShatuzar, flexible: totalFlexible, 
      acoustic: totalAcousticArea, external: totalExternalArea,
      sharshuri: sharshuriTotals, adapter: adapterTotals
    };
  };

  const totals = getProjectTotals();

  const getSubtotal = () => {
    return sheets.reduce((sum, sheet) => sum + getDetailedSheetCosts(sheet).subtotal, 0);
  };

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

  // פתיחת טופס להוספת חלק חדש עם ברירות מחדל בהתאם לצורה שנבחרה
  const openAddPartForm = (type: RowData['type'], defaultNotes: string = '') => {
    setIsAddingPart(true);
    
    const defaults: RowData = {
      id: Date.now().toString(),
      partNumber: '',
      type,
      width1: 500,
      height1: 400,
      width2: 0,
      height2: 0,
      length: 1000,
      rBig: 0,
      rSmall: 150,
      shatuzar: false,
      flexible: 0,
      acoustic: false,
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
      defaults.rBig = 500 + 150; // width1 + rSmall
    } else if (type === 'מעבר') {
      defaults.width2 = 400;
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

    // הוספת שורה חדשה לדף המדידה הפעיל
    setSheets(sheets.map(s => {
      if (s.id === activeSheetId) {
        return {
          ...s,
          rows: [...s.rows, { ...newPartData, id: Date.now().toString() }]
        };
      }
      return s;
    }));

    setIsAddingPart(false);
  };

  // חישוב ריכוז כמויות עבור דף מדידה בודד (עבור טבלת האקסל)
  const getSheetTotals = (sheet: Sheet) => {
    let t08 = 0;
    let t10 = 0;
    let t125 = 0;
    let flexible = 0;
    let acoustic = 0;
    let external = 0;
    let sharshuri6 = 0;
    let sharshuri8 = 0;
    let sharshuri10 = 0;
    let adapterQty = 0;
    let shatuzar = 0;

    sheet.rows.forEach(row => {
      const thick = calculateThickness(row.width1, row.height1, row.manualThickness);
      const area = calculateArea(row);

      if (thick === 0.8) t08 += area;
      else if (thick === 1.0) t10 += area;
      else if (thick === 1.25) t125 += area;

      if (row.flexible) flexible += row.flexible;
      if (row.acoustic) acoustic += area;
      if (row.external) external += area;

      if (row.sharshuriType === '"6') sharshuri6 += row.sharshuriLen;
      else if (row.sharshuriType === '"8') sharshuri8 += row.sharshuriLen;
      else if (row.sharshuriType === '"10') sharshuri10 += row.sharshuriLen;

      if (row.adapterType !== 'ללא') adapterQty += row.adapterQty;
      if (row.shatuzar) shatuzar += 1;
    });

    return {
      t08,
      t10,
      t125,
      flexible,
      acoustic,
      external,
      sharshuri6,
      sharshuri8,
      sharshuri10,
      adapterQty,
      shatuzar
    };
  };

  // ייצוא לאקסל
  // ── עזרים לעיצוב אקסל ──
  const downloadWorkbook = async (wb: ExcelJS.Workbook, filename: string) => {
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const styleHeaderRow = (row: ExcelJS.Row, colCount: number) => {
    row.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11, name: 'Assistant' };
    row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E79' } };
    row.alignment = { horizontal: 'center', vertical: 'middle' };
    row.height = 28;
    for (let i = 1; i <= colCount; i++) {
      const cell = row.getCell(i);
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    }
  };

  const styleDataRow = (row: ExcelJS.Row, colCount: number, isEven: boolean) => {
    row.height = 20;
    if (isEven) row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEBF5FB' } };
    row.alignment = { vertical: 'middle', horizontal: 'center' };
    for (let i = 1; i <= colCount; i++) {
      const cell = row.getCell(i);
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    }
  };

  // ── ייצוא דף מדידה לאקסל מעוצב ──
  function exportToExcel() {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'שרארה מערכות מיזוג';
    wb.created = new Date();
    const dateStr = new Date().toISOString().slice(0, 10);
    const infoLine = `לקוח: ${clientDetails.name}  |  פרויקט: ${selectedProject}  |  תאריך: ${docDate}  |  מס' מסמך: ${docNumber}`;

    sheets.forEach((sheet, si) => {
      const ws = wb.addWorksheet(`דף ${si+1} - ${sheet.name}`);
      const cols = 21;
      ws.mergeCells(1, 1, 1, cols);
      const titleRow = ws.addRow([`שרארה — דף מדידה: ${sheet.name}`]);
      titleRow.font = { bold: true, size: 14, name: 'Assistant', color: { argb: 'FF1F4E79' } };
      titleRow.alignment = { horizontal: 'right', vertical: 'middle' };
      titleRow.height = 30;
      ws.mergeCells(2, 1, 2, cols);
      const infoRow = ws.addRow([infoLine]);
      infoRow.font = { size: 10, name: 'Assistant', italic: true, color: { argb: 'FF555555' } };
      infoRow.alignment = { horizontal: 'right', vertical: 'middle' };
      infoRow.height = 20;

      const headers = ['#','מס\' חלק','סוג/פירוט','רוחב','גובה','רוחב 2','גובה 2','אורך (מ"מ)','רדיוס גדול','רדיוס קטן','שתוצר','גמיש (מ"א)','אקוסטי','חיצוני','קוטר שרשורי','שרשורי (מ"א)','סוג מתאם','מתאם (כמות)','עובי פח','דופן','שטח (מ"ר)'];
      const hRow = ws.addRow(headers);
      styleHeaderRow(hRow, cols);

      sheet.rows.forEach((row, idx) => {
        const thick = calculateThickness(row.width1, row.height1, row.manualThickness);
        const area = calculateArea(row);
        const displayType = row.notes && ['לאמד S','צינור עגול','קופסת פיזור','מדף אש'].includes(row.notes) ? row.notes : row.type;
        let detail = `${displayType} ${row.notes === 'צינור עגול' ? `קוטר ${row.width1}` : `${row.width1}x${row.height1}`}`;
        if (row.type === 'מעבר') detail += ` / ${row.width2}x${row.height2}`;
        if (row.length > 0) detail += ` L=${row.length}`;

        const dRow = ws.addRow([
          idx+1, row.partNumber||'', detail,
          row.width1, row.height1, row.width2, row.height2, row.length,
          row.rBig, row.rSmall,
          row.shatuzar ? '✓' : '', row.flexible||'',
          row.acoustic ? '✓' : '', row.external ? '✓' : '',
          row.sharshuriType !== 'ללא' ? row.sharshuriType : '', row.sharshuriLen||'',
          row.adapterType !== 'ללא' ? row.adapterType : '', row.adapterQty||'',
          thick.toFixed(2), row.panels||'', area.toFixed(3)
        ]);
        styleDataRow(dRow, cols, idx % 2 === 1);
      });

      [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21].forEach((c,i) => { ws.getColumn(c).width = [5,10,28,8,8,8,8,10,10,10,7,7,7,7,10,8,10,8,8,7,8][i]; });
    });
    downloadWorkbook(wb, `sharara_${dateStr}.xlsx`);
  }

  // ── ייצוא ריכוז כמויות לאקסל מעוצב ──
  const exportSummaryToExcel = () => {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'שרארה מערכות מיזוג';
    wb.created = new Date();
    const dateStr = new Date().toISOString().slice(0, 10);
    const infoLine = `לקוח: ${clientDetails.name}  |  פרויקט: ${selectedProject}  |  תאריך: ${docDate}`;

    sheets.forEach((sheet, si) => {
      const ws = wb.addWorksheet(`ריכוז ${si+1}`);
      const cols = 12;
      ws.mergeCells(1, 1, 1, cols);
      const titleRow = ws.addRow([`ריכוז כמויות — ${sheet.name}`]);
      titleRow.font = { bold: true, size: 14, name: 'Assistant', color: { argb: 'FF1F4E79' } };
      titleRow.alignment = { horizontal: 'right', vertical: 'middle' };
      titleRow.height = 30;
      ws.mergeCells(2, 1, 2, cols);
      const infoRow = ws.addRow([infoLine]);
      infoRow.font = { size: 10, name: 'Assistant', italic: true, color: { argb: 'FF555555' } };
      infoRow.alignment = { horizontal: 'right', vertical: 'middle' };
      infoRow.height = 20;

      const headers = ['#','מס\' חלק','פירוט','פח (מ"ר)','בידוד (מ"ר)','מתאם (יח\')','דופן','שתוצר (יח\')','גמיש (מ"א)','שרשורי (מ"א)','פח 1.25 (מ"ר)','הערות'];
      const hRow = ws.addRow(headers);
      styleHeaderRow(hRow, cols);

      sheet.rows.forEach((row, idx) => {
        const thick = calculateThickness(row.width1, row.height1, row.manualThickness);
        const area = calculateArea(row);
        const displayType = row.notes && ['לאמד S','צינור עגול','קופסת פיזור','מדף אש'].includes(row.notes) ? row.notes : row.type;
        let detail = `${displayType} ${row.notes === 'צינור עגול' ? `קוטר ${row.width1}` : `${row.width1}x${row.height1}`}`;
        if (row.type === 'מעבר') detail += ` / ${row.width2}x${row.height2}`;
        if (row.length > 0) detail += ` L=${row.length}`;
        const is125 = thick === 1.25;

        const dRow = ws.addRow([
          idx+1, row.partNumber||'', detail,
          !is125 && area > 0 ? area.toFixed(2) : '',
          (row.acoustic || row.external) && area > 0 ? area.toFixed(2) : '',
          row.adapterType !== 'ללא' ? row.adapterQty : '',
          row.panels||'',
          row.shatuzar ? 1 : '',
          row.flexible||'',
          row.adapterType !== 'ללא' ? row.adapterQty : '',
          is125 && area > 0 ? area.toFixed(2) : '',
          row.notes||''
        ]);
        styleDataRow(dRow, cols, idx % 2 === 1);
      });

      [1,2,3,4,5,6,7,8,9,10,11,12].forEach((c,i) => { ws.getColumn(c).width = [5,10,28,10,10,10,7,10,10,10,12,18][i]; });
    });
    downloadWorkbook(wb, `sharara_summary_${dateStr}.xlsx`);
  }

  // ── ייצוא חשבון פרופורמה לאקסל מעוצב ──
  const exportInvoiceToExcel = () => {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'שרארה מערכות מיזוג';
    wb.created = new Date();
    const dateStr = new Date().toISOString().slice(0, 10);
    const ws = wb.addWorksheet('חשבון פרופורמה');
    const cols = 5;

    ws.mergeCells(1, 1, 1, cols);
    const titleRow = ws.addRow(['חשבון פרופורמה']);
    titleRow.font = { bold: true, size: 16, name: 'Assistant', color: { argb: 'FF1F4E79' } };
    titleRow.alignment = { horizontal: 'right', vertical: 'middle' };
    titleRow.height = 34;

    ws.mergeCells(2, 1, 2, cols);
    const infoRow = ws.addRow([`לקוח: ${clientDetails.name}  |  פרויקט: ${selectedProject}  |  תאריך: ${docDate}  |  מס' מסמך: ${docNumber}`]);
    infoRow.font = { size: 10, name: 'Assistant', italic: true, color: { argb: 'FF555555' } };
    infoRow.alignment = { horizontal: 'right', vertical: 'middle' };
    infoRow.height = 20;

    const allTotals = { t08: 0, t10: 0, t125: 0, flexible: 0, acoustic: 0, external: 0, sharshuri6: 0, sharshuri8: 0, sharshuri10: 0, adapterQty: 0, shatuzar: 0 };
    sheets.forEach(s => { const t = getSheetTotals(s); Object.keys(allTotals).forEach(k => allTotals[k as keyof typeof allTotals] += t[k as keyof typeof t]); });
    const gp = (k: string) => getInvoicePrice(k);
    const items: { label: string; qty: number; unit: string; price: number; total: number }[] = [];
    if (allTotals.t08 > 0) items.push({ label: 'פח מגולוון עובי 0.8 מ"מ', qty: allTotals.t08, unit: 'מ"ר', price: gp('פח 0.8'), total: allTotals.t08 * gp('פח 0.8') });
    if (allTotals.t10 > 0) items.push({ label: 'פח מגולוון עובי 1.0 מ"מ', qty: allTotals.t10, unit: 'מ"ר', price: gp('פח 1.0'), total: allTotals.t10 * gp('פח 1.0') });
    if (allTotals.t125 > 0) items.push({ label: 'פח מגולוון עובי 1.25 מ"מ', qty: allTotals.t125, unit: 'מ"ר', price: gp('פח 1.25'), total: allTotals.t125 * gp('פח 1.25') });
    if (allTotals.shatuzar > 0) items.push({ label: 'שתוצר עגול לתעלות', qty: allTotals.shatuzar, unit: 'יח\'', price: gp('שתוצר עגול'), total: allTotals.shatuzar * gp('שתוצר עגול') });
    if (allTotals.flexible > 0) items.push({ label: 'חיבור גמיש מונע רעידות', qty: allTotals.flexible, unit: 'מ"א', price: gp('חיבור גמיש'), total: allTotals.flexible * gp('חיבור גמיש') });
    if (allTotals.acoustic > 0) items.push({ label: 'בידוד אקוסטי', qty: allTotals.acoustic, unit: 'מ"ר', price: gp('בידוד אקוסטי'), total: allTotals.acoustic * gp('בידוד אקוסטי') });
    if (allTotals.external > 0) items.push({ label: 'בידוד חיצוני', qty: allTotals.external, unit: 'מ"ר', price: gp('בידוד חיצוני'), total: allTotals.external * gp('בידוד חיצוני') });
    const sumSharshuri = allTotals.sharshuri6 + allTotals.sharshuri8 + allTotals.sharshuri10;
    if (sumSharshuri > 0) items.push({ label: 'שרשוריות', qty: sumSharshuri, unit: 'מ"א', price: gp('שרשוריות'), total: sumSharshuri * gp('שרשוריות') });
    if (allTotals.adapterQty > 0) items.push({ label: 'מתאמים', qty: allTotals.adapterQty, unit: 'יח\'', price: gp('מתאמים'), total: allTotals.adapterQty * gp('מתאמים') });

    const headers = ['תיאור', 'כמות', 'יחידה', 'מחיר ליחידה', 'סה"כ'];
    const hRow = ws.addRow(headers);
    styleHeaderRow(hRow, cols);

    items.forEach((item, idx) => {
      const dRow = ws.addRow([item.label, item.qty.toFixed(2), item.unit, item.price.toFixed(2), item.total.toFixed(2)]);
      styleDataRow(dRow, cols, idx % 2 === 1);
    });

    const grandTotal = items.reduce((s, i) => s + i.total, 0);
    const totalRow = ws.addRow(['', '', '', 'סה"כ לתשלום:', grandTotal.toFixed(2)]);
    totalRow.font = { bold: true, size: 12, name: 'Assistant', color: { argb: 'FF1F4E79' } };
    totalRow.alignment = { horizontal: 'center', vertical: 'middle' };
    totalRow.height = 28;
    totalRow.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' };
    totalRow.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' };
    for (let i = 1; i <= cols; i++) {
      totalRow.getCell(i).border = { top: { style: 'double' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      totalRow.getCell(i).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F0FE' } };
    }

    ws.getColumn(1).width = 32;
    ws.getColumn(2).width = 12;
    ws.getColumn(3).width = 8;
    ws.getColumn(4).width = 14;
    ws.getColumn(5).width = 14;

    downloadWorkbook(wb, `sharara_invoice_${dateStr}.xlsx`);
  }

  // ── ייצוא מחירון לאקסל מעוצב ──
  const exportPriceListToExcel = () => {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'שרארה מערכות מיזוג';
    wb.created = new Date();
    const dateStr = new Date().toISOString().slice(0, 10);
    const ws = wb.addWorksheet('מחירון');
    const cols = 2;

    ws.mergeCells(1, 1, 1, cols);
    const titleRow = ws.addRow(['מחירון — שרארה מערכות מיזוג']);
    titleRow.font = { bold: true, size: 14, name: 'Assistant', color: { argb: 'FF1F4E79' } };
    titleRow.alignment = { horizontal: 'right', vertical: 'middle' };
    titleRow.height = 30;
    ws.mergeCells(2, 1, 2, cols);
    const infoRow = ws.addRow([`תאריך: ${docDate}  |  מס' מסמך: ${docNumber}`]);
    infoRow.font = { size: 10, name: 'Assistant', italic: true, color: { argb: 'FF555555' } };
    infoRow.alignment = { horizontal: 'right', vertical: 'middle' };
    infoRow.height = 20;

    const headers = ['שם פריט/שירות', 'מחיר (₪)'];
    const hRow = ws.addRow(headers);
    styleHeaderRow(hRow, cols);

    pricesList.forEach((p, idx) => {
      const dRow = ws.addRow([p.detail, p.price]);
      styleDataRow(dRow, cols, idx % 2 === 1);
    });

    ws.getColumn(1).width = 38;
    ws.getColumn(2).width = 16;

    downloadWorkbook(wb, `sharara_pricelist_${dateStr}.xlsx`);
  }

  if (!isLoggedIn) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a', fontFamily: 'Assistant, Rubik, sans-serif', direction: 'rtl', padding: '20px', boxSizing: 'border-box' }}>
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #334155', padding: '40px 32px', width: '100%', maxWidth: '420px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center', boxSizing: 'border-box' }}>
          
          {/* לוגו החברה הרשמי בראש דף ההתחברות */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginBottom: '24px', textAlign: 'center' }}>
            <img 
              src="./logo.png" 
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
    <div className={`active-tab-${activeTab}${isPreviewMode && activeTab !== 'measure' ? ' preview-mode' : ''}`} style={{ direction: 'rtl', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: 'Assistant, Rubik, sans-serif', color: '#1e293b', width: '100%', letterSpacing: '0.2px' }}>
      <div className="no-print" style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
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
        
        {/* לוגו באמצע הדף - מוגדל בצורה משמעותית */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
            <div style={{ position: 'relative' }}>
              <img 
                src="./logo.png" 
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
                      id: '1', partNumber: 'P001', type: 'קטע ישר', width1: 500, height1: 400, width2: 0, height2: 0, length: 1000, rBig: 0, rSmall: 150,
                      shatuzar: false, flexible: 0, acoustic: false, external: false, 
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
              <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', width: '100%' }}>
                
                <div style={{ backgroundColor: '#1e293b', color: '#ffffff', padding: '16px 20px', borderTopLeftRadius: '7px', borderTopRightRadius: '7px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                  
                  {/* קבוצה ימנית: ניהול דפים */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
                    {/* שורה עליונה: הוספת דף חדש ומחיקה */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={addSheet} style={{ backgroundColor: '#475569', color: '#ffffff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>+ דף חדש</button>
                      {sheets.length > 1 && (
                        <button 
                          onClick={() => deleteSheet(activeSheetId)} 
                          style={{ backgroundColor: '#ef4444', color: '#ffffff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}
                          title="מחק דף נוכחי"
                        >
                          <Trash2 size={13} /> מחק דף
                        </button>
                      )}
                    </div>

                    {/* שורה תחתונה: בחירה ועריכת מספר דף */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <select value={activeSheetId} onChange={(e) => setActiveSheetId(e.target.value)} style={{ padding: '6px 12px', borderRadius: '4px', backgroundColor: '#334155', color: '#ffffff', border: '1px solid #475569', fontWeight: 'bold', fontSize: '13px' }}>
                        {sheets.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#334155', padding: '6px 12px', borderRadius: '4px', border: '1px solid #475569' }}>
                        <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#94a3b8' }}>דף מדידה #</span>
                        <input 
                          type="text" 
                          value={activeSheet.name.replace(/דף מדידה #/g, '')} 
                          onChange={(e) => {
                            const newNum = e.target.value;
                            setSheets(sheets.map(s => s.id === activeSheetId ? { ...s, name: `דף מדידה #${newNum}` } : s));
                          }}
                          style={{ backgroundColor: 'transparent', color: '#ffffff', border: 'none', fontWeight: 'bold', fontSize: '13px', width: '40px', textAlign: 'center', padding: 0, outline: 'none' }}
                          placeholder="מס'"
                          title="ערוך את מספר דף המדידה"
                        />
                      </div>
                    </div>
                  </div>

                  {/* קבוצה מרכזית: 7 צורות החלקים */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#94a3b8' }}>הוסף חלק:</span>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, auto)', gap: '6px' }}>
                      {/* קטע ישר */}
                      <button onClick={() => openAddPartForm('קטע ישר')} style={{ backgroundColor: '#334155', border: '1px solid #475569', borderRadius: '4px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: '#ffffff' }}>


                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="8" width="18" height="8" rx="1" />
                          <line x1="3" y1="12" x2="21" y2="12" strokeDasharray="2 2" opacity="0.5" />
                        </svg>

                        <span style={{ fontWeight: 'bold', fontSize: '12px' }}>קטע ישר</span>
                      </button>
                      {/* קשת */}
                      <button onClick={() => openAddPartForm('קשת')} style={{ backgroundColor: '#334155', border: '1px solid #475569', borderRadius: '4px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: '#ffffff' }}>


                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 21v-9a8 8 0 0 1 8-8h9" />
                          <path d="M11 21v-6a4 4 0 0 1 4-4h6" />
                          <line x1="4" y1="21" x2="11" y2="21" />
                          <line x1="21" y1="4" x2="21" y2="11" />
                        </svg>

                        <span style={{ fontWeight: 'bold', fontSize: '12px' }}>קשת (מרפק)</span>
                      </button>
                      {/* מעבר */}
                      <button onClick={() => openAddPartForm('מעבר')} style={{ backgroundColor: '#334155', border: '1px solid #475569', borderRadius: '4px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: '#ffffff' }}>


                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="4,5 20,5 17,19 7,17" />
                        </svg>

                        <span style={{ fontWeight: 'bold', fontSize: '12px' }}>מעבר</span>
                      </button>
                      {/* לאמד S */}
                      <button onClick={() => openAddPartForm('קטע ישר', 'לאמד S')} style={{ backgroundColor: '#334155', border: '1px solid #475569', borderRadius: '4px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: '#ffffff' }}>


                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 5h5c3 0 5 6 8 6h5" />
                          <path d="M3 11h5c3 0 5 6 8 6h5" />
                          <line x1="3" y1="5" x2="3" y2="11" />
                          <line x1="21" y1="11" x2="21" y2="17" />
                          <path d="M3 8h5c3 0 5 6 8 6h5" strokeDasharray="2 2" opacity="0.5" />
                        </svg>

                        <span style={{ fontWeight: 'bold', fontSize: '12px' }}>לאמד S</span>
                      </button>
                      {/* צינור עגול */}
                      <button onClick={() => openAddPartForm('קטע ישר', 'צינור עגול')} style={{ backgroundColor: '#334155', border: '1px solid #475569', borderRadius: '4px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: '#ffffff' }}>


                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <ellipse cx="12" cy="6" rx="6" ry="3" />
                          <line x1="6" y1="6" x2="6" y2="18" />
                          <line x1="18" y1="6" x2="18" y2="18" />
                          <ellipse cx="12" cy="18" rx="6" ry="3" />
                        </svg>

                        <span style={{ fontWeight: 'bold', fontSize: '12px' }}>צינור עגול</span>
                      </button>
                      {/* קופסת פיזור */}
                      <button onClick={() => openAddPartForm('קטע ישר', 'קופסת פיזור')} style={{ backgroundColor: '#334155', border: '1px solid #475569', borderRadius: '4px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: '#ffffff' }}>


                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="4" y="10" width="16" height="11" rx="1" />
                          <ellipse cx="12" cy="6" rx="5" ry="2" />
                          <line x1="7" y1="6" x2="7" y2="10" />
                          <line x1="17" y1="6" x2="17" y2="10" />
                        </svg>

                        <span style={{ fontWeight: 'bold', fontSize: '12px' }}>קופסת פיזור</span>
                      </button>
                      {/* מדף אש */}
                      <button onClick={() => openAddPartForm('קטע ישר', 'מדף אש')} style={{ backgroundColor: '#334155', border: '1px solid #475569', borderRadius: '4px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: '#ffffff', gridColumn: 'span 2', justifyContent: 'center' }}>


                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="4" y="4" width="16" height="16" rx="1" />
                          <line x1="4" y1="8" x2="20" y2="8" />
                          <line x1="4" y1="16" x2="20" y2="16" />
                          <circle cx="12" cy="12" r="2" fill="currentColor" />
                        </svg>

                        <span style={{ fontWeight: 'bold', fontSize: '12px' }}>מדף אש</span>
                      </button>
                    </div>
                  </div>

                  {/* קבוצה שמאלית: ביטול/שחזור + הדפסה/ייצוא */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                    {/* שורה עליונה: ביטול ושחזור */}
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={handleUndo} disabled={undoStack.length === 0} style={{ backgroundColor: undoStack.length === 0 ? '#1e293b' : '#475569', color: undoStack.length === 0 ? '#64748b' : '#ffffff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: undoStack.length === 0 ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 'bold' }} title="בטל פעולה (Ctrl+Z)">↩ בטל</button>
                      <button onClick={handleRedo} disabled={redoStack.length === 0} style={{ backgroundColor: redoStack.length === 0 ? '#1e293b' : '#475569', color: redoStack.length === 0 ? '#64748b' : '#ffffff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: redoStack.length === 0 ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 'bold' }} title="בצע שוב (Ctrl+Y)">שחזר ↪</button>
                    </div>

                    {/* שורה תחתונה: ייצוא והדפסה */}
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={exportToExcel} style={{ backgroundColor: '#16a34a', color: '#ffffff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>Excel</button>
                      <button onClick={() => setIsPreviewMode(true)} style={{ backgroundColor: '#7c3aed', color: '#ffffff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>תצוגה מקדימה</button>
                      <button onClick={handlePrint} style={{ backgroundColor: '#475569', color: '#ffffff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>הדפס דוח</button>
                    </div>
                  </div>
                </div>

                {/* טופס הוספת חלק ויזואלי נוח ורחב */}
                {isAddingPart && (
                  <div style={{ backgroundColor: '#f8fafc', padding: '24px', borderBottom: '2.5px solid #cbd5e1', borderTop: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #334155', paddingBottom: '10px' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#1e3a8a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        ✨ טופס הזנת חלק חדש: <span style={{ color: '#10b981' }}>{newPartData.notes || newPartData.type}</span>
                      </h3>
                      <button onClick={() => setIsAddingPart(false)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b', fontWeight: 'bold' }}>✕</button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                      
                      {/* עמודה 1: מידות החלק */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <h4 style={{ margin: '0 0 6px 0', borderBottom: '1px solid #cbd5e1', paddingBottom: '4px', color: '#0f172a', fontWeight: 'bold', fontSize: '13px' }}>📏 מידות החלק (מ"מ)</h4>
                        
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                          <div>
                            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '2px' }}>מס' חלק:</label>
                            <input type="text" value={newPartData.partNumber} onChange={(e) => setNewPartData({...newPartData, partNumber: e.target.value})} style={{ width: '100%', maxWidth: '140px', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', color: '#0f172a', textAlign: 'center' }} placeholder="לדוגמה: P001" />
                          </div>
                          <div>
                            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '2px' }}>עובי פח:</label>
                            <select value={newPartData.manualThickness || ''} onChange={(e) => setNewPartData({...newPartData, manualThickness: Number(e.target.value)})} style={{ width: '110px', padding: '6px 10px', border: newPartData.manualThickness > 0 ? '2px solid #d97706' : '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: newPartData.manualThickness > 0 ? '#fffbeb' : '#ffffff', color: '#0f172a', fontWeight: newPartData.manualThickness > 0 ? 700 : 400, textAlign: 'center' }}>
                              <option value="">מחושב אוטומטי</option>
                              <option value="0.7">0.7 מ"מ</option>
                              <option value="0.8">0.8 מ"מ</option>
                              <option value="0.9">0.9 מ"מ</option>
                              <option value="1.0">1.0 מ"מ</option>
                              <option value="1.25">1.25 מ"מ</option>
                              <option value="2.0">2.0 מ"מ (שחור)</option>
                            </select>
                          </div>
                        </div>
                        
                        {/* 1. מידות לצינור עגול */}
                        {newPartData.notes === 'צינור עגול' ? (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <div>
                              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '2px' }}>קוטר הצינור (Diameter):</label>
                              <input type="number" value={newPartData.width1 || ''} onChange={(e) => setNewPartData({...newPartData, width1: Number(e.target.value), height1: Number(e.target.value)})} style={{ width: '100%', maxWidth: '110px', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', color: '#0f172a', textAlign: 'center' }} />
                            </div>
                            <div>
                              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '2px' }}>אורך צינור (מ"מ):</label>
                              <input type="number" value={newPartData.length || ''} onChange={(e) => setNewPartData({...newPartData, length: Number(e.target.value)})} style={{ width: '100%', maxWidth: '110px', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', color: '#0f172a', textAlign: 'center' }} />
                            </div>
                          </div>
                        ) : newPartData.notes === 'לאמד S' ? (
                          /* 2. מידות ללאמד S */
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <div>
                              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '2px' }}>רוחב תעלה (Width):</label>
                              <input type="number" value={newPartData.width1 || ''} onChange={(e) => setNewPartData({...newPartData, width1: Number(e.target.value)})} style={{ width: '100%', maxWidth: '110px', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', color: '#0f172a', textAlign: 'center' }} />
                            </div>
                            <div>
                              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '2px' }}>עומק תעלה (Depth):</label>
                              <input type="number" value={newPartData.height1 || ''} onChange={(e) => setNewPartData({...newPartData, height1: Number(e.target.value)})} style={{ width: '100%', maxWidth: '110px', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', color: '#0f172a', textAlign: 'center' }} />
                            </div>
                            <div>
                              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '2px' }}>אורך לאמד (מ"מ):</label>
                              <input type="number" value={newPartData.length || ''} onChange={(e) => setNewPartData({...newPartData, length: Number(e.target.value)})} style={{ width: '100%', maxWidth: '110px', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', color: '#0f172a', textAlign: 'center' }} />
                            </div>
                            <div></div>
                            <div>
                              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '2px' }}>סטייה עליונה (מ"מ):</label>
                              <input type="number" value={newPartData.rSmall || ''} onChange={(e) => setNewPartData({...newPartData, rSmall: Number(e.target.value)})} style={{ width: '100%', maxWidth: '110px', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', color: '#0f172a', textAlign: 'center' }} />
                            </div>
                            <div>
                              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '2px' }}>סטייה תחתונה (מ"מ):</label>
                              <input type="number" value={newPartData.rBig2 || ''} onChange={(e) => setNewPartData({...newPartData, rBig2: Number(e.target.value)})} style={{ width: '100%', maxWidth: '110px', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', color: '#0f172a', textAlign: 'center' }} />
                            </div>
                          </div>
                        ) : newPartData.notes === 'קופסת פיזור' ? (
                          /* 3. מידות לקופסת פיזור */
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <div>
                              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '2px' }}>רוחב קופסה (מ"מ):</label>
                              <input type="number" value={newPartData.width1 || ''} onChange={(e) => setNewPartData({...newPartData, width1: Number(e.target.value)})} style={{ width: '100%', maxWidth: '110px', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', color: '#0f172a', textAlign: 'center' }} />
                            </div>
                            <div>
                              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '2px' }}>עומק קופסה (מ"מ):</label>
                              <input type="number" value={newPartData.height1 || ''} onChange={(e) => setNewPartData({...newPartData, height1: Number(e.target.value)})} style={{ width: '100%', maxWidth: '110px', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', color: '#0f172a', textAlign: 'center' }} />
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '2px' }}>גובה קופסה (מ"מ):</label>
                              <input type="number" value={newPartData.length || ''} onChange={(e) => setNewPartData({...newPartData, length: Number(e.target.value)})} style={{ width: '100%', maxWidth: '110px', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', color: '#0f172a', textAlign: 'center' }} />
                            </div>
                          </div>
                        ) : newPartData.notes === 'מדף אש' ? (
                          /* 4. מידות למדף אש */
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <div>
                              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '2px' }}>רוחב מדף (Width):</label>
                              <input type="number" value={newPartData.width1 || ''} onChange={(e) => setNewPartData({...newPartData, width1: Number(e.target.value)})} style={{ width: '100%', maxWidth: '110px', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', color: '#0f172a', textAlign: 'center' }} />
                            </div>
                            <div>
                              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '2px' }}>עומק מדף (Depth):</label>
                              <input type="number" value={newPartData.height1 || ''} onChange={(e) => setNewPartData({...newPartData, height1: Number(e.target.value)})} style={{ width: '100%', maxWidth: '110px', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', color: '#0f172a', textAlign: 'center' }} />
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '2px' }}>גובה מדף (מ"מ):</label>
                              <input type="number" value={newPartData.length || ''} onChange={(e) => setNewPartData({...newPartData, length: Number(e.target.value)})} style={{ width: '100%', maxWidth: '110px', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', color: '#0f172a', textAlign: 'center' }} />
                            </div>
                          </div>
                        ) : (
                          /* 5. מידות סטנדרטיות (קטע ישר, קשת, מעבר) */
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {/* מידות לקטע ישר */}
                            {newPartData.type === 'קטע ישר' && (
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <div>
                                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '2px' }}>חתך 1 (רוחב):</label>
                                  <input type="number" value={newPartData.width1 || ''} onChange={(e) => setNewPartData({...newPartData, width1: Number(e.target.value)})} style={{ width: '100%', maxWidth: '110px', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', color: '#0f172a', textAlign: 'center' }} />
                                </div>
                                <div>
                                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '2px' }}>חתך 1 (עומק):</label>
                                  <input type="number" value={newPartData.height1 || ''} onChange={(e) => setNewPartData({...newPartData, height1: Number(e.target.value)})} style={{ width: '100%', maxWidth: '110px', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', color: '#0f172a', textAlign: 'center' }} />
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '2px' }}>אורך (מ"מ):</label>
                                  <input type="number" value={newPartData.length || ''} onChange={(e) => setNewPartData({...newPartData, length: Number(e.target.value)})} style={{ width: '100%', maxWidth: '110px', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', color: '#0f172a', textAlign: 'center' }} />
                                </div>
                              </div>
                            )}

                            {/* מידות לקשת */}
                            {newPartData.type === 'קשת' && (
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <div>
                                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '2px' }}>חתך 1 (רוחב):</label>
                                  <input type="number" value={newPartData.width1 || ''} onChange={(e) => { const w = Number(e.target.value); setNewPartData({...newPartData, width1: w, rBig: w + newPartData.rSmall}); }} style={{ width: '100%', maxWidth: '110px', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', color: '#0f172a', textAlign: 'center' }} />
                                </div>
                                <div>
                                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '2px' }}>חתך 1 (עומק):</label>
                                  <input type="number" value={newPartData.height1 || ''} onChange={(e) => setNewPartData({...newPartData, height1: Number(e.target.value)})} style={{ width: '100%', maxWidth: '110px', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', color: '#0f172a', textAlign: 'center' }} />
                                </div>
                                <div>
                                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '2px' }}>רדיוס קטן (R קטן):</label>
                                  <input type="number" value={newPartData.rSmall || ''} onChange={(e) => { const r = Number(e.target.value); setNewPartData({...newPartData, rSmall: r, rBig: newPartData.width1 + r}); }} style={{ width: '100%', maxWidth: '110px', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', color: '#0f172a', textAlign: 'center' }} />
                                </div>
                                <div>
                                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '2px' }}>רדיוס גדול (מחושב):</label>
                                  <input type="number" disabled value={newPartData.rBig || ''} style={{ width: '100%', maxWidth: '110px', padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: '4px', backgroundColor: '#e2e8f0', color: '#475569', fontWeight: 'bold', textAlign: 'center' }} />
                                </div>
                              </div>
                            )}

                            {/* מידות למעבר */}
                            {newPartData.type === 'מעבר' && (
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <div>
                                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '2px' }}>רוחב 1:</label>
                                  <input type="number" value={newPartData.width1 || ''} onChange={(e) => setNewPartData({...newPartData, width1: Number(e.target.value)})} style={{ width: '100%', maxWidth: '110px', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', color: '#0f172a', textAlign: 'center' }} />
                                </div>
                                <div>
                                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '2px' }}>עומק 1:</label>
                                  <input type="number" value={newPartData.height1 || ''} onChange={(e) => setNewPartData({...newPartData, height1: Number(e.target.value)})} style={{ width: '100%', maxWidth: '110px', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', color: '#0f172a', textAlign: 'center' }} />
                                </div>
                                <div>
                                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '2px' }}>רוחב 2:</label>
                                  <input type="number" value={newPartData.width2 || ''} onChange={(e) => setNewPartData({...newPartData, width2: Number(e.target.value)})} style={{ width: '100%', maxWidth: '110px', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', color: '#0f172a', textAlign: 'center' }} />
                                </div>
                                <div>
                                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '2px' }}>עומק 2:</label>
                                  <input type="number" value={newPartData.height2 || ''} onChange={(e) => setNewPartData({...newPartData, height2: Number(e.target.value)})} style={{ width: '100%', maxWidth: '110px', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', color: '#0f172a', textAlign: 'center' }} />
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '2px' }}>אורך (מ"מ):</label>
                                  <input type="number" value={newPartData.length || ''} onChange={(e) => setNewPartData({...newPartData, length: Number(e.target.value)})} style={{ width: '100%', maxWidth: '110px', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', color: '#0f172a', textAlign: 'center' }} />
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* עמודה 2: אביזרים ובידוד */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <h4 style={{ margin: '0 0 6px 0', borderBottom: '1px solid #cbd5e1', paddingBottom: '4px', color: '#0f172a', fontWeight: 'bold', fontSize: '13px' }}>🛠️ אביזרים ובידוד החלק</h4>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                            <input type="checkbox" checked={newPartData.shatuzar} onChange={(e) => setNewPartData({...newPartData, shatuzar: e.target.checked})} />
                            <span>שתוצר (עגול לתעלות)</span>
                          </label>
                          
                          <div>
                            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '2px' }}>חיבור גמיש (מ"א):</label>
                            <input type="number" value={newPartData.flexible || ''} onChange={(e) => setNewPartData({...newPartData, flexible: Number(e.target.value)})} style={{ width: '100%', maxWidth: '110px', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', color: '#0f172a', textAlign: 'center' }} />
                          </div>

                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', marginTop: '4px' }}>
                            <input type="checkbox" checked={newPartData.acoustic} onChange={(e) => setNewPartData({...newPartData, acoustic: e.target.checked})} />
                            <span>בידוד פנימי אקוסטי</span>
                          </label>

                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                            <input type="checkbox" checked={newPartData.external} onChange={(e) => setNewPartData({...newPartData, external: e.target.checked})} />
                            <span>בידוד חיצוני תרמי</span>
                          </label>
                        </div>
                      </div>

                      {/* עמודה 3: שרשורי ומתאמים + הערות */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <h4 style={{ margin: '0 0 6px 0', borderBottom: '1px solid #cbd5e1', paddingBottom: '4px', color: '#0f172a', fontWeight: 'bold', fontSize: '13px' }}>🔌 צינור שרשורי ומתאמים</h4>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <div>
                            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '2px' }}>קוטר שרשורי:</label>
                            <select value={newPartData.sharshuriType} onChange={(e) => setNewPartData({...newPartData, sharshuriType: e.target.value as any})} style={{ width: '100%', maxWidth: '120px', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', color: '#0f172a', fontWeight: '600' }}>
                              <option value="ללא">ללא</option>
                              <option value='"4'>"4</option>
                              <option value='"6'>"6</option>
                              <option value='"8'>"8</option>
                              <option value='"10'>"10</option>
                              <option value='"12'>"12</option>
                              <option value='"14'>"14</option>
                            </select>
                          </div>
                          <div>
                            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '2px' }}>שרשורי (מ"א):</label>
                            <input type="number" disabled={newPartData.sharshuriType === 'ללא'} value={newPartData.sharshuriLen || ''} onChange={(e) => setNewPartData({...newPartData, sharshuriLen: Number(e.target.value)})} style={{ width: '100%', maxWidth: '110px', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: newPartData.sharshuriType === 'ללא' ? '#e2e8f0' : '#ffffff', color: '#0f172a', textAlign: 'center' }} />
                          </div>
                          
                           <div>
                            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '2px' }}>סוג מתאם:</label>
                            <select value={newPartData.adapterType} onChange={(e) => setNewPartData({...newPartData, adapterType: e.target.value as any})} style={{ width: '100%', maxWidth: '140px', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', color: '#0f172a', fontWeight: '600' }}>
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
                          <div>
                            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '2px' }}>מתאם (כמות):</label>
                            <input type="number" disabled={newPartData.adapterType === 'ללא'} value={newPartData.adapterQty || ''} onChange={(e) => setNewPartData({...newPartData, adapterQty: Number(e.target.value)})} style={{ width: '100%', maxWidth: '110px', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: newPartData.adapterType === 'ללא' ? '#e2e8f0' : '#ffffff', color: '#0f172a', textAlign: 'center' }} />
                          </div>

                          {/* דופן ומס' חלקים */}
                          <div style={{ gridColumn: 'span 2', display: 'flex', gap: '12px', alignItems: 'center', padding: '10px 12px', backgroundColor: '#fefce8', borderRadius: '6px', border: '1px solid #facc15' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#854d0e' }}>דופן:</label>
                              <input type="number" min="0" value={newPartData.dofan || ''} onChange={(e) => setNewPartData({...newPartData, dofan: Math.max(0, Number(e.target.value))})} style={{ width: '50px', padding: '4px 8px', border: '1px solid #facc15', borderRadius: '4px', backgroundColor: '#ffffff', color: '#0f172a', fontWeight: 'bold', textAlign: 'center' }} placeholder="0" />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#854d0e' }}>מס' חלקים:</label>
                              <input type="number" min="1" value={newPartData.panels || 1} onChange={(e) => setNewPartData({...newPartData, panels: Math.max(1, Number(e.target.value))})} style={{ width: '50px', padding: '4px 8px', border: '1px solid #facc15', borderRadius: '4px', backgroundColor: '#ffffff', color: '#0f172a', fontWeight: 'bold', textAlign: 'center' }} placeholder="1" />
                            </div>
                          </div>

                          <div style={{ gridColumn: 'span 2', marginTop: '4px' }}>
                            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '2px' }}>הערות לחלק זה:</label>
                            <input type="text" value={newPartData.notes} onChange={(e) => setNewPartData({...newPartData, notes: e.target.value})} style={{ width: '100%', maxWidth: '220px', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', color: '#0f172a', textAlign: 'center' }} placeholder="כתוב הערה..." />
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* כפתורי שמירה וביטול */}
                    <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '10px', borderTop: '1px solid #cbd5e1', paddingTop: '15px' }}>
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
                    </div>
                  </div>
                )}

                <div style={{ overflowX: 'auto', width: '100%', backgroundColor: '#ffffff' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '13px', minWidth: '1700px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f1f5f9', color: '#475569', fontWeight: 'bold', borderBottom: '2px solid #cbd5e1' }}>
                        <th style={{ padding: '12px 8px', textAlign: 'center', width: '40px' }}>מס'</th>
                        <th style={{ padding: '12px 8px', textAlign: 'center', width: '60px' }}>מס' חלק</th>
                        <th style={{ padding: '12px 8px', width: '140px' }}>סוג חלק</th>
                        <th style={{ padding: '12px 8px', textAlign: 'center', backgroundColor: '#f8fafc' }}>חתך 1 (רוחב)</th>
                        <th style={{ padding: '12px 8px', textAlign: 'center', backgroundColor: '#f8fafc' }}>חתך 1 (גובה)</th>
                        <th style={{ padding: '12px 8px', textAlign: 'center', backgroundColor: '#e2f5ec' }}>חתך 2 (רוחב)</th>
                        <th style={{ padding: '12px 8px', textAlign: 'center', backgroundColor: '#e2f5ec' }}>חתך 2 (גובה)</th>
                        <th style={{ padding: '12px 8px', textAlign: 'center' }}>אורך (מ"מ)</th>
                        <th style={{ padding: '12px 8px', textAlign: 'center', backgroundColor: '#fff7ed' }}>רדיוס גדול</th>
                        <th style={{ padding: '12px 8px', textAlign: 'center', backgroundColor: '#fff7ed' }}>רדיוס קטן</th>
                        <th style={{ padding: '12px 8px', textAlign: 'center', backgroundColor: '#f0fdfa' }}>שתוצר</th>
                        <th style={{ padding: '12px 8px', textAlign: 'center', backgroundColor: '#f0fdfa' }}>גמיש (מ"א)</th>
                        <th style={{ padding: '12px 8px', textAlign: 'center', backgroundColor: '#faf5ff' }}>אקוסטי</th>
                        <th style={{ padding: '12px 8px', textAlign: 'center', backgroundColor: '#faf5ff' }}>חיצוני</th>
                        <th style={{ padding: '12px 8px', textAlign: 'center', backgroundColor: '#eff6ff' }}>קוטר שרשורי</th>
                        <th style={{ padding: '12px 8px', textAlign: 'center', backgroundColor: '#eff6ff' }}>שרשורי (מ"א)</th>
                        <th style={{ padding: '12px 8px', textAlign: 'center', backgroundColor: '#f0fdf4' }}>סוג מתאם</th>
                        <th style={{ padding: '12px 8px', textAlign: 'center', backgroundColor: '#f0fdf4' }}>מתאם (כמות)</th>
                        <th style={{ padding: '12px 8px', textAlign: 'center' }}>עובי פח</th>
                        <th style={{ padding: '12px 8px', textAlign: 'center', backgroundColor: '#fefce8', color: '#854d0e', fontWeight: 'bold' }}>דופן</th>
                        <th style={{ padding: '12px 8px', textAlign: 'center', backgroundColor: '#fefce8', color: '#854d0e', fontWeight: 'bold' }}>מס' חלקים</th>
                        <th style={{ padding: '12px 8px', textAlign: 'center', color: '#1d4ed8', fontWeight: 'bold' }}>שטח (מ"ר)</th>
                        <th style={{ padding: '12px 8px', width: '160px' }}>הערות</th>
                        <th style={{ padding: '12px 8px', width: '40px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeSheet.rows.map((row, idx) => (
                        <tr key={row.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '8px', textAlign: 'center', color: '#94a3b8' }}>{idx + 1}</td>
                          <td style={{ padding: '8px', textAlign: 'center' }}>
                            <input type="text" value={row.partNumber} onChange={(e) => updateRow(row.id, 'partNumber', e.target.value)} style={{ width: '50px', padding: '4px', textAlign: 'center', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', color: '#0f172a', fontWeight: 600, fontSize: '12px' }} />
                          </td>
                          <td style={{ padding: '8px' }}>
                             <select value={row.notes && ['לאמד S','צינור עגול','קופסת פיזור','מדף אש'].includes(row.notes) ? `${row.type}||${row.notes}` : row.type} onChange={(e) => {
                               const val = e.target.value;
                               if (val.includes('||')) {
                                 const [type, notes] = val.split('||');
                                 updateRow(row.id, 'type', type);
                                 updateRow(row.id, 'notes', notes);
                               } else {
                                 updateRow(row.id, 'type', val);
                                 updateRow(row.id, 'notes', '');
                               }
                             }} style={{ width: '130px', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontWeight: 500, backgroundColor: '#ffffff', color: '#0f172a' }}>
                               <option value="קטע ישר">קטע ישר</option>
                               <option value="קשת">קשת (מרפק)</option>
                               <option value="מעבר">מעבר</option>
                               <option value="קטע ישר||לאמד S">לאמד S</option>
                               <option value="קטע ישר||צינור עגול">צינור עגול</option>
                               <option value="קטע ישר||קופסת פיזור">קופסת פיזור</option>
                               <option value="קטע ישר||מדף אש">מדף אש</option>
                             </select>
                          </td>
                          <td style={{ padding: '8px', textAlign: 'center', backgroundColor: '#f8fafc' }}><input type="number" value={row.width1 || ''} onChange={(e) => updateRow(row.id, 'width1', Number(e.target.value))} style={{ width: '65px', padding: '6px', textAlign: 'center', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', color: '#0f172a' }} /></td>
                          <td style={{ padding: '8px', textAlign: 'center', backgroundColor: '#f8fafc' }}><input type="number" value={row.height1 || ''} onChange={(e) => updateRow(row.id, 'height1', Number(e.target.value))} style={{ width: '65px', padding: '6px', textAlign: 'center', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', color: '#0f172a' }} /></td>
                          <td style={{ padding: '8px', textAlign: 'center', backgroundColor: '#f4fbf7' }}><input type="number" value={row.width2 || ''} disabled={row.type !== 'מעבר'} onChange={(e) => updateRow(row.id, 'width2', Number(e.target.value))} style={{ width: '65px', padding: '6px', textAlign: 'center', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: row.type !== 'מעבר' ? '#e2e8f0' : '#ffffff', color: '#0f172a' }} /></td>
                          <td style={{ padding: '8px', textAlign: 'center', backgroundColor: '#f4fbf7' }}><input type="number" value={row.height2 || ''} disabled={row.type !== 'מעבר'} onChange={(e) => updateRow(row.id, 'height2', Number(e.target.value))} style={{ width: '65px', padding: '6px', textAlign: 'center', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: row.type !== 'מעבר' ? '#e2e8f0' : '#ffffff', color: '#0f172a' }} /></td>
                          <td style={{ padding: '8px', textAlign: 'center' }}><input type="number" value={row.length || ''} disabled={row.type === 'קשת'} onChange={(e) => updateRow(row.id, 'length', Number(e.target.value))} style={{ width: '65px', padding: '6px', textAlign: 'center', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: row.type === 'קשת' ? '#e2e8f0' : '#ffffff', color: '#0f172a' }} /></td>
                          <td style={{ padding: '8px', textAlign: 'center', backgroundColor: '#fffaf3' }}><input type="number" value={row.rBig || ''} disabled={row.type !== 'קשת'} onChange={(e) => updateRow(row.id, 'rBig', Number(e.target.value))} style={{ width: '65px', padding: '6px', textAlign: 'center', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: row.type !== 'קשת' ? '#e2e8f0' : '#ffffff', color: '#0f172a' }} /></td>
                          <td style={{ padding: '8px', textAlign: 'center', backgroundColor: '#fffaf3' }}><input type="number" value={row.rSmall || ''} disabled={row.type !== 'קשת'} onChange={(e) => updateRow(row.id, 'rSmall', Number(e.target.value))} style={{ width: '65px', padding: '6px', textAlign: 'center', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: row.type !== 'קשת' ? '#e2e8f0' : '#ffffff', color: '#0f172a' }} /></td>
                          
                          <td style={{ padding: '8px', textAlign: 'center', backgroundColor: '#f0fdfa' }}><input type="checkbox" checked={row.shatuzar} onChange={(e) => updateRow(row.id, 'shatuzar', e.target.checked)} /></td>
                          <td style={{ padding: '8px', textAlign: 'center', backgroundColor: '#f0fdfa' }}><input type="number" value={row.flexible || ''} onChange={(e) => updateRow(row.id, 'flexible', Number(e.target.value))} style={{ width: '55px', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', color: '#0f172a' }} /></td>
                          <td style={{ padding: '8px', textAlign: 'center', backgroundColor: '#faf5ff' }}><input type="checkbox" checked={row.acoustic} onChange={(e) => updateRow(row.id, 'acoustic', e.target.checked)} /></td>
                          <td style={{ padding: '8px', textAlign: 'center', backgroundColor: '#faf5ff' }}><input type="checkbox" checked={row.external} onChange={(e) => updateRow(row.id, 'external', e.target.checked)} /></td>
                          
                          <td style={{ padding: '8px', backgroundColor: '#eff6ff' }}>
                            <select value={row.sharshuriType} onChange={(e) => updateRow(row.id, 'sharshuriType', e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', width: '75px', backgroundColor: '#ffffff', color: '#0f172a' }}>
                              <option value="ללא">ללא</option><option value='"4'>"4</option><option value='"6'>"6</option><option value='"8'>"8</option><option value='"10'>"10</option><option value='"12'>"12</option><option value='"14'>"14</option>
                            </select>
                          </td>
                          <td style={{ padding: '8px', textAlign: 'center', backgroundColor: '#eff6ff' }}><input type="number" value={row.sharshuriLen || ''} disabled={row.sharshuriType === 'ללא'} onChange={(e) => updateRow(row.id, 'sharshuriLen', Number(e.target.value))} style={{ width: '55px', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: row.sharshuriType === 'ללא' ? '#e2e8f0' : '#ffffff', color: '#0f172a' }} /></td>
                          
                          <td style={{ padding: '8px', backgroundColor: '#f0fdf4' }}>
                            <select value={row.adapterType} onChange={(e) => updateRow(row.id, 'adapterType', e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', width: '110px', backgroundColor: '#ffffff', color: '#0f172a' }}>
                              <option value="ללא">ללא</option><option value='"6 מתאם'>"6 מתאם'</option><option value='8/8 מתאם'>8/8 מתאם</option><option value='10/10 מתאם'>10/10 מתאם</option><option value='12/12 מתאם'>12/12 מתאם</option><option value='14/14 מתאם'>14/14 מתאם</option><option value='16/16 מתאם'>16/16 מתאם</option><option value='60/60 מתאם'>60/60 מתאם</option>
                            </select>
                          </td>
                          <td style={{ padding: '8px', textAlign: 'center', backgroundColor: '#f0fdf4' }}><input type="number" value={row.adapterQty || ''} disabled={row.adapterType === 'ללא'} onChange={(e) => updateRow(row.id, 'adapterQty', Number(e.target.value))} style={{ width: '55px', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: row.adapterType === 'ללא' ? '#e2e8f0' : '#ffffff', color: '#0f172a' }} /></td>
                          
                          <td style={{ padding: '8px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <select value={row.manualThickness || ''} onChange={(e) => updateRow(row.id, 'manualThickness', Number(e.target.value))} style={{ width: '80px', padding: '4px', textAlign: 'center', border: row.manualThickness > 0 ? '2px solid #d97706' : '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: row.manualThickness > 0 ? '#fffbeb' : '#ffffff', color: '#0f172a', fontWeight: row.manualThickness > 0 ? 700 : 500, fontSize: '11px' }}>
                                <option value="">אוטומטי</option>
                                <option value="0.7">0.7</option>
                                <option value="0.8">0.8</option>
                                <option value="0.9">0.9</option>
                                <option value="1.0">1.0</option>
                                <option value="1.25">1.25</option>
                                <option value="2.0">2.0</option>
                              </select>
                              <span style={{ fontSize: '10px', color: row.manualThickness > 0 ? '#d97706' : '#64748b', fontWeight: 'bold' }}>
                                {row.manualThickness > 0 ? '' : `(${calculateThickness(row.width1, row.height1, row.manualThickness).toFixed(2)})`}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '8px', textAlign: 'center', backgroundColor: '#fefce8' }}>
                            <input type="number" min="0" value={row.dofan || ''} onChange={(e) => updateRow(row.id, 'dofan', Math.max(0, Number(e.target.value)))} style={{ width: '40px', padding: '4px', textAlign: 'center', border: '1px solid #facc15', borderRadius: '4px', backgroundColor: row.dofan > 0 ? '#fffbeb' : '#ffffff', color: '#854d0e', fontWeight: row.dofan > 0 ? 700 : 400 }} placeholder="0" />
                          </td>
                          <td style={{ padding: '8px', textAlign: 'center', backgroundColor: '#fefce8' }}>
                            <input type="number" min="1" value={row.panels || 1} onChange={(e) => updateRow(row.id, 'panels', Math.max(1, Number(e.target.value)))} style={{ width: '40px', padding: '4px', textAlign: 'center', border: '1px solid #facc15', borderRadius: '4px', backgroundColor: '#ffffff', color: '#854d0e', fontWeight: 700 }} placeholder="1" />
                          </td>
                          <td style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold', color: '#1d4ed8', backgroundColor: '#eff6ff' }}>{calculateArea(row).toFixed(3)}</td>
                          <td style={{ padding: '8px' }}><input type="text" value={row.notes} onChange={(e) => updateRow(row.id, 'notes', e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box', backgroundColor: '#ffffff', color: '#0f172a' }} /></td>
                          <td style={{ padding: '8px', textAlign: 'center' }}><button onClick={() => deleteRow(row.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={16} /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ backgroundColor: '#0f172a', color: '#ffffff', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold', borderBottomLeftRadius: '7px', borderBottomRightRadius: '7px' }}>
                  <span>סך הכל שטח בדף הנוכחי:</span>
                  <span style={{ color: '#3b82f6', fontSize: '16px' }}>{activeSheet.rows.reduce((s, r) => s + calculateArea(r), 0).toFixed(3)} מ"ר</span>
                </div>
              </div>
            )}

            {/* טאב ריכוז כמויות */}
            {activeTab === 'summary' && (
              <div className="landscape-print summary-print-page print-document" style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '32px', maxWidth: '1400px', margin: '0 auto', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
                <div className="print-orientation-spacer landscape-print" aria-hidden="true" />
                
                {/* סרגל כפתורי ניהול נייר המכתבים - מוסתר בהדפסה */}
                  <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '20px', borderBottom: '1px solid #cbd5e1', paddingBottom: '10px', gap: '8px' }}>
                  <button
                    onClick={() => setIsPreviewMode(true)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#7c3aed',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '13px',
                    }}
                  >
                    תצוגה מקדימה
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
                    הדפס ריכוז כמויות / שמור כ-PDF
                  </button>
                  <button onClick={exportSummaryToExcel} style={{ padding: '8px 16px', backgroundColor: '#16a34a', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}><FileDown size={14} /> Excel</button>
                </div>

                {/* כותרת רשמית של החברה בריכוז כמויות */}
                <CompanyLetterhead details={myCompanyDetails} />

                {/* פרטי הפרויקט והריכוז */}
                <div className="summary-project-info" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '25px', paddingBottom: '10px', borderBottom: '1px solid #cbd5e1', fontSize: '14px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div><b>פרויקט:</b> {isNewProject ? newProjectName : selectedProject} - {isNewClient ? clientDetails.name : selectedClientKey}</div>
                    <div><b>ריכוז:</b> ריכוז מס' - {docNumber}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
                    <div><b>תאריך:</b> {docDate}</div>
                  </div>
                </div>

                {/* מעבר על כל דפי המדידות ורינדור טבלה מפורטת לכל דף (דף ריכוז בהתאם ל-PDF) */}
                  {sheets.map((sheet, sIdx) => {
                  const shTotals = getSheetTotals(sheet);
                  
                  return (
                    <div key={sheet.id} className="summary-sheet-block" style={{ marginBottom: '50px', paddingBottom: '30px', borderBottom: sIdx < sheets.length - 1 ? '2px dashed #cbd5e1' : 'none', pageBreakAfter: sIdx < sheets.length - 1 ? 'always' : 'auto' }}>
                      
                      {/* כותרת דף הריכוז עבור הדף הנוכחי */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e3a8a', margin: 0, fontFamily: 'Rubik, sans-serif' }}>
                          דף ריכוז - {sheet.name}
                        </h2>
                        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>
                          טבלה {sIdx + 1} מתוך {sheets.length}
                        </span>
                      </div>

                      {/* טבלת הריכוז המפורטת לכל שורה בדף המדידה */}
                      <div className="print-table-wrapper" style={{ overflowX: 'auto', width: '100%', backgroundColor: '#ffffff', marginBottom: '15px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '11px', border: '1.5px solid #cbd5e1', minWidth: '1100px' }}>
                          <thead style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #475569' }}>
                            <tr style={{ color: '#0f172a', fontWeight: 'bold' }}>
                              <th style={{ padding: '8px 6px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', width: '50px' }}>מספר</th>
                              <th style={{ padding: '8px 6px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', width: '60px', fontWeight: 'bold' }}>מס' חלק</th>
                              <th style={{ padding: '8px 10px', borderLeft: '1px solid #cbd5e1', textAlign: 'right' }}>פירוט</th>
                              <th style={{ padding: '8px 6px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', width: '100px' }}>פח (מ"ר)</th>
                              <th style={{ padding: '8px 6px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', width: '100px' }}>בידוד (מ"ר)</th>
                              <th style={{ padding: '8px 6px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', width: '100px' }}>מתאם (יח')</th>
                              <th style={{ padding: '8px 6px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', width: '70px', backgroundColor: '#fefce8', color: '#854d0e' }}>דופן</th>
                              <th style={{ padding: '8px 6px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', width: '100px' }}>שתוצר (יח')</th>
                              <th style={{ padding: '8px 6px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', width: '100px' }}>גמיש (מ"א)</th>
                              <th style={{ padding: '8px 6px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', width: '100px' }}>שרשורי (מ"א)</th>
                              <th style={{ padding: '8px 6px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', width: '100px' }}>פח 1.25 (מ"ר)</th>
                              <th style={{ padding: '8px 10px', textAlign: 'right', width: '160px' }}>הערות</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sheet.rows.map((row, rIdx) => {
                              const thick = calculateThickness(row.width1, row.height1, row.manualThickness);
                              const area = calculateArea(row);
                              
                              let displayType = row.notes && ['לאמד S','צינור עגול','קופסת פיזור','מדף אש'].includes(row.notes) ? row.notes : row.type;
                              let formatDetail = `${displayType} ${row.notes === 'צינור עגול' ? `קוטר ${row.width1}` : `${row.width1}x${row.height1}`}`;
                              if (row.type === 'מעבר') formatDetail += ` / ${row.width2}x${row.height2}`;
                              if (row.length > 0) formatDetail += ` L=${row.length}`;
                              if (row.panels > 0) formatDetail += ` [דופן×${row.panels}]`;

                              return (
                                <tr key={row.id} style={{ borderBottom: '1px solid #cbd5e1', backgroundColor: rIdx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                                  <td style={{ padding: '8px 6px', textAlign: 'center', borderLeft: '1px solid #cbd5e1', fontWeight: 'bold', color: '#64748b' }}>{rIdx + 1}</td>
                                  <td style={{ padding: '8px 6px', textAlign: 'center', borderLeft: '1px solid #cbd5e1', fontWeight: 600, color: '#1e293b', fontSize: '11px' }}>{row.partNumber || ''}</td>
                                  <td style={{ padding: '8px 10px', borderLeft: '1px solid #cbd5e1', fontWeight: 600, color: '#1e293b' }}>{formatDetail}</td>
                                  
                                  {/* פח רגיל */}
                                  <td style={{ padding: '8px 6px', textAlign: 'center', borderLeft: '1px solid #cbd5e1' }}>
                                    {thick !== 1.25 && area > 0 ? area.toFixed(2) : ''}
                                  </td>
                                  
                                  {/* בידוד */}
                                  <td style={{ padding: '8px 6px', textAlign: 'center', borderLeft: '1px solid #cbd5e1' }}>
                                    {(row.acoustic || row.external) && area > 0 ? area.toFixed(2) : ''}
                                  </td>
                                  
                                  {/* מתאם */}
                                  <td style={{ padding: '8px 6px', textAlign: 'center', borderLeft: '1px solid #cbd5e1' }}>
                                    {row.adapterType !== 'ללא' && row.adapterQty > 0 ? row.adapterQty : ''}
                                  </td>
                                  
                                  {/* דופן */}
                                  <td style={{ padding: '8px 6px', textAlign: 'center', borderLeft: '1px solid #cbd5e1', backgroundColor: '#fefce8', color: '#854d0e', fontWeight: 600 }}>
                                    {row.panels > 0 ? row.panels : ''}
                                  </td>
                                  
                                  {/* שתוצר */}
                                  <td style={{ padding: '8px 6px', textAlign: 'center', borderLeft: '1px solid #cbd5e1' }}>
                                    {row.shatuzar ? '1' : ''}
                                  </td>
                                  
                                  {/* גמיש */}
                                  <td style={{ padding: '8px 6px', textAlign: 'center', borderLeft: '1px solid #cbd5e1' }}>
                                    {row.flexible > 0 ? row.flexible.toFixed(2) : ''}
                                  </td>
                                  
                                  {/* שרשורי */}
                                  <td style={{ padding: '8px 6px', textAlign: 'center', borderLeft: '1px solid #cbd5e1' }}>
                                    {row.sharshuriType !== 'ללא' && row.sharshuriLen > 0 ? row.sharshuriLen.toFixed(2) : ''}
                                  </td>
                                  
                                  {/* פח 1.25 */}
                                  <td style={{ padding: '8px 6px', textAlign: 'center', borderLeft: '1px solid #cbd5e1' }}>
                                    {thick === 1.25 && area > 0 ? area.toFixed(2) : ''}
                                  </td>
                                  
                                  <td style={{ padding: '8px 10px', color: '#64748b', fontSize: '11px' }}>{row.notes}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                          
                          {/* רגל הטבלה - סה"כ כמויות */}
                          <tfoot>
                            <tr style={{ backgroundColor: '#f1f5f9', fontWeight: 'bold', borderTop: '2px solid #cbd5e1' }}>
                              <td style={{ padding: '8px 6px', textAlign: 'center', borderLeft: '1px solid #cbd5e1' }} colSpan={3}>סה"כ כמות:</td>
                              <td style={{ padding: '8px 6px', textAlign: 'center', borderLeft: '1px solid #cbd5e1' }}>{(shTotals.t08 + shTotals.t10) > 0 ? (shTotals.t08 + shTotals.t10).toFixed(2) : ''}</td>
                              <td style={{ padding: '8px 6px', textAlign: 'center', borderLeft: '1px solid #cbd5e1' }}>{(shTotals.acoustic + shTotals.external) > 0 ? (shTotals.acoustic + shTotals.external).toFixed(2) : ''}</td>
                              <td style={{ padding: '8px 6px', textAlign: 'center', borderLeft: '1px solid #cbd5e1' }}>{shTotals.adapterQty > 0 ? shTotals.adapterQty : ''}</td>
                              <td style={{ padding: '8px 6px', textAlign: 'center', borderLeft: '1px solid #cbd5e1' }}>{''}</td>
                              <td style={{ padding: '8px 6px', textAlign: 'center', borderLeft: '1px solid #cbd5e1' }}>{shTotals.shatuzar > 0 ? shTotals.shatuzar : ''}</td>
                              <td style={{ padding: '8px 6px', textAlign: 'center', borderLeft: '1px solid #cbd5e1' }}>{shTotals.flexible > 0 ? shTotals.flexible.toFixed(2) : ''}</td>
                              <td style={{ padding: '8px 6px', textAlign: 'center', borderLeft: '1px solid #cbd5e1' }}>{(shTotals.sharshuri6 + shTotals.sharshuri8 + shTotals.sharshuri10) > 0 ? (shTotals.sharshuri6 + shTotals.sharshuri8 + shTotals.sharshuri10).toFixed(2) : ''}</td>
                              <td style={{ padding: '8px 6px', textAlign: 'center', borderLeft: '1px solid #cbd5e1' }}>{shTotals.t125 > 0 ? shTotals.t125.toFixed(2) : ''}</td>
                              <td style={{ padding: '8px 10px' }}></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>

                    </div>
                  );
                })}

                {/* הערה חוקית קבועה למטה בתחתית הדף */}
                <div className="summary-footer" style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', color: '#64748b', paddingTop: '10px', borderTop: '1px solid #cbd5e1' }}>
                  <span>הופק באמצעות מערכת עלי שרארה בע"מ - ממוחשב</span>
                  <span>חתימת העסק ומבצע הריכוז</span>
                </div>

              </div>
            )}

            {/* טאב חשבון פרופורמה */}
            {activeTab === 'invoice' && (
              <div className="portrait-print print-document invoice-print-page" style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '32px', maxWidth: '750px', margin: '0 auto', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
                <div className="print-orientation-spacer portrait-print" aria-hidden="true" />
                
                {/* סרגל כפתורי ניהול נייר המכתבים - מוסתר בהדפסה */}
                <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid #cbd5e1', paddingBottom: '10px', gap: '8px' }}>
                  <button 
                    onClick={() => setIsEditingMyCompany(!isEditingMyCompany)} 
                    style={{ 
                      padding: '8px 16px', 
                      backgroundColor: isEditingMyCompany ? '#475569' : '#d97706', 
                      color: '#ffffff', 
                      border: 'none', 
                      borderRadius: '6px', 
                      cursor: 'pointer', 
                      fontWeight: 'bold', 
                      fontSize: '13px'
                    }}
                  >
                    {isEditingMyCompany ? "סגור עריכת פרטי לוגו" : "ערוך פרטי לוגו וטלפונים/מיילים של העסק"}
                  </button>
                  
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
                      onClick={() => setIsPreviewMode(true)}
                      style={{ 
                        padding: '8px 16px', 
                        backgroundColor: '#7c3aed', 
                        color: '#ffffff', 
                        border: 'none', 
                        borderRadius: '6px', 
                        cursor: 'pointer', 
                        fontWeight: 'bold', 
                        fontSize: '13px'
                      }}
                    >
                      תצוגה מקדימה
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
                    <button onClick={exportInvoiceToExcel} style={{ padding: '8px 16px', backgroundColor: '#16a34a', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}><FileDown size={14} /> Excel</button>
                  </div>
                </div>

                {isEditingMyCompany && (
                  <div className="no-print" style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '20px', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 15px 0' }}>עריכת פרטי לוגו ונייר המכתבים הרשמי של העסק</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '3px' }}>שם העסק בעברית:</label>
                        <input type="text" value={myCompanyDetails.name} onChange={(e) => setMyCompanyDetails({...myCompanyDetails, name: e.target.value})} style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px', backgroundColor: '#ffffff', color: '#0f172a' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '3px' }}>כיתוב אנגלי / שנת הקמה:</label>
                        <input type="text" value={myCompanyDetails.engName} onChange={(e) => setMyCompanyDetails({...myCompanyDetails, engName: e.target.value})} style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px', backgroundColor: '#ffffff', color: '#0f172a' }} />
                      </div>
                      <div style={{ gridColumn: 'span 2' }}>
                        <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '3px' }}>תיאור העסק / סלוגן:</label>
                        <input type="text" value={myCompanyDetails.subtitle} onChange={(e) => setMyCompanyDetails({...myCompanyDetails, subtitle: e.target.value})} style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px', backgroundColor: '#ffffff', color: '#0f172a' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '3px' }}>אימייל:</label>
                        <input type="text" value={myCompanyDetails.email} onChange={(e) => setMyCompanyDetails({...myCompanyDetails, email: e.target.value})} style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px', backgroundColor: '#ffffff', color: '#0f172a' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '3px' }}>אתר אינטרנט:</label>
                        <input type="text" value={myCompanyDetails.website} onChange={(e) => setMyCompanyDetails({...myCompanyDetails, website: e.target.value})} style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px', backgroundColor: '#ffffff', color: '#0f172a' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '3px' }}>טלפון משרד:</label>
                        <input type="text" value={myCompanyDetails.phone} onChange={(e) => setMyCompanyDetails({...myCompanyDetails, phone: e.target.value})} style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px', backgroundColor: '#ffffff', color: '#0f172a' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '3px' }}>מספר פקס:</label>
                        <input type="text" value={myCompanyDetails.fax} onChange={(e) => setMyCompanyDetails({...myCompanyDetails, fax: e.target.value})} style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px', backgroundColor: '#ffffff', color: '#0f172a' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '3px' }}>מספר נייד:</label>
                        <input type="text" value={myCompanyDetails.mobile} onChange={(e) => setMyCompanyDetails({...myCompanyDetails, mobile: e.target.value})} style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px', backgroundColor: '#ffffff', color: '#0f172a' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '3px' }}>כתובת העסק והמפעל:</label>
                        <input type="text" value={myCompanyDetails.address} onChange={(e) => setMyCompanyDetails({...myCompanyDetails, address: e.target.value})} style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px', backgroundColor: '#ffffff', color: '#0f172a' }} />
                      </div>
                      <div style={{ gridColumn: 'span 2' }}>
                        <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '3px' }}>דואר למשלוחים:</label>
                        <input type="text" value={myCompanyDetails.pobox} onChange={(e) => setMyCompanyDetails({...myCompanyDetails, pobox: e.target.value})} style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px', backgroundColor: '#ffffff', color: '#0f172a' }} />
                      </div>
                      {(myCompanyDetails.serviceLines ?? []).map((line: string, index: number) => (
                        <div key={index} style={{ gridColumn: 'span 2' }}>
                          <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '3px' }}>{`שורת שירותים ${index + 1} (הפרד ב-*):`}</label>
                          <input
                            type="text"
                            value={line}
                            onChange={(e) => {
                              const nextLines = [...(myCompanyDetails.serviceLines ?? ['', '', ''])];
                              nextLines[index] = e.target.value;
                              setMyCompanyDetails({ ...myCompanyDetails, serviceLines: nextLines });
                            }}
                            style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px', backgroundColor: '#ffffff', color: '#0f172a' }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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
                        let adapterPriceKey = 'מתאם 6"6/"';
                        if (k === '8/8 מתאם') adapterPriceKey = 'מתאם 8"8/"';
                        else if (k === '10/10 מתאם') adapterPriceKey = 'מתאם 10"10/"';
                        else if (k === '12/12 נת') adapterPriceKey = 'מתאם 12"12/"';
                        else if (k === '14/14 מתאם') adapterPriceKey = 'מתאם 14"14/"';
                        else if (k === '16/16 מת') adapterPriceKey = 'מתאם 16"16/"';
                        else if (k === '60/60 מתאם') adapterPriceKey = 'מתאם 60/60';
                        
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
                      let adapterPriceKey = 'מתאם 6"6/"';
                      if (k === '8/8 מתאם') adapterPriceKey = 'מתאם 8"8/"';
                      else if (k === '10/10 מתאם') adapterPriceKey = 'מתאם 10"10/"';
                      else if (k === '12/12 נת') adapterPriceKey = 'מתאם 12"12/"';
                      else if (k === '14/14 מתאם') adapterPriceKey = 'מתאם 14"14/"';
                      else if (k === '16/16 מת') adapterPriceKey = 'מתאם 16"16/"';
                      else if (k === '60/60 מתאם') adapterPriceKey = 'מתאם 60/60';
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
            )}

            {/* טאב מחירון העסק */}
            {activeTab === 'pricelist' && (
              <div className="portrait-print print-document pricelist-print-page" style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '32px', maxWidth: '800px', margin: '0 auto', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
                <div className="print-orientation-spacer portrait-print" aria-hidden="true" />
                <div style={{ borderBottom: '3px solid #0f172a', paddingBottom: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>מחירון העסק</h2>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>מחירון מעודכן הניתן לעדכון ועריכה בכל עת. השינויים משפיעים ישירות על כל הדוחות והחישובים במערכת.</p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setIsPreviewMode(true)}
                      className="no-print"
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#7c3aed',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '13px',
                      }}
                    >
                      תצוגה מקדימה
                    </button>
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
                      הדפס מחירון
                    </button>
                    <button onClick={exportPriceListToExcel} className="no-print" style={{ padding: '8px 16px', backgroundColor: '#16a34a', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}><FileDown size={14} /> Excel</button>
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
            )}

            {/* טאב דפי ייצור לייצור תעלות ואביזרים */}
            {activeTab === 'production' && (
              <div className="no-shadow landscape-print print-document production-print-document" style={{ maxWidth: '1100px', margin: '0 auto' }}>
                <div className="print-orientation-spacer landscape-print" aria-hidden="true" />
                
                {/* סרגל כפתורי ניהול מוסתר בהדפסה */}
                <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '20px', backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #cbd5e1', gap: '8px' }}>
                  <button
                    onClick={() => setIsPreviewMode(true)}
                    style={{
                      padding: '10px 24px',
                      backgroundColor: '#7c3aed',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '14px',
                    }}
                  >
                    תצוגה מקדימה
                  </button>
                  <button 
                    onClick={handlePrint}
                    style={{ 
                      padding: '10px 24px', 
                      backgroundColor: '#10b981', 
                      color: '#ffffff', 
                      border: 'none', 
                      borderRadius: '6px', 
                      cursor: 'pointer', 
                      fontWeight: 'bold', 
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 6px -1px rgba(16,185,129,0.2)'
                    }}
                  >
                    🖨️ הדפס דפי ייצור / שמור כ-PDF
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
            )}
          </main>
        </div>
      )}
      {isPreviewMode && activeTab !== 'measure' && (
        <div className="preview-toolbar no-print">
          <button className="preview-action-btn preview-action-btn--close" onClick={() => setIsPreviewMode(false)}>✕ סגור תצוגה מקדימה</button>
          <button className="preview-action-btn preview-action-btn--print" onClick={handlePrint}>🖨️ הדפס</button>
        </div>
      )}
      {isPreviewMode && activeTab === 'measure' && (
        <div className="preview-overlay" onClick={() => setIsPreviewMode(false)}>
          <div className="preview-container preview-container--landscape" onClick={e => e.stopPropagation()}>
            <div className="preview-toolbar-inline no-print">
              <button className="preview-action-btn preview-action-btn--close" onClick={() => setIsPreviewMode(false)}>✕ סגור תצוגה מקדימה</button>
              <button className="preview-action-btn preview-action-btn--print" onClick={handlePrint}>🖨️ הדפס</button>
            </div>
            <PrintableReport
              sheets={sheets}
              clientDetails={{ name: clientDetails.name, phone: clientDetails.phone, email: clientDetails.email, contact: clientDetails.contact }}
              selectedProject={selectedProject}
              docDate={docDate}
              docNumber={docNumber}
              calculateArea={calculateArea}
              calculateThickness={calculateThickness}
            />
          </div>
        </div>
      )}
      </div> {/* end of .no-print wrapper */}
      <PrintableReport
        sheets={sheets}
        clientDetails={{ name: clientDetails.name, phone: clientDetails.phone, email: clientDetails.email, contact: clientDetails.contact }}
        selectedProject={selectedProject}
        docDate={docDate}
        docNumber={docNumber}
        calculateArea={calculateArea}
        calculateThickness={calculateThickness}
      />
    </div>
  );
}
