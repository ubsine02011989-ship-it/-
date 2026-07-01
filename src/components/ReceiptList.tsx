/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Trash2, 
  Edit, 
  FileSpreadsheet, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Hammer, 
  Zap, 
  Droplet, 
  Wrench, 
  Cpu, 
  FileCheck, 
  Package, 
  SlidersHorizontal,
  ChevronDown,
  Printer,
  PlusCircle,
  Clock
} from 'lucide-react';
import { ReceiptItem } from '../types';
import { formatCurrency, formatThaiDate, exportToCSV, CATEGORY_PRESETS } from '../utils/helpers';

interface ReceiptListProps {
  items: ReceiptItem[];
  onEdit: (item: ReceiptItem) => void;
  onDelete: (id: string) => void;
  onDeleteMultiple: (ids: string[]) => void;
  onToggleUsed: (
    id: string, 
    disburseData?: { usedQuantity: number; withdrawerName: string; usagePurpose: string; usedDate: string; usedProject?: string | null } | null
  ) => void;
  onToggleWorkOrder: (
    id: string,
    workOrderData?: { workOrderNumber: string; workOrderDate: string } | null
  ) => void;
  onNavigateToForm: () => void;
  onOpenPrintPreview: (selectedItems: ReceiptItem[]) => void;
}

