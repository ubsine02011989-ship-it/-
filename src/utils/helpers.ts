/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReceiptItem } from '../types';

// Format currency in Baht
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Convert date string YYYY-MM-DD to Thai Date string
export function formatThaiDate(dateString: string, includeTime = false): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    const formatter = new Intl.DateTimeFormat('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: includeTime ? '2-digit' : undefined,
      minute: includeTime ? '2-digit' : undefined,
    });
    return formatter.format(date);
  } catch (e) {
    return dateString;
  }
}

// Convert YYYY-MM to Thai Month name
export function formatThaiMonth(yearMonthString: string): string {
  if (!yearMonthString || !yearMonthString.includes('-')) return yearMonthString;
  try {
    const [year, month] = yearMonthString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    const formatter = new Intl.DateTimeFormat('th-TH', {
      month: 'long',
      year: 'numeric',
    });
    return formatter.format(date);
  } catch (e) {
    return yearMonthString;
  }
}

// Export receipt items to CSV (Excel compatible with Thai support)
export function exportToCSV(items: ReceiptItem[], filename = 'inventory_receipt_report.csv'): void {
  // UTF-8 BOM for Excel to recognize Thai characters
  const BOM = '\uFEFF';
  
  const headers = [
    'โครงการ',
    'รหัสสินค้า',
    'วันที่รับของ',
    'รายการสินค้า',
    'ราคาต่อชิ้น',
    'จำนวน',
    'ราคารวม',
    'ราคาส่งงาน',
    'วันที่นำไปใช้',
    'เลขที่ใบงาน',
    'หมายเหตุ'
  ];

  const rows = items.map(item => [
    `"${(item.project || 'ทั่วไป / ไม่ระบุโครงการ').replace(/"/g, '""')}"`,
    `"${item.id}"`,
    `"${item.receiveDate}"`,
    `"${item.name.replace(/"/g, '""')}"`,
    item.price,
    item.quantity,
    item.totalPrice,
    item.isWorkOrderIssued ? (item.workOrderPrice !== undefined && item.workOrderPrice !== null ? item.workOrderPrice : item.totalPrice) : '-',
    `"${item.usedDate || '-'}"`,
    `"${item.workOrderNumber || '-'}"`,
    `"${(item.notes || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(e => e.join(','))
  ].join('\n');

  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Generate unique ID
export function generateId(prefix = 'ITEM'): string {
  return `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;
}

// Get standard categories and default visual themes (gradients/colors) for product avatars
export const CATEGORY_PRESETS: { [key: string]: { label: string; icon: string; bg: string; text: string } } = {
  'materials': { label: 'วัสดุก่อสร้าง', icon: 'Hammer', bg: 'bg-amber-100 dark:bg-amber-950', text: 'text-amber-700 dark:text-amber-300' },
  'electrical': { label: 'อุปกรณ์ไฟฟ้า', icon: 'Zap', bg: 'bg-yellow-100 dark:bg-yellow-950', text: 'text-yellow-700 dark:text-yellow-300' },
  'plumbing': { label: 'อุปกรณ์ประปา', icon: 'Droplet', bg: 'bg-blue-100 dark:bg-blue-950', text: 'text-blue-700 dark:text-blue-300' },
  'tools': { label: 'เครื่องมือช่าง', icon: 'Wrench', bg: 'bg-stone-100 dark:bg-stone-900', text: 'text-stone-700 dark:text-stone-300' },
  'electronics': { label: 'ไอที & อิเล็กทรอนิกส์', icon: 'Cpu', bg: 'bg-purple-100 dark:bg-purple-950', text: 'text-purple-700 dark:text-purple-300' },
  'office': { label: 'เครื่องใช้สำนักงาน', icon: 'FileText', bg: 'bg-emerald-100 dark:bg-emerald-950', text: 'text-emerald-700 dark:text-emerald-300' },
  'other': { label: 'อื่นๆ', icon: 'Package', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300' },
};

// Seed initial mock data (Thai language, highly realistic business cases)
export const SEED_ITEMS: ReceiptItem[] = [
  {
    id: 'ITEM-125419',
    name: 'ปูนซีเมนต์ปอร์ตแลนด์ TOA 50กก.',
    category: 'วัสดุก่อสร้าง',
    price: 185.00,
    quantity: 40,
    totalPrice: 7400.00,
    receiveDate: '2026-06-05',
    imageUrl: '',
    isUsed: true,
    usedDate: '2026-06-12',
    isWorkOrderIssued: true,
    workOrderNumber: 'WO-202606-001',
    workOrderDate: '2026-06-10',
    notes: 'สำหรับงานเทพื้นอาคารจอดรถหลังใหม่',
  },
  {
    id: 'ITEM-395812',
    name: 'สายไฟ Yazaki THW 1x1.5 Sq.mm. (100ม.)',
    category: 'อุปกรณ์ไฟฟ้า',
    price: 820.00,
    quantity: 12,
    totalPrice: 9840.00,
    receiveDate: '2026-06-10',
    imageUrl: '',
    isUsed: false,
    isWorkOrderIssued: true,
    workOrderNumber: 'WO-202606-004',
    workOrderDate: '2026-06-15',
    notes: 'งานเดินสายไฟระบบปรับอากาศชั้น 2',
  },
  {
    id: 'ITEM-881294',
    name: 'ท่อ PVC ตราช้าง 4 นิ้ว ชั้น 8.5 (4ม.)',
    category: 'อุปกรณ์ประปา',
    price: 295.00,
    quantity: 25,
    totalPrice: 7375.00,
    receiveDate: '2026-06-12',
    imageUrl: '',
    isUsed: true,
    usedDate: '2026-06-25',
    isWorkOrderIssued: true,
    workOrderNumber: 'WO-202606-003',
    workOrderDate: '2026-06-20',
    notes: 'ระบบระบายน้ำเสียหลักของตึกพัฒนาคุณภาพ',
  },
  {
    id: 'ITEM-471203',
    name: 'สว่านโรตารี่ Bosch GBH 2-26 DFR',
    category: 'เครื่องมือช่าง',
    price: 5200.00,
    quantity: 2,
    totalPrice: 10400.00,
    receiveDate: '2026-05-18',
    imageUrl: '',
    isUsed: false,
    isWorkOrderIssued: false,
    notes: 'จัดซื้อเพิ่มสำหรับช่างติดตั้งทีม B',
  },
  {
    id: 'ITEM-994301',
    name: 'แท็บเล็ต Samsung Galaxy Tab S9',
    category: 'ไอที & อิเล็กทรอนิกส์',
    price: 28900.00,
    quantity: 3,
    totalPrice: 86700.00,
    receiveDate: '2026-05-20',
    imageUrl: '',
    isUsed: true,
    usedDate: '2026-05-22',
    isWorkOrderIssued: true,
    workOrderNumber: 'WO-202605-012',
    workOrderDate: '2026-05-21',
    notes: 'สำหรับวิศวกรควบคุมงานใช้ตรวจเช็คแบบนอกสถานที่',
  },
  {
    id: 'ITEM-221049',
    name: 'เก้าอี้สำนักงาน Ergonomic สีดำ',
    category: 'เครื่องใช้สำนักงาน',
    price: 3450.00,
    quantity: 10,
    totalPrice: 34500.00,
    receiveDate: '2026-06-15',
    imageUrl: '',
    isUsed: false,
    isWorkOrderIssued: false,
    notes: 'เบิกจ่ายเข้าแผนกทรัพยากรบุคคล',
  },
  {
    id: 'ITEM-115592',
    name: 'ถุงมือยางกันสารเคมี Ansell (แพ็ค 10 คู่)',
    category: 'อื่นๆ',
    price: 450.00,
    quantity: 15,
    totalPrice: 6750.00,
    receiveDate: '2026-06-22',
    imageUrl: '',
    isUsed: true,
    usedDate: '2026-06-28',
    isWorkOrderIssued: false,
    notes: 'แจกจ่ายให้เจ้าหน้าที่ทำความสะอาดห้องปฏิบัติการ',
  }
];
