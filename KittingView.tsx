import React, { useState } from 'react';
import { KittingQueueItem, AppSettings, BufferLocationMap } from './types';
import { storageService } from './storage';
import {
  Scissors,
  CheckCircle2,
  Clock,
  User,
  Package,
  AlertTriangle,
  QrCode,
  Zap,
  Check,
  TrendingUp,
  BarChart2,
  Trash2,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { InlineQrScanner } from './InlineQrScanner';

interface KittingViewProps {
  queue: KittingQueueItem[];
  settings: AppSettings;
  buffers: BufferLocationMap[];
  onRefresh: () => void;
}

export const KittingView: React.FC<KittingViewProps> = ({
  queue,
  settings,
  buffers,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [selectedItem, setSelectedItem] = useState<KittingQueueItem | null>(null);

  // Form states for modal
  const [kittedQty, setKittedQty] = useState<number>(0);
  const [scrapQty, setScrapQty] = useState<number>(0);
  const [durationMins, setDurationMins] = useState<number>(20);
  const [operator, setOperator] = useState<string>(settings.staffList[0] || 'Lê Hoàng Nam');
  const [targetBuffer, setTargetBuffer] = useState<string>('BUFFER-A1-01');
  const [isQrScanning, setIsQrScanning] = useState<boolean>(false);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filter items
  const pendingItems = queue.filter((i) => i.status === 'PENDING_KITTING');
  const completedItems = queue.filter((i) => i.status === 'IN_BUFFER' || i.status === 'DELIVERED');

  // KPI Calculations
  const totalKittedPCS = completedItems.reduce((acc, curr) => acc + (curr.kittedQuantity || 0), 0);
  const totalScrapPCS = completedItems.reduce((acc, curr) => acc + (curr.scrapQuantity || 0), 0);
  const avgDuration =
    completedItems.length > 0
      ? Math.round(
          completedItems.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0) /
            completedItems.length
        )
      : 0;
  const scrapRate =
    totalKittedPCS + totalScrapPCS > 0
      ? ((totalScrapPCS / (totalKittedPCS + totalScrapPCS)) * 100).toFixed(1)
      : '0.0';

  const handleOpenKittingModal = (item: KittingQueueItem) => {
    setSelectedItem(item);
    setKittedQty(item.rawQuantity);
    setScrapQty(0);
    setDurationMins(15);
    setOperator(item.operatorName || settings.staffList[0] || 'Lê Hoàng Nam');

    // Default buffer selection
    const matchingBuf = buffers.find((b) => b.partCode === item.partCode && b.status !== 'EMPTY');
    const emptyBuf = buffers.find((b) => b.status === 'EMPTY');
    setTargetBuffer(matchingBuf ? matchingBuf.locationId : emptyBuf ? emptyBuf.locationId : 'BUFFER-A1-01');
    setIsQrScanning(false);
  };

  const handleCompleteKitting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      storageService.completeKittingItem({
        id: selectedItem.id,
        kittedQuantity: kittedQty,
        scrapQuantity: scrapQty,
        bufferLocation: targetBuffer,
        operatorName: operator,
        durationMinutes: durationMins,
      });

      setMessage({
        type: 'success',
        text: `🎉 Đã bóc tách thành công ${kittedQty} ${selectedItem.unit} ${selectedItem.partCode} vào kệ ${targetBuffer}!`,
      });

      setSelectedItem(null);
      onRefresh();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Đã xảy ra lỗi khi bóc tách' });
    }
  };

  const handleDeleteItem = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bản ghi bóc tách này khỏi hàng chờ?')) {
      storageService.deleteKittingItem(id);
      onRefresh();
    }
  };

  // Real-time calculated productivity
  const liveProductivity =
    durationMins > 0 ? Math.round((kittedQty / (durationMins / 60)) * 10) / 10 : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-800 via-indigo-800 to-blue-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 bg-purple-500/30 border border-purple-300/30 text-purple-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              <Scissors className="w-3.5 h-3.5 text-purple-300" />
              <span>PRE-ASSEMBLY & KITTING BUFFER ZONE</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Khu Vực Bóc Tách Linh Kiện (Kitting)
            </h1>
            <p className="text-purple-200 text-xs sm:text-sm max-w-2xl">
              Quy trình bóc bọc carton thô, phân loại đóng thùng xanh chuẩn kích thước, kiểm soát tỷ lệ phế phẩm và đẩy hàng lên Kệ OUTBUFFER phục vụ Dây Chuyền.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex items-center space-x-4">
            <div className="p-3 bg-purple-500/40 text-purple-200 rounded-xl">
              <Zap className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-[11px] text-purple-200 uppercase font-bold tracking-wider block">Hàng Chờ Bóc Tách</span>
              <span className="text-2xl font-black text-white">{pendingItems.length} Lô Linh Kiện</span>
            </div>
          </div>
        </div>
      </div>

      {/* Message notification */}
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
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="font-semibold text-xs sm:text-sm">{message.text}</span>
          </div>
          <button
            onClick={() => setMessage(null)}
            className="text-xs font-bold underline hover:no-underline cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}

      {/* KPI Cards Header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="p-3 bg-purple-100 text-purple-700 rounded-xl">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-bold block">TỔNG ĐÃ BÓC TÁCH</span>
            <span className="text-lg font-extrabold text-slate-900">
              {totalKittedPCS.toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-500">PCS</span>
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="p-3 bg-amber-100 text-amber-700 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-bold block">THỜI GIAN TB / LÔ</span>
            <span className="text-lg font-extrabold text-slate-900">
              {avgDuration} <span className="text-xs font-normal text-slate-500">Phút</span>
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="p-3 bg-rose-100 text-rose-700 rounded-xl">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-bold block">TỶ LỆ PHẾ PHẨM</span>
            <span className={`text-lg font-extrabold ${Number(scrapRate) > 1 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {scrapRate}%
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="p-3 bg-blue-100 text-blue-700 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-bold block">HÀNG CHỜ HIỆN TẠI</span>
            <span className="text-lg font-extrabold text-purple-700">
              {pendingItems.length} <span className="text-xs font-normal text-slate-500">Bản ghi</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Tabs Selection */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50 p-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`flex-1 py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center space-x-2 cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-purple-700 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>DANH SÁCH CHỜ BÓC TÁCH</span>
            {pendingItems.length > 0 && (
              <span className="px-2 py-0.5 text-[10px] bg-amber-400 text-amber-950 font-black rounded-full">
                {pendingItems.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center space-x-2 cursor-pointer ${
              activeTab === 'history'
                ? 'bg-purple-700 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>LỊCH SỬ & NĂNG SUẤT BÓC TÁCH</span>
            <span className="px-2 py-0.5 text-[10px] bg-purple-200 text-purple-900 font-bold rounded-full">
              {completedItems.length}
            </span>
          </button>
        </div>

        {/* Tab 1: Pending Queue */}
        {activeTab === 'pending' && (
          <div className="p-4 sm:p-6">
            {pendingItems.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">Không có linh kiện nào chờ bóc tách!</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Tất cả các lô xuất kho từ Kho thô đã được xử lý xong kitting đóng thùng xanh. Khi có đơn xuất mới, hệ thống sẽ tự động hiển thị tại đây.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px] border-b border-slate-200">
                    <tr>
                      <th className="p-3 w-10 text-center">STT</th>
                      <th className="p-3">Thời Gian Thô</th>
                      <th className="p-3">Mã Linh Kiện</th>
                      <th className="p-3">Tên Linh Kiện</th>
                      <th className="p-3 text-right">SL Xuất Thô</th>
                      <th className="p-3 text-center">ĐVT</th>
                      <th className="p-3">Kệ Buffer Gợi Ý</th>
                      <th className="p-3 text-center">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pendingItems.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-purple-50/50 transition-colors">
                        <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                        <td className="p-3 text-slate-500">
                          {new Date(item.createdAt).toLocaleString('vi-VN')}
                        </td>
                        <td className="p-3 font-mono font-bold text-purple-700">{item.partCode}</td>
                        <td className="p-3 font-semibold text-slate-900">{item.partName}</td>
                        <td className="p-3 text-right font-black text-amber-700 bg-amber-50/50">
                          {item.rawQuantity.toLocaleString('vi-VN')}
                        </td>
                        <td className="p-3 text-center text-slate-600">{item.unit}</td>
                        <td className="p-3 font-bold text-blue-700">📍 {item.bufferLocation}</td>
                        <td className="p-3 text-center space-x-2">
                          <button
                            type="button"
                            onClick={() => handleOpenKittingModal(item)}
                            className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold cursor-pointer transition-all inline-flex items-center space-x-1.5 shadow-sm"
                          >
                            <Scissors className="w-3.5 h-3.5" />
                            <span>Thực Hiện Bóc Tách</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                            title="Xóa bản ghi"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Completed / Productivity History */}
        {activeTab === 'history' && (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="p-3 w-10 text-center">STT</th>
                    <th className="p-3">Mã Linh Kiện</th>
                    <th className="p-3">Tên Linh Kiện</th>
                    <th className="p-3 text-right">SL Thô</th>
                    <th className="p-3 text-right text-emerald-800 bg-emerald-50">SL Thực Bóc</th>
                    <th className="p-3 text-right text-rose-800 bg-rose-50">SL Phế Phẩm</th>
                    <th className="p-3 text-center">Thời Gian (Phút)</th>
                    <th className="p-3 text-right text-purple-900 font-black">Năng Suất (PCS/Giờ)</th>
                    <th className="p-3">Vị Trí Kệ Buffer</th>
                    <th className="p-3">Người Bóc Tách</th>
                    <th className="p-3 text-center">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {completedItems.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-slate-400 italic">
                        Chưa có dữ liệu lịch sử bóc tách
                      </td>
                    </tr>
                  ) : (
                    completedItems.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                        <td className="p-3 font-mono font-bold text-purple-700">{item.partCode}</td>
                        <td className="p-3 font-semibold text-slate-900">{item.partName}</td>
                        <td className="p-3 text-right text-slate-500">{item.rawQuantity}</td>
                        <td className="p-3 text-right font-black text-emerald-700 bg-emerald-50/50">
                          {item.kittedQuantity} {item.unit}
                        </td>
                        <td className="p-3 text-right font-bold text-rose-600 bg-rose-50/50">
                          {item.scrapQuantity || 0}
                        </td>
                        <td className="p-3 text-center font-medium text-slate-600">
                          {item.durationMinutes || 0} Phút
                        </td>
                        <td className="p-3 text-right font-black text-purple-900 bg-purple-50/50 text-sm">
                          {item.kittingProductivity || 0} PCS/H
                        </td>
                        <td className="p-3 font-bold text-blue-700">📍 {item.bufferLocation}</td>
                        <td className="p-3 text-slate-700 font-medium">{item.operatorName}</td>
                        <td className="p-3 text-center">
                          {item.status === 'DELIVERED' ? (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-md">
                              Đã Giao Dây Chuyền
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md">
                              Đang Trên Kệ Buffer
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal Form: Execute Kitting */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-4">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-800 to-indigo-800 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-purple-500/40 rounded-2xl">
                  <Scissors className="w-6 h-6 text-purple-200" />
                </div>
                <div>
                  <span className="px-2 py-0.5 bg-purple-500/50 text-purple-100 text-[10px] font-extrabold rounded uppercase tracking-wider">
                    PRE-ASSEMBLY WORKFLOW
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-white mt-0.5">
                    Xác Nhận Bóc Tách Linh Kiện (Kitting)
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="text-purple-200 hover:text-white p-2 rounded-xl hover:bg-white/10 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleCompleteKitting} className="p-5 sm:p-6 space-y-5 text-xs text-slate-700">
              {/* Item Info Box */}
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-purple-900 font-mono font-bold text-sm">{selectedItem.partCode}</p>
                  <p className="text-slate-800 font-semibold">{selectedItem.partName}</p>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block">Số Lượng Carton Thô:</span>
                  <span className="text-xl font-black text-amber-700">
                    {selectedItem.rawQuantity.toLocaleString('vi-VN')} {selectedItem.unit}
                  </span>
                </div>
              </div>

              {/* Form Input Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    1. SL Bóc Tách Đóng Thùng Xanh (Chuẩn) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={kittedQty}
                    onChange={(e) => setKittedQty(Number(e.target.value))}
                    required
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 text-sm"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Số lượng thực tế còn nguyên vẹn đóng thùng xanh.</p>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    2. SL Phế Phẩm / Hỏng Móp Carton
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={scrapQty}
                    onChange={(e) => setScrapQty(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-rose-50 border border-rose-200 rounded-xl font-bold text-rose-800 focus:ring-2 focus:ring-rose-500 text-sm"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Hao hụt do trầy xước, móp vỡ trong thùng thô.</p>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    3. Thời Gian Bóc Tách (Phút) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={durationMins}
                    onChange={(e) => setDurationMins(Number(e.target.value))}
                    required
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 text-sm"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Tổng số phút thực hiện lô hàng này.</p>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    4. Nhân Viên Thực Hiện Bóc Tách
                  </label>
                  <select
                    value={operator}
                    onChange={(e) => setOperator(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-purple-500 text-sm"
                  >
                    {settings.staffList.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Buffer Location Selection */}
              <div className="space-y-2 border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-800">
                    5. Chọn Kệ OUTBUFFER Đặt Thùng Xanh <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsQrScanning(!isQrScanning)}
                    className="text-purple-700 hover:text-purple-900 font-bold flex items-center space-x-1 cursor-pointer"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>{isQrScanning ? 'Ẩn Quét QR' : 'Quét Mã QR Ô Kệ'}</span>
                  </button>
                </div>

                {isQrScanning && (
                  <div className="p-3 bg-slate-900 text-white rounded-2xl">
                    <InlineQrScanner
                      onScanSuccess={(scannedText) => {
                        const matched = buffers.find((b) => b.locationId.toLowerCase() === scannedText.trim().toLowerCase());
                        if (matched) {
                          setTargetBuffer(matched.locationId);
                          setIsQrScanning(false);
                          setMessage({ type: 'success', text: `Đã nhận diện mã kệ OUTBUFFER: ${matched.locationId}` });
                        } else {
                          setTargetBuffer(scannedText.trim().toUpperCase());
                          setIsQrScanning(false);
                        }
                      }}
                      placeholderText="Đưa mã QR của Kệ OUTBUFFER vào camera..."
                    />
                  </div>
                )}

                <select
                  value={targetBuffer}
                  onChange={(e) => setTargetBuffer(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-blue-900 focus:ring-2 focus:ring-purple-500 text-sm"
                >
                  {buffers.map((b) => (
                    <option key={b.locationId} value={b.locationId}>
                      📍 {b.locationId} {b.partCode ? `(Đang chứa: ${b.partCode} - ${b.currentStockQty} PCS)` : '(Trống - EMPTY)'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Real-time Productivity Preview */}
              <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-indigo-700" />
                  <span className="font-bold text-indigo-900">Năng Suất Bóc Tách Dự Tính:</span>
                </div>
                <span className="text-base font-black text-indigo-900">
                  ⚡ {liveProductivity} <span className="text-xs font-semibold">PCS / Giờ</span>
                </span>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold shadow-md transition-all cursor-pointer flex items-center space-x-2"
                >
                  <Check className="w-4 h-4" />
                  <span>XÁC NHẬN BÓC TÁCH & ĐẨY SANG BUFFER</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
