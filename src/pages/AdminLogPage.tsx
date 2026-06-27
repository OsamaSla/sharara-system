import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, getDoc, doc, setDoc, deleteDoc, orderBy, query, limit } from 'firebase/firestore';
import { Shield, RotateCcw, Trash2, Download, Clock, FileText, Wrench, Camera } from 'lucide-react';
import type { Sheet } from '../types';

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  projectName: string;
  clientName: string;
  actionType: 'DXF_EXPORTED' | 'PAGE_RESET' | 'DATA_SAVED' | 'PRODUCTION_SNAPSHOT' | 'BACKUP_CREATED' | 'BACKUP_RESTORED' | 'PART_ADDED' | 'PART_DELETED';
  details: string;
  snapshotData?: Sheet[];
}

interface AdminLogPageProps {
  selectedClientKey: string;
  selectedProject: string;
  isNewClient: boolean;
  clientDetails: { name: string };
  sheets: Sheet[];
  setSheets: React.Dispatch<React.SetStateAction<Sheet[]>>;
}

const ACTION_LABELS: Record<string, string> = {
  'DXF_EXPORTED': '🔧 ייצוא DXF ללייזר',
  'PAGE_RESET': '🔄 איפוס דף מדידה',
  'DATA_SAVED': '💾 שמירת נתונים',
  'PRODUCTION_SNAPSHOT': '📸 צילום מצב ייצור',
  'BACKUP_CREATED': '☁️ גיבוי בענן',
  'BACKUP_RESTORED': '↩️ שחזור מגיבוי',
  'PART_ADDED': '➕ הוספת חלק',
  'PART_DELETED': '🗑️ מחיקת חלק',
};

const ACTION_COLORS: Record<string, string> = {
  'DXF_EXPORTED': '#c2410c',
  'PAGE_RESET': '#d97706',
  'DATA_SAVED': '#2563eb',
  'PRODUCTION_SNAPSHOT': '#7c3aed',
  'BACKUP_CREATED': '#059669',
  'BACKUP_RESTORED': '#dc2626',
  'PART_ADDED': '#0891b2',
  'PART_DELETED': '#be123c',
};

export default function AdminLogPage({
  selectedClientKey,
  selectedProject,
  isNewClient,
  clientDetails,
  sheets,
  setSheets,
}: AdminLogPageProps) {
  const [logEntries, setLogEntries] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);

  const clientName = (isNewClient ? clientDetails.name : selectedClientKey) || 'Unknown';

  useEffect(() => {
    loadLog();
  }, []);

  const loadLog = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'measurement_history'), orderBy('timestamp', 'desc'), limit(100));
      const snap = await getDocs(q);
      const entries: ActivityLogEntry[] = [];
      snap.forEach(d => {
        const data = d.data();
        entries.push({
          id: d.id,
          timestamp: data.timestamp || '',
          projectName: data.projectName || '',
          clientName: data.clientName || '',
          actionType: data.actionType || 'DATA_SAVED',
          details: data.details || '',
          snapshotData: data.snapshotData,
        });
      });
      setLogEntries(entries);
    } catch (err) {
      console.error('Failed to load activity log:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (entry: ActivityLogEntry) => {
    if (!entry.snapshotData || entry.snapshotData.length === 0) {
      alert('לא נמצא צילום מצב לשחזור.');
      return;
    }
    if (!confirm(`לשחזר את המצב מ-${entry.timestamp}?\nזה ידרוס את נתוני המדידה הפעילים.`)) return;

    setRestoring(entry.id);
    try {
      setSheets(entry.snapshotData);
      const restoreKey = `${clientName}|||${selectedProject}`;
      const dataRef = doc(db, 'appData', 'mainData');
      const currentSnap = await getDoc(dataRef);
      const currentData = currentSnap.exists() ? currentSnap.data() : {};
      await setDoc(dataRef, {
        ...currentData,
        sheetsByProject: {
          ...(currentData.sheetsByProject || {}),
          [restoreKey]: entry.snapshotData,
        },
      }, { merge: true });
      alert('✅ השחזור הושלם בהצלחה!');
    } catch (err: any) {
      alert('שגיאה בשחזור: ' + err.message);
    } finally {
      setRestoring(null);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm('למחוק רשומה זו מהלוג?')) return;
    try {
      await deleteDoc(doc(db, 'measurement_history', entryId));
      setLogEntries(prev => prev.filter(e => e.id !== entryId));
    } catch (err: any) {
      alert('שגיאה במחיקה: ' + err.message);
    }
  };

  const formatDate = (ts: string) => {
    if (!ts) return '—';
    try {
      const d = new Date(ts);
      return d.toLocaleDateString('he-IL') + ' ' + d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return ts;
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <Shield size={22} color="#7c3aed" />
        <h2 style={{ margin: 0, fontSize: '18px', color: '#0f172a', fontWeight: 700 }}>לוח בקרה — מנהל מערכת</h2>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button onClick={loadLog} style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
          <RotateCcw size={13} /> רענון לוג
        </button>
        <span style={{ fontSize: '11px', color: '#64748b', alignSelf: 'center' }}>{logEntries.length} רשומות</span>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>טוען לוג פעילות...</div>
      ) : logEntries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '14px' }}>
          <Clock size={32} style={{ marginBottom: '8px', opacity: 0.4 }} />
          <div>אין רשומות פעילות עדיין.</div>
          <div style={{ fontSize: '12px', marginTop: '4px' }}>פעולות שיתועדו יופיעו כאן.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {logEntries.map(entry => (
            <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', borderRight: `4px solid ${ACTION_COLORS[entry.actionType] || '#64748b'}` }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: ACTION_COLORS[entry.actionType] || '#334155' }}>
                    {ACTION_LABELS[entry.actionType] || entry.actionType}
                  </span>
                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>•</span>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>{formatDate(entry.timestamp)}</span>
                </div>
                <div style={{ fontSize: '11px', color: '#475569' }}>
                  <span style={{ fontWeight: 600 }}>{entry.projectName}</span>
                  {entry.details && <span style={{ marginRight: '6px', color: '#94a3b8' }}>— {entry.details}</span>}
                </div>
              </div>

              {entry.snapshotData && entry.snapshotData.length > 0 ? (
                <button
                  onClick={() => handleRestore(entry)}
                  disabled={restoring === entry.id}
                  title="שחזר מצב זה"
                  style={{
                    backgroundColor: restoring === entry.id ? '#94a3b8' : '#7c3aed',
                    color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px',
                    cursor: restoring === entry.id ? 'not-allowed' : 'pointer',
                    fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0,
                  }}
                >
                  <RotateCcw size={11} /> שחזר
                </button>
              ) : (
                <span style={{ fontSize: '10px', color: '#94a3b8', flexShrink: 0 }}>ללא נתוני שחזור</span>
              )}

              <button
                onClick={() => handleDeleteEntry(entry.id)}
                title="מחק רשומה"
                style={{ backgroundColor: 'transparent', color: '#94a3b8', border: '1px solid #e2e8f0', padding: '4px 6px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', flexShrink: 0 }}
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
