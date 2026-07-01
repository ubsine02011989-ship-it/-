/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  Package, 
  CheckCircle2, 
  FileSpreadsheet, 
  AlertCircle, 
  Clock, 
  Layers, 
  DollarSign 
} from 'lucide-react';
import { ReceiptItem, StatusNotification } from '../types';
import { formatCurrency, formatThaiDate, formatThaiMonth, CATEGORY_PRESETS } from '../utils/helpers';

interface DashboardProps {
  items: ReceiptItem[];
  notifications: StatusNotification[];
  onClearNotifications: () => void;
  onNavigateToForm: () => void;
  onNavigateToList: () => void;
}

export default function Dashboard({ 
  items, 
  notifications, 
  onClearNotifications,
  onNavigateToForm,
  onNavigateToList 
}: DashboardProps) {
  
  // 1. Calculate General Stats
  const stats = useMemo(() => {
    const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const usedItems = items.filter(item => item.isUsed);
    const workOrderIssued = items.filter(item => item.isWorkOrderIssued);
    
    const usagePercentage = items.length > 0 ? Math.round((usedItems.length / items.length) * 100) : 0;
    const workOrderPercentage = items.length > 0 ? Math.round((workOrderIssued.length / items.length) * 100) : 0;

    return {
      totalAmount,
      uniqueCount: items.length,
      totalItemsCount,
      usedCount: usedItems.length,
      unusedCount: items.length - usedItems.length,
      workOrderCount: workOrderIssued.length,
      nonWorkOrderCount: items.length - workOrderIssued.length,
      usagePercentage,
      workOrderPercentage
    };
  }, [items]);

  // 2. Group by Month for Chart (Last 6 Months)
  const monthlyData = useMemo(() => {
    const monthsMap: { [key: string]: { total: number; count: number } } = {};
    
    items.forEach(item => {
      // Extract YYYY-MM
      const month = item.receiveDate.substring(0, 7);
      if (!month) return;
      
      if (!monthsMap[month]) {
        monthsMap[month] = { total: 0, count: 0 };
      }
      monthsMap[month].total += item.totalPrice;
      monthsMap[month].count += 1;
    });

    // Convert to sorted array
    const sortedMonths = Object.keys(monthsMap).sort().slice(-6); // Last 6 months
    return sortedMonths.map(month => ({
      month,
      thaiMonth: formatThaiMonth(month),
      total: monthsMap[month].total,
      count: monthsMap[month].count
    }));
  }, [items]);

  // Max value for bar scaling
  const maxMonthlySpend = useMemo(() => {
    if (monthlyData.length === 0) return 10000;
    const max = Math.max(...monthlyData.map(d => d.total));
    return max === 0 ? 10000 : max;
  }, [monthlyData]);

  // 3. Category Spending Breakdown
  const categoryStats = useMemo(() => {
    const categoriesMap: { [key: string]: number } = {};
    items.forEach(item => {
      const cat = item.category;
      categoriesMap[cat] = (categoriesMap[cat] || 0) + item.totalPrice;
    });

    return Object.entries(categoriesMap)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
  }, [items]);

  return (
    <div className="space-y-8 animate-fade-in" id="dashboard-view">
      {/* Welcome Banner */}
      <div className="bg-slate-900 text-white p-6 md:p-8 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden" id="dashboard-hero">
        <div className="absolute right-0 top-0 w-64 h-64 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="z-10">
          <h2 className="text-2xl md:text-3xl font-sans font-bold tracking-tight text-white mb-2" id="dashboard-hero-title">
            แดชบอร์ดสรุปงานรับของและใบงาน
          </h2>
          <p className="text-slate-300 text-sm max-w-xl" id="dashboard-hero-subtitle">
            บันทึกรายการรับสินค้า ออกใบงาน และติดตามสถานะแบบเรียลไทม์ (รองรับการใช้งานแบบออฟไลน์ 100% ข้อมูลจะถูกบันทึกไว้อย่างปลอดภัยบนเครื่องของคุณ)
          </p>
        </div>
        <div className="flex gap-3 z-10 w-full sm:w-auto" id="dashboard-hero-actions">
          <button 
            id="btn-quick-add"
            onClick={onNavigateToForm}
            className="flex-1 sm:flex-initial bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-medium px-4 py-2.5 rounded-xl transition duration-200 shadow-md text-sm flex items-center justify-center gap-2"
          >
            <Package size={18} />
            รับของใหม่
          </button>
          <button 
            id="btn-quick-list"
            onClick={onNavigateToList}
            className="flex-1 sm:flex-initial bg-slate-800 hover:bg-slate-700 text-slate-100 font-medium px-4 py-2.5 rounded-xl transition duration-200 border border-slate-700 text-sm flex items-center justify-center gap-2"
          >
            <Layers size={18} />
            ดูประวัติทั้งหมด
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="dashboard-stats-grid">
        {/* Total Cost */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm relative overflow-hidden" id="stat-total-price">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-1">ยอดรวมราคารับของทั้งหมด</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white font-mono tracking-tight mt-1">
                {formatCurrency(stats.totalAmount)}
              </h3>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-slate-400 dark:text-slate-500 gap-1.5 border-t border-slate-50 dark:border-slate-800/40 pt-3">
            <TrendingUp size={14} className="text-emerald-500" />
            <span>คำนวณราคารวมโดยอัตโนมัติ</span>
          </div>
        </div>

        {/* Total Quantity */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm" id="stat-total-quantity">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-1">จำนวนหน่วยสินค้าในระบบ</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white font-mono tracking-tight mt-1">
                {stats.totalItemsCount.toLocaleString()} <span className="text-sm font-sans font-normal text-slate-500">หน่วย</span>
              </h3>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
              <Package size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-slate-400 dark:text-slate-500 gap-1.5 border-t border-slate-50 dark:border-slate-800/40 pt-3">
            <span>แยกเป็น </span>
            <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">{stats.uniqueCount} รายการ</span>
            <span>ที่บันทึกไว้</span>
          </div>
        </div>

        {/* Usage Progress */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm" id="stat-usage-rate">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-1">อัตราการนำไปใช้งานล่าสุด</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white font-mono tracking-tight mt-1">
                {stats.usagePercentage}%
              </h3>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-xl">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="space-y-1.5" id="stat-usage-bar-container">
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-purple-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${stats.usagePercentage}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 font-mono">
              <span>ใช้แล้ว {stats.usedCount} รายการ</span>
              <span>เหลือ {stats.unusedCount} รายการ</span>
            </div>
          </div>
        </div>

        {/* Work Orders Progress */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm" id="stat-work-order-rate">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-1">สถานะการออกใบงาน</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white font-mono tracking-tight mt-1">
                {stats.workOrderPercentage}%
              </h3>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl">
              <FileSpreadsheet size={20} />
            </div>
          </div>
          <div className="space-y-1.5" id="stat-work-order-bar-container">
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${stats.workOrderPercentage}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 font-mono">
              <span>ออกแล้ว {stats.workOrderCount} รายการ</span>
              <span>ค้างออก {stats.nonWorkOrderCount} รายการ</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid (Charts + Notifications Log) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="dashboard-charts-notifications-section">
        
        {/* Expenditure Bar Chart (Monthly Report) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm lg:col-span-2 flex flex-col" id="dashboard-monthly-chart-card">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h4 className="text-base font-sans font-bold text-slate-900 dark:text-white" id="chart-card-title">
                รายงานสรุปยอดราคารับของรายเดือน
              </h4>
              <p className="text-xs text-slate-400 mt-1">ยอดรวมมูลค่าที่มีการรับสิ่งของเข้ามาในแต่ละเดือนล่าสุด</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono bg-slate-50 dark:bg-slate-800/40 px-2.5 py-1 rounded-lg">
              <Clock size={12} />
              <span>ย้อนหลัง 6 เดือน</span>
            </div>
          </div>

          {monthlyData.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-400 gap-2 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl" id="chart-no-data">
              <Package size={36} className="text-slate-300 stroke-1" />
              <p className="text-sm font-sans">ยังไม่มีข้อมูลที่จะแสดงรายงาน</p>
              <button 
                onClick={onNavigateToForm}
                className="text-xs text-emerald-600 font-semibold hover:underline"
              >
                คลิกที่นี่เพื่อเพิ่มรายการแรก
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-between" id="chart-rendering-container">
              {/* Vertical Chart Container */}
              <div className="grid grid-cols-6 gap-3 items-end h-56 pt-4 pb-2 border-b border-slate-100 dark:border-slate-800" id="svg-bars-container">
                {monthlyData.map((d, idx) => {
                  const percent = Math.max(4, (d.total / maxMonthlySpend) * 100);
                  return (
                    <div key={d.month} className="group flex flex-col items-center gap-2 h-full justify-end relative" id={`chart-bar-col-${idx}`}>
                      {/* Tooltip on Hover */}
                      <div className="absolute -top-6 bg-slate-900 dark:bg-slate-800 text-white text-[10px] font-mono px-2 py-0.5 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 whitespace-nowrap">
                        {formatCurrency(d.total)} ({d.count} ใบ)
                      </div>
                      
                      {/* Interactive Bar */}
                      <div className="w-full max-w-[40px] bg-slate-50 dark:bg-slate-800 rounded-t-lg h-full flex items-end overflow-hidden">
                        <div 
                          className="w-full bg-gradient-to-t from-emerald-500/80 to-emerald-400 dark:from-emerald-600 dark:to-emerald-400 rounded-t-lg group-hover:from-emerald-400 group-hover:to-emerald-300 transition-all duration-300"
                          style={{ height: `${percent}%` }}
                        ></div>
                      </div>
                      
                      {/* Value below bar */}
                      <span className="text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300 block truncate max-w-full">
                        {d.total >= 1000 ? `${(d.total / 1000).toFixed(1)}k` : d.total}
                      </span>
                    </div>
                  );
                })}
              </div>
              
              {/* Month Labels */}
              <div className="grid grid-cols-6 gap-3 pt-2 text-center" id="chart-labels-container">
                {monthlyData.map((d) => (
                  <span key={d.month} className="text-[10px] font-medium text-slate-500 truncate" title={d.thaiMonth}>
                    {d.thaiMonth.split(' ')[0]}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Status Notification Center (Real-Time Alerts Log) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col h-[350px]" id="dashboard-notifications-card">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="text-base font-sans font-bold text-slate-900 dark:text-white" id="notif-card-title">
                บันทึกการแจ้งเตือนล่าสุด
              </h4>
              <p className="text-xs text-slate-400 mt-1">อัปเดตการใช้งานและออกใบงานทันที</p>
            </div>
            {notifications.length > 0 && (
              <button 
                id="btn-clear-notifications"
                onClick={onClearNotifications}
                className="text-[10px] text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 font-medium transition duration-150"
              >
                ล้างทั้งหมด
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin" id="notifications-scroll-area">
            {notifications.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2 py-8" id="notif-empty-state">
                <AlertCircle size={24} className="text-slate-300" />
                <p className="text-xs font-sans text-center">ยังไม่มีประวัติแจ้งเตือนในระบบ</p>
                <p className="text-[10px] text-center text-slate-400 max-w-[200px]">
                  เมื่อคุณกดสลับสถานะ นำไปใช้ หรือ ทำการออกใบงาน ระบบจะรายงานแจ้งเตือนที่นี่ทันที
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  id={`notif-${notif.id}`}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/40 flex gap-3 text-xs"
                >
                  <div className={`mt-0.5 p-1.5 rounded-lg h-fit ${
                    notif.type === 'usage' 
                      ? 'bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400' 
                      : 'bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400'
                  }`}>
                    {notif.type === 'usage' ? <CheckCircle2 size={14} /> : <FileSpreadsheet size={14} />}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{notif.itemName}</p>
                    <p className="text-slate-500 dark:text-slate-400 leading-normal text-[11px]">{notif.message}</p>
                    <p className="text-[9px] text-slate-400 font-mono">
                      {formatThaiDate(notif.timestamp, true)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Category Breakdown list */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm" id="dashboard-category-card">
        <h4 className="text-base font-sans font-bold text-slate-900 dark:text-white mb-4" id="category-card-title">
          สัดส่วนมูลค่าเงินรับของแยกตามหมวดหมู่
        </h4>
        {categoryStats.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">ไม่มีข้อมูลหมวดหมู่สินค้า</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="categories-grid">
            {categoryStats.map(({ name, total }) => {
              // Find matching preset config or fallback to other
              const presetKey = Object.keys(CATEGORY_PRESETS).find(
                key => CATEGORY_PRESETS[key].label === name
              ) || 'other';
              const preset = CATEGORY_PRESETS[presetKey];
              const sharePercent = stats.totalAmount > 0 ? Math.round((total / stats.totalAmount) * 100) : 0;
              
              return (
                <div key={name} className="flex items-center justify-between p-4 rounded-xl border border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 gap-3" id={`category-card-${presetKey}`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-lg ${preset.bg} ${preset.text}`}>
                      <Package size={16} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs">{name}</p>
                      <p className="text-slate-500 dark:text-slate-400 text-[10px] font-mono">{formatCurrency(total)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                      {sharePercent}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
