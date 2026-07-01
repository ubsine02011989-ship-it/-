/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Printer, X, FileText, CheckSquare, Layers, FileSpreadsheet, Folder, User, MapPin } from 'lucide-react';
import { ReceiptItem } from '../types';
import { formatCurrency, formatThaiDate } from '../utils/helpers';

interface PrintInvoiceProps {
  selectedItems: ReceiptItem[];
  onClose: () => void;
}

export default function PrintInvoice({ selectedItems, onClose }: PrintInvoiceProps) {
  const [selectedProject, setSelectedProject] = useState<string>('ALL');
  const [printMode, setPrintMode] = useState<'single' | 'split'>('single');

  // Custom print handler
  const handlePrint = () => {
    window.print();
  };

  const issueDateStr = new Date().toISOString().substring(0, 10);

  // Extract list of all projects represented in selected items
  const allProjects = useMemo(() => {
    const projectsSet = new Set<string>();
    selectedItems.forEach(item => {
      const pName = item.project?.trim() || 'ทั่วไป / ไม่ระบุโครงการ';
      projectsSet.add(pName);
    });
    return Array.from(projectsSet).sort();
  }, [selectedItems]);

  // Determine which projects to print
  const projectsToPrint = useMemo(() => {
    if (printMode === 'split') {
      return allProjects;
    } else {
      return [selectedProject];
    }
  }, [printMode, allProjects, selectedProject]);

  // Generate helper to get items for a project
  const getItemsForProject = (projectVal: string) => {
    if (projectVal === 'ALL') return selectedItems;
    return selectedItems.filter(item => {
      const pName = item.project?.trim() || 'ทั่วไป / ไม่ระบุโครงการ';
      return pName === projectVal;
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in" id="print-modal-container">
      {/* Outer Card with controls visible on screen, but print styles hiding them */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col my-8 border border-slate-100 dark:border-slate-800 print:shadow-none print:border-none print:my-0 print:rounded-none print:w-full" id="print-modal-card">
        
        {/* Modal Controls - Hidden during Printing */}
        <div className="bg-slate-900 text-white p-5 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 border-b border-slate-800 print:hidden animate-slide-down" id="modal-controls">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
              <Printer size={20} className="animate-pulse" />
            </span>
            <div>
              <h3 className="font-sans font-bold text-sm">พิมพ์เอกสารรายงานแยกโครงการและเบิกจ่ายพัสดุ (PDF)</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">กำหนดรูปแบบการกรองข้อมูลพัสดุและตั้งค่าหน้าพิมพ์เพื่อพิมพ์ใบเบิกและรายงาน</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-trigger-print"
              onClick={handlePrint}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-4 py-2 rounded-xl transition text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Printer size={15} />
              สั่งพิมพ์รายงาน / บันทึก PDF
            </button>
            <button
              id="btn-close-print-modal"
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-4 py-2 rounded-xl transition text-xs flex items-center gap-1.5 border border-slate-700 cursor-pointer"
            >
              <X size={15} />
              ปิดหน้าต่าง
            </button>
          </div>
        </div>

        {/* Dynamic Options & Controls Panel - Hidden during Printing */}
        <div className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-150 dark:border-slate-800 p-5 grid grid-cols-1 md:grid-cols-2 gap-4 print:hidden" id="print-options-panel">
          {/* Print Mode Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Layers size={14} className="text-emerald-500" />
              รูปแบบการพิมพ์เอกสาร (Print Mode)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setPrintMode('single');
                  setSelectedProject('ALL');
                }}
                className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                  printMode === 'single'
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                }`}
              >
                🗂️ รวมพัสดุทั้งหมดเป็นใบเดียว
              </button>
              <button
                type="button"
                onClick={() => {
                  setPrintMode('split');
                }}
                className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                  printMode === 'split'
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                }`}
              >
                📄 แยกหน้าพิมพ์ตามโครงการ (Page Break)
              </button>
            </div>
          </div>

          {/* Project Filtering (Only active in Single mode) */}
          <div className="space-y-2">
            <label htmlFor="select-print-project" className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Folder size={14} className="text-amber-500" />
              เลือกพิมพ์เฉพาะโครงการ (Project Filter)
            </label>
            <select
              id="select-print-project"
              value={selectedProject}
              disabled={printMode === 'split'}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-950 dark:text-white"
            >
              <option value="ALL">🌟 แสดงของทุกโครงการทั้งหมดในใบเดียว</option>
              {allProjects.map((proj) => (
                <option key={proj} value={proj}>📁 {proj}</option>
              ))}
            </select>
            {printMode === 'split' && (
              <p className="text-[10px] text-amber-600 dark:text-amber-400">
                *โหมดแยกพิมพ์เปิดทำงานอยู่ เอกสารจะถูกแยกหน้าพิมพ์โดยอัตโนมัติตามโครงการพัสดุ
              </p>
            )}
          </div>
        </div>

        {/* Informative advice strip - Hidden during printing */}
        <div className="bg-amber-50 dark:bg-amber-950/20 border-b border-slate-150 dark:border-slate-800 px-5 py-2.5 text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-2 print:hidden" id="print-advice">
          <span className="font-bold">💡 คำแนะนำสำหรับการพิมพ์และบันทึก:</span>
          <span>ในหน้าจอเครื่องพิมพ์ของเบราว์เซอร์ ให้เลือกปลายทาง (Destination) เป็น <b>"บันทึกเป็น PDF" (Save as PDF)</b> และเปิดใช้งาน <b>"พิมพ์สีพื้นหลัง" (Background graphics)</b> เพื่อให้ตารางสีสวยงามคมชัด</span>
        </div>

        {/* Printable Area - Render Single or Multiple Sheets depending on printMode */}
        <div 
          className="p-8 md:p-12 bg-white text-slate-900 overflow-y-auto max-h-[70vh] print:max-h-none print:overflow-visible print:p-0 print:text-black font-sans" 
          id="printable-invoice-sheet"
        >
          {/* Print Styles Injection */}
          <style dangerouslySetInnerHTML={{__html: `
            @media print {
              body * {
                visibility: hidden;
              }
              #printable-invoice-sheet, #printable-invoice-sheet * {
                visibility: visible;
              }
              #printable-invoice-sheet {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                color: #000 !important;
                background: #fff !important;
                padding: 0 !important;
                margin: 0 !important;
              }
              .print-border {
                border-color: #000 !important;
              }
              .print-bg-slate {
                background-color: #f8fafc !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .page-break {
                page-break-after: always;
                break-after: page;
              }
            }
          `}} />

          {projectsToPrint.map((projectKey, index) => {
            const projectItems = getItemsForProject(projectKey);
            
            // Skip printing projects that have no items matched
            if (projectItems.length === 0) return null;

            const totalCost = projectItems.reduce((sum, item) => sum + item.totalPrice, 0);
            const totalQty = projectItems.reduce((sum, item) => sum + item.quantity, 0);
            
            // Generate a professional doc number for this page
            const docNumber = `REC-${issueDateStr.replace(/-/g, '').substring(2, 8)}-P${String(index + 1).padStart(2, '0')}-${Math.floor(1000 + (index * 123) % 9000)}`;

            return (
              <div 
                key={projectKey} 
                className={`w-full ${index < projectsToPrint.length - 1 ? 'page-break mb-12 border-b-2 border-dashed border-slate-300 pb-12 print:border-none print:pb-0 print:mb-0' : ''}`}
                id={`project-sheet-${index}`}
              >
                {/* Letterhead */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b-2 border-slate-800 pb-5 mb-6 print-border" id={`invoice-letterhead-${index}`}>
                  <div>
                    <h1 className="text-lg md:text-xl font-bold tracking-tight text-slate-950 print:text-black font-sans flex items-center gap-2">
                      <span>ใบแจ้งสถานะงานและเอกสารเบิกจ่ายพัสดุ</span>
                      <span className="text-xs px-2.5 py-0.5 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-mono font-bold rounded-full print-border border">
                        {projectKey === 'ALL' ? 'รายการรวมทั้งหมด' : `โครงการ: ${projectKey}`}
                      </span>
                    </h1>
                    <p className="text-slate-500 text-xs mt-1 print:text-slate-600">
                      ระบบจัดการรับของและราคา (Item Receipt & Work Order System)
                    </p>
                    <p className="text-slate-400 text-[10px] mt-0.5 print:text-slate-500">
                      พัสดุสังกัด: {projectKey === 'ALL' ? 'ทุกโครงการในระบบ' : projectKey}
                    </p>
                  </div>
                  
                  <div className="text-left sm:text-right text-xs space-y-1 text-slate-600 print:text-black font-sans" id={`invoice-meta-fields-${index}`}>
                    <p className="font-mono"><span className="font-sans font-bold text-slate-800">เลขที่เอกสาร:</span> {docNumber}</p>
                    <p className="font-mono"><span className="font-sans font-bold text-slate-800">วันที่ออกพัสดุ:</span> {formatThaiDate(issueDateStr)}</p>
                    <p className="font-mono"><span className="font-sans font-bold text-slate-800">ผู้จัดทำเอกสาร:</span> ubsine02011989@gmail.com</p>
                  </div>
                </div>

                {/* Recipient Details & Objective */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs mb-6 text-slate-600 print:text-black" id={`invoice-parties-${index}`}>
                  <div className="space-y-1 p-3.5 bg-slate-50 rounded-xl print-bg-slate border border-slate-100/80 print-border" id={`invoice-party-left-${index}`}>
                    <h4 className="font-bold text-slate-900 print:text-black text-xs mb-1">หน่วยงานรับมอบพัสดุ</h4>
                    <p className="font-semibold text-slate-800">ฝ่ายคลังสินค้าและการจัดซื้อกลาง</p>
                    <p>โครงการหลัก: <span className="font-bold text-emerald-700">{projectKey === 'ALL' ? 'พัสดุรวมส่วนกลาง' : projectKey}</span></p>
                    <p>ผู้ควบคุมดูแล: ubsine02011989 (เจ้าหน้าที่พัสดุ)</p>
                  </div>
                  <div className="space-y-1 p-3.5 bg-slate-50 rounded-xl print-bg-slate border border-slate-100/80 print-border" id={`invoice-party-right-${index}`}>
                    <h4 className="font-bold text-slate-900 print:text-black text-xs mb-1">วัตถุประสงค์และรายงาน</h4>
                    <p>รายงานสรุปยอดค่าใช้จ่ายโครงการ และใบสั่งเบิกจ่ายช่าง</p>
                    <p>จำนวนรายการพัสดุหน้ากระดาษนี้: <span className="font-mono font-bold text-slate-900">{projectItems.length} รายการ</span></p>
                    <p>การส่งเอกสาร: แนบเอกสารพิมพ์นี้พร้อมลายเซ็นตรวจสอบเพื่อดำเนินการเคลียร์บัญชี</p>
                  </div>
                </div>

                {/* Table list of items */}
                <div className="overflow-x-auto mb-6" id={`invoice-items-table-wrapper-${index}`}>
                  <table className="w-full text-left text-xs border-collapse border border-slate-200 print-border" id={`invoice-items-table-${index}`}>
                    <thead>
                      <tr className="bg-slate-100 print-bg-slate border-b border-slate-200 text-slate-700 font-bold print-border">
                        <th className="py-2.5 px-3 border-r border-slate-200 print-border text-[11px] w-14 text-center">รหัส</th>
                        <th className="py-2.5 px-3 border-r border-slate-200 print-border text-[11px]">รายการสินค้า / รายละเอียดพัสดุ</th>
                        <th className="py-2.5 px-3 border-r border-slate-200 print-border text-[11px] w-36">หมายเหตุ</th>
                        <th className="py-2.5 px-3 border-r border-slate-200 print-border text-[11px] text-right w-24">ราคา/หน่วย</th>
                        <th className="py-2.5 px-3 border-r border-slate-200 print-border text-[11px] text-center w-16">จำนวน</th>
                        <th className="py-2.5 px-3 border-r border-slate-200 print-border text-[11px] text-right w-28">ราคารวม (บาท)</th>
                        <th className="py-2.5 px-3 border-r border-slate-200 print-border text-[11px] text-center w-36">ผู้เบิก & สถานที่นำไปใช้</th>
                        <th className="py-2.5 px-3 text-[11px] text-center w-28">เลขที่ใบงาน</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 print-border">
                      {projectItems.map((item) => (
                        <tr key={item.id} className="border-b border-slate-200 print-border hover:bg-slate-50/50">
                          <td className="py-2 px-2 font-mono text-[9px] text-slate-500 border-r border-slate-200 print-border text-center">{item.id}</td>
                          <td className="py-2 px-3 border-r border-slate-200 print-border font-semibold text-slate-900">
                            <div>
                              <p className="text-[11px]">{item.name}</p>
                              {item.project && (
                                <p className="text-[9px] text-slate-400 font-normal mt-0.5 flex items-center gap-1">
                                  <span>📁 โครงการ:</span> <span className="font-bold text-slate-500">{item.project}</span>
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-3 border-r border-slate-200 print-border text-slate-600 text-[11px] font-normal italic">
                            {item.notes || '-'}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-200 print-border text-right font-mono text-[11px]">{formatCurrency(item.price)}</td>
                          <td className="py-2 px-3 border-r border-slate-200 print-border text-center font-mono text-[11px]">{item.quantity}</td>
                          <td className="py-2 px-3 border-r border-slate-200 print-border text-right font-mono font-bold text-[11px]">{formatCurrency(item.totalPrice)}</td>
                          
                          {/* บันทึกการเบิกพัสดุ ผู้เบิกของ และสถานที่นำไปใช้ */}
                          <td className="py-2 px-3 border-r border-slate-200 print-border text-[10px] text-slate-700">
                            {item.isUsed ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1 font-semibold text-slate-900">
                                  <span className="text-slate-400">👤 ผู้เบิก:</span>
                                  <span>{item.withdrawerName || '-'}</span>
                                </div>
                                <div className="flex items-start gap-1 text-[9px] text-slate-500 leading-normal">
                                  <span className="text-slate-400">📍 วัตถุประสงค์:</span>
                                  <span>{item.usagePurpose || '-'}</span>
                                </div>
                                {item.usedProject && (
                                  <div className="flex items-start gap-1 text-[9px] text-slate-500 leading-normal">
                                    <span className="text-slate-400">📁 ใช้โครงการ:</span>
                                    <span className="font-bold text-slate-700">{item.usedProject}</span>
                                  </div>
                                )}
                                {item.usedQuantity && (
                                  <div className="text-[9px] text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded font-medium inline-block mt-0.5">
                                    เบิกใช้ {item.usedQuantity} / {item.quantity} หน่วย
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[10px]">ยังไม่เบิกจ่ายใช้งาน</span>
                            )}
                          </td>
                          
                          <td className="py-2 px-2 text-center font-mono text-[10px] font-bold text-amber-700">
                            {item.workOrderNumber || '-'}
                          </td>
                        </tr>
                      ))}
                      
                      {/* Aggregate totals row */}
                      <tr className="bg-slate-50 print-bg-slate font-bold">
                        <td colSpan={4} className="py-3 px-3 text-right border-r border-slate-200 print-border font-sans">สรุปรวมเฉพาะโครงการ ({projectKey === 'ALL' ? 'ทั้งหมด' : projectKey})</td>
                        <td className="py-3 px-3 text-center border-r border-slate-200 print-border font-mono">{totalQty} หน่วย</td>
                        <td className="py-3 px-3 text-right border-r border-slate-200 print-border font-mono text-xs text-slate-950 print:text-black">
                          {formatCurrency(totalCost)}
                        </td>
                        <td colSpan={2} className="py-3 px-3"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Signature and Approval workflow section */}
                <div className="grid grid-cols-3 gap-6 text-center text-xs mt-10 pt-5 border-t border-dashed border-slate-300 print-border" id={`invoice-signatures-${index}`}>
                  <div className="space-y-8" id={`signature-block-creator-${index}`}>
                    <p className="text-slate-500 print:text-black font-semibold text-[11px]">ผู้จัดทำรายงาน / เบิกจ่าย</p>
                    <div className="w-40 mx-auto border-b border-slate-400 py-3"></div>
                    <div>
                      <p className="font-semibold text-slate-800 print:text-black">( ubsine02011989 )</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">วันที่: ..... / ..... / 2569</p>
                    </div>
                  </div>

                  <div className="space-y-8" id={`signature-block-inspector-${index}`}>
                    <p className="text-slate-500 print:text-black font-semibold text-[11px]">ผู้ตรวจสอบ / นายทะเบียนพัสดุ</p>
                    <div className="w-40 mx-auto border-b border-slate-400 py-3"></div>
                    <div>
                      <p className="font-semibold text-slate-800 print:text-black">( .................................................... )</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">วันที่: ..... / ..... / 2569</p>
                    </div>
                  </div>

                  <div className="space-y-8" id={`signature-block-receiver-${index}`}>
                    <p className="text-slate-500 print:text-black font-semibold text-[11px]">ผู้อนุมัติ / ช่างผู้ตรวจรับงาน</p>
                    <div className="w-40 mx-auto border-b border-slate-400 py-3"></div>
                    <div>
                      <p className="font-semibold text-slate-800 print:text-black">( .................................................... )</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">วันที่: ..... / ..... / 2569</p>
                    </div>
                  </div>
                </div>

                {/* System Footer stamp */}
                <div className="mt-12 text-center text-[9px] text-slate-400 border-t border-slate-150 pt-3" id={`invoice-system-stamp-${index}`}>
                  <p>รายงานนี้จัดทำในระบบพัสดุออฟไลน์เพื่อสนับสนุนข้อมูลโครงการ: <span className="font-bold">{projectKey === 'ALL' ? 'ทุกโครงการ' : projectKey}</span></p>
                  <p className="mt-0.5">วันที่พิมพ์: {formatThaiDate(new Date().toISOString(), true)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
