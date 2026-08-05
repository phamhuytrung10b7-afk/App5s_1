import React, { useState } from 'react';
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

  // Edit Buffer Modal state
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
    if (window.confirm(`Bạn có chắc muốn giải phóng trống Kệ Buffer ${locationId}?`)) {
      storageService.clearBufferLocation(locationId);
      setMessage({ type: 'success', text: `Đã dọn trống kệ ${locationId}` });
      setSelectedBuffer(null);
      onRefresh();
    }
  };

  const filteredBuffers = buffers.filter((b) => {
    if (!filterPart.trim()) return true;
    const query = filterPart.toLowerCase();
    return (
      b.locationId.toLowerCase().includes(query) ||
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
              Ma trận giám sát thời gian thực các ô kệ chứa thùng xanh linh kiện sẵn sàng cấp cho Dây Chuyền. Tích hợp thuật toán cảnh báo FIFO First tự động.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsQrScannerOpen(!isQrScannerOpen)}
            className="px-5 py-3 bg-white text-emerald-950 hover:bg-emerald-50 font-extrabold rounded-2xl shadow-lg transition-all flex items-center space-x-2 cursor-pointer text-xs sm:text-sm shrink-0"
          >
            <QrCode className="w-5 h-5 text-emerald-700" />
            <span>QUÉT QR BỘ ĐỌC TRUY XUẤT</span>
          </button>
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
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
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
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Tìm theo mã kệ, mã linh kiện..."
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
              className={`relative rounded-3xl p-5 border transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between min-h-[170px] ${
                isCallPending
                  ? 'bg-amber-50/90 border-amber-300 ring-2 ring-amber-400/50'
                  : isReady
                  ? 'bg-emerald-50/90 border-emerald-300 hover:border-emerald-500'
                  : 'bg-slate-50 border-slate-200 opacity-80 hover:opacity-100'
              }`}
            >
              {/* Header Badge */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
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
                >
                  <Edit3 className="w-4 h-4" />
                </button>
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

      {/* Modal: Edit / Inspect Buffer Location */}
      {selectedBuffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-4">
            <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-500/30 rounded-xl font-mono font-black text-emerald-100">
                  {selectedBuffer.locationId}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Cập Nhật Kệ OUTBUFFER</h3>
                  <p className="text-emerald-200 text-xs">Quản lý tồn kho linh kiện trong thùng xanh</p>
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
              <div>
                <label className="block font-bold text-slate-800 mb-1">Mã Linh Kiện</label>
                <input
                  type="text"
                  placeholder="Ví dụ: LK-RES-10K-0805"
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

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleClearShelf(selectedBuffer.locationId)}
                  className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-bold transition-all cursor-pointer inline-flex items-center space-x-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Dọn Trống Kệ</span>
                </button>

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