export default function ReceiptList({ 
  items, 
  onEdit, 
  onDelete, 
  onDeleteMultiple,
  onToggleUsed, 
  onToggleWorkOrder,
  onNavigateToForm,
  onOpenPrintPreview
}: ReceiptListProps) {
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const [selectedProject, setSelectedProject] = useState('ทั้งหมด');
  const [usedFilter, setUsedFilter] = useState('ทั้งหมด'); // ทั้งหมด, นำไปใช้แล้ว, ยังไม่ได้นำไปใช้
  const [workOrderFilter, setWorkOrderFilter] = useState('ทั้งหมด'); // ทั้งหมด, ออกใบงานแล้ว, ยังไม่ออกใบงาน
  
  // Disbursement / Withdrawal modal state
  const [disburseItem, setDisburseItem] = useState<ReceiptItem | null>(null);
  const [disburseQty, setDisburseQty] = useState<number>(1);
  const [disburseWithdrawer, setDisburseWithdrawer] = useState<string>('');
  const [disbursePurpose, setDisbursePurpose] = useState<string>('');
  const [disburseDate, setDisburseDate] = useState<string>('');
  const [disburseProject, setDisburseProject] = useState<string>('');

  // Sync modal states with selected disburseItem
  React.useEffect(() => {
    if (disburseItem) {
      setDisburseQty(disburseItem.usedQuantity || disburseItem.quantity);
      setDisburseWithdrawer(disburseItem.withdrawerName || '');
      setDisbursePurpose(disburseItem.usagePurpose || '');
      setDisburseDate(disburseItem.usedDate || new Date().toISOString().substring(0, 10));
      setDisburseProject(disburseItem.usedProject || '');
    }
  }, [disburseItem]);

  const handleToggleUsedClick = (item: ReceiptItem) => {
    setDisburseItem(item);
  };

  const handleConfirmDisbursement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disburseItem) return;
    if (disburseQty <= 0) {
      alert('กรุณาระบุจำนวนที่นำออกไปใช้งานอย่างน้อย 1 หน่วย');
      return;
    }
    if (disburseQty > disburseItem.quantity) {
      alert(`จำนวนที่นำออกไปใช้งานต้องไม่เกินจำนวนที่มีอยู่ (${disburseItem.quantity} หน่วย)`);
      return;
    }
    if (!disburseDate) {
      alert('กรุณาระบุวันที่นำออกไปใช้งาน');
      return;
    }

    onToggleUsed(disburseItem.id, {
      usedQuantity: Number(disburseQty),
      withdrawerName: disburseWithdrawer.trim(),
      usagePurpose: disbursePurpose.trim(),
      usedDate: disburseDate,
      usedProject: disburseProject.trim() || null
    });
    setDisburseItem(null);
  };

  const handleCancelDisbursement = () => {
    if (!disburseItem) return;
    if (window.confirm('คุณต้องการยกเลิกการนำออกไปใช้งานรายการนี้ และนำกลับเข้าคลังใช่หรือไม่?')) {
      onToggleUsed(disburseItem.id, null);
      setDisburseItem(null);
    }
  };

  // Work Order modal state
  const [workOrderItem, setWorkOrderItem] = useState<ReceiptItem | null>(null);
  const [woNumber, setWoNumber] = useState<string>('');
  const [woDate, setWoDate] = useState<string>('');

  // Sync modal states with selected workOrderItem
  React.useEffect(() => {
    if (workOrderItem) {
      if (workOrderItem.isWorkOrderIssued && workOrderItem.workOrderNumber) {
        setWoNumber(workOrderItem.workOrderNumber);
        setWoDate(workOrderItem.workOrderDate || new Date().toISOString().substring(0, 10));
      } else {
        const prefix = workOrderItem.receiveDate.replace(/-/g, '').substring(0, 6);
        const generatedWoNum = `WO-${prefix}-${Math.floor(100 + Math.random() * 900)}`;
        setWoNumber(generatedWoNum);
        setWoDate(new Date().toISOString().substring(0, 10));
      }
    }
  }, [workOrderItem]);

  const handleToggleWorkOrderClick = (item: ReceiptItem) => {
    setWorkOrderItem(item);
  };

  const handleConfirmWorkOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workOrderItem) return;
    if (!woNumber.trim()) {
      alert('กรุณาระบุเลขที่ใบงาน');
      return;
    }
    if (!woDate) {
      alert('กรุณาระบุวันที่ออกใบงาน');
      return;
    }

    onToggleWorkOrder(workOrderItem.id, {
      workOrderNumber: woNumber.trim(),
      workOrderDate: woDate
    });
    setWorkOrderItem(null);
  };

  const handleCancelWorkOrder = () => {
    if (!workOrderItem) return;
    if (window.confirm('คุณต้องการยกเลิกการออกใบงานช่างรายการนี้ใช่หรือไม่?')) {
      onToggleWorkOrder(workOrderItem.id, null);
      setWorkOrderItem(null);
    }
  };

  // Multi-selection state for batch action (Print PDF or Export)
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

  // Available categories list for filter dropdown
  const categoriesList = useMemo(() => {
    const list = new Set(items.map(item => item.category));
    return ['ทั้งหมด', ...Array.from(list)];
  }, [items]);

  // Available projects list for filter dropdown
  const projectsList = useMemo(() => {
    const list = new Set(items.map(item => item.project?.trim()).filter(Boolean));
    return ['ทั้งหมด', 'ไม่ได้ระบุโครงการ', ...Array.from(list)];
  }, [items]);

  // Filtering Logic
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // 1. Search query
      const matchQuery = 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.notes || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.project || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.workOrderNumber || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      // 2. Category filter
      const matchCategory = selectedCategory === 'ทั้งหมด' || item.category === selectedCategory;

      // 2.5 Project filter
      const matchProject = 
        selectedProject === 'ทั้งหมด' || 
        (selectedProject === 'ไม่ได้ระบุโครงการ' && !item.project) ||
        item.project === selectedProject;

      // 3. Usage filter
      const matchUsage = 
        usedFilter === 'ทั้งหมด' || 
        (usedFilter === 'นำไปใช้แล้ว' && item.isUsed) || 
        (usedFilter === 'ยังไม่ได้นำไปใช้' && !item.isUsed);

      // 4. Work order filter
      const matchWorkOrder = 
        workOrderFilter === 'ทั้งหมด' || 
        (workOrderFilter === 'ออกใบงานแล้ว' && item.isWorkOrderIssued) || 
        (workOrderFilter === 'ยังไม่ออกใบงาน' && !item.isWorkOrderIssued);

      return matchQuery && matchCategory && matchProject && matchUsage && matchWorkOrder;
    });
  }, [items, searchQuery, selectedCategory, selectedProject, usedFilter, workOrderFilter]);

  // Handle Select All Checkboxes
  const isAllSelected = filteredItems.length > 0 && selectedItemIds.size === filteredItems.length;
  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(filteredItems.map(item => item.id)));
    }
  };

  const handleSelectItem = (id: string) => {
    const next = new Set(selectedItemIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedItemIds(next);
  };

  // Batch Export selected to Excel/CSV
  const handleBatchExportCSV = () => {
    const itemsToExport = items.filter(item => 
      selectedItemIds.size > 0 ? selectedItemIds.has(item.id) : filteredItems.includes(item)
    );
    if (itemsToExport.length === 0) {
      alert('ไม่มีข้อมูลที่จะส่งออก');
      return;
    }
    exportToCSV(itemsToExport, `receipt_report_${new Date().toISOString().substring(0, 10)}.csv`);
  };

  // Batch Print PDF
  const handleBatchPrintPDF = () => {
    const itemsToPrint = items.filter(item => 
      selectedItemIds.size > 0 ? selectedItemIds.has(item.id) : filteredItems.includes(item)
    );
    if (itemsToPrint.length === 0) {
      alert('โปรดเลือกรายการที่ต้องการพิมพ์ใบงานหรือจัดทำ PDF');
      return;
    }
    onOpenPrintPreview(itemsToPrint);
  };

  // Batch Delete Items
  const handleBatchDelete = () => {
    if (selectedItemIds.size === 0) return;
    onDeleteMultiple(Array.from(selectedItemIds));
    setSelectedItemIds(new Set());
  };

  // Helper to render Category Avatar
  const renderCategoryAvatar = (item: ReceiptItem) => {
    if (item.imageUrl) {
      return (
        <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-100 flex-shrink-0" id={`avatar-${item.id}`}>
          <img 
            src={item.imageUrl} 
            alt={item.name} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      );
    }

    // Default icon selector based on Thai category
    const presetKey = Object.keys(CATEGORY_PRESETS).find(
      key => CATEGORY_PRESETS[key].label === item.category
    ) || 'other';
    const preset = CATEGORY_PRESETS[presetKey];

    const getIconElement = () => {
      switch (presetKey) {
        case 'materials': return <Hammer size={16} />;
        case 'electrical': return <Zap size={16} />;
        case 'plumbing': return <Droplet size={16} />;
        case 'tools': return <Wrench size={16} />;
        case 'electronics': return <Cpu size={16} />;
        case 'office': return <FileText size={16} />;
        default: return <Package size={16} />;
      }
    };

    return (
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${preset.bg} ${preset.text}`} id={`avatar-${item.id}`}>
        {getIconElement()}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in" id="receipt-list-view">
      
      {/* Search and Filters Bento Grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4" id="filters-bento-card">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4" id="search-bar-row">
          {/* Quick Search */}
          <div className="relative flex-1" id="search-input-wrapper">
            <input 
              id="search-input"
              type="text"
              placeholder="ค้นหาด่วนตามชื่อรายการ, รหัส, หมายเหตุ หรือเลขใบงาน..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 dark:text-white placeholder:text-slate-400"
            />
            <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
          </div>

          {/* Action buttons (Export/Print/Add) */}
          <div className="flex flex-wrap gap-2.5" id="list-batch-actions">
            {selectedItemIds.size > 0 && (
              <>
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40 px-3 py-2.5 rounded-xl flex items-center justify-center">
                  เลือกอยู่ {selectedItemIds.size} รายการ
                </span>
                <button
                  id="btn-delete-selected"
                  onClick={handleBatchDelete}
                  className="flex-1 sm:flex-initial bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40 font-semibold px-4 py-2.5 rounded-xl transition duration-150 text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  title="ลบรายการที่เลือกออกทั้งหมด"
                >
                  <Trash2 size={15} />
                  ลบที่เลือก ({selectedItemIds.size})
                </button>
              </>
            )}
            
            <button
              id="btn-export-excel"
              onClick={handleBatchExportCSV}
              className="flex-1 sm:flex-initial bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-semibold px-4 py-2.5 rounded-xl transition duration-150 text-xs flex items-center justify-center gap-1.5"
              title="ส่งออกรายการทั้งหมดเป็นไฟล์ Excel (.csv รองรับภาษาไทย)"
            >
              <FileSpreadsheet size={15} className="text-emerald-500" />
              ส่งออก Excel
            </button>

            <button
              id="btn-export-pdf"
              onClick={handleBatchPrintPDF}
              className="flex-1 sm:flex-initial bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-semibold px-4 py-2.5 rounded-xl transition duration-150 text-xs flex items-center justify-center gap-1.5"
              title="เลือกและสั่งพิมพ์ใบงานเป็น PDF (แนะนำให้กดเลือกแถวที่ต้องการพิมพ์ก่อน)"
            >
              <Printer size={15} className="text-blue-500" />
              พิมพ์ใบงาน / PDF
            </button>

            <button
              id="btn-navigate-form"
              onClick={onNavigateToForm}
              className="flex-1 sm:flex-initial bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl transition duration-150 text-xs flex items-center justify-center gap-1.5 shadow-sm"
            >
              <PlusCircle size={15} />
              เพิ่มรายการรับของ
            </button>
          </div>
        </div>

        {/* Filter Selection Panel */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 border-t border-slate-100 dark:border-slate-800 pt-4" id="advanced-filters-row">
          {/* Category Selector */}
          <div className="space-y-1.5" id="filter-col-category">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">กรองตามหมวดหมู่</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-white"
            >
              {categoriesList.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Project Selector */}
          <div className="space-y-1.5" id="filter-col-project">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">กรองตามโครงการ / แผนก</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-white"
            >
              {projectsList.map(proj => (
                <option key={proj} value={proj}>{proj === 'ทั้งหมด' ? 'ทั้งหมด (โครงการ)' : proj}</option>
              ))}
            </select>
          </div>

          {/* Usage Selector */}
          <div className="space-y-1.5" id="filter-col-usage">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">กรองสถานะการใช้งาน</label>
            <select
              value={usedFilter}
              onChange={(e) => setUsedFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-white"
            >
              <option value="ทั้งหมด">ทั้งหมด (สถานะใช้งาน)</option>
              <option value="นำไปใช้แล้ว">นำไปใช้แล้ว</option>
              <option value="ยังไม่ได้นำไปใช้">ยังไม่ได้นำไปใช้</option>
            </select>
          </div>

          {/* Work Order Selector */}
          <div className="space-y-1.5" id="filter-col-workorder">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">กรองสถานะการออกใบงาน</label>
            <select
              value={workOrderFilter}
              onChange={(e) => setWorkOrderFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-white"
            >
              <option value="ทั้งหมด">ทั้งหมด (สถานะใบงาน)</option>
              <option value="ออกใบงานแล้ว">ออกใบงานแล้ว</option>
              <option value="ยังไม่ออกใบงาน">ยังไม่ออกใบงาน</option>
            </select>
          </div>
        </div>
      </div>

      {/* Receipts Table Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden" id="receipts-list-results">
        
        {/* Results Info Bar */}
        <div className="bg-slate-50/50 dark:bg-slate-800/20 px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500" id="results-meta-bar">
          <div>
            <span>แสดงทั้งหมด </span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{filteredItems.length} รายการ</span>
            {filteredItems.length !== items.length && (
              <span> (จากทั้งหมด {items.length} รายการ)</span>
            )}
          </div>
          {selectedItemIds.size > 0 && (
            <button 
              id="btn-clear-selection"
              onClick={() => setSelectedItemIds(new Set())}
              className="text-emerald-600 hover:underline font-semibold"
            >
              ล้างการเลือก
            </button>
          )}
        </div>

        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3 text-center px-4" id="list-empty-state">
            <Package size={44} className="text-slate-300 stroke-1" />
            <p className="text-sm font-sans font-medium text-slate-700 dark:text-slate-300">ไม่พบข้อมูลตามเงื่อนไขที่ค้นหา</p>
            <p className="text-xs text-slate-400 max-w-sm">โปรดตรวจเช็คคำค้นหา หรือกดล้างตัวกรองเพื่อเรียกดูรายการสินค้าใหม่ทั้งหมด</p>
            <button 
              id="btn-reset-filters"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ทั้งหมด');
                setSelectedProject('ทั้งหมด');
                setUsedFilter('ทั้งหมด');
                setWorkOrderFilter('ทั้งหมด');
              }}
              className="mt-2 text-xs font-semibold text-emerald-600 hover:underline"
            >
              ล้างค่าตัวกรองทั้งหมด
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto w-full" id="table-scroll-wrapper">
              {/* Desktop Table Layout */}
              <table className="w-full text-left border-collapse min-w-[1000px] hidden md:table" id="receipts-data-table">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {/* Multiselect Checkbox */}
                  <th className="py-3 px-4 w-10 text-center">
                    <input 
                      type="checkbox" 
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/30 w-4 h-4 cursor-pointer"
                      id="checkbox-select-all"
                    />
                  </th>
                  <th className="py-3 px-4">รูปสินค้า & รหัส</th>
                  <th className="py-3 px-4">ชื่อรายการ</th>
                  <th className="py-3 px-4">หมวดหมู่</th>
                  <th className="py-3 px-4 text-right">ราคาต่อหน่วย</th>
                  <th className="py-3 px-4 text-center">จำนวน</th>
                  <th className="py-3 px-4 text-right">ราคารวม</th>
                  <th className="py-3 px-4">วันที่รับของ</th>
                  <th className="py-3 px-4 text-center">นำไปใช้หรือยัง</th>
                  <th className="py-3 px-4 text-center">ออกใบงานแล้วหรือยัง</th>
                  <th className="py-3 px-4 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {filteredItems.map((item) => {
                  const isChecked = selectedItemIds.has(item.id);
                  return (
                    <tr 
                      key={item.id} 
                      id={`row-${item.id}`}
                      className={`hover:bg-slate-50/40 dark:hover:bg-slate-800/10 transition-colors ${
                        isChecked ? 'bg-emerald-50/10 dark:bg-emerald-950/10' : ''
                      }`}
                    >
                      {/* Checkbox select */}
                      <td className="py-3.5 px-4 text-center">
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={() => handleSelectItem(item.id)}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/30 w-4 h-4 cursor-pointer"
                          id={`checkbox-${item.id}`}
                        />
                      </td>

                      {/* Image & ID */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {renderCategoryAvatar(item)}
                          <span className="font-mono text-[10px] text-slate-400 font-bold block">{item.id}</span>
                        </div>
                      </td>

                      {/* Name & Notes tooltip */}
                      <td className="py-3.5 px-4 max-w-[200px]">
                        <p className="font-semibold text-slate-800 dark:text-slate-200 truncate" title={item.name}>
                          {item.name}
                        </p>
                        <div className="flex flex-col gap-0.5">
                          {item.project && (
                            <span className="inline-flex items-center gap-1 text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">
                              📁 {item.project}
                            </span>
                          )}
                          {item.notes && (
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate" title={item.notes}>
                              {item.notes}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                        {item.category}
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4 text-right font-mono text-slate-700 dark:text-slate-300">
                        {formatCurrency(item.price)}
                      </td>

                      {/* Quantity */}
                      <td className="py-3.5 px-4 text-center font-mono font-semibold text-slate-800 dark:text-white">
                        {item.quantity.toLocaleString()}
                      </td>

                      {/* Total Price */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-emerald-400">
                        <div>{formatCurrency(item.totalPrice)}</div>
                        {item.workOrderPrice !== undefined && item.workOrderPrice !== null && (
                          <div className="text-[10px] text-amber-600 dark:text-amber-400 font-sans font-medium mt-0.5" title="ราคาส่งงาน">
                            ส่งงาน: {formatCurrency(item.workOrderPrice)}
                          </div>
                        )}
                      </td>

                      {/* Receive Date */}
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-mono whitespace-nowrap">
                        {formatThaiDate(item.receiveDate)}
                      </td>

                      {/* Usage Interactive Toggle Status */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          id={`toggle-row-used-${item.id}`}
                          onClick={() => handleToggleUsedClick(item)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all duration-200 shadow-sm cursor-pointer border ${
                            item.isUsed 
                              ? 'bg-purple-100 border-purple-200 text-purple-700 dark:bg-purple-950 dark:border-purple-900 dark:text-purple-300' 
                              : 'bg-slate-50 border-slate-200 text-slate-400 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-500'
                          }`}
                          title="คลิกเพื่อบันทึกการนำออกไปใช้งาน / เบิกพัสดุ"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${item.isUsed ? 'bg-purple-500 animate-pulse' : 'bg-slate-400'}`}></span>
                          {item.isUsed ? 'นำออกไปใช้งานแล้ว' : 'ยังไม่ใช้'}
                        </button>
                        {item.isUsed && (
                          <div className="mt-1 space-y-0.5 text-center text-[9px] text-slate-500 leading-tight">
                            {item.usedQuantity && (
                              <p className="font-semibold text-purple-600 dark:text-purple-400">
                                เบิก: {item.usedQuantity.toLocaleString()} หน่วย
                              </p>
                            )}
                            {item.withdrawerName && (
                              <p className="text-slate-600 dark:text-slate-400">
                                โดย: {item.withdrawerName}
                              </p>
                            )}
                            {item.usedProject && (
                              <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold">
                                โครงการ: {item.usedProject}
                              </p>
                            )}
                            {item.usedDate && (
                              <p className="text-[8px] font-mono text-slate-400">
                                {formatThaiDate(item.usedDate)}
                              </p>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Work Order Interactive Toggle Status */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          id={`toggle-row-wo-${item.id}`}
                          onClick={() => handleToggleWorkOrderClick(item)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all duration-200 shadow-sm cursor-pointer border ${
                            item.isWorkOrderIssued 
                              ? 'bg-amber-100 border-amber-200 text-amber-850 dark:bg-amber-950 dark:border-amber-900 dark:text-amber-300' 
                              : 'bg-slate-50 border-slate-200 text-slate-400 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-500'
                          }`}
                          title="คลิกเพื่อระบุ/แก้ไขเลขที่ใบงานช่าง"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${item.isWorkOrderIssued ? 'bg-amber-500 animate-pulse' : 'bg-slate-400'}`}></span>
                          {item.isWorkOrderIssued ? 'ออกใบงานแล้ว' : 'ยังไม่ออก'}
                        </button>
                        {item.isWorkOrderIssued && item.workOrderNumber && (
                          <span className="block text-[8px] text-amber-600 dark:text-amber-400 font-mono mt-1 font-semibold truncate max-w-[100px]" title={item.workOrderNumber}>
                            {item.workOrderNumber}
                          </span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5" id={`actions-${item.id}`}>
                          <button
                            id={`btn-print-${item.id}`}
                            onClick={() => onOpenPrintPreview([item])}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-emerald-600 hover:text-emerald-750 bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/30 rounded-lg transition"
                            title="พิมพ์ใบงาน PDF"
                          >
                            <Printer size={13} />
                            <span>พิมพ์ใบงาน</span>
                          </button>
                          <button
                            id={`btn-edit-${item.id}`}
                            onClick={() => onEdit(item)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-950/40 border border-blue-100 dark:border-blue-900/30 rounded-lg transition"
                            title="แก้ไขข้อมูล"
                          >
                            <Edit size={13} />
                            <span>แก้ไข</span>
                          </button>
                          <button
                            id={`btn-delete-${item.id}`}
                            onClick={() => onDelete(item.id)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 border border-red-100 dark:border-red-900/30 rounded-lg transition"
                            title="ลบรายการ"
                          >
                            <Trash2 size={13} />
                            <span>ลบ</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards Layout */}
          <div className="grid grid-cols-1 gap-4 p-4 md:hidden" id="receipts-mobile-cards">
              {filteredItems.map((item) => {
                const isChecked = selectedItemIds.has(item.id);
                return (
                  <div 
                    key={item.id}
                    id={`mobile-card-${item.id}`}
                    className={`p-4 rounded-xl border transition-all ${
                      isChecked 
                        ? 'bg-emerald-50/10 border-emerald-500/30' 
                        : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3" id={`mobile-header-${item.id}`}>
                      <div className="flex items-center gap-2.5">
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={() => handleSelectItem(item.id)}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/30 w-4 h-4 cursor-pointer"
                          id={`checkbox-mob-${item.id}`}
                        />
                        {renderCategoryAvatar(item)}
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{item.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {item.id} • {item.category}
                            {item.project && ` • 📁 ${item.project}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          id={`btn-mob-print-${item.id}`}
                          onClick={() => onOpenPrintPreview([item])}
                          className="inline-flex items-center gap-0.5 px-2 py-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-950/40 rounded-lg border border-emerald-100 dark:border-emerald-900/30 transition"
                          title="พิมพ์ใบงาน PDF"
                        >
                          <Printer size={11} />
                          <span>พิมพ์ใบงาน</span>
                        </button>
                        <button
                          id={`btn-mob-edit-${item.id}`}
                          onClick={() => onEdit(item)}
                          className="inline-flex items-center gap-0.5 px-2 py-1 text-[11px] font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-950/40 rounded-lg border border-blue-100 dark:border-blue-900/30 transition"
                        >
                          <Edit size={11} />
                          <span>แก้ไข</span>
                        </button>
                        <button
                          id={`btn-mob-delete-${item.id}`}
                          onClick={() => onDelete(item.id)}
                          className="inline-flex items-center gap-0.5 px-2 py-1 text-[11px] font-semibold text-red-600 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 rounded-lg border border-red-100 dark:border-red-900/30 transition"
                        >
                          <Trash2 size={11} />
                          <span>ลบ</span>
                        </button>
                      </div>
                    </div>

                    {/* Meta info block */}
                    <div className="grid grid-cols-2 gap-2 text-xs border-y border-slate-50 dark:border-slate-800/60 py-2.5 my-2.5" id={`mobile-meta-${item.id}`}>
                      <div>
                        <p className="text-slate-400 text-[10px]">ราคาต่อหน่วย</p>
                        <p className="font-mono font-medium text-slate-700 dark:text-slate-300 mt-0.5">{formatCurrency(item.price)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-[10px]">จำนวนที่รับเข้า</p>
                        <p className="font-mono font-medium text-slate-700 dark:text-slate-300 mt-0.5">{item.quantity} หน่วย</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-[10px]">ราคารวมทั้งหมด</p>
                        <p className="font-mono font-bold text-slate-900 dark:text-emerald-400 mt-0.5">{formatCurrency(item.totalPrice)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-[10px]">วันที่รับเข้าคลัง</p>
                        <p className="font-mono text-slate-600 dark:text-slate-400 mt-0.5">{formatThaiDate(item.receiveDate)}</p>
                      </div>
                    </div>

                     {/* Interactive Toggles */}
                     <div className="flex flex-wrap justify-between gap-2 pt-1 border-b border-slate-50 dark:border-slate-800/40 pb-2.5 mb-2.5" id={`mobile-toggles-${item.id}`}>
                       {/* Usage status toggle */}
                       <div className="flex items-center gap-2">
                         <span className="text-[10px] text-slate-400">การนำไปใช้:</span>
                         <button
                           type="button"
                           id={`toggle-mob-used-${item.id}`}
                           onClick={() => handleToggleUsedClick(item)}
                           className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border cursor-pointer ${
                             item.isUsed 
                               ? 'bg-purple-100 border-purple-200 text-purple-700 dark:bg-purple-950 dark:text-purple-300' 
                               : 'bg-slate-50 border-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                           }`}
                         >
                           {item.isUsed ? 'เบิกใช้แล้ว' : 'ยังไม่ใช้'}
                         </button>
                       </div>

                       {/* Work order status toggle */}
                       <div className="flex items-center gap-2">
                         <span className="text-[10px] text-slate-400">ใบงานช่าง:</span>
                         <button
                           type="button"
                           id={`toggle-mob-wo-${item.id}`}
                           onClick={() => handleToggleWorkOrderClick(item)}
                           className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border cursor-pointer ${
                             item.isWorkOrderIssued 
                               ? 'bg-amber-100 border-amber-200 text-amber-800 dark:bg-amber-950 dark:text-amber-300' 
                               : 'bg-slate-50 border-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                           }`}
                         >
                           {item.isWorkOrderIssued ? 'ออกแล้ว' : 'ยังไม่ออก'}
                         </button>
                       </div>
                     </div>

                     {/* Detailed Withdrawal Info if used */}
                     {item.isUsed && (
                       <div className="p-2.5 bg-purple-50/50 dark:bg-purple-950/20 rounded-xl text-[11px] text-slate-600 dark:text-slate-400 space-y-1 border border-purple-100/40 dark:border-purple-900/10" id={`mobile-used-info-${item.id}`}>
                         {item.usedQuantity && (
                           <p><span className="font-semibold text-purple-600 dark:text-purple-400">จำนวนที่เบิกใช้:</span> {item.usedQuantity.toLocaleString()} หน่วย</p>
                         )}
                         {item.withdrawerName && (
                           <p><span className="font-semibold">ผู้เบิกใช้งาน:</span> {item.withdrawerName}</p>
                         )}
                         {item.usagePurpose && (
                           <p><span className="font-semibold">สถานที่/วัตถุประสงค์:</span> {item.usagePurpose}</p>
                         )}
                         {item.usedDate && (
                           <p><span className="font-semibold">วันที่เบิกจ่าย:</span> {formatThaiDate(item.usedDate)}</p>
                         )}
                       </div>
                     )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* บันทึกการนำออกไปใช้งาน (Disbursement / Withdrawal Modal) */}
      {disburseItem && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in" id="disburse-modal-container">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-slide-down" id="disburse-modal-card">
            {/* Header */}
            <div className="bg-purple-600 text-white p-5 flex justify-between items-center" id="disburse-modal-header">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-white/10 rounded-lg">
                  <Package size={18} />
                </span>
                <div>
                  <h3 className="font-sans font-bold text-sm">บันทึกรายละเอียดการนำออกไปใช้งาน</h3>
                  <p className="text-[10px] text-purple-100 mt-0.5">เบิกจ่ายพัสดุพ่วงบันทึกรายชื่อผู้รับมอบ</p>
                </div>
              </div>
              <button 
                id="btn-close-disburse-modal"
                onClick={() => setDisburseItem(null)}
                className="p-1.5 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition"
              >
                <XCircle size={18} />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleConfirmDisbursement} className="p-6 space-y-4" id="disburse-form">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-1 text-xs text-slate-600 dark:text-slate-300">
                <p className="font-semibold text-slate-800 dark:text-white text-sm">{disburseItem.name}</p>
                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] font-mono">
                  <p>รหัสพัสดุ: <span className="font-bold">{disburseItem.id}</span></p>
                  <p>หมวดหมู่: <span className="font-bold">{disburseItem.category}</span></p>
                  <p>พัสดุในคลัง: <span className="font-bold text-emerald-600 dark:text-emerald-400">{disburseItem.quantity.toLocaleString()} หน่วย</span></p>
                  <p>ราคาต่อหน่วย: <span className="font-bold">{formatCurrency(disburseItem.price)}</span></p>
                </div>
              </div>

              {/* Quantity */}
              <div className="space-y-1.5" id="disburse-qty-group">
                <label htmlFor="disburse-qty" className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                  จำนวนที่นำออกไปใช้งาน (หน่วย) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input 
                    id="disburse-qty"
                    type="number"
                    min={1}
                    max={disburseItem.quantity}
                    value={disburseQty}
                    onChange={(e) => setDisburseQty(Math.min(disburseItem.quantity, Math.max(1, Number(e.target.value))))}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500/50 focus:border-purple-500 dark:text-white font-mono font-semibold"
                    required
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-sans">
                    / สูงสุด {disburseItem.quantity.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Withdrawer Name */}
              <div className="space-y-1.5" id="disburse-withdrawer-group">
                <label htmlFor="disburse-withdrawer" className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                  ผู้เบิกพัสดุ / ช่างผู้มารับพัสดุ <span className="text-red-500">*</span>
                </label>
                <input 
                  id="disburse-withdrawer"
                  type="text"
                  placeholder="เช่น ช่างวิชัย ใจมั่น, คุณนพดล แผนกไอที"
                  value={disburseWithdrawer}
                  onChange={(e) => setDisburseWithdrawer(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500/50 focus:border-purple-500 dark:text-white"
                  required
                />
              </div>

              {/* Used Project */}
              <div className="space-y-1.5" id="disburse-project-group">
                <label htmlFor="disburse-project" className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                  ใช้โครงการ
                </label>
                <input 
                  id="disburse-project"
                  type="text"
                  placeholder="เช่น โครงการปรับปรุงอาคารเรียน (ถ้ามี)"
                  value={disburseProject}
                  onChange={(e) => setDisburseProject(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500/50 focus:border-purple-500 dark:text-white"
                />
              </div>

              {/* Objective/Location */}
              <div className="space-y-1.5" id="disburse-purpose-group">
                <label htmlFor="disburse-purpose" className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                  วัตถุประสงค์
                </label>
                <input 
                  id="disburse-purpose"
                  type="text"
                  placeholder="เช่น ติดตั้งแอร์ชั้น 2 อาคารอำนวยการ, ซ่อมทางเดินเท้า"
                  value={disbursePurpose}
                  onChange={(e) => setDisbursePurpose(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500/50 focus:border-purple-500 dark:text-white"
                />
              </div>

              {/* Date */}
              <div className="space-y-1.5" id="disburse-date-group">
                <label htmlFor="disburse-date" className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                  วันที่นำออกไปใช้งาน <span className="text-red-500">*</span>
                </label>
                <input 
                  id="disburse-date"
                  type="date"
                  value={disburseDate}
                  onChange={(e) => setDisburseDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500/50 focus:border-purple-500 dark:text-white"
                  required
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-end pt-4 border-t border-slate-100 dark:border-slate-800" id="disburse-actions">
                {disburseItem.isUsed && (
                  <button 
                    type="button"
                    id="btn-return-stock"
                    onClick={handleCancelDisbursement}
                    className="mr-auto px-3.5 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition border border-red-200 dark:border-red-900/30 cursor-pointer"
                  >
                    คืนคลัง (ยกเลิกเบิก)
                  </button>
                )}
                <button 
                  type="button"
                  id="btn-cancel-disburse"
                  onClick={() => setDisburseItem(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button 
                  type="submit"
                  id="btn-confirm-disburse"
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2 rounded-xl transition text-xs shadow-md cursor-pointer"
                >
                  ยืนยันนำออกไปใช้งาน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* บันทึกการออกใบงานช่าง (Work Order Modal) */}
      {workOrderItem && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in" id="workorder-modal-container">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-slide-down" id="workorder-modal-card">
            {/* Header */}
            <div className="bg-amber-500 text-white p-5 flex justify-between items-center" id="workorder-modal-header">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-white/10 rounded-lg">
                  <FileCheck size={18} />
                </span>
                <div>
                  <h3 className="font-sans font-bold text-sm">ระบุเลขที่ใบงานที่ออกแล้ว</h3>
                  <p className="text-[10px] text-amber-50 mt-0.5">ระบุรหัสและรายละเอียดใบงานช่างสำหรับการติดตั้ง/ซ่อมบำรุง</p>
                </div>
              </div>
              <button 
                id="btn-close-workorder-modal"
                onClick={() => setWorkOrderItem(null)}
                className="p-1.5 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition"
              >
                <XCircle size={18} />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleConfirmWorkOrder} className="p-6 space-y-4" id="workorder-form">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-1 text-xs text-slate-600 dark:text-slate-300">
                <p className="font-semibold text-slate-800 dark:text-white text-sm">{workOrderItem.name}</p>
                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] font-mono">
                  <p>รหัสพัสดุ: <span className="font-bold">{workOrderItem.id}</span></p>
                  <p>หมวดหมู่: <span className="font-bold">{workOrderItem.category}</span></p>
                  <p>จำนวนในคลัง: <span className="font-bold text-emerald-600 dark:text-emerald-400">{workOrderItem.quantity.toLocaleString()} หน่วย</span></p>
                  <p>ราคาต่อหน่วย: <span className="font-bold">{formatCurrency(workOrderItem.price)}</span></p>
                </div>
              </div>

              {/* Work Order Number */}
              <div className="space-y-1.5" id="workorder-number-group">
                <label htmlFor="workorder-number-input" className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                  เลขที่ใบงาน <span className="text-red-500">*</span>
                </label>
                <input 
                  id="workorder-number-input"
                  type="text"
                  placeholder="เช่น WO-202606-258"
                  value={woNumber}
                  onChange={(e) => setWoNumber(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500 dark:text-white font-mono font-semibold"
                  required
                />
              </div>

              {/* Work Order Date */}
              <div className="space-y-1.5" id="workorder-date-group">
                <label htmlFor="workorder-date-input" className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                  วันที่ออกใบงาน <span className="text-red-500">*</span>
                </label>
                <input 
                  id="workorder-date-input"
                  type="date"
                  value={woDate}
                  onChange={(e) => setWoDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500 dark:text-white"
                  required
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-end pt-4 border-t border-slate-100 dark:border-slate-800" id="workorder-actions">
                {workOrderItem.isWorkOrderIssued && (
                  <button 
                    type="button"
                    id="btn-cancel-workorder-issued"
                    onClick={handleCancelWorkOrder}
                    className="mr-auto px-3.5 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition border border-red-200 dark:border-red-900/30 cursor-pointer"
                  >
                    ยกเลิกใบงานช่าง
                  </button>
                )}
                <button 
                  type="button"
                  id="btn-close-workorder"
                  onClick={() => setWorkOrderItem(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button 
                  type="submit"
                  id="btn-confirm-workorder"
                  className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-4 py-2 rounded-xl transition text-xs shadow-md cursor-pointer"
                >
                  บันทึกข้อมูลใบงาน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
