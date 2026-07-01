/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ClipboardList, 
  PlusCircle, 
  WifiOff, 
  User, 
  Bell, 
  X,
  CheckCircle,
  FileSpreadsheet
} from 'lucide-react';
import { ReceiptItem, StatusNotification } from './types';
import { SEED_ITEMS, generateId } from './utils/helpers';

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
  // 1. Core States loaded from local storage
  const [items, setItems] = useState<ReceiptItem[]>(() => {
    const localData = localStorage.getItem('inventory_receipts');
    if (localData) {
      try {
        return JSON.parse(localData);
      } catch (e) {
        console.error('Failed to parse receipts from localstorage, fallback to seed data');
      }
    }
    return SEED_ITEMS;
  });

  const [notifications, setNotifications] = useState<StatusNotification[]>(() => {
    const localNotifs = localStorage.getItem('inventory_notifications');
    if (localNotifs) {
      try {
        return JSON.parse(localNotifs);
      } catch (e) {
        console.error('Failed to parse notifications');
      }
    }
    return [];
  });

  // 2. Control states
  const [activeTab, setActiveTab] = useState<'dashboard' | 'list' | 'form'>('dashboard');
  const [editItem, setEditItem] = useState<ReceiptItem | null>(null);
  
  // 3. Print states
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [printPreviewItems, setPrintPreviewItems] = useState<ReceiptItem[]>([]);

  // 4. Toast notifications state
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Sync to localstorage whenever state changes
  useEffect(() => {
    localStorage.setItem('inventory_receipts', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('inventory_notifications', JSON.stringify(notifications));
  }, [notifications]);

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

  // Helper to create a persistent status notification logs entry
  const addStatusNotification = (
    itemId: string, 
    itemName: string, 
    type: 'usage' | 'work_order', 
    status: boolean, 
    message: string
  ) => {
    const notif: StatusNotification = {
      id: generateId('NOTIF'),
      itemId,
      itemName,
      type,
      status,
      message,
      timestamp: new Date().toISOString()
    };
    setNotifications((prev) => [notif, ...prev].slice(0, 50)); // Keep last 50
  };

  // Triggering toggles with immediate notifications
  const handleToggleUsed = (
    id: string, 
    disburseData?: { usedQuantity: number; withdrawerName: string; usagePurpose: string; usedDate: string; usedProject?: string | null } | null
  ) => {
    setItems((prevItems) => {
      return prevItems.map((item) => {
        if (item.id === id) {
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
          addStatusNotification(item.id, item.name, 'usage', nextStatus, msg);

          return {
            ...item,
            isUsed: nextStatus,
            usedDate: today,
            usedQuantity: usedQty,
            withdrawerName: withdrawer,
            usagePurpose: purpose,
            usedProject: uProj
          };
        }
        return item;
      });
    });
  };

  const handleToggleWorkOrder = (
    id: string, 
    workOrderData?: { workOrderNumber: string; workOrderDate: string } | null
  ) => {
    setItems((prevItems) => {
      return prevItems.map((item) => {
        if (item.id === id) {
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
          addStatusNotification(item.id, item.name, 'work_order', nextStatus, msg);

          return {
            ...item,
            isWorkOrderIssued: nextStatus,
            workOrderNumber: woNum,
            workOrderDate: woDate
          };
        }
        return item;
      });
    });
  };

  // Add / Edit save handler
  const handleSaveItem = (updatedItem: ReceiptItem) => {
    const isEditing = items.some(item => item.id === updatedItem.id);
    
    if (isEditing) {
      setItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
      triggerToast(`แก้ไขรายการ "${updatedItem.name}" เรียบร้อยแล้ว`, 'success');
    } else {
      setItems(prev => [updatedItem, ...prev]);
      triggerToast(`บันทึกรับของ "${updatedItem.name}" เข้าคลังสำเร็จ`, 'success');
    }

    // Reset editing state and redirect
    setEditItem(null);
    setActiveTab('list');
  };

  const handleEditClick = (item: ReceiptItem) => {
    setEditItem(item);
    setActiveTab('form');
  };

  const handleDeleteItem = (id: string) => {
    const itemToDelete = items.find(item => item.id === id);
    if (!itemToDelete) return;

    const isUsed = itemToDelete.isUsed;
    const confirmMsg = isUsed 
      ? `แจ้งเตือน: รายการ "${itemToDelete.name}" มีการบันทึกเบิกจ่ายใช้งานแล้ว!\nคุณแน่ใจหรือไม่ที่จะลบรายการนี้ออกจากระบบคลังสินค้าถาวร?`
      : `คุณแน่ใจหรือไม่ที่จะลบรายการ "${itemToDelete.name}" ออกจากคลัง?`;

    if (window.confirm(confirmMsg)) {
      setItems(prev => prev.filter(item => item.id !== id));
      triggerToast(`ลบรายการ "${itemToDelete.name}" ออกแล้ว`, 'warning');
      
      // Clean corresponding notifications
      setNotifications(prev => prev.filter(n => n.itemId !== id));
    }
  };

  const handleDeleteMultipleItems = (ids: string[]) => {
    if (ids.length === 0) return;
    
    // Check if any of these are already used
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
      setItems(prev => prev.filter(item => !ids.includes(item.id)));
      triggerToast(`ลบรายการที่เลือกจำนวน ${selectedItems.length} รายการเรียบร้อยแล้ว`, 'warning');
      setNotifications(prev => prev.filter(n => !ids.includes(n.itemId)));
    }
  };

  // Triggering the custom PDF Print layout preview
  const handleOpenPrintPreview = (selected: ReceiptItem[]) => {
    setPrintPreviewItems(selected);
    setShowPrintPreview(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans transition-colors duration-300" id="main-applet-shell">
      
      {/* Top Professional Navigation Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-40" id="main-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            
            {/* Brand Logo & Offline indicator */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500 rounded-xl text-slate-950 shadow-md flex items-center justify-center">
                <ClipboardList size={22} className="stroke-[2.5]" />
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-sans tracking-tight">
                  ระบบบันทึกรับของและใบงาน
                </h1>
                {/* Offline Status indicator badge */}
                <div className="flex items-center gap-1 mt-0.5 text-[10px] text-slate-400 dark:text-slate-500 font-mono font-bold uppercase">
                  <WifiOff size={10} className="text-slate-500 animate-pulse" />
                  <span>ใช้งานออฟไลน์ท้องถิ่น</span>
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

            {/* Right Account display info */}
            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400" id="user-profile-badge">
              <div className="hidden sm:block text-right">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">เจ้าหน้าที่ระบบ</p>
                <p className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-200">ubsine02011989@gmail.com</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
                <User size={16} />
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8" id="main-content-section">
        {activeTab === 'dashboard' && (
          <Dashboard 
            items={items} 
            notifications={notifications}
            onClearNotifications={() => setNotifications([])}
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
      </main>

      {/* Footer System Details */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 py-6 text-center text-xs text-slate-400" id="main-footer">
        <p>© 2026 ระบบจัดการรับของและใบงานช่างแบบออฟไลน์ • ubsine02011989</p>
        <p className="text-[10px] text-slate-500 mt-1">ข้อมูลถูกจัดเก็บไว้อย่างปลอดภัยและด่วนที่สุดในเว็บเบราว์เซอร์ของคุณ (Local Storage) ทำให้คุณสามารถทำงานต่อได้แม้ไม่มีเครือข่ายอินเทอร์เน็ต</p>
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
