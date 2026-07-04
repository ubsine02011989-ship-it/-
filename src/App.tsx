/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ClipboardList, 
  PlusCircle, 
  User, 
  Bell, 
  X,
  CheckCircle,
  FileSpreadsheet,
  Cloud,
  LogOut,
  Loader2,
  LogIn
} from 'lucide-react';
import { ReceiptItem, StatusNotification } from './types';
import { SEED_ITEMS, generateId } from './utils/helpers';

// Firebase imports
import { 
  auth, 
  db, 
  googleProvider, 
  handleFirestoreError, 
  OperationType 
} from './firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  writeBatch 
} from 'firebase/firestore';

// Subcomponents
import Dashboard from './components/Dashboard';
import ReceiptForm from './components/ReceiptForm';
import ReceiptList from './components/ReceiptList';
import PrintInvoice from './components/PrintInvoice';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning';
}

export default function App() {
  // 1. Firebase Auth & Database states
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dbLoading, setDbLoading] = useState(false);
  
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [notifications, setNotifications] = useState<StatusNotification[]>([]);

  // 2. Control states
  const [activeTab, setActiveTab] = useState<'dashboard' | 'list' | 'form'>('dashboard');
  const [editItem, setEditItem] = useState<ReceiptItem | null>(null);
  
  // 3. Print states
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [printPreviewItems, setPrintPreviewItems] = useState<ReceiptItem[]>([]);

  // 4. Toast notifications state
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Monitor Authentication State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Sync receipts from Firestore
  useEffect(() => {
    if (!user) {
      setItems([]);
      return;
    }

    setDbLoading(true);
    const q = query(collection(db, 'receipts'), where('userId', '==', user.uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedItems: ReceiptItem[] = [];
      snapshot.forEach((docSnap) => {
        fetchedItems.push(docSnap.data() as ReceiptItem);
      });
      
      // Sort items: newest receiveDate first, fallback to ID
      fetchedItems.sort((a, b) => b.receiveDate.localeCompare(a.receiveDate) || b.id.localeCompare(a.id));
      
      // Seed default items if new user has empty collection
      if (fetchedItems.length === 0) {
        const batch = writeBatch(db);
        SEED_ITEMS.forEach((item) => {
          const itemRef = doc(db, 'receipts', item.id);
          batch.set(itemRef, { ...item, userId: user.uid });
        });
        batch.commit()
          .then(() => {
            triggerToast('สร้างข้อมูลตัวอย่างเริ่มต้นบนระบบคลาวด์เรียบร้อยแล้ว', 'info');
          })
          .catch((err) => {
            console.error('Error seeding default items: ', err);
          });
      } else {
        setItems(fetchedItems);
      }
      setDbLoading(false);
    }, (error) => {
      setDbLoading(false);
      handleFirestoreError(error, OperationType.GET, 'receipts');
    });

    return () => unsubscribe();
  }, [user]);

  // Sync notifications from Firestore
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const q = query(collection(db, 'notifications'), where('userId', '==', user.uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedNotifs: StatusNotification[] = [];
      snapshot.forEach((docSnap) => {
        fetchedNotifs.push(docSnap.data() as StatusNotification);
      });
      
      // Sort by timestamp descending
      fetchedNotifs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      setNotifications(fetchedNotifs.slice(0, 50));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'notifications');
    });

    return () => unsubscribe();
  }, [user]);

  // Helper to add a transient toast message
  const triggerToast = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    const id = generateId('TOAST');
    const newToast: Toast = { id, message, type };
    setToasts((prev) => [newToast, ...prev]);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const handleRemoveToast = (id: string) => {
    setToasts((prev) => prev.filter(t => t.id !== id));
  };

  // Helper to create a persistent status notification log entry in Firestore
  const addStatusNotification = async (
    itemId: string, 
    itemName: string, 
    type: 'usage' | 'work_order', 
    status: boolean, 
    message: string
  ) => {
    if (!user) return;
    
    const notifId = generateId('NOTIF');
    const notif = {
      id: notifId,
      itemId,
      itemName,
      type,
      status,
      message,
      timestamp: new Date().toISOString(),
      userId: user.uid
    };
    
    try {
      await setDoc(doc(db, 'notifications', notifId), notif);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `notifications/${notifId}`);
    }
  };

  // Triggering toggles with immediate notifications
  const handleToggleUsed = async (
    id: string, 
    disburseData?: { usedQuantity: number; withdrawerName: string; usagePurpose: string; usedDate: string; usedProject?: string | null } | null
  ) => {
    const item = items.find((item) => item.id === id);
    if (!item || !user) return;

    const nextStatus = disburseData !== null ? (disburseData ? true : !item.isUsed) : false;
    
    let today = nextStatus ? new Date().toISOString().substring(0, 10) : null;
    let usedQty = nextStatus ? item.quantity : null;
    let withdrawer = null;
    let purpose = null;
    let uProj = null;

    if (disburseData) {
      today = disburseData.usedDate;
      usedQty = disburseData.usedQuantity;
      withdrawer = disburseData.withdrawerName || null;
      purpose = disburseData.usagePurpose || null;
      uProj = disburseData.usedProject || null;
    }

    let msg = '';
    if (nextStatus) {
      if (disburseData) {
        msg = `อัปเดตสถานะ: นำออกไปใช้งานจำนวน ${usedQty} หน่วย โดย ${withdrawer || 'ไม่ระบุผู้เบิก'} เพื่อ: ${purpose || 'ไม่ระบุวัตถุประสงค์'}${uProj ? ` [ใช้โครงการ: ${uProj}]` : ''} (วันที่: ${today})`;
      } else {
        msg = `อัปเดตสถานะ: นำไปใช้งานแล้ว (วันที่: ${today})`;
      }
    } else {
      msg = 'อัปเดตสถานะ: ยกเลิกการนำไปใช้งาน (กลับเข้าสู่คลัง)';
    }
      
    triggerToast(
      nextStatus ? `บันทึกการเบิกจ่ายของ ${item.name} สำเร็จ` : `ยกเลิกการเบิกใช้งาน ${item.name} แล้ว`, 
      nextStatus ? 'success' : 'warning'
    );

    const updatedItem = {
      ...item,
      isUsed: nextStatus,
      usedDate: today,
      usedQuantity: usedQty,
      withdrawerName: withdrawer,
      usagePurpose: purpose,
      usedProject: uProj
    };

    try {
      await setDoc(doc(db, 'receipts', id), updatedItem);
      await addStatusNotification(item.id, item.name, 'usage', nextStatus, msg);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `receipts/${id}`);
    }
  };

  const handleToggleWorkOrder = async (
    id: string, 
    workOrderData?: { workOrderNumber: string; workOrderDate: string } | null
  ) => {
    const item = items.find((item) => item.id === id);
    if (!item || !user) return;

    const nextStatus = workOrderData !== null ? (workOrderData ? true : !item.isWorkOrderIssued) : false;
    
    let woNum = item.workOrderNumber;
    let woDate = item.workOrderDate;
    
    if (nextStatus) {
      if (workOrderData) {
        woNum = workOrderData.workOrderNumber;
        woDate = workOrderData.workOrderDate;
      } else if (!woNum) {
        const prefix = item.receiveDate.replace(/-/g, '').substring(0, 6);
        woNum = `WO-${prefix}-${Math.floor(100 + Math.random() * 900)}`;
        woDate = new Date().toISOString().substring(0, 10);
      }
    } else {
      woNum = null;
      woDate = null;
    }

    const msg = nextStatus 
      ? `ทำการออกใบงานสำเร็จ เลขที่: ${woNum} (วันที่ออก: ${woDate})` 
      : 'ยกเลิกการออกใบงานช่าง';

    triggerToast(
      nextStatus ? `ออกใบงานช่างสำเร็จ! (${woNum})` : 'ยกเลิกใบงานช่างแล้ว', 
      nextStatus ? 'success' : 'warning'
    );

    const updatedItem = {
      ...item,
      isWorkOrderIssued: nextStatus,
      workOrderNumber: woNum,
      workOrderDate: woDate
    };

    try {
      await setDoc(doc(db, 'receipts', id), updatedItem);
      await addStatusNotification(item.id, item.name, 'work_order', nextStatus, msg);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `receipts/${id}`);
    }
  };

  // Add / Edit save handler in Firestore
  const handleSaveItem = async (updatedItem: ReceiptItem) => {
    if (!user) return;
    const isEditing = items.some(item => item.id === updatedItem.id);
    
    const docWithUser = {
      ...updatedItem,
      userId: user.uid
    };

    try {
      await setDoc(doc(db, 'receipts', updatedItem.id), docWithUser);
      
      if (isEditing) {
        triggerToast(`แก้ไขรายการ "${updatedItem.name}" เรียบร้อยแล้ว`, 'success');
      } else {
        triggerToast(`บันทึกรับของ "${updatedItem.name}" เข้าคลังสำเร็จ`, 'success');
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `receipts/${updatedItem.id}`);
    }

    // Reset editing state and redirect
    setEditItem(null);
    setActiveTab('list');
  };

  const handleEditClick = (item: ReceiptItem) => {
    setEditItem(item);
    setActiveTab('form');
  };

  const handleDeleteItem = async (id: string) => {
    const itemToDelete = items.find(item => item.id === id);
    if (!itemToDelete || !user) return;

    const isUsed = itemToDelete.isUsed;
    const confirmMsg = isUsed 
      ? `แจ้งเตือน: รายการ "${itemToDelete.name}" มีการบันทึกเบิกจ่ายใช้งานแล้ว!\nคุณแน่ใจหรือไม่ที่จะลบรายการนี้ออกจากคลังถาวร?`
      : `คุณแน่ใจหรือไม่ที่จะลบรายการ "${itemToDelete.name}" ออกจากคลัง?`;

    if (window.confirm(confirmMsg)) {
      try {
        await deleteDoc(doc(db, 'receipts', id));
        triggerToast(`ลบรายการ "${itemToDelete.name}" ออกแล้ว`, 'warning');
        
        // Clean corresponding notifications in Firestore
        const notifsToDelete = notifications.filter(n => n.itemId === id);
        if (notifsToDelete.length > 0) {
          const batch = writeBatch(db);
          notifsToDelete.forEach(n => {
            batch.delete(doc(db, 'notifications', n.id));
          });
          await batch.commit();
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `receipts/${id}`);
      }
    }
  };

  const handleDeleteMultipleItems = async (ids: string[]) => {
    if (ids.length === 0 || !user) return;
    
    const selectedItems = items.filter(item => ids.includes(item.id));
    const usedCount = selectedItems.filter(item => item.isUsed).length;
    const unusedCount = selectedItems.length - usedCount;

    let confirmMsg = '';
    if (usedCount > 0) {
      confirmMsg = `คุณเลือกทั้งหมด ${selectedItems.length} รายการ (ยังไม่ใช้ ${unusedCount} รายการ, นำไปใช้แล้ว ${usedCount} รายการ)\nคุณแน่ใจหรือไม่ที่จะลบรายการเหล่านี้ออกจากคลังทั้งหมด?`;
    } else {
      confirmMsg = `คุณแน่ใจหรือไม่ที่จะลบรายการที่เลือกทั้งหมด ${selectedItems.length} รายการออกจากคลัง?`;
    }

    if (window.confirm(confirmMsg)) {
      try {
        const batch = writeBatch(db);
        ids.forEach(id => {
          batch.delete(doc(db, 'receipts', id));
        });
        
        // Clean corresponding notifications
        const notifsToDelete = notifications.filter(n => ids.includes(n.itemId));
        notifsToDelete.forEach(n => {
          batch.delete(doc(db, 'notifications', n.id));
        });
        
        await batch.commit();
        triggerToast(`ลบรายการที่เลือกจำนวน ${selectedItems.length} รายการเรียบร้อยแล้ว`, 'warning');
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `batch-delete`);
      }
    }
  };

  const handleClearNotifications = async () => {
    if (!user) return;
    try {
      const batch = writeBatch(db);
      notifications.forEach((notif) => {
        batch.delete(doc(db, 'notifications', notif.id));
      });
      await batch.commit();
      triggerToast('ล้างบันทึกการแจ้งเตือนทั้งหมดสำเร็จ', 'info');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'clear-notifications');
    }
  };

  // Triggering the custom PDF Print layout preview
  const handleOpenPrintPreview = (selected: ReceiptItem[]) => {
    setPrintPreviewItems(selected);
    setShowPrintPreview(true);
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      triggerToast('ลงชื่อเข้าใช้งานสำเร็จ ยินดีต้อนรับ!', 'success');
    } catch (error) {
      console.error('Login error: ', error);
      triggerToast('การลงชื่อเข้าใช้งานล้มเหลว กรุณาลองใหม่อีกครั้ง', 'warning');
    }
  };

  // Fullscreen Auth loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4" id="auth-loading-screen">
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 className="h-10 w-10 text-emerald-500 animate-spin" />
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">กำลังตรวจสอบสิทธิ์ผู้ใช้งาน...</p>
        </div>
      </div>
    );
  }

  // Not Authenticated screen
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6" id="auth-signin-screen">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xl p-8 space-y-6 text-center animate-slide-down">
          
          <div className="flex justify-center">
            <div className="p-4 bg-emerald-500 text-slate-950 rounded-2xl shadow-xl shadow-emerald-500/20">
              <ClipboardList size={36} className="stroke-[2.5]" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              ระบบบันทึกรับของและใบงานช่าง
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
              เชื่อมต่อระบบ Cloud Firebase
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed pt-2">
              กรุณาลงชื่อเข้าใช้ด้วยบัญชี Google เพื่อเข้าถึงคลังเก็บข้อมูลส่วนตัวของท่าน ซิงค์ข้อมูลกับเซิร์ฟเวอร์แบบเรียลไทม์ และออกใบงานช่างได้อย่างปลอดภัย
            </p>
          </div>

          <button
            type="button"
            id="btn-google-login"
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-lg hover:shadow-xl hover:shadow-emerald-600/10 active:scale-[0.98] transition cursor-pointer"
          >
            <LogIn size={18} />
            <span>ลงชื่อเข้าใช้งานด้วย Google</span>
          </button>

          <div className="text-[10px] text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-4">
            ระบบตรวจสอบสิทธิ์และเก็บรักษาพิกัดข้อมูลผู้ใช้อย่างเป็นส่วนตัวแบบ Zero-Trust
          </div>
        </div>
      </div>
    );
  }

  // Authenticated Screen view
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans transition-colors duration-300" id="main-applet-shell">
      
      {/* Top Professional Navigation Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-40" id="main-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            
            {/* Brand Logo & Cloud status */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500 rounded-xl text-slate-950 shadow-md flex items-center justify-center">
                <ClipboardList size={22} className="stroke-[2.5]" />
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-sans tracking-tight">
                  ระบบบันทึกรับของและใบงาน
                </h1>
                {/* Cloud Status indicator badge */}
                <div className="flex items-center gap-1 mt-0.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold uppercase">
                  <Cloud size={10} className="text-emerald-500" />
                  <span>ระบบฐานข้อมูล Cloud Firestore</span>
                </div>
              </div>
            </div>

            {/* Middle Nav Tabs (Desktop) */}
            <nav className="hidden md:flex space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl" id="desktop-nav">
              <button
                id="tab-btn-dashboard"
                onClick={() => { setActiveTab('dashboard'); setEditItem(null); }}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition duration-150 ${
                  activeTab === 'dashboard'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <LayoutDashboard size={14} />
                แดชบอร์ดสรุปยอด
              </button>
              <button
                id="tab-btn-list"
                onClick={() => { setActiveTab('list'); setEditItem(null); }}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition duration-150 ${
                  activeTab === 'list'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <ClipboardList size={14} />
                ประวัติรายการรับของ
              </button>
              <button
                id="tab-btn-form"
                onClick={() => { setActiveTab('form'); setEditItem(null); }}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition duration-150 ${
                  activeTab === 'form'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <PlusCircle size={14} />
                {editItem ? 'กำลังแก้ไขรายการ' : 'บันทึกของเข้าใหม่'}
              </button>
            </nav>

            {/* Right Account display info & Sign out button */}
            <div className="flex items-center gap-3" id="user-profile-badge">
              <div className="hidden sm:block text-right">
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider flex items-center justify-end gap-1">
                  <Cloud size={11} className="text-emerald-500" />
                  <span>เชื่อมต่อระบบคลาวด์แล้ว</span>
                </p>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[180px]">
                  {user.displayName || user.email}
                </p>
              </div>
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName || 'User'} 
                  className="w-9 h-9 rounded-full border border-emerald-500/30 object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <User size={16} />
                </div>
              )}
              
              <button
                id="btn-sign-out"
                onClick={async () => {
                  try {
                    await signOut(auth);
                    triggerToast('ลงชื่อออกจากระบบเรียบร้อยแล้ว', 'info');
                  } catch (e) {
                    triggerToast('ออกจากระบบล้มเหลว', 'warning');
                  }
                }}
                title="ออกจากระบบ"
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-red-500 transition cursor-pointer"
              >
                <LogOut size={16} />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8" id="main-content-section">
        {dbLoading && items.length === 0 ? (
          <div className="h-96 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
            <p className="text-xs text-slate-500">กำลังเชื่อมต่อข้อมูลคลาวด์...</p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <Dashboard 
                items={items} 
                notifications={notifications}
                onClearNotifications={handleClearNotifications}
                onNavigateToForm={() => setActiveTab('form')}
                onNavigateToList={() => setActiveTab('list')}
              />
            )}

            {activeTab === 'list' && (
              <ReceiptList 
                items={items}
                onEdit={handleEditClick}
                onDelete={handleDeleteItem}
                onDeleteMultiple={handleDeleteMultipleItems}
                onToggleUsed={handleToggleUsed}
                onToggleWorkOrder={handleToggleWorkOrder}
                onNavigateToForm={() => setActiveTab('form')}
                onOpenPrintPreview={handleOpenPrintPreview}
              />
            )}

            {activeTab === 'form' && (
              <ReceiptForm 
                editItem={editItem}
                onSave={handleSaveItem}
                onCancel={() => { setActiveTab('list'); setEditItem(null); }}
              />
            )}
          </>
        )}
      </main>

      {/* Footer System Details */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 py-6 text-center text-xs text-slate-400" id="main-footer">
        <p>© 2026 ระบบจัดการรับของและใบงานช่างแบบเชื่อมต่อระบบคลาวด์ (Firebase) • ubsine02011989</p>
        <p className="text-[10px] text-slate-500 mt-1">ข้อมูลพัสดุและกิจกรรมทั้งหมดได้รับการปกป้องและจัดเก็บแบบเรียลไทม์ไว้ในระบบคลาวด์อย่างปลอดภัยด้วย Firebase (Cloud Firestore & Firebase Auth) เพื่อความสม่ำเสมอของข้อมูลในทุกอุปกรณ์</p>
      </footer>

      {/* Navigation Bar (Mobile View) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 p-2 flex justify-around items-center z-40 shadow-lg" id="mobile-bottom-nav">
        <button
          onClick={() => { setActiveTab('dashboard'); setEditItem(null); }}
          className={`flex flex-col items-center gap-1 p-2 text-[10px] font-bold ${
            activeTab === 'dashboard' ? 'text-emerald-500' : 'text-slate-400 hover:text-slate-600'
          }`}
          id="mob-tab-dashboard"
        >
          <LayoutDashboard size={18} />
          <span>แดชบอร์ด</span>
        </button>
        <button
          onClick={() => { setActiveTab('list'); setEditItem(null); }}
          className={`flex flex-col items-center gap-1 p-2 text-[10px] font-bold ${
            activeTab === 'list' ? 'text-emerald-500' : 'text-slate-400 hover:text-slate-600'
          }`}
          id="mob-tab-list"
        >
          <ClipboardList size={18} />
          <span>ประวัติ</span>
        </button>
        <button
          onClick={() => { setActiveTab('form'); setEditItem(null); }}
          className={`flex flex-col items-center gap-1 p-2 text-[10px] font-bold ${
            activeTab === 'form' ? 'text-emerald-500' : 'text-slate-400 hover:text-slate-600'
          }`}
          id="mob-tab-form"
        >
          <PlusCircle size={18} />
          <span>{editItem ? 'แก้ไข' : 'บันทึกของ'}</span>
        </button>
      </nav>

      {/* Transient Slide-in Toast Alert Center */}
      <div className="fixed bottom-20 md:bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full" id="toast-overlay-center">
        {toasts.map((toast) => (
          <div 
            key={toast.id}
            id={toast.id}
            className={`p-4 rounded-xl shadow-xl border flex items-start gap-3 text-xs text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 animate-slide-in justify-between ${
              toast.type === 'success' 
                ? 'border-emerald-500/30 border-l-4 border-l-emerald-500' 
                : toast.type === 'warning'
                ? 'border-red-500/30 border-l-4 border-l-red-500'
                : 'border-blue-500/30 border-l-4 border-l-blue-500'
            }`}
          >
            <div className="flex gap-2">
              <div className="mt-0.5">
                {toast.type === 'success' && <CheckCircle className="text-emerald-500 h-4 w-4" />}
                {toast.type === 'warning' && <X className="text-red-500 h-4 w-4" />}
                {toast.type === 'info' && <Bell className="text-blue-500 h-4 w-4" />}
              </div>
              <p className="font-semibold leading-normal">{toast.message}</p>
            </div>
            <button 
              onClick={() => handleRemoveToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              id={`btn-close-toast-${toast.id}`}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Print PDF Sheet Modal */}
      {showPrintPreview && (
        <PrintInvoice 
          selectedItems={printPreviewItems} 
          onClose={() => { setShowPrintPreview(false); setPrintPreviewItems([]); }}
        />
      )}

    </div>
  );
}

