import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { BufferLocationMap } from './types';
import { storageService } from './storage';
import {
  LayoutGrid,
  QrCode,
  Package,
  Clock,
  Zap,
  Sparkles,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Trash2,
  Edit3,
  X,
  Search,
  Upload,
  Download,
  Plus,
  Info,
} from 'lucide-react';
import { InlineQrScanner } from './InlineQrScanner';

interface BufferMapViewProps {
  buffers: BufferLocationMap[];
  onRefresh: () => void;
}

export const BufferMapView: React.FC<BufferMapViewProps> = ({ buffers, onRefresh }) => {
  const [selectedBuffer, setSelectedBuffer] = useState<BufferLocationMap | null>(null);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [filterPart, setFilterPart] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Add Shelf Modal state
  const [isAddShelfOpen, setIsAddShelfOpen] = useState(false);
  const [newLocId, setNewLocId] = useState('');
  const [newLocDesc, setNewLocDesc] = useState('');
  const [newLocQty, setNewLocQty] = useState(50);

  // Edit Buffer Modal state
  const [editLocId, setEditLocId] = useState('');
  const [editLocDesc, setEditLocDesc] = useState('');
  const [editPartCode, setEditPartCode] = useState('');
  const [editPartName, setEditPartName] = useState('');
  const [editUnit, setEditUnit] = useState('Con');
  const [editStockQty, setEditStockQty] = useState(0);
  const [editStandardQty, setEditStandardQty] = useState(50);

  // Find oldest shelf with goods for FIFO First Badge
  const readyBuffers = buffers.filter((b) => b.status === 'READY' || b.status === 'CALL_PENDING');
  let fifoOldestShelfId: string | null = null;
  if (readyBuffers.length > 0) {
    const sortedByAge = [...readyBuffers].sort(
      (a, b) => new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime()
    );
    fifoOldestShelfId = sortedByAge[0].locationId;
  }

  const handleOpenEditModal = (b: BufferLocationMap) => {
    setSelectedBuffer(b);
    setEditLocId(b.locationId);
    setEditLocDesc(b.description || '');
    setEditPartCode(b.partCode || '');
    setEditPartName(b.partName || '');
    setEditUnit(b.unit || 'Con');
    setEditStockQty(b.currentStockQty || 0);
    setEditStandardQty(b.containerStandardQty || 50);
  };

  const handleSaveBufferEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBuffer) return;

    try {
      const isNowEmpty = editStockQty <= 0 && !editPartCode.trim();
      storageService.updateBufferLocation(selectedBuffer.locationId, {
        description: editLocDesc.trim() || undefined,
        partCode: editPartCode.trim() || undefined,
        partName: editPartName.trim() || undefined,
        unit: editUnit,
        currentStockQty: editStockQty,
        containerStandardQty: editStandardQty,
        status: isNowEmpty ? 'EMPTY' : selectedBuffer.status === 'CALL_PENDING' ? 'CALL_PENDING' : 'READY',
      });

      setMessage({ type: 'success', text: `Đã cập nhật dữ liệu Kệ Buffer ${selectedBuffer.locationId}` });
      setSelectedBuffer(null);
      onRefresh();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Lỗi cập nhật kệ' });
    }
  };

  const handleClearShelf = (locationId: string) => {
    if (window.confirm(`Bạn có chắc muốn dọn trống linh kiện trên Kệ Buffer ${locationId}?`)) {
      storageService.clearBufferLocation(locationId);
      setMessage({ type: 'success', text: `Đã dọn trống linh kiện trên kệ ${locationId}` });
      setSelectedBuffer(null);
      onRefresh();
    }
  };

  const handleDeleteShelf = (locationId: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn XÓA VĨNH VIỄN Kệ Buffer ${locationId}?`)) return;
    try {
      storageService.deleteBufferLocation(locationId);
      setMessage({ type: 'success', text: `Đã xóa vĩnh viễn kệ ${locationId} khỏi sơ đồ` });
      setSelectedBuffer(null);
      onRefresh();
    } catch (err: any) {
      const errorMsg = err.message || 'Không thể xóa kệ này';
      alert(errorMsg);
      setMessage({ type: 'error', text: errorMsg });
    }
  };

  const handleAddShelfSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      storageService.addBufferLocation({
        locationId: newLocId,
        description: newLocDesc,
        containerStandardQty: newLocQty,
      });
      setMessage({ type: 'success', text: `Đã khai báo thành công kệ mới: ${newLocId}` });
      setIsAddShelfOpen(false);
      setNewLocId('');
      setNewLocDesc('');
      onRefresh();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        const result = storageService.importBufferLocationsFromRows(data);
        setMessage({
          type: 'success',
          text: `🎉 Đã khai báo Excel thành công: Thêm mới ${result.added} vị trí kệ, Cập nhật ${result.updated} kệ!`,
        });
        onRefresh();
      } catch (err: any) {
        setMessage({ type: 'error', text: 'Lỗi đọc file Excel khai báo vị trí: ' + err.message });
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const filteredBuffers = buffers.filter((b) => {
    if (!filterPart.trim()) return true;
    const query = filterPart.toLowerCase();
    return (
      b.locationId.toLowerCase().includes(query) ||
      (b.description && b.description.toLowerCase().includes(query)) ||
      (b.partCode && b.partCode.toLowerCase().includes(query)) ||
      (b.partName && b.partName.toLowerCase().includes(query))
    );
  });

  // Count summaries
  const readyCount = buffers.filter((b) => b.status === 'READY').length;
  const callPendingCount = buffers.filter((b) => b.status === 'CALL_PENDING').length;
  const emptyCount = buffers.filter((b) => b.status === 'EMPTY').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-cyan-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 bg-emerald-500/30 border border-emerald-300/30 text-emerald-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              <LayoutGrid className="w-3.5 h-3.5 text-emerald-300" />
              <span>OUTBUFFER LIVE MATRIX GRID</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Sơ Đồ Trực Quan Kệ OUTBUFFER
            </h1>
            <p className="text-emerald-100 text-xs sm:text-sm max-w-2xl">
              Ma trận giám sát thời gian thực các ô kệ chứa thùng xanh linh kiện sẵn sàng cấp cho Dây Chuyền. Khai báo vị trí kệ bằng Excel & quản lý FIFO tự động.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Upload Excel Button */}
            <label className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white font-extrabold rounded-2xl shadow-md transition-all flex items-center space-x-2 cursor-pointer text-xs shrink-0 border border-emerald-300/40">
              <Upload className="w-4 h-4 text-white" />
              <span>UPLOAD EXCEL KHAI BÁO VỊ TRÍ KỆ</span>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleExcelUpload}
                className="hidden"
              />
            </label>

            {/* Template Download Button */}
            <button
              type="button"
              onClick={() => storageService.downloadBufferImportTemplate()}
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-emerald-100 border border-white/20 font-bold rounded-2xl transition-all flex items-center space-x-1.5 cursor-pointer text-xs shrink-0"
              title="Tải file mẫu Excel cột 1: Tên vị trí, cột 2: Mô tả vị trí"
            >
              <Download className="w-4 h-4 text-emerald-200" />
              <span>File Mẫu Excel</span>
            </button>

            {/* Add New Shelf Button */}
            <button
              type="button"
              onClick={() => setIsAddShelfOpen(true)}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl shadow-md transition-all flex items-center space-x-1.5 cursor-pointer text-xs shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>THÊM KỆ MỚI</span>
            </button>

            {/* QR Reader Button */}
            <button
              type="button"
              onClick={() => setIsQrScannerOpen(!isQrScannerOpen)}
              className="px-4 py-2.5 bg-white text-emerald-950 hover:bg-emerald-50 font-extrabold rounded-2xl shadow-md transition-all flex items-center space-x-1.5 cursor-pointer text-xs shrink-0"
            >
              <QrCode className="w-4 h-4 text-emerald-700" />
              <span>QUÉT QR</span>
            </button>
          </div>
        </div>
      </div>

      {/* Message feedback */}
      {message && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between animate-in fade-in ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center space-x-3">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="font-semibold text-xs sm:text-sm">{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-xs font-bold underline hover:no-underline cursor-pointer">
            Đóng
          </button>
        </div>
      )}

      {/* QR Scanner Panel if Open */}
      {isQrScannerOpen && (
        <div className="bg-slate-900 text-white rounded-3xl p-5 border border-slate-700 shadow-xl space-y-3 animate-in zoom-in-95">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <QrCode className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-sm text-white">Camera Quét Mã QR Kệ Buffer</h3>
            </div>
            <button
              onClick={() => setIsQrScannerOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
            >
              ✕
            </button>
          </div>
          <InlineQrScanner
            onScanSuccess={(scannedText) => {
              const matched = buffers.find((b) => b.locationId.toLowerCase() === scannedText.trim().toLowerCase());
              if (matched) {
                handleOpenEditModal(matched);
                setIsQrScannerOpen(false);
                setMessage({ type: 'success', text: `Đã tìm thấy Kệ Buffer: ${matched.locationId}` });
              } else {
                setMessage({ type: 'error', text: `Không tìm thấy thông tin kệ cho mã: ${scannedText}` });
              }
            }}
            placeholderText="Đưa mã QR ô kệ OUTBUFFER vào ô vuông..."
          />
        </div>
      )}

      {/* Filter and Status Legend */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Status Legend Pills */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>SẴN SÀNG (READY): {readyCount}</span>
          </div>

          <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-bounce" />
            <span>ĐANG GỌI (CALL_PENDING): {callPendingCount}</span>
          </div>

          <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-xl">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
            <span>TRỐNG (EMPTY): {emptyCount}</span>
          </div>
        </div>

        {/* Search input */}
        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Tìm theo mã kệ, mô tả, mã linh kiện..."
            value={filterPart}
            onChange={(e) => setFilterPart(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
          />
        </div>
      </div>

      {/* OUTBUFFER Matrix Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredBuffers.map((buf) => {
          const isFifoNext = buf.locationId === fifoOldestShelfId;
          const isCallPending = buf.status === 'CALL_PENDING';
          const isReady = buf.status === 'READY';
          const isEmpty = buf.status === 'EMPTY';

          return (
            <div
              key={buf.locationId}
              onClick={() => handleOpenEditModal(buf)}
              className={`relative rounded-3xl p-5 border transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between min-h-[185px] ${
                isCallPending
                  ? 'bg-amber-50/90 border-amber-300 ring-2 ring-amber-400/50'
                  : isReady
                  ? 'bg-emerald-50/90 border-emerald-300 hover:border-emerald-500'
                  : 'bg-slate-50 border-slate-200 opacity-80 hover:opacity-100'
              }`}
            >
              {/* Header Badge */}
              <div>
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span
                      className={`font-mono font-black text-sm px-3 py-1 rounded-xl shadow-xs ${
                        isCallPending
                          ? 'bg-amber-600 text-white'
                          : isReady
                          ? 'bg-emerald-700 text-white'
                          : 'bg-slate-300 text-slate-700'
                      }`}
                    >
                      {buf.locationId}
                    </span>

                    {isFifoNext && !isEmpty && (
                      <span className="px-2 py-0.5 bg-pink-600 text-white text-[10px] font-black rounded-full animate-bounce shadow-md flex items-center space-x-1">
                        <Sparkles className="w-3 h-3" />
                        <span>FIFO FIRST</span>
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEditModal(buf);
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white/60 rounded-lg cursor-pointer"
                    title="Chỉnh sửa hoặc Xóa Kệ"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>

                {/* Location Description */}
                {buf.description && (
                  <p className="text-[11px] text-slate-600 font-medium line-clamp-1 italic mt-1">
                    📍 {buf.description}
                  </p>
                )}
              </div>

              {/* Shelf Content Info */}
              <div className="my-3 space-y-1">
                {isEmpty ? (
                  <div className="py-2 text-center text-slate-400">
                    <span className="text-xs font-bold uppercase tracking-wider block">KỆ TRỐNG</span>
                    <span className="text-[11px]">Sẵn sàng tiếp nhận thùng xanh</span>
                  </div>
                ) : (
                  <>
                    <p className="font-mono font-bold text-xs text-blue-900">{buf.partCode}</p>
                    <p className="font-semibold text-xs text-slate-800 line-clamp-2">{buf.partName}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                      <span className="text-slate-500 text-[11px]">Tồn Thùng Xanh:</span>
                      <span className="font-black text-sm text-emerald-800">
                        {buf.currentStockQty.toLocaleString('vi-VN')} {buf.unit || 'PCS'}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Footer status line */}
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 pt-2 border-t border-slate-200/40">
                <span className="flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{new Date(buf.lastUpdated).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                </span>
                <span className="uppercase font-extrabold text-[10px]">
                  {isCallPending ? '⚠️ ĐANG GỌI HÀNG' : isReady ? '✅ SẴN SÀNG' : 'TRỐNG'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Add New Shelf */}
      {isAddShelfOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-4">
            <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Plus className="w-5 h-5 text-amber-300" />
                <h3 className="text-base font-bold text-white">Thêm Vị Trí Kệ Outbuffer Mới</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddShelfOpen(false)}
                className="text-emerald-200 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddShelfSubmit} className="p-5 space-y-4 text-xs text-slate-700">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  1. Tên Vị Trí (Mã Kệ) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Kệ 1, Kệ 2, BUFFER-A1-05..."
                  value={newLocId}
                  onChange={(e) => setNewLocId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  2. Mô Tả Vị Trí (Ảnh 2)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Khoang 01 - Tầng 1 - Vị trí 1"
                  value={newLocDesc}
                  onChange={(e) => setNewLocDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  3. Quy Cách Sức Chứa Thùng Xanh Standard
                </label>
                <input
                  type="number"
                  min={1}
                  value={newLocQty}
                  onChange={(e) => setNewLocQty(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddShelfOpen(false)}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-md cursor-pointer transition-all"
                >
                  Tạo Vị Trí Kệ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit / Delete Buffer Location */}
      {selectedBuffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-4">
            <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-500/30 rounded-xl font-mono font-black text-emerald-100">
                  {selectedBuffer.locationId}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Chỉnh Sửa / Quản Lý Kệ OUTBUFFER</h3>
                  <p className="text-emerald-200 text-xs">Cập nhật thông tin vị trí và tồn kho linh kiện</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBuffer(null)}
                className="text-emerald-200 hover:text-white p-2 rounded-xl cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBufferEdit} className="p-5 space-y-4 text-xs text-slate-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Tên Vị Trí (Kệ)</label>
                  <input
                    type="text"
                    disabled
                    value={editLocId}
                    className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl font-mono font-bold text-slate-700 text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Mô Tả Vị Trí (Ảnh 2)</label>
                  <input
                    type="text"
                    placeholder="Khoang 01 - Tầng 1 - Vị trí 1"
                    value={editLocDesc}
                    onChange={(e) => setEditLocDesc(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-semibold text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Mã Linh Kiện Căn Lưu</label>
                <input
                  type="text"
                  placeholder="Ví dụ: 04-29-00-SHA76219CK-0004"
                  value={editPartCode}
                  onChange={(e) => setEditPartCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-mono font-bold text-purple-800 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Tên Linh Kiện</label>
                <input
                  type="text"
                  placeholder="Tên chi tiết linh kiện"
                  value={editPartName}
                  onChange={(e) => setEditPartName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-semibold text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Số Lượng Tồn Kho</label>
                  <input
                    type="number"
                    min={0}
                    value={editStockQty}
                    onChange={(e) => setEditStockQty(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-black text-emerald-700 text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Quy Cách Thùng Xanh</label>
                  <input
                    type="number"
                    min={1}
                    value={editStandardQty}
                    onChange={(e) => setEditStandardQty(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Shelf Status Warning if contains parts */}
              {(selectedBuffer.currentStockQty > 0 || selectedBuffer.partCode) && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] flex items-center space-x-2">
                  <Info className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    ⚠️ Kệ đang chứa linh kiện ({selectedBuffer.partCode || 'Đã khai báo'} - Tồn {selectedBuffer.currentStockQty} {selectedBuffer.unit || 'PCS'}). <strong>Không cho phép xóa kệ này</strong> cho tới khi dọn trống!
                  </span>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-slate-100">
                <div className="flex items-center space-x-2">
                  {/* Clear shelf button */}
                  <button
                    type="button"
                    onClick={() => handleClearShelf(selectedBuffer.locationId)}
                    className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl font-bold transition-all cursor-pointer inline-flex items-center space-x-1"
                    title="Dọn sạch linh kiện để trả về kệ trống"
                  >
                    <span>Dọn Trống Kệ</span>
                  </button>

                  {/* Delete Shelf Button (Disabled/Alert if stock > 0) */}
                  <button
                    type="button"
                    onClick={() => handleDeleteShelf(selectedBuffer.locationId)}
                    className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-bold transition-all cursor-pointer inline-flex items-center space-x-1 border border-rose-200"
                    title="Xóa vĩnh viễn vị trí kệ khỏi hệ thống"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa Kệ</span>
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setSelectedBuffer(null)}
                    className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-md cursor-pointer transition-all"
                  >
                    Lưu Thay Đổi
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
