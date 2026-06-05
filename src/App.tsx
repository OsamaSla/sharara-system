import React, { useState, useEffect } from 'react';
import { Plus, Trash2, FileSpreadsheet, Layers, CreditCard, Building2, Briefcase, Upload, User, Phone, Mail, CheckCircle2 } from 'lucide-react';

interface RowData {
  id: string;
  type: 'קטע ישר' | 'קשת' | 'מעבר';
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
  adapterType: 'ללא' | '"6 מת' | '8/8 מתאם' | '10/10 מתאם' | '12/12 נת' | '14/14 מתאם' | '16/16 מת' | '60/60 מתאם';
  adapterQty: number;
  notes: string;
}

interface Sheet {
  id: string;
  name: string;
  rows: RowData[];
}

interface PriceItem {
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
  const [logoUrl, setLogoUrl] = useState<string>('');

  // דפי המדידות והשורות
  const [sheets, setSheets] = useState<Sheet[]>([
    {
      id: '1',
      name: 'דף מדידה #1',
      rows: [{ 
        id: '1', type: 'קטע ישר', width1: 500, height1: 400, width2: 0, height2: 0, length: 1000, rBig: 0, rSmall: 150,
        shatuzar: false, flexible: 0, acoustic: false, external: false, 
        sharshuriType: 'ללא', sharshuriLen: 0, adapterType: 'ללא', adapterQty: 0, notes: '' 
      }]
    }
  ]);
  const [activeSheetId, setActiveSheetId] = useState<string>('1');
  const [activeTab, setActiveTab] = useState<'measure' | 'summary' | 'invoice' | 'pricelist'>('measure');

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
    const saved = localStorage.getItem('sharara_myCompanyDetails');
    return saved ? JSON.parse(saved) : {
      name: "עלי שרארה בע\"מ",
      engName: "Sharara 1970",
      subtitle: "תעשיות פח ומערכות אוורור ומיזוג אוויר",
      website: "www.sharara.co.il",
      email: "sh_ali@netvision.net.il",
      address: "אזור תעשייה, נצרת עילית (ריינה) ת.ד. 4174",
      phone: "04-6082264",
      fax: "04-6082263",
      mobile: "050-5215192",
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
      ]
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

  // אפקטים לשמירה אוטומטית ב-localStorage
  useEffect(() => {
    localStorage.setItem('sharara_clientsData', JSON.stringify(clientsData));
  }, [clientsData]);

  useEffect(() => {
    localStorage.setItem('sharara_pricesList', JSON.stringify(pricesList));
  }, [pricesList]);

  useEffect(() => {
    localStorage.setItem('sharara_myCompanyDetails', JSON.stringify(myCompanyDetails));
  }, [myCompanyDetails]);

  useEffect(() => {
    localStorage.setItem('sharara_projectDocNumbers', JSON.stringify(projectDocNumbers));
  }, [projectDocNumbers]);

  useEffect(() => {
    localStorage.setItem('sharara_projectDocDates', JSON.stringify(projectDocDates));
  }, [projectDocDates]);

  useEffect(() => {
    localStorage.setItem('sharara_producedProjects', JSON.stringify(producedProjects));
  }, [producedProjects]);

  useEffect(() => {
    localStorage.setItem('sharara_producedSnapshots', JSON.stringify(producedSnapshots));
  }, [producedSnapshots]);

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

  // מעקב אחר החברה והפרויקט הפעילים כרגע בטבלה כדי לזהות מתי הם הוחלפו ולתחול דפים מחדש
  const [loadedClientProject, setLoadedClientProject] = useState({
    client: "אלקטרה מיזוג אוויר",
    project: "מגדלי עזריאלי קומה 4"
  });

  // סטייטים לעריכת לקוחות ופרויקטים
  const [isEditingClient, setIsEditingClient] = useState<boolean>(false);
  const [isEditingProjectName, setIsEditingProjectName] = useState<boolean>(false);
  const [tempProjectName, setTempProjectName] = useState<string>('');

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



  const calculateThickness = (w1: number, h1: number): number => {
    const max = Math.max(w1, h1);
    if (max <= 600) return 0.8;
    if (max <= 1000) return 1.0;
    return 1.25;
  };

  const calculateArea = (row: RowData): number => {
    const { type, width1, height1, width2, height2, length, rBig, rSmall } = row;
    if (type === 'קטע ישר') return (2 * (width1 + height1) * length) / 1000000;
    if (type === 'קשת') return (2 * (width1 + height1) * (rBig + rSmall)) / 1000000;
    if (type === 'מעבר') return (((width1 + width2) + (height1 + height2)) * length) / 1000000;
    return 0;
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
      const thick = calculateThickness(row.width1, row.height1);
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
        sheetBidudSum += area * getPrice('בידוד פנימי 1"');
      }
      if (row.external) {
        sheetBidudSum += area * getPrice('בידוד חיצוני 1"');
      }

