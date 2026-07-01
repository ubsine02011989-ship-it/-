/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Save, 
  X, 
  Upload, 
  Sparkles, 
  Hammer, 
  Zap, 
  Droplet, 
  Wrench, 
  Cpu, 
  FileText, 
  Package, 
  Check, 
  Calendar,
  DollarSign
} from 'lucide-react';
import { ReceiptItem } from '../types';
import { generateId, CATEGORY_PRESETS } from '../utils/helpers';

interface ReceiptFormProps {
  editItem?: ReceiptItem | null;
  onSave: (item: ReceiptItem) => void;
  onCancel: () => void;
}

export default function ReceiptForm({ editItem, onSave, onCancel }: ReceiptFormProps) {
  // State variables matching ReceiptItem properties
  const [name, setName] = useState('');
  const [category, setCategory] = useState('วัสดุก่อสร้าง');
  const [price, setPrice] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [receiveDate, setReceiveDate] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isUsed, setIsUsed] = useState(false);
  const [usedDate, setUsedDate] = useState('');
  const [usedQuantity, setUsedQuantity] = useState<number>(1);
  const [withdrawerName, setWithdrawerName] = useState('');
  const [usagePurpose, setUsagePurpose] = useState('');
  const [isWorkOrderIssued, setIsWorkOrderIssued] = useState(false);
  const [workOrderNumber, setWorkOrderNumber] = useState('');
  const [workOrderDate, setWorkOrderDate] = useState('');
  const [notes, setNotes] = useState('');
  const [project, setProject] = useState('');
  const [workOrderPrice, setWorkOrderPrice] = useState<number | ''>('');
  const [usedProject, setUsedProject] = useState('');

  // Drag and drop state
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load standard categories from helper
  const categoriesList = Object.values(CATEGORY_PRESETS).map(c => c.label);

  // Set default form values
  useEffect(() => {
    if (editItem) {
      setName(editItem.name);
      setCategory(editItem.category);
      setPrice(editItem.price);
      setQuantity(editItem.quantity);
      setReceiveDate(editItem.receiveDate);
      setImageUrl(editItem.imageUrl || '');
      setIsUsed(editItem.isUsed);
      setUsedDate(editItem.usedDate || '');
      setUsedQuantity(editItem.usedQuantity || editItem.quantity || 1);
      setWithdrawerName(editItem.withdrawerName || '');
      setUsagePurpose(editItem.usagePurpose || '');
      setUsedProject(editItem.usedProject || '');
      setIsWorkOrderIssued(editItem.isWorkOrderIssued);
      setWorkOrderNumber(editItem.workOrderNumber || '');
      setWorkOrderDate(editItem.workOrderDate || '');
      setNotes(editItem.notes || '');
      setProject(editItem.project || '');
      setWorkOrderPrice(editItem.workOrderPrice !== undefined && editItem.workOrderPrice !== null ? editItem.workOrderPrice : '');
    } else {
      // Set receiveDate to current date in YYYY-MM-DD
      const todayStr = new Date().toISOString().substring(0, 10);
      setName('');
      setCategory('วัสดุก่อสร้าง');
      setPrice(0);
      setQuantity(1);
      setReceiveDate(todayStr);
      setImageUrl('');
      setIsUsed(false);
      setUsedDate('');
      setUsedQuantity(1);
      setWithdrawerName('');
      setUsagePurpose('');
      setUsedProject('');
      setIsWorkOrderIssued(false);
      setWorkOrderNumber('');
      setWorkOrderDate('');
      setNotes('');
      setProject('');
      setWorkOrderPrice('');
    }
  }, [editItem]);

  // Keep usedQuantity in sync with quantity for new items
  useEffect(() => {
    if (!editItem) {
      setUsedQuantity(quantity);
    }
  }, [quantity, editItem]);

  // Handle auto-calculating Work Order fields
  useEffect(() => {
    if (isWorkOrderIssued && !workOrderNumber && !editItem) {
      // Auto-generate a dummy Work Order ID if toggled on in Add mode
      const monthPrefix = receiveDate.replace(/-/g, '').substring(0, 6);
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      setWorkOrderNumber(`WO-${monthPrefix}-${randomSuffix}`);
      setWorkOrderDate(receiveDate);
    }
    if (!isWorkOrderIssued) {
      setWorkOrderNumber('');
      setWorkOrderDate('');
    }
  }, [isWorkOrderIssued, receiveDate, editItem]);

  // Handle auto-calculating used date
  useEffect(() => {
    if (isUsed && !usedDate) {
      setUsedDate(new Date().toISOString().substring(0, 10));
    }
    if (!isUsed) {
      setUsedDate('');
    }
  }, [isUsed]);

  // Handle Image Upload Conversion to Base64
  const processFile = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
      return;
    }
    
    // Limit to ~2MB for LocalStorage safety
    if (file.size > 2 * 1024 * 1024) {
      alert('รูปภาพมีขนาดใหญ่เกินไป (ไม่ควรเกิน 2MB)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === 'string') {
        setImageUrl(e.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = () => {
    setImageUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      alert('กรุณากรอกชื่อรายการรับสินค้า');
      return;
    }
    if (price < 0) {
      alert('ราคาต่อหน่วยต้องไม่ต่ำกว่า 0 บาท');
      return;
    }
    if (quantity <= 0) {
      alert('จำนวนสินค้าต้องไม่ต่ำกว่า 1 หน่วย');
      return;
    }
    if (!receiveDate) {
      alert('กรุณาระบุวันที่รับของ');
      return;
    }

    if (isUsed) {
      if (usedQuantity <= 0) {
        alert('กรุณาระบุจำนวนที่นำไปใช้งานอย่างน้อย 1 หน่วย');
        return;
      }
      if (usedQuantity > quantity) {
        alert(`จำนวนที่นำไปใช้งานต้องไม่เกินจำนวนสินค้าคงคลัง (${quantity} หน่วย)`);
        return;
      }
      if (!withdrawerName.trim()) {
        alert('กรุณาระบุรายชื่อผู้เบิกพัสดุ');
        return;
      }
    }

    // Prepare complete item object
    const finalItem: ReceiptItem = {
      id: editItem ? editItem.id : generateId(),
      name: name.trim(),
      category,
      price: Number(price),
      quantity: Number(quantity),
      totalPrice: Number(price) * Number(quantity),
      receiveDate,
      imageUrl,
      isUsed,
      usedDate: isUsed ? usedDate : null,
      usedQuantity: isUsed ? Number(usedQuantity) : null,
      withdrawerName: isUsed ? withdrawerName.trim() || null : null,
      usagePurpose: isUsed ? usagePurpose.trim() || null : null,
      isWorkOrderIssued,
      workOrderNumber: isWorkOrderIssued ? workOrderNumber : null,
      workOrderDate: isWorkOrderIssued ? workOrderDate : null,
      notes: notes.trim() || undefined,
      project: project.trim() || null,
      workOrderPrice: workOrderPrice !== '' ? Number(workOrderPrice) : null,
      usedProject: isUsed ? (usedProject.trim() || null) : null,
    };

    onSave(finalItem);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm max-w-4xl mx-auto animate-fade-in" id="receipt-form-container">
      <div className="flex justify-between items-center pb-4 mb-6 border-b border-slate-100 dark:border-slate-800" id="receipt-form-header">
        <div>
          <h3 className="text-lg font-sans font-bold text-slate-900 dark:text-white" id="form-title">
            {editItem ? 'แก้ไขรายการรับของ' : 'บันทึกรายการรับของราคา'}
          </h3>
          <p className="text-xs text-slate-400 mt-1" id="form-subtitle">
            กรอกรายละเอียดข้อมูลการรับของ ราคาขาย และสถานะงานใบสั่งงาน
          </p>
        </div>
        <button 
          id="btn-form-close"
          onClick={onCancel}
          className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition duration-150"
        >
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" id="inventory-form">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="form-fields-grid">
          
          {/* Column 1: Image Upload (Interactive Drag-and-Drop) */}
          <div className="md:col-span-1 space-y-2" id="image-upload-column">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">รูปสินค้า</label>
            
            {imageUrl ? (
              <div className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 aspect-square flex items-center justify-center" id="image-uploaded-box">
                <img 
                  src={imageUrl} 
                  alt="Product preview" 
                  className="object-contain w-full h-full max-h-56"
                  referrerPolicy="no-referrer"
                />
                <button
                  type="button"
                  id="btn-remove-image"
                  onClick={handleRemoveImage}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-medium transition duration-200 gap-1"
                >
                  <X size={16} /> ลบรูปภาพ
                </button>
              </div>
            ) : (
              <div 
                id="image-dropzone"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={triggerFileInput}
                className={`border-2 border-dashed aspect-square flex flex-col items-center justify-center rounded-xl p-4 cursor-pointer text-center transition duration-200 select-none ${
                  isDragOver 
                    ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400' 
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20 text-slate-400 dark:text-slate-500'
                }`}
              >
                <Upload size={28} className="mb-2" />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">ลากและวางรูปที่นี่</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">หรือ คลิกเพื่อเลือกไฟล์จากเครื่อง</span>
                <span className="text-[9px] text-slate-400 dark:text-slate-600 mt-2 block">(ขนาดไฟล์ไม่เกิน 2MB)</span>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
              id="file-input-raw"
            />
          </div>

          {/* Column 2 & 3: Detailed Specifications */}
          <div className="md:col-span-2 space-y-4" id="item-details-fields">
            {/* Name */}
            <div className="space-y-1.5" id="field-group-name">
              <label htmlFor="input-name" className="block text-xs font-semibold text-slate-600 dark:text-slate-400">ชื่อรายการรับของ <span className="text-red-500">*</span></label>
              <input 
                id="input-name"
                type="text" 
                placeholder="ระบุชื่อรายการสิ่งของ เช่น ปูนซีเมนต์, ท่อน้ำพีวีซี, หลอดไฟ LED"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 dark:text-white"
              />
            </div>

            {/* Category, Date and Project in grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="category-date-project-row">
              <div className="space-y-1.5" id="field-group-category">
                <label htmlFor="input-category" className="block text-xs font-semibold text-slate-600 dark:text-slate-400">หมวดหมู่</label>
                <select 
                  id="input-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 dark:text-white"
                >
                  {categoriesList.map((catName) => (
                    <option key={catName} value={catName}>{catName}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5" id="field-group-receivedate">
                <label htmlFor="input-receivedate" className="block text-xs font-semibold text-slate-600 dark:text-slate-400">วันที่รับของ <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input 
                    id="input-receivedate"
                    type="date" 
                    value={receiveDate}
                    onChange={(e) => setReceiveDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 dark:text-white"
                  />
                  <Calendar size={14} className="absolute left-3 top-3 text-slate-400" />
                </div>
              </div>

              <div className="space-y-1.5" id="field-group-project">
                <label htmlFor="input-project" className="block text-xs font-semibold text-slate-600 dark:text-slate-400">โครงการ / แผนกงาน</label>
                <input 
                  id="input-project"
                  type="text" 
                  placeholder="เช่น โครงการปรับปรุงอาคาร A"
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  list="project-suggestions"
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 dark:text-white"
                />
                <datalist id="project-suggestions">
                  <option value="โครงการปรับปรุงอาคารเรียน/อำนวยการ" />
                  <option value="โครงการติดตั้งระบบปรับอากาศประจำปี" />
                  <option value="โครงการซ่อมบำรุงเครือข่ายอินเทอร์เน็ต" />
                  <option value="โครงการซ่อมทางเดินเท้าและภูมิทัศน์" />
                  <option value="งานซ่อมบำรุงทั่วไป (งานด่วน)" />
                </datalist>
              </div>
            </div>

            {/* Price and Quantity in grid */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4" id="price-quantity-row">
              <div className="space-y-1.5" id="field-group-price">
                <label htmlFor="input-price" className="block text-xs font-semibold text-slate-600 dark:text-slate-400">ราคาต่อหน่วย (บาท) <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input 
                    id="input-price"
                    type="number" 
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={price || ''}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 dark:text-white font-mono"
                  />
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-sans">฿</span>
                </div>
              </div>

              <div className="space-y-1.5" id="field-group-quantity">
                <label htmlFor="input-quantity" className="block text-xs font-semibold text-slate-600 dark:text-slate-400">จำนวนที่รับเข้า <span className="text-red-500">*</span></label>
                <input 
                  id="input-quantity"
                  type="number" 
                  min="1"
                  step="1"
                  placeholder="1"
                  value={quantity || ''}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 dark:text-white font-mono"
                />
              </div>

              {/* Read-Only Total Price */}
              <div className="space-y-1.5" id="field-group-total">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">คำนวณราคารวมให้อัตโนมัติ</label>
                <div className="px-3 py-2 text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl font-mono text-slate-700 dark:text-slate-300 font-bold">
                  {((price || 0) * (quantity || 0)).toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿
                </div>
              </div>

              {/* Work Order Price */}
              <div className="space-y-1.5" id="field-group-woprice">
                <label htmlFor="input-woprice" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <span>ราคาส่งงาน (บาท)</span>
                  <span className="text-[9px] text-slate-400 font-normal">(ถ้ามี)</span>
                </label>
                <div className="relative">
                  <input 
                    id="input-woprice"
                    type="number" 
                    min="0"
                    step="0.01"
                    placeholder="ปล่อยว่างเพื่อใช้ราคารวม"
                    value={workOrderPrice}
                    onChange={(e) => setWorkOrderPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 dark:text-white font-mono"
                  />
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-sans">฿</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Separator line */}
        <hr className="border-slate-100 dark:border-slate-800" />

        {/* Section 2: Usage Status and Work Order Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="form-status-section">
          {/* Sub column 1: นำไปใช้หรือยัง (Usage Status) */}
          <div className="p-4 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/30 space-y-4" id="usage-status-group">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">สถานะการนำสินค้าไปใช้งาน</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">ระบุข้อมูลว่ารายการรับของชิ้นนี้ถูกเบิกไปใช้งานแล้วหรือยัง</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none" id="toggle-used-label">
                <input 
                  id="toggle-used"
                  type="checkbox" 
                  checked={isUsed}
                  onChange={(e) => setIsUsed(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-6 bg-slate-200 dark:bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
              </label>
            </div>

            {isUsed && (
              <div className="space-y-4 animate-slide-down" id="used-details-fields">
                {/* Used Date */}
                <div className="space-y-1.5" id="used-date-details">
                  <label htmlFor="input-useddate" className="block text-xs font-semibold text-slate-600 dark:text-slate-400">วันที่นำออกไปใช้ <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input 
                      id="input-useddate"
                      type="date" 
                      value={usedDate}
                      onChange={(e) => setUsedDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500/30 focus:border-purple-500 dark:text-white"
                      required
                    />
                    <Calendar size={14} className="absolute left-3 top-3 text-slate-400" />
                  </div>
                </div>

                {/* Used Quantity */}
                <div className="space-y-1.5" id="used-qty-details">
                  <label htmlFor="input-usedqty" className="block text-xs font-semibold text-slate-600 dark:text-slate-400">จำนวนที่เบิกใช้ (หน่วย) <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input 
                      id="input-usedqty"
                      type="number" 
                      min="1"
                      max={quantity}
                      value={usedQuantity}
                      onChange={(e) => setUsedQuantity(Math.min(quantity, Math.max(1, Number(e.target.value))))}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500/30 focus:border-purple-500 dark:text-white font-mono"
                      required
                    />
                    <span className="absolute right-3 top-2 text-xs text-slate-400">
                      สูงสุด {quantity}
                    </span>
                  </div>
                </div>

                {/* Withdrawer Name */}
                <div className="space-y-1.5" id="used-withdrawer-details">
                  <label htmlFor="input-withdrawer" className="block text-xs font-semibold text-slate-600 dark:text-slate-400">ผู้เบิกสินค้า <span className="text-red-500">*</span></label>
                  <input 
                    id="input-withdrawer"
                    type="text" 
                    placeholder="เช่น ช่างวิชัย ใจมั่น, คุณนพดล แผนกไอที"
                    value={withdrawerName}
                    onChange={(e) => setWithdrawerName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500/30 focus:border-purple-500 dark:text-white"
                    required
                  />
                </div>

                {/* Used Project */}
                <div className="space-y-1.5" id="used-project-details">
                  <label htmlFor="input-usedproject" className="block text-xs font-semibold text-slate-600 dark:text-slate-400">ใช้โครงการ</label>
                  <input 
                    id="input-usedproject"
                    type="text" 
                    placeholder="เช่น โครงการปรับปรุงอาคารเรียน (ถ้ามี)"
                    value={usedProject}
                    onChange={(e) => setUsedProject(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500/30 focus:border-purple-500 dark:text-white"
                  />
                </div>

                {/* Usage Purpose */}
                <div className="space-y-1.5" id="used-purpose-details">
                  <label htmlFor="input-purpose" className="block text-xs font-semibold text-slate-600 dark:text-slate-400">วัตถุประสงค์</label>
                  <input 
                    id="input-purpose"
                    type="text" 
                    placeholder="เช่น ติดตั้งแอร์ชั้น 2 อาคารอำนวยการ"
                    value={usagePurpose}
                    onChange={(e) => setUsagePurpose(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500/30 focus:border-purple-500 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Sub column 2: การออกใบงานแล้วหรือยัง (Work Order Status) */}
          <div className="p-4 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/30 space-y-4" id="work-order-status-group">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">สถานะการออกใบงานช่าง</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">ระบุว่าสินค้าชิ้นนี้ได้รับการจัดทำใบมอบหมายงานแล้วหรือยัง</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none" id="toggle-workorder-label">
                <input 
                  id="toggle-workorder"
                  type="checkbox" 
                  checked={isWorkOrderIssued}
                  onChange={(e) => setIsWorkOrderIssued(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-6 bg-slate-200 dark:bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

            {isWorkOrderIssued && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-slide-down" id="work-order-details">
                <div className="space-y-1.5" id="field-group-wonumber">
                  <label htmlFor="input-wonumber" className="block text-xs font-semibold text-slate-600 dark:text-slate-400">เลขที่ใบงาน</label>
                  <input 
                    id="input-wonumber"
                    type="text" 
                    placeholder="เช่น WO-XXXXXXXX"
                    value={workOrderNumber}
                    onChange={(e) => setWorkOrderNumber(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500/30 focus:border-amber-500 dark:text-white font-mono"
                  />
                </div>

                <div className="space-y-1.5" id="field-group-wodate">
                  <label htmlFor="input-wodate" className="block text-xs font-semibold text-slate-600 dark:text-slate-400">วันที่ออกใบงาน</label>
                  <div className="relative">
                    <input 
                      id="input-wodate"
                      type="date" 
                      value={workOrderDate}
                      onChange={(e) => setWorkOrderDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500/30 focus:border-amber-500 dark:text-white"
                    />
                    <Calendar size={14} className="absolute left-3 top-3 text-slate-400" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1.5" id="field-group-notes">
          <label htmlFor="input-notes" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 font-sans">หมายเหตุเพิ่มเติม</label>
          <textarea 
            id="input-notes"
            rows={2}
            placeholder="รายละเอียดเพิ่มเติม รายชื่อผู้เบิก จุดประสงค์การใช้งาน หรือสถานที่จัดเก็บชิ้นงาน..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 dark:text-white font-sans"
          ></textarea>
        </div>

        {/* Form Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800" id="form-actions-buttons">
          <button 
            type="button"
            id="btn-form-cancel"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition duration-150 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            ยกเลิก
          </button>
          
          <button 
            type="submit"
            id="btn-form-save"
            className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold px-5 py-2 rounded-xl transition duration-200 text-sm shadow-md flex items-center gap-1.5"
          >
            <Save size={16} />
            {editItem ? 'บันทึกการแก้ไข' : 'บันทึกของเข้าคลัง'}
          </button>
        </div>
      </form>
    </div>
  );
}
