/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ReceiptItem {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  totalPrice: number;
  receiveDate: string; // YYYY-MM-DD
  imageUrl: string; // Base64 or placeholder URL
  isUsed: boolean; // นำไปใช้หรือยัง
  usedDate?: string | null;
  usedQuantity?: number | null; // จำนวนที่นำออกไปใช้งาน
  withdrawerName?: string | null; // ผู้เบิกพัสดุ / นำออกไปใช้งาน
  usagePurpose?: string | null; // วัตถุประสงค์ / สถานที่ใช้งาน
  usedProject?: string | null; // ใช้โครงการ (เบิกใช้สำหรับโครงการใด)
  isWorkOrderIssued: boolean; // ทำการออกใบงานหรือยัง
  workOrderNumber?: string | null;
  workOrderDate?: string | null;
  notes?: string;
  project?: string | null; // โครงการ / แผนกงาน
  workOrderPrice?: number | null; // ราคาส่งงาน (บาท)
}

export interface StatusNotification {
  id: string;
  itemId: string;
  itemName: string;
  type: 'usage' | 'work_order';
  status: boolean;
  message: string;
  timestamp: string; // ISO String
}

export interface MonthlySummary {
  month: string; // YYYY-MM
  totalAmount: number;
  totalItems: number;
  usedItemsCount: number;
  workOrderCount: number;
}