      // 3. מתאמים
      if (row.adapterType !== 'ללא' && row.adapterQty > 0) {
        let adapterPriceKey = 'מתאם 6"6/"';
        if (row.adapterType === '8/8 מתאם') adapterPriceKey = 'מתאם 8"8/"';
        else if (row.adapterType === '10/10 מתאם') adapterPriceKey = 'מתאם 10"10/"';
        else if (row.adapterType === '12/12 נת') adapterPriceKey = 'מתאם 12"12/"';
        else if (row.adapterType === '14/14 מתאם') adapterPriceKey = 'מתאם 14"14/"';
        else if (row.adapterType === '16/16 מת') adapterPriceKey = 'מתאם 16"16/"';
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
    const adapterTotals = { '"6 מת': 0, '8/8 מתאם': 0, '10/10 מתאם': 0, '12/12 נת': 0, '14/14 מתאם': 0, '16/16 מת': 0, '60/60 מתאם': 0 };

    sheets.forEach(sheet => {
      sheet.rows.forEach(row => {
        const thick = calculateThickness(row.width1, row.height1);
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

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) setLogoUrl(event.target.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const addRow = () => {
    pushToHistory(sheets);
    const newRow: RowData = {
      id: Date.now().toString(), type: 'קטע ישר', width1: 0, height1: 0, width2: 0, height2: 0, length: 0, rBig: 0, rSmall: 150,
      shatuzar: false, flexible: 0, acoustic: false, external: false, sharshuriType: 'ללא', sharshuriLen: 0, adapterType: 'ללא', adapterQty: 0, notes: ''
    };
    setSheets(sheets.map(s => s.id === activeSheetId ? { ...s, rows: [...s.rows, newRow] } : s));
  };

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
      const thick = calculateThickness(row.width1, row.height1);
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



  return (
    <div style={{ direction: 'rtl', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: 'Assistant, Rubik, sans-serif', color: '#1e293b', width: '100%', letterSpacing: '0.2px' }}>
      
      {/* כותרת עליונה קבועה */}
      <header style={{ backgroundColor: '#0f172a', borderBottom: '4px solid #475569', padding: '30px 24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '20px' }}>
        
        {/* לוגו באמצע הדף - מוגדל בצורה משמעותית */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
          {logoUrl ? (
            <div style={{ position: 'relative' }}>
              <img 
                src={logoUrl} 
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
              <button 
                onClick={() => setLogoUrl('')} 
                className="no-print"
                style={{ 
                  position: 'absolute', 
                  top: '-10px', 
                  right: '-10px', 
                  backgroundColor: '#ef4444', 
                  color: '#ffffff', 
                  border: 'none', 
                  borderRadius: '50%', 
                  width: '24px', 
                  height: '24px', 
                  cursor: 'pointer', 
                  fontWeight: 'bold', 
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
                title="הסר לוגו"
              >
                ✕
              </button>
            </div>
          ) : (
            <label style={{ width: '180px', height: '80px', border: '2px dashed #475569', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', cursor: 'pointer', fontSize: '13px', transition: 'all 0.3s', backgroundColor: '#1e293b' }}>
              <Upload size={20} style={{ marginBottom: '4px', color: '#3b82f6' }} />
              <span style={{ fontWeight: 'bold' }}>העלה לוגו רשמי</span>
              <span style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>לוגו רחב או מלבני</span>
              <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
            </label>
          )}
          
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
            
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
                </div>
              )}

              <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '2px' }}>תאריך מסמך:</label>
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
                    style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px', backgroundColor: '#ffffff', color: '#0f172a', textAlign: 'center', boxSizing: 'border-box' }} 
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '2px' }}>מספר סימוכין:</label>
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
                    style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#ffffff', color: '#0f172a' }} 
                  />
                </div>
              </div>

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
                      id: '1', type: 'קטע ישר', width1: 500, height1: 400, width2: 0, height2: 0, length: 1000, rBig: 0, rSmall: 150,
                      shatuzar: false, flexible: 0, acoustic: false, external: false, 
                      sharshuriType: 'ללא', sharshuriLen: 0, adapterType: 'ללא', adapterQty: 0, notes: '' 
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
                
                <div style={{ backgroundColor: '#1e293b', color: '#ffffff', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTopLeftRadius: '7px', borderTopRightRadius: '7px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                        style={{ 
                          backgroundColor: 'transparent', 
                          color: '#ffffff', 
                          border: 'none', 
                          fontWeight: 'bold', 
                          fontSize: '13px',
                          width: '50px',
                          textAlign: 'center',
                          padding: 0,
                          outline: 'none'
                        }}
                        placeholder="מס'"
                        title="ערוך את מספר דף המדידה הנוכחי"
                      />
                    </div>
                    <button onClick={addSheet} style={{ backgroundColor: '#475569', color: '#ffffff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>+ דף חדש</button>
                    {sheets.length > 1 && (
                      <button 
                        onClick={() => deleteSheet(activeSheetId)} 
                        style={{ 
                          backgroundColor: '#ef4444', 
                          color: '#ffffff', 
                          border: 'none', 
                          padding: '6px 12px', 
                          borderRadius: '4px', 
                          cursor: 'pointer', 
                          fontSize: '13px', 
                          fontWeight: 500, 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '4px' 
                        }}
                        title="מחק דף נוכחי"
                      >
                        <Trash2 size={14} /> מחק דף
                      </button>
                    )}
                    
                    {/* כפתורי בטל / בצע שוב (Undo/Redo) */}
                    <div style={{ display: 'flex', gap: '4px', borderLeft: '1.5px solid #475569', paddingLeft: '10px', marginLeft: '6px' }}>
                      <button 
                        onClick={handleUndo} 
                        disabled={undoStack.length === 0}
                        style={{ 
                          backgroundColor: undoStack.length === 0 ? '#334155' : '#475569', 
                          color: undoStack.length === 0 ? '#64748b' : '#ffffff', 
                          border: 'none', 
                          padding: '6px 12px', 
                          borderRadius: '4px', 
                          cursor: undoStack.length === 0 ? 'not-allowed' : 'pointer', 
                          fontSize: '12px', 
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        title="בטל פעולה (Ctrl+Z)"
                      >
                        ↩ בטל
                      </button>
                      <button 
                        onClick={handleRedo} 
                        disabled={redoStack.length === 0}
                        style={{ 
                          backgroundColor: redoStack.length === 0 ? '#334155' : '#475569', 
                          color: redoStack.length === 0 ? '#64748b' : '#ffffff', 
                          border: 'none', 
                          padding: '6px 12px', 
                          borderRadius: '4px', 
                          cursor: redoStack.length === 0 ? 'not-allowed' : 'pointer', 
                          fontSize: '12px', 
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        title="בצע שוב (Ctrl+Y)"
                      >
                        שחזר ↪
                      </button>
                    </div>
                  </div>
                  <button onClick={addRow} style={{ backgroundColor: '#2563eb', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}><Plus size={16} /> הוסף שורה</button>
                </div>

                <div style={{ overflowX: 'auto', width: '100%', backgroundColor: '#ffffff' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '13px', minWidth: '1650px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f1f5f9', color: '#475569', fontWeight: 'bold', borderBottom: '2px solid #cbd5e1' }}>
                        <th style={{ padding: '12px 8px', textAlign: 'center', width: '40px' }}>מס'</th>
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
                        <th style={{ padding: '12px 8px', textAlign: 'center', color: '#1d4ed8', fontWeight: 'bold' }}>שטח (מ"ר)</th>
                        <th style={{ padding: '12px 8px', width: '160px' }}>הערות</th>
                        <th style={{ padding: '12px 8px', width: '40px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeSheet.rows.map((row, idx) => (
                        <tr key={row.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '8px', textAlign: 'center', color: '#94a3b8' }}>{idx + 1}</td>
                          <td style={{ padding: '8px' }}>
                            <select value={row.type} onChange={(e) => updateRow(row.id, 'type', e.target.value)} style={{ width: '130px', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontWeight: 500, backgroundColor: '#ffffff', color: '#0f172a' }}>
                              <option value="קטע ישר">קטע ישר</option>
                              <option value="קשת">קשת (מרפק)</option>
                              <option value="מעבר">מעבר</option>
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
                              <option value="ללא">ללא</option><option value='"6 מת'>"6 מת'</option><option value='8/8 מתאם'>8/8 מתאם</option><option value='10/10 מתאם'>10/10 מתאם</option><option value='12/12 נת'>12/12 נת</option><option value='14/14 מתאם'>14/14 מתאם</option><option value='16/16 מת'>16/16 מת</option><option value='60/60 מתאם'>60/60 מתאם</option>
                            </select>
                          </td>
                          <td style={{ padding: '8px', textAlign: 'center', backgroundColor: '#f0fdf4' }}><input type="number" value={row.adapterQty || ''} disabled={row.adapterType === 'ללא'} onChange={(e) => updateRow(row.id, 'adapterQty', Number(e.target.value))} style={{ width: '55px', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: row.adapterType === 'ללא' ? '#e2e8f0' : '#ffffff', color: '#0f172a' }} /></td>
                          
                          <td style={{ padding: '8px', textAlign: 'center', fontWeight: 500, color: '#475569' }}>{calculateThickness(row.width1, row.height1).toFixed(2)}</td>
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
              <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '32px', maxWidth: '1400px', margin: '0 auto', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
                
                {/* סרגל כפתורי ניהול נייר המכתבים - מוסתר בהדפסה */}
                <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '20px', borderBottom: '1px solid #cbd5e1', paddingBottom: '10px' }}>
                  <button 
                    onClick={() => window.print()} 
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
                </div>

                {/* כותרת רשמית של החברה בריכוז כמויות */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', borderBottom: '3px double #0f172a', paddingBottom: '15px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', width: '100%', position: 'relative' }}>
                    <span style={{ fontSize: '15px', fontFamily: '"Times New Roman", Times, serif', color: '#1e293b', fontWeight: 'bold' }}>
                      {myCompanyDetails.engName}
                    </span>
                    <svg width="100" height="40" viewBox="0 0 180 70">
                      <path d="M10 20 C 50 10, 100 30, 140 20" fill="none" stroke="#94a3b8" strokeWidth="2.5" />
                      <path d="M10 32 C 50 22, 100 42, 140 32" fill="none" stroke="#475569" strokeWidth="2.5" />
                      <path d="M10 44 C 50 34, 100 54, 140 44" fill="none" stroke="#d97706" strokeWidth="2.5" />
                      <g transform="translate(140, 5)">
                        <path d="M20 35 C 20 22, 45 22, 45 31 C 45 40, 15 37, 15 49 C 15 60, 40 60, 40 49" fill="none" stroke="#d97706" strokeWidth="5" strokeLinecap="round" />
                        <path d="M30 18 L 15 52 M 30 18 L 45 52 M 19 40 L 41 40" fill="none" stroke="#475569" strokeWidth="4.5" strokeLinecap="round" />
                      </g>
                    </svg>
                  </div>
                  <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#1e293b', margin: '4px 0 0 0', fontFamily: '"Times New Roman", Times, serif' }}>
                    {myCompanyDetails.name}
                  </h1>
                  <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', margin: '2px 0 6px 0' }}>
                    {myCompanyDetails.subtitle}
                  </p>
                  <div style={{ fontSize: '10px', color: '#475569' }}>
                    <b>משרד ראשי ומפעל:</b> {myCompanyDetails.address} | <b>טל:</b> {myCompanyDetails.phone} | <b>פקס:</b> {myCompanyDetails.fax} | <b>נייד:</b> {myCompanyDetails.mobile} | <b>דוא"ל:</b> {myCompanyDetails.email}
                  </div>
                </div>

                {/* פרטי הפרויקט והריכוז */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '25px', paddingBottom: '10px', borderBottom: '1px solid #cbd5e1', fontSize: '14px', textAlign: 'right' }}>
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
                  const costs = getDetailedSheetCosts(sheet);
                  const shTotals = getSheetTotals(sheet);
                  
                  return (
                    <div key={sheet.id} style={{ marginBottom: '50px', paddingBottom: '30px', borderBottom: sIdx < sheets.length - 1 ? '2px dashed #cbd5e1' : 'none', pageBreakAfter: 'always' }}>
                      
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
                      <div style={{ overflowX: 'auto', width: '100%', backgroundColor: '#ffffff', marginBottom: '15px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '11px', border: '1.5px solid #cbd5e1', minWidth: '1100px' }}>
                          <thead style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #475569' }}>
                            <tr style={{ color: '#0f172a', fontWeight: 'bold' }}>
                              <th style={{ padding: '8px 6px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', width: '50px' }}>מספר</th>
                              <th style={{ padding: '8px 10px', borderLeft: '1px solid #cbd5e1', textAlign: 'right' }}>פירוט</th>
                              <th style={{ padding: '8px 6px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', width: '100px' }}>פח (מ"ר)</th>
                              <th style={{ padding: '8px 6px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', width: '100px' }}>בידוד (מ"ר)</th>
                              <th style={{ padding: '8px 6px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', width: '100px' }}>מתאם (יח')</th>
                              <th style={{ padding: '8px 6px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', width: '100px' }}>שתוצר (יח')</th>
                              <th style={{ padding: '8px 6px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', width: '100px' }}>גמיש (מ"א)</th>
                              <th style={{ padding: '8px 6px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', width: '100px' }}>שרשורי (מ"א)</th>
                              <th style={{ padding: '8px 6px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', width: '100px' }}>פח 1.25 (מ"ר)</th>
                              <th style={{ padding: '8px 10px', textAlign: 'right', width: '160px' }}>הערות</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sheet.rows.map((row, rIdx) => {
                              const thick = calculateThickness(row.width1, row.height1);
                              const area = calculateArea(row);
                              
                              let formatDetail = `${row.type} ${row.width1}x${row.height1}`;
                              if (row.type === 'מעבר') formatDetail += ` / ${row.width2}x${row.height2}`;
                              if (row.length > 0) formatDetail += ` L=${row.length}`;
                              
                              return (
                                <tr key={row.id} style={{ borderBottom: '1px solid #cbd5e1', backgroundColor: rIdx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                                  <td style={{ padding: '8px 6px', textAlign: 'center', borderLeft: '1px solid #cbd5e1', fontWeight: 'bold', color: '#64748b' }}>{rIdx + 1}</td>
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
                          
                          {/* רגל הטבלה - סה"כ כמויות, מחירי יחידה, ועלויות בשקלים */}
                          <tfoot>
                            {/* שורת סה"כ כמות */}
                            <tr style={{ backgroundColor: '#f1f5f9', fontWeight: 'bold', borderTop: '2px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>
                              <td style={{ padding: '8px 6px', textAlign: 'center', borderLeft: '1px solid #cbd5e1' }} colSpan={2}>סה"כ כמות:</td>
                              <td style={{ padding: '8px 6px', textAlign: 'center', borderLeft: '1px solid #cbd5e1' }}>{(shTotals.t08 + shTotals.t10) > 0 ? (shTotals.t08 + shTotals.t10).toFixed(2) : ''}</td>
                              <td style={{ padding: '8px 6px', textAlign: 'center', borderLeft: '1px solid #cbd5e1' }}>{(shTotals.acoustic + shTotals.external) > 0 ? (shTotals.acoustic + shTotals.external).toFixed(2) : ''}</td>
                              <td style={{ padding: '8px 6px', textAlign: 'center', borderLeft: '1px solid #cbd5e1' }}>{shTotals.adapterQty > 0 ? shTotals.adapterQty : ''}</td>
                              <td style={{ padding: '8px 6px', textAlign: 'center', borderLeft: '1px solid #cbd5e1' }}>{shTotals.shatuzar > 0 ? shTotals.shatuzar : ''}</td>
                              <td style={{ padding: '8px 6px', textAlign: 'center', borderLeft: '1px solid #cbd5e1' }}>{shTotals.flexible > 0 ? shTotals.flexible.toFixed(2) : ''}</td>
                              <td style={{ padding: '8px 6px', textAlign: 'center', borderLeft: '1px solid #cbd5e1' }}>{(shTotals.sharshuri6 + shTotals.sharshuri8 + shTotals.sharshuri10) > 0 ? (shTotals.sharshuri6 + shTotals.sharshuri8 + shTotals.sharshuri10).toFixed(2) : ''}</td>
                              <td style={{ padding: '8px 6px', textAlign: 'center', borderLeft: '1px solid #cbd5e1' }}>{shTotals.t125 > 0 ? shTotals.t125.toFixed(2) : ''}</td>
                              <td style={{ padding: '8px 10px' }}></td>
                            </tr>
                            {/* שורת מחיר יחידה */}
                            <tr style={{ backgroundColor: '#f8fafc', color: '#475569', fontSize: '11px', borderBottom: '1px solid #cbd5e1' }}>
                              <td style={{ padding: '6px', textAlign: 'center', borderLeft: '1px solid #cbd5e1', fontWeight: 'bold' }} colSpan={2}>מחיר יח' (₪):</td>
                              <td style={{ padding: '6px', textAlign: 'center', borderLeft: '1px solid #cbd5e1' }}>{getPrice('פח 0.8')} ₪</td>
                              <td style={{ padding: '6px', textAlign: 'center', borderLeft: '1px solid #cbd5e1' }}>{getPrice('בידוד פנימי 1"')} ₪</td>
                              <td style={{ padding: '6px', textAlign: 'center', borderLeft: '1px solid #cbd5e1' }}>משתנה</td>
                              <td style={{ padding: '6px', textAlign: 'center', borderLeft: '1px solid #cbd5e1' }}>{getPrice('שתוצר עגול')} ₪</td>
                              <td style={{ padding: '6px', textAlign: 'center', borderLeft: '1px solid #cbd5e1' }}>{getPrice('חיבור גמיש')} ₪</td>
                              <td style={{ padding: '6px', textAlign: 'center', borderLeft: '1px solid #cbd5e1' }}>משתנה</td>
                              <td style={{ padding: '6px', textAlign: 'center', borderLeft: '1px solid #cbd5e1' }}>{getPrice('פח 1.25')} ₪</td>
                              <td style={{ padding: '6px 10px' }}></td>
                            </tr>
                            {/* שורת סה"כ בשקלים */}
                            <tr style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', fontWeight: 'bold', borderBottom: '2px solid #1d4ed8' }}>
                              <td style={{ padding: '8px 6px', textAlign: 'center', borderLeft: '1.5px solid #cbd5e1' }} colSpan={2}>סה"כ (₪):</td>
                              <td style={{ padding: '8px 6px', textAlign: 'center', borderLeft: '1.5px solid #cbd5e1' }}>{costs.pahCost > 0 ? `${costs.pahCost.toFixed(2)} ₪` : ''}</td>
                              <td style={{ padding: '8px 6px', textAlign: 'center', borderLeft: '1.5px solid #cbd5e1' }}>{costs.bidudCost > 0 ? `${costs.bidudCost.toFixed(2)} ₪` : ''}</td>
                              <td style={{ padding: '8px 6px', textAlign: 'center', borderLeft: '1.5px solid #cbd5e1' }}>{costs.matamCost > 0 ? `${costs.matamCost.toFixed(2)} ₪` : ''}</td>
                              <td style={{ padding: '8px 6px', textAlign: 'center', borderLeft: '1.5px solid #cbd5e1' }}>{costs.shatuzarCost > 0 ? `${costs.shatuzarCost.toFixed(2)} ₪` : ''}</td>
                              <td style={{ padding: '8px 6px', textAlign: 'center', borderLeft: '1.5px solid #cbd5e1' }}>{costs.flexibleCost > 0 ? `${costs.flexibleCost.toFixed(2)} ₪` : ''}</td>
                              <td style={{ padding: '8px 6px', textAlign: 'center', borderLeft: '1.5px solid #cbd5e1' }}>{costs.sharshuriCost > 0 ? `${costs.sharshuriCost.toFixed(2)} ₪` : ''}</td>
                              <td style={{ padding: '8px 6px', textAlign: 'center', borderLeft: '1.5px solid #cbd5e1' }}>{costs.pah125Cost > 0 ? `${costs.pah125Cost.toFixed(2)} ₪` : ''}</td>
                              <td style={{ padding: '8px 10px' }}></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>

                      {/* חישוב תחתון לכל טבלה בנפרד (מע"מ, סה"כ) כמענה מוחלט לדף 3 ב-PDF */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                        <div style={{ width: '300px', backgroundColor: '#f8fafc', padding: '15px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', lineHeight: '1.6', textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>סה"כ נטו:</span>
                            <span style={{ fontWeight: 'bold' }}>{costs.subtotal.toFixed(2)} ₪</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                            <span>מע"מ (18%):</span>
                            <span>{costs.vat.toFixed(2)} ₪</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #cbd5e1', fontSize: '15px', fontWeight: 'bold', color: '#1e40af' }}>
                            <span>כולל מע"מ:</span>
                            <span style={{ borderBottom: '2px double #1e40af' }}>{costs.total.toFixed(2)} ₪</span>
                          </div>
                        </div>
                      </div>

                    </div>
                  );
                })}

                {/* הערה חוקית קבועה למטה בתחתית הדף */}
                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', color: '#64748b', paddingTop: '10px', borderTop: '1px solid #cbd5e1' }}>
                  <span>הופק באמצעות מערכת עלי שרארה בע"מ - ממוחשב</span>
                  <span>חתימת העסק ומבצע הריכוז</span>
                </div>

              </div>
            )}

            {/* טאב חשבון פרופורמה */}
            {activeTab === 'invoice' && (
              <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '32px', maxWidth: '750px', margin: '0 auto', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
                
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
                      onClick={() => window.print()} 
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
                    </div>
                  </div>
                )}

                {/* לוגו ומכתב רשמי מרוכז וממורכז */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', borderBottom: '3px double #0f172a', paddingBottom: '20px', marginBottom: '24px' }}>
                  
                  {/* לוגו מרכזי מוגדל פי 2.5 */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', textAlign: 'center', marginBottom: '10px' }}>
                    
                    {/* כותרת משנה באנגלית למעלה מצד שמאל, לוגו מצד ימין */}
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '30px', width: '100%', position: 'relative' }}>
                      
                      {/* כיתוב אנגלי */}
                      <span style={{ fontSize: '18px', fontFamily: '"Times New Roman", Times, serif', color: '#1e293b', fontWeight: 'bold', letterSpacing: '1px' }}>
                        {myCompanyDetails.engName}
                      </span>
                      
                      {/* סמל הלוגו - שחזור SVG מרשים של הלוגו המקורי */}
                      <svg width="150" height="60" viewBox="0 0 180 70">
                        {/* Wavy lines for ventilation/airflow */}
                        <path d="M10 20 C 50 10, 100 30, 140 20" fill="none" stroke="#94a3b8" strokeWidth="2.5" />
                        <path d="M10 32 C 50 22, 100 42, 140 32" fill="none" stroke="#475569" strokeWidth="2.5" />
                        <path d="M10 44 C 50 34, 100 54, 140 44" fill="none" stroke="#d97706" strokeWidth="2.5" />
                        
                        {/* Monogram */}
                        <g transform="translate(140, 5)">
                          <path d="M20 35 C 20 22, 45 22, 45 31 C 45 40, 15 37, 15 49 C 15 60, 40 60, 40 49" fill="none" stroke="#d97706" strokeWidth="5" strokeLinecap="round" />
                          <path d="M30 18 L 15 52 M 30 18 L 45 52 M 19 40 L 41 40" fill="none" stroke="#475569" strokeWidth="4.5" strokeLinecap="round" />
                        </g>
                      </svg>
                    </div>

                    {/* כותרת ראשית עברית ענקית ומכובדת */}
                    <h1 style={{ fontSize: '38px', fontWeight: '900', color: '#1e293b', margin: '5px 0 0 0', letterSpacing: '1px', fontFamily: '"Times New Roman", Times, serif' }}>
                      {myCompanyDetails.name}
                    </h1>
                    
                    {/* תיאור העסק */}
                    <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#475569', margin: '2px 0 10px 0', letterSpacing: '0.5px' }}>
                      {myCompanyDetails.subtitle}
                    </p>
                  </div>

                  {/* קישורים: אתר ומייל */}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '60px', width: '100%', borderTop: '1px solid #cbd5e1', paddingTop: '6px', paddingBottom: '6px', fontSize: '14px', fontWeight: '600' }}>
                    <span style={{ color: '#1e293b', fontFamily: 'sans-serif' }}>{myCompanyDetails.website}</span>
                    <span style={{ color: '#1e293b', fontFamily: 'sans-serif' }}>E-mail: <a href={`mailto:${myCompanyDetails.email}`} style={{ color: '#2563eb', textDecoration: 'none' }}>{myCompanyDetails.email}</a></span>
                  </div>

                  {/* בלוק תחתון דו-עמודתי מופרד בקו אנכי */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '15px', width: '100%', borderTop: '1.5px solid #0f172a', paddingTop: '10px', fontSize: '11px', lineHeight: '1.5', textAlign: 'right' }}>
                    
                    {/* עמודה ימנית: תחומי פעילות */}
                    <div style={{ paddingRight: '5px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', rowGap: '4px', columnGap: '8px', color: '#475569', fontWeight: 'bold' }}>
                        {myCompanyDetails.services.map((service: string, index: number) => (
                          <span key={index}>
                            {service} {index < myCompanyDetails.services.length - 1 ? ' | ' : ''}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* עמודה שמאלית: פרטי התקשרות וכתובת */}
                    <div style={{ borderRight: '1.5px solid #cbd5e1', paddingRight: '15px', display: 'flex', flexDirection: 'column', gap: '3px', color: '#1e293b' }}>
                      <div><b>משרד ראשי ומפעל:</b> {myCompanyDetails.address}</div>
                      <div>
                        <b>טל:</b> {myCompanyDetails.phone} | <b>פקס:</b> {myCompanyDetails.fax} | <b>נייד:</b> {myCompanyDetails.mobile}
                      </div>
                      <div><b>דואר למשלוחים:</b> {myCompanyDetails.pobox}</div>
                    </div>

                  </div>

                </div>

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
                      {totals[0.8] > 0 && (
                        <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                          <td style={{ padding: '10px 8px', borderLeft: '1px solid #cbd5e1', fontWeight: 600, color: '#1e293b' }}>פח מגולוון עובי 0.8 מ"מ</td>
                          <td style={{ padding: '10px 8px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold' }}>{totals[0.8].toFixed(2)}</td>
                          <td style={{ padding: '10px 8px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', color: '#64748b' }}>מ"ר</td>
                          <td style={{ padding: '10px 8px', borderLeft: '1px solid #cbd5e1', textAlign: 'center' }}>{getPrice('פח 0.8')} ₪</td>
                          <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 'bold', color: '#1d4ed8' }}>{(totals[0.8] * getPrice('פח 0.8')).toFixed(2)} ₪</td>
                        </tr>
                      )}
                      {/* 2. פח מגולוון 1.0 */}
                      {totals[1.0] > 0 && (
                        <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                          <td style={{ padding: '10px 8px', borderLeft: '1px solid #cbd5e1', fontWeight: 600, color: '#1e293b' }}>פח מגולוון עובי 1.0 מ"מ</td>
                          <td style={{ padding: '10px 8px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold' }}>{totals[1.0].toFixed(2)}</td>
                          <td style={{ padding: '10px 8px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', color: '#64748b' }}>מ"ר</td>
                          <td style={{ padding: '10px 8px', borderLeft: '1px solid #cbd5e1', textAlign: 'center' }}>{getPrice('פח 1.0')} ₪</td>
                          <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 'bold', color: '#1d4ed8' }}>{(totals[1.0] * getPrice('פח 1.0')).toFixed(2)} ₪</td>
                        </tr>
                      )}
                      {/* 3. פח מגולוון 1.25 */}
                      {totals[1.25] > 0 && (
                        <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                          <td style={{ padding: '10px 8px', borderLeft: '1px solid #cbd5e1', fontWeight: 600, color: '#1e293b' }}>פח מגולוון עובי 1.25 מ"מ</td>
                          <td style={{ padding: '10px 8px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold' }}>{totals[1.25].toFixed(2)}</td>
                          <td style={{ padding: '10px 8px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', color: '#64748b' }}>מ"ר</td>
                          <td style={{ padding: '10px 8px', borderLeft: '1px solid #cbd5e1', textAlign: 'center' }}>{getPrice('פח 1.25')} ₪</td>
                          <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 'bold', color: '#1d4ed8' }}>{(totals[1.25] * getPrice('פח 1.25')).toFixed(2)} ₪</td>
                        </tr>
                      )}
                      {/* 4. שתוצר עגול */}
                      {totals.shatuzar > 0 && (
                        <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                          <td style={{ padding: '10px 8px', borderLeft: '1px solid #cbd5e1', fontWeight: 600, color: '#1e293b' }}>שתוצר עגול לתעלות</td>
                          <td style={{ padding: '10px 8px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold' }}>{totals.shatuzar}</td>
                          <td style={{ padding: '10px 8px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', color: '#64748b' }}>יח'</td>
                          <td style={{ padding: '10px 8px', borderLeft: '1px solid #cbd5e1', textAlign: 'center' }}>{getPrice('שתוצר עגול')} ₪</td>
                          <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 'bold', color: '#1d4ed8' }}>{(totals.shatuzar * getPrice('שתוצר עגול')).toFixed(2)} ₪</td>
                        </tr>
                      )}
                      {/* 5. חיבור גמיש */}
                      {totals.flexible > 0 && (
                        <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                          <td style={{ padding: '10px 8px', borderLeft: '1px solid #cbd5e1', fontWeight: 600, color: '#1e293b' }}>חיבור גמיש מונע רעידות</td>
                          <td style={{ padding: '10px 8px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold' }}>{totals.flexible.toFixed(2)}</td>
                          <td style={{ padding: '10px 8px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', color: '#64748b' }}>מ"א</td>
                          <td style={{ padding: '10px 8px', borderLeft: '1px solid #cbd5e1', textAlign: 'center' }}>{getPrice('חיבור גמיש')} ₪</td>
                          <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 'bold', color: '#1d4ed8' }}>{(totals.flexible * getPrice('חיבור גמיש')).toFixed(2)} ₪</td>
                        </tr>
                      )}
                      {/* 6. בידוד אקוסטי */}
                      {totals.acoustic > 0 && (
                        <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                          <td style={{ padding: '10px 8px', borderLeft: '1px solid #cbd5e1', fontWeight: 600, color: '#1e293b' }}>בידוד פנימי אקוסטי 1"</td>
                          <td style={{ padding: '10px 8px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold' }}>{totals.acoustic.toFixed(2)}</td>
                          <td style={{ padding: '10px 8px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', color: '#64748b' }}>מ"ר</td>
                          <td style={{ padding: '10px 8px', borderLeft: '1px solid #cbd5e1', textAlign: 'center' }}>{getPrice('בידוד פנימי 1"')} ₪</td>
                          <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 'bold', color: '#1d4ed8' }}>{(totals.acoustic * getPrice('בידוד פנימי 1"')).toFixed(2)} ₪</td>
                        </tr>
                      )}
                      {/* 7. בידוד חיצוני */}
                      {totals.external > 0 && (
                        <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                          <td style={{ padding: '10px 8px', borderLeft: '1px solid #cbd5e1', fontWeight: 600, color: '#1e293b' }}>בידוד חיצוני תעלות 1"</td>
                          <td style={{ padding: '10px 8px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold' }}>{totals.external.toFixed(2)}</td>
                          <td style={{ padding: '10px 8px', borderLeft: '1px solid #cbd5e1', textAlign: 'center', color: '#64748b' }}>מ"ר</td>
                          <td style={{ padding: '10px 8px', borderLeft: '1px solid #cbd5e1', textAlign: 'center' }}>{getPrice('בידוד חיצוני 1"')} ₪</td>
                          <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 'bold', color: '#1d4ed8' }}>{(totals.external * getPrice('בידוד חיצוני 1"')).toFixed(2)} ₪</td>
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
                            <td style={{ padding: '10px 8px', borderLeft: '1px solid #cbd5e1', textAlign: 'center' }}>{getPrice(priceKey)} ₪</td>
                            <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 'bold', color: '#1d4ed8' }}>{(qty * getPrice(priceKey)).toFixed(2)} ₪</td>
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
                            <td style={{ padding: '10px 8px', borderLeft: '1px solid #cbd5e1', textAlign: 'center' }}>{getPrice(adapterPriceKey)} ₪</td>
                            <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 'bold', color: '#1d4ed8' }}>{(qty * getPrice(adapterPriceKey)).toFixed(2)} ₪</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div style={{ marginTop: '20px', backgroundColor: '#f1f5f9', padding: '16px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}><span>סך הכל נטו (ללא מע"מ):</span><span style={{ fontWeight: 600 }}>{subtotal.toFixed(2)} ₪</span></div>
                  {/* חישוב מע"מ עדכני ומדויק של 18% */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#475569' }}><span>מס ערך מוסף (18%):</span><span>{vat.toFixed(2)} ₪</span></div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '2px dashed #94a3b8', fontSize: '18px', fontWeight: 'bold', color: '#0f172a' }}>
                    <span>לתשלום כולל מע"מ:</span>
                    <span style={{ color: '#1e40af', borderBottom: '2px double #1e40af' }}>{finalTotal.toFixed(2)} ₪</span>
                  </div>
                </div>

                <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#64748b', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                  <span>מערכת עלי שרארה בע"מ - הפקה ממוחשבת</span>
                  <div style={{ textAlign: 'center', borderTop: '1px dashed #cbd5e1', width: '150px', paddingTop: '6px' }}>חתימה וחותמת העסק</div>
                </div>
              </div>
            )}

            {/* טאב מחירון העסק */}
            {activeTab === 'pricelist' && (
              <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '32px', maxWidth: '800px', margin: '0 auto', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
                <div style={{ borderBottom: '3px solid #0f172a', paddingBottom: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>מחירון העסק</h2>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>מחירון מעודכן הניתן לעדכון ועריכה בכל עת. השינויים משפיעים ישירות על כל הדוחות והחישובים במערכת.</p>
                  </div>
                  <button 
                    onClick={() => window.print()} 
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
          </main>
        </div>
      )}
    </div>
  );
}