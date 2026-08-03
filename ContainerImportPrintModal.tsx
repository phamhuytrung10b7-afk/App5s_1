import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Part, AppSettings, ContainerBatch, ContainerQrTag } from './types';
import { QRCodeSVG } from 'qrcode.react';
import { printHtml } from './printHelper';
import { getSavedPrintConfigs, savePrintConfigs, PrintLayout, AllPrintConfigs } from './printConfig';

import {
  FileSpreadsheet,
  Upload,
  Printer,
  X,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  QrCode,
  Tag,
  Package,
  Layers,
  Search,
  Check, Settings2,
  Eye, 
  Settings,
  History,
  Trash2,
  Clock,
  RotateCcw,
} from 'lucide-react';
import {
  parseContainerExcel,
  ContainerImportResult,
  ContainerImportItem,
} from './containerParser';
import { storageService } from './storage';

interface ContainerImportPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  parts: Part[];
  settings: AppSettings;
  onRefreshParts: () => void;
}

export const ContainerImportPrintModal: React.FC<ContainerImportPrintModalProps> = ({
  isOpen,
  onClose,
  parts,
  settings,
  onRefreshParts,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ContainerImportResult | null>(null);
  const [contNumber, setContNumber] = useState('GAOU7800407');
  const [contDate, setContDate] = useState('16/07/2026');
  const [isAddingNewParts, setIsAddingNewParts] = useState(false);
  const [addedSuccessMsg, setAddedSuccessMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'import' | 'history' | 'preview'>('import');
  const [labelLayout, setLabelLayout] = useState<'double' | 'single' | 'a7'>('double');
  const [printConfigs, setPrintConfigs] = useState<AllPrintConfigs>(getSavedPrintConfigs());
  const printRef = useRef<HTMLDivElement>(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    savePrintConfigs(printConfigs);
  }, [printConfigs]);
 // 'double' = 73x22mm (2 tem / hàng), 'single' = 35x22mm
  const [searchTerm, setSearchTerm] = useState('');
  const [savedBatches, setSavedBatches] = useState<ContainerBatch[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load saved container batches when modal opens
  useEffect(() => {
    if (isOpen) {
      setSavedBatches(storageService.getContainerBatches());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Real-time scanned QR tokens lookup
  const usedTokens = storageService.getUsedQrTokens();
  const checkScanStatus = (tagId?: string, qrPayload?: string) => {
    if (tagId && usedTokens[tagId]) {
      return { isScanned: true, details: usedTokens[tagId] };
    }
    if (qrPayload && usedTokens[qrPayload]) {
      return { isScanned: true, details: usedTokens[qrPayload] };
    }
    return { isScanned: false };
  };

  const saveBatchToStorage = (cNum: string, cDate: string, itemsList: ContainerImportItem[]) => {
    const qrTags: ContainerQrTag[] = itemsList.map((item) => ({
      id: item.tagId || `TAG-${item.code}-${Math.random().toString(36).substring(2, 6)}`,
      partCode: item.code,
      partName: item.name,
      unit: item.unit,
      quantity: item.quantity,
      contNumber: cNum,
      contDate: cDate,
      qrPayload: item.qrPayload,
      printCopies: item.printCopies || 1,
    }));

    const batchObj: ContainerBatch = {
      id: `batch-${cNum.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now()}`,
      contNumber: cNum,
      contDate: cDate,
      createdAt: new Date().toISOString(),
      totalItems: itemsList.length,
      totalQuantity: itemsList.reduce((sum, i) => sum + i.quantity, 0),
      items: qrTags,
    };

    storageService.saveContainerBatch(batchObj);
    setSavedBatches(storageService.getContainerBatches());
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setAddedSuccessMsg(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result as ArrayBuffer;
        const result = parseContainerExcel(buffer, parts);
        setParseResult(result);
        setContNumber(result.contNumber || 'GAOU7800407');
        setContDate(result.contDate || '16/07/2026');

        // Automatically save batch to storage history so user can re-print anytime
        saveBatchToStorage(result.contNumber || 'GAOU7800407', result.contDate || '16/07/2026', result.items);
      } catch (err: any) {
        console.error('Lỗi khi đọc file Excel Danh mục Cont:', err);
        alert('Lỗi đọc file Excel: ' + (err.message || 'Không khớp định dạng Danh Mục Cont'));
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  const handleContNumberChange = (newCont: string) => {
    setContNumber(newCont);
    if (parseResult) {
      // Update qrPayload for all items
      const updatedItems = parseResult.items.map((item) => ({
        ...item,
        contNumber: newCont,
        qrPayload: `CONT_IN|${item.code}|${item.quantity}|${newCont}`,
      }));
      setParseResult({
        ...parseResult,
        contNumber: newCont,
        items: updatedItems,
      });
    }
  };

  const handleContDateChange = (newDate: string) => {
    setContDate(newDate);
    if (parseResult) {
      const updatedItems = parseResult.items.map((item) => ({
        ...item,
        contDate: newDate,
      }));
      setParseResult({
        ...parseResult,
        contDate: newDate,
        items: updatedItems,
      });
    }
  };

  const handleSelectSavedBatch = (batch: ContainerBatch) => {
    const items: ContainerImportItem[] = batch.items.map((tag) => {
      const matchedPart = parts.find((p) => p.code.trim().toLowerCase() === tag.partCode.trim().toLowerCase());
      return {
        id: tag.id,
        tagId: tag.id,
        code: tag.partCode,
        name: tag.partName,
        unit: tag.unit,
        quantity: tag.quantity,
        contNumber: batch.contNumber,
        contDate: batch.contDate,
        matchedPart,
        isNewPart: !matchedPart,
        printCopies: tag.printCopies || 1,
        qrPayload: tag.qrPayload || `CONT_IN|${tag.partCode}|${tag.quantity}|${batch.contNumber}|${tag.id}|${batch.contDate}`,
      };
    });

    setContNumber(batch.contNumber);
    setContDate(batch.contDate);
    setParseResult({
      contNumber: batch.contNumber,
      contDate: batch.contDate,
      items,
      totalQuantity: batch.totalQuantity,
      newPartsCount: items.filter((i) => i.isNewPart).length,
      matchedPartsCount: items.filter((i) => !i.isNewPart).length,
    });

    setActiveTab('preview');
  };

  const handleDeleteSavedBatch = (batchId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Bạn có chắc muốn xóa lịch sử mã QR Cont này?')) {
      storageService.deleteContainerBatch(batchId);
      setSavedBatches(storageService.getContainerBatches());
    }
  };

  const handleAddMissingPartsToSystem = () => {
    if (!parseResult) return;
    setIsAddingNewParts(true);

    let addedCount = 0;
    const currentParts = storageService.getParts();

    parseResult.items.forEach((item) => {
      const exists = currentParts.some(
        (p) => p.code.trim().toLowerCase() === item.code.trim().toLowerCase()
      );

      if (!exists) {
        storageService.addPart({
          code: item.code,
          name: item.name,
          description: `Thêm tự động từ file Danh Mục Cont ${contNumber}`,
          location: 'Kệ Cont',
          unit: item.unit || 'Cái',
          currentStock: 0, // Tồn ban đầu = 0, sẽ cộng dồn khi Nhập kho
          minStock: 10,
          barcode: item.code,
          qrCode: item.code,
          note: `Cont: ${contNumber}`,
        });
        addedCount++;
      }
    });

    onRefreshParts();
    setIsAddingNewParts(false);

    // Re-parse with updated parts
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const buffer = evt.target?.result as ArrayBuffer;
        const updatedParts = storageService.getParts();
        const newResult = parseContainerExcel(buffer, updatedParts);
        setParseResult(newResult);
      };
      reader.readAsArrayBuffer(file);
    }

    setAddedSuccessMsg(
      `Thành công! Đã thêm ${addedCount} linh kiện mới vào hệ thống danh mục.`
    );
  };

  const handleQuantityChange = (itemId: string, copies: number) => {
    if (!parseResult) return;
    const updated = parseResult.items.map((it) =>
      it.id === itemId ? { ...it, printCopies: Math.max(0, copies) } : it
    );
    setParseResult({ ...parseResult, items: updated });
  };

  const handlePrint = () => {
    if (printRef.current) {
      const styles = `
        .label-row {
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          box-sizing: border-box;
          page-break-after: always;
          break-after: page;
          overflow: hidden;
          background-color: white;
        }
        .single-label {
          box-sizing: border-box;
          display: flex;
          overflow: hidden;
          background-color: white;
        }
      `;
      printHtml(printRef.current.innerHTML, styles);
    }
  };

  // Build array of label items to print based on printCopies
  const printLabelItems: ContainerImportItem[] = [];
  if (parseResult) {
    parseResult.items.forEach((item) => {
      for (let i = 0; i < item.printCopies; i++) {
        printLabelItems.push(item);
      }
    });
  }

  // Calculate scan progress for current parse result
  const currentParseScannedCount = parseResult
    ? parseResult.items.filter((item) => checkScanStatus(item.tagId || item.id, item.qrPayload).isScanned).length
    : 0;
  const currentParseTotalItems = parseResult ? parseResult.items.length : 0;
  const currentParsePercent = currentParseTotalItems > 0 ? Math.round((currentParseScannedCount / currentParseTotalItems) * 100) : 0;

  // Filter items by search
  const filteredItems = parseResult
    ? parseResult.items.filter(
        (it) =>
          it.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          it.code.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  // Group labels into rows for 2-up (tem đôi 73x22mm)
  const labelRows: ContainerImportItem[][] = [];
  
    for (let i = 0; i < printLabelItems.length; i++) {
      labelRows.push([printLabelItems[i]]);
    
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-md">
              <FileSpreadsheet className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg flex items-center space-x-2">
                <span>IN TEM QR KHO THEO DANH MỤC CONT (FILE EXCEL)</span>
                <span className="px-2 py-0.5 text-[11px] bg-amber-400 text-slate-950 font-black rounded-full">
                  Tem 73x22mm
                </span>
              </h3>
              <p className="text-xs text-emerald-200 mt-0.5">
                Tự động đọc Cột Mã VT, Tên VT, ĐVT & Cột XUẤT (Số lượng). Tạo mã QR chứa số lượng để quét tự động Nhập Kho.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {parseResult && (
              <button
                onClick={handlePrint}
                disabled={printLabelItems.length === 0}
                className="flex items-center space-x-2 px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-black rounded-xl shadow-lg transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>In {printLabelItems.length} Tem Ngay</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 text-white rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab & Bar */}
        <div className="p-3 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2">
            <div className="flex items-center bg-slate-200 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('import')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'import'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>1. Tải File Excel Cont</span>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'history'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <History className="w-4 h-4" />
                <span>2. Lịch Sử Cont Đã Tạo ({savedBatches.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                disabled={!parseResult}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'preview'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                } ${!parseResult ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Eye className="w-4 h-4" />
                <span>3. Xem Mẫu In Tem ({printLabelItems.length} tem)</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-3 text-xs font-semibold text-slate-700">
              <div className="flex items-center space-x-1">
                <span className="text-slate-500">Khổ giấy:</span>
                <select
                  value={labelLayout}
                  onChange={(e) => setLabelLayout(e.target.value as 'double' | 'single' | 'a7')}
                  className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg font-bold text-emerald-800 focus:outline-hidden cursor-pointer"
                >
                  <option value="double">Tem Đôi (73x22mm)</option>
                  <option value="single">Tem Đơn (35x22mm)</option>
                  <option value="a7">Khổ A7 (74x105mm)</option>
                </select>
              </div>
              <button
                  onClick={() => setShowSettings(!showSettings)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border transition-colors ${
                      showSettings ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
              >
                  <Settings2 className="w-4 h-4" />
                  <span>Cài đặt kích thước</span>
              </button>
            </div>
          </div>
          
          {showSettings && (
              <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-3 gap-4">
                  <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Cỡ chữ Tên (px)</label>
                      <input type="number" value={printConfigs[labelLayout].nameFontSize} onChange={(e) => setPrintConfigs({...printConfigs, [labelLayout]: {...printConfigs[labelLayout], nameFontSize: Number(e.target.value)}})} className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-mono" />
                  </div>
                  <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Cỡ chữ Mã (px)</label>
                      <input type="number" value={printConfigs[labelLayout].codeFontSize} onChange={(e) => setPrintConfigs({...printConfigs, [labelLayout]: {...printConfigs[labelLayout], codeFontSize: Number(e.target.value)}})} className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-mono" />
                  </div>
                  <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Kích thước QR (mm)</label>
                      <input type="number" value={printConfigs[labelLayout].qrSize} onChange={(e) => setPrintConfigs({...printConfigs, [labelLayout]: {...printConfigs[labelLayout], qrSize: Number(e.target.value)}})} className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-mono" />
                  </div>
              </div>
          )}

        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'import' ? (
            <div className="h-full flex flex-col p-4 space-y-4 overflow-y-auto">
              {/* File Upload Banner */}
              <div className="p-5 bg-emerald-50/60 border-2 border-dashed border-emerald-300 rounded-2xl text-center space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="inline-flex p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
                  <FileSpreadsheet className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-emerald-950">
                    Tải Tệp Excel "DANH MỤC CONT" Lên Hệ Thống
                  </h4>
                  <p className="text-xs text-slate-500 max-w-lg mx-auto mt-1">
                    Tự động bỏ qua các cột bị Ẩn (Hide). Đọc Mã VT, Tên VT, ĐVT và số lượng ở cột XUẤT (tính đúng các biểu thức như 384+384 hay số 1.000).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer inline-flex items-center space-x-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>{file ? `Đã chọn: ${file.name}` : 'Chọn File Excel Danh Mục Cont (.xlsx)'}</span>
                </button>
              </div>

              {addedSuccessMsg && (
                <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{addedSuccessMsg}</span>
                </div>
              )}

              {/* Parsed Result Section */}
              {parseResult && (
                <div className="space-y-3 flex-1 flex flex-col min-h-0">
                  {/* Container Info & Stats Bar */}
                  <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-wrap items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                        <Package className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-xs text-slate-400 font-medium">Mã Số Cont:</span>
                            <input
                              type="text"
                              value={contNumber}
                              onChange={(e) => handleContNumberChange(e.target.value)}
                              className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded-md font-mono font-bold text-emerald-400 text-xs outline-hidden w-28"
                            />
                          </div>

                          <div className="flex items-center space-x-1.5">
                            <span className="text-xs text-slate-400 font-medium">Ngày Cont:</span>
                            <input
                              type="text"
                              value={contDate}
                              onChange={(e) => handleContDateChange(e.target.value)}
                              className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded-md font-mono font-bold text-amber-300 text-xs outline-hidden w-24"
                            />
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Tổng số dòng vật tư: <strong>{parseResult.items.length}</strong> | Tổng SL Cont về (XUẤT):{' '}
                          <strong className="text-amber-300">
                            {parseResult.totalQuantity.toLocaleString('vi-VN')}
                          </strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {parseResult.newPartsCount > 0 && (
                        <button
                          onClick={handleAddMissingPartsToSystem}
                          disabled={isAddingNewParts}
                          className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-sm flex items-center space-x-1.5"
                        >
                          <PlusCircle className="w-4 h-4" />
                          <span>Tạo {parseResult.newPartsCount} Linh Kiện Mới Vào Hệ Thống</span>
                        </button>
                      )}
                      <button
                        onClick={() => setActiveTab('preview')}
                        className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-sm flex items-center space-x-1.5"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Xem Mẫu In Tem</span>
                      </button>
                    </div>
                  </div>

                  {/* Search filter in parsed table */}
                  <div className="relative shrink-0">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Tìm theo Mã VT hoặc Tên VT trong danh mục Cont..."
                      className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-hidden"
                    />
                  </div>

                  {/* Parsed Items Table */}
                  <div className="flex-1 overflow-y-auto border border-slate-200 rounded-2xl bg-white">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 z-10 border-b border-slate-200">
                        <tr>
                          <th className="p-3 w-12 text-center">STT</th>
                          <th className="p-3">Mã VT</th>
                          <th className="p-3">Tên VT</th>
                          <th className="p-3 text-center">ĐVT</th>
                          <th className="p-3 text-center font-black text-amber-700 bg-amber-50/60">
                            Số Lượng Cont (XUẤT)
                          </th>
                          <th className="p-3 text-center">Mã QR Sẽ Tạo</th>
                          <th className="p-3 text-center">Trạng Thái Hệ Thống</th>
                          <th className="p-3 text-center">Trạng Thái Quét QR</th>
                          <th className="p-3 text-center w-28">Số Tem In</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredItems.map((item, index) => {
                          const scanState = checkScanStatus(item.tagId || item.id, item.qrPayload);
                          return (
                            <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${scanState.isScanned ? 'bg-emerald-50/40' : ''}`}>
                              <td className="p-3 text-center font-semibold text-slate-400">{index + 1}</td>
                              <td className="p-3 font-mono font-bold text-emerald-800">{item.code}</td>
                              <td className="p-3 font-extrabold text-slate-900">{item.name}</td>
                              <td className="p-3 text-center font-bold text-slate-600">{item.unit}</td>
                              <td className="p-3 text-center font-black text-base text-amber-700 bg-amber-50/30">
                                {item.quantity.toLocaleString('vi-VN')}
                              </td>
                              <td className="p-3 text-center font-mono text-[10px] text-slate-500">
                                <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-md">
                                  {item.qrPayload}
                                </span>
                              </td>
                              <td className="p-3 text-center">
                                {item.isNewPart ? (
                                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-bold text-[10px]">
                                    <AlertCircle className="w-3 h-3 text-amber-600" />
                                    <span>Linh kiện mới</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span>Đã có (Tồn: {item.matchedPart?.currentStock})</span>
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-center">
                                {scanState.isScanned ? (
                                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-emerald-600 text-white rounded-full font-extrabold text-[10px] shadow-xs">
                                    <CheckCircle2 className="w-3 h-3 text-white" />
                                    <span>Đã quét nhập kho</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-slate-100 text-slate-500 border border-slate-200 rounded-full font-bold text-[10px]">
                                    <Clock className="w-3 h-3 text-slate-400" />
                                    <span>Chưa quét</span>
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-center">
                                <input
                                  type="number"
                                  min={0}
                                  max={50}
                                  value={item.printCopies}
                                  onChange={(e) =>
                                    handleQuantityChange(item.id, parseInt(e.target.value) || 0)
                                  }
                                  className="w-16 text-center px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg font-bold text-emerald-700 text-xs outline-hidden focus:ring-2 focus:ring-emerald-500"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === 'history' ? (
            /* HISTORY TAB (Danh sách các đợt Cont đã tạo tem QR để in lại & theo dõi tiến độ) */
            <div className="h-full overflow-y-auto p-6 bg-slate-50 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 flex items-center space-x-2">
                    <History className="w-5 h-5 text-emerald-600" />
                    <span>LỊCH SỬ VÀ TIẾN ĐỘ QUÉT NHẬP KHO CÁC LÔ CONT</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Theo dõi màu sắc và phần trăm tiến độ nhập kho lên kệ của từng lô Cont sau khi quét mã QR tem in.
                  </p>
                </div>
              </div>

              {savedBatches.length === 0 ? (
                <div className="p-10 text-center bg-white border border-slate-200 rounded-2xl space-y-3">
                  <Clock className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-600">Chưa có lịch sử mã QR Cont nào được lưu.</p>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    Khi bạn chọn file Excel "Danh Mục Cont" ở Tab 1, hệ thống sẽ tự động tạo mã QR độc nhất và lưu lại danh sách tại đây.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {savedBatches.map((batch) => {
                    const batchScannedCount = batch.items.filter(
                      (tag) => checkScanStatus(tag.id, tag.qrPayload).isScanned
                    ).length;
                    const batchTotal = batch.items.length;
                    const batchPercent = batchTotal > 0 ? Math.round((batchScannedCount / batchTotal) * 100) : 0;
                    const batchIsComplete = batchTotal > 0 && batchScannedCount === batchTotal;

                    return (
                      <div
                        key={batch.id}
                        className={`p-5 bg-white border rounded-2xl shadow-xs transition-all space-y-3 group ${
                          batchIsComplete
                            ? 'border-emerald-400 bg-emerald-50/30'
                            : batchScannedCount > 0
                            ? 'border-amber-300 bg-amber-50/20'
                            : 'border-slate-200 hover:border-emerald-400'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`p-3 rounded-2xl font-black text-xs font-mono ${
                              batchIsComplete
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : batchScannedCount > 0
                                ? 'bg-amber-500 text-white'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              CONT
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <h5 className="font-black text-base text-slate-900 font-mono">
                                  {batch.contNumber}
                                </h5>
                                {batchIsComplete ? (
                                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-[10px] font-black flex items-center space-x-1">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    <span>ĐÃ NHẬP HẾT LÊN KỆ (100%)</span>
                                  </span>
                                ) : batchScannedCount > 0 ? (
                                  <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-[10px] font-black flex items-center space-x-1">
                                    <Clock className="w-3 h-3 text-amber-600" />
                                    <span>ĐANG NHẬP KHO ({batchPercent}%)</span>
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-[10px] font-bold">
                                    CHƯA QUÉT (0%)
                                  </span>
                                )}
                              </div>
                              <p className="text-xs font-bold text-amber-700 mt-0.5">
                                Ngày Cont: {batch.contDate}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => handleDeleteSavedBatch(batch.id, e)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                            title="Xóa lô Cont này"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Progress Bar for Batch */}
                        <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className="text-slate-600">Tiến độ nhập kệ Cont:</span>
                            <span className={`font-mono font-black ${batchIsComplete ? 'text-emerald-700' : 'text-amber-800'}`}>
                              {batchScannedCount} / {batchTotal} mã đã quét ({batchPercent}%)
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ${
                                batchIsComplete
                                  ? 'bg-emerald-500'
                                  : batchScannedCount > 0
                                  ? 'bg-amber-500'
                                  : 'bg-slate-300'
                              }`}
                              style={{ width: `${batchPercent}%` }}
                            />
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-slate-50 p-2.5 rounded-xl">
                            <span className="text-slate-400 text-[11px]">Tổng số mã VT:</span>
                            <p className="font-extrabold text-slate-800">{batch.totalItems} loại linh kiện</p>
                          </div>
                          <div className="bg-slate-50 p-2.5 rounded-xl">
                            <span className="text-slate-400 text-[11px]">Tổng SL Cont về:</span>
                            <p className="font-extrabold text-emerald-700">
                              {batch.totalQuantity.toLocaleString('vi-VN')}
                            </p>
                          </div>
                        </div>

                        <div className="pt-2 flex items-center justify-between text-xs">
                          <span className="text-[11px] text-slate-400">
                            Tạo lúc: {new Date(batch.createdAt).toLocaleString('vi-VN')}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleSelectSavedBatch(batch)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5 text-amber-300" />
                            <span>Xem Tem & Nhận Biết Mã</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* PREVIEW TEMPLATE TAB (73x22mm / 35x22mm) WITH SCANNED COLOR RECOGNITION */
            <div className="h-full overflow-y-auto p-6 bg-slate-200/80 space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-300 shadow-xs space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="font-black text-slate-900 text-sm">
                        Mẫu Tem QR Cho Danh Mục Cont {contNumber} ({'Khổ A7 74x105mm'})
                      </p>
                    </div>
                    <p className="text-slate-500 mt-0.5">
                      Tem nhúng mã QR thông minh. Nhận biết mã QR đã quét bằng <span className="font-bold text-emerald-700 bg-emerald-100 px-1 rounded-xs">khung xanh lá tươi</span>.
                    </p>
                  </div>
                  <button
                    onClick={handlePrint}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center space-x-1.5"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Bắt Đầu In Giấy Tem</span>
                  </button>
                </div>

                {/* Progress Bar Header */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-slate-700">Tiến độ nhập kệ Cont:</span>
                    <div className="w-40 sm:w-56 bg-slate-200 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          currentParsePercent === 100
                            ? 'bg-emerald-500'
                            : currentParsePercent > 0
                            ? 'bg-amber-500'
                            : 'bg-slate-300'
                        }`}
                        style={{ width: `${currentParsePercent}%` }}
                      />
                    </div>
                    <span className="font-mono font-black text-emerald-800">
                      {currentParseScannedCount}/{currentParseTotalItems} tem ({currentParsePercent}%)
                    </span>
                  </div>

                  {currentParsePercent === 100 ? (
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg font-black text-xs flex items-center space-x-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Đã Nhập Hết 100% Lên Kệ</span>
                    </span>
                  ) : currentParseScannedCount > 0 ? (
                    <span className="px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-lg font-black text-xs flex items-center space-x-1">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span>Đang Nhập Kho (Còn {currentParseTotalItems - currentParseScannedCount} tem chưa quét)</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-lg font-bold text-xs">
                      Chưa Quét Tem Nào (0%)
                    </span>
                  )}
                </div>
              </div>

              {labelRows.length === 0 ? (
                <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-300">
                  Chưa có tem nào được chọn in.
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-3 pb-8">
                  {labelRows.map((row, rowIndex) => (
                    <div
                      key={`label-row-${rowIndex}-${row[0]?.id || row[0]?.tagId || ''}`}
                      className="bg-white border-2 border-dashed border-slate-400 p-1.5 rounded-lg shadow-md flex items-center space-x-1.5 bg-amber-50/20"
                      style={{
                        width: labelLayout === 'double' ? '420px' : '210px',
                        height: '400px',
                      }}
                    >
                      {row.map((item, colIndex) => {
                        const scanState = checkScanStatus(item.tagId || item.id, item.qrPayload);
                        const isScanned = scanState.isScanned;

                        return (
                          <div
                            key={item.tagId || item.id || `col-${rowIndex}-${colIndex}`}
                            className={`flex-1 h-full rounded-md p-2 flex items-center justify-between overflow-hidden shadow-2xs relative border transition-all ${
                              isScanned
                                ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-400/80 shadow-emerald-100'
                                : 'bg-white border-slate-300'
                            }`}
                          >
                            {/* Scanned Badge Indicator */}
                            <div className="absolute top-0.5 right-1 z-10 flex items-center space-x-1">
                              {isScanned ? (
                                <span className="px-1.5 py-0.5 bg-emerald-600 text-white font-black text-[8px] rounded-xs shadow-xs flex items-center space-x-0.5 uppercase tracking-wider">
                                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                                  <span>ĐÃ SCAN</span>
                                </span>
                              ) : (
                                <span className="text-[8px] font-mono font-bold text-slate-400 bg-slate-100 px-1 rounded-xs border border-slate-200">
                                  CHƯA QUÉT
                                </span>
                              )}
                            </div>

                            {/* Left: QR Code */}
                            <div className="shrink-0 pr-2">
                              <QRCodeSVG
                                value={item.qrPayload}
                                size={72}
                                level="M"
                                marginSize={0}
                              />
                            </div>

                            {/* Right: Part Details */}
                            <div className="flex-1 min-w-0 h-full flex flex-col justify-between py-0.5">
                              <div className="text-[9px] font-bold text-slate-500 truncate uppercase tracking-tighter flex items-center justify-between pr-14">
                                <span>CONT: {item.contNumber || contNumber}</span>
                                <span className="text-amber-700 font-bold">{item.contDate || contDate}</span>
                              </div>

                              <div>
                                <p className="text-[11px] font-black text-slate-900 leading-tight line-clamp-2">
                                  {item.name}
                                </p>
                                <p className={`text-[10px] font-mono font-bold mt-0.5 ${isScanned ? 'text-emerald-900 font-black' : 'text-emerald-800'}`}>
                                  {item.code}
                                </p>
                              </div>

                              <div className="flex items-center justify-between text-[10px] font-extrabold border-t border-slate-200 pt-0.5">
                                <span className="text-slate-500">{item.unit}</span>
                                <span className={`px-1 rounded-xs font-mono ${isScanned ? 'bg-emerald-600 text-white font-black' : 'bg-amber-400 text-slate-950'}`}>
                                  SL: {item.quantity.toLocaleString('vi-VN')}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {labelLayout === 'double' && row.length === 1 && (
                        <div className="flex-1 h-full bg-slate-100 border border-dashed border-slate-300 rounded-md p-2 flex items-center justify-center text-[10px] text-slate-400 italic">
                          (Tem trống)
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0 text-xs text-slate-500">
          <span>
            * Mẹo in: Chọn máy in tem nhiệt (Godex/Xprinter), Khổ giấy {'74x105mm'}, Margins = None.
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold cursor-pointer transition-colors"
            >
              Đóng
            </button>
            {parseResult && (
              <button
                onClick={handlePrint}
                disabled={printLabelItems.length === 0}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl font-bold shadow-md cursor-pointer transition-colors flex items-center space-x-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>In Ngay ({printLabelItems.length} tem)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      
                  {/* HIDDEN PRINT RENDERING */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', visibility: 'hidden', overflow: 'hidden' }}>
        <div ref={printRef}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {labelRows.map((row, rowIndex) => {
              const conf = printConfigs[labelLayout];
              return (
              <div key={rowIndex} className="label-row" style={{ 
                  width: `${conf.pageWidth}mm`, 
                  height: `${conf.pageHeight}mm`,
                  padding: `${conf.padding}mm`,
                  gap: labelLayout === 'double' ? '2mm' : '0'
              }}>
                {row.map((item, colIndex) => (
                  <div key={colIndex} className="single-label" style={{
                      width: labelLayout === 'double' ? '35mm' : (labelLayout === 'single' ? '33mm' : '100%'),
                      height: labelLayout === 'a7' ? '100%' : '20mm',
                      flexDirection: labelLayout === 'a7' ? 'column' : 'row',
                      alignItems: 'center',
                      border: labelLayout === 'a7' ? '1px solid #ccc' : '0.5px solid #ccc',
                      borderRadius: labelLayout === 'a7' ? '4mm' : '2mm',
                      padding: labelLayout === 'a7' ? '4mm' : '1mm'
                  }}>
                    {labelLayout === 'a7' ? (
                        <>
                            <div style={{ textAlign: 'center', width: '100%' }}>
                                <div style={{ fontSize: `${conf.metaFontSize}px`, fontWeight: 'bold', color: '#555', marginBottom: '4mm', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>CONT: {item.contNumber || contNumber}</span>
                                    <span>{item.contDate || contDate}</span>
                                </div>
                                <div style={{ fontSize: `${conf.nameFontSize}px`, fontWeight: '900', color: '#000', marginBottom: '6mm', lineHeight: '1.3', wordBreak: 'break-word', overflow: 'hidden' }}>
                                    {item.name}
                                </div>
                                <div style={{ fontSize: `${conf.codeFontSize}px`, fontWeight: 'bold', fontFamily: 'monospace', color: '#065f46', padding: '3mm', background: '#f1f5f9', borderRadius: '2mm', display: 'inline-block' }}>
                                    {item.code}
                                </div>
                            </div>
                            <div style={{ width: `${conf.qrSize}mm`, height: `${conf.qrSize}mm`, margin: '4mm 0' }}>
                              <QRCodeSVG
                                value={item.qrPayload}
                                size={300}
                                level="Q"
                                marginSize={1}
                                style={{ width: '100%', height: '100%' }}
                              />
                            </div>
                            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '2mm', marginTop: 'auto' }}>
                                <div style={{ fontSize: `${conf.metaFontSize + 4}px`, fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #ccc', paddingTop: '3mm' }}>
                                    <span>{item.unit}</span>
                                    <span style={{ fontFamily: 'monospace', fontWeight: '900', background: '#166534', color: 'white', padding: '1.5mm 4mm', borderRadius: '2mm' }}>SL: {item.quantity.toLocaleString('vi-VN')}</span>
                                </div>
                                <div style={{ fontSize: '12px', fontWeight: 'normal', color: '#64748b', textAlign: 'right' }}>
                                    Ngày in: {new Date().toLocaleDateString('vi-VN')}
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div style={{ width: `${conf.qrSize}mm`, height: `${conf.qrSize}mm`, flexShrink: 0, marginRight: '1mm' }}>
                              <QRCodeSVG
                                value={item.qrPayload}
                                size={128}
                                level="M"
                                marginSize={0}
                                style={{ width: '100%', height: '100%' }}
                              />
                            </div>
                            <div style={{ flex: 1, minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontFamily: 'sans-serif', lineHeight: '1.1' }}>
                              <div style={{ fontSize: `${conf.metaFontSize}px`, fontWeight: 'bold', color: '#555', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', justifyContent: 'space-between' }}>
                                <span>C: {item.contNumber || contNumber}</span>
                                <span>{item.contDate || contDate}</span>
                              </div>
                              <div>
                                <div style={{ fontSize: `${conf.nameFontSize}px`, fontWeight: '900', color: '#000', maxHeight: '11mm', overflow: 'hidden', wordBreak: 'break-word', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                                  {item.name}
                                </div>
                                <div style={{ fontSize: `${conf.codeFontSize}px`, fontWeight: 'bold', fontFamily: 'monospace', color: '#065f46', marginTop: '0.5mm' }}>
                                  {item.code}
                                </div>
                              </div>
                              <div style={{ fontSize: `${conf.metaFontSize}px`, fontWeight: 'bold', borderTop: '0.5px solid #ccc', paddingTop: '0.5mm', display: 'flex', justifyContent: 'space-between' }}>
                                <span>{item.unit}</span>
                                <span style={{ fontFamily: 'monospace', fontWeight: 'bold', backgroundColor: '#f59e0b', color: '#000', padding: '0 2px', borderRadius: '2px' }}>SL: {item.quantity.toLocaleString('vi-VN')}</span>
                              </div>
                            </div>
                        </>
                    )}
                  </div>
                ))}
                
                {labelLayout === 'double' && row.length === 1 && (
                  <div className="single-label" style={{ visibility: 'hidden', width: '35mm' }} />
                )}
              </div>
            )})}
          </div>
        </div>
      </div>
    </div>
  );
};
