import React, { useState, useEffect } from 'react';
import { MaterialCallRequest, BufferLocationMap, AppSettings } from './types';
import { storageService } from './storage';
import {
  Bell,
  BellRing,
  Send,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Package,
  User,
  AlertCircle,
  Volume2,
  ArrowRight,
  ShieldCheck,
  Check,
  Zap,
} from 'lucide-react';

interface AndonCallViewProps {
  materialCalls: MaterialCallRequest[];
  buffers: BufferLocationMap[];
  settings: AppSettings;
  onRefresh: () => void;
}

export const AndonCallView: React.FC<AndonCallViewProps> = ({
  materialCalls,
  buffers,
  settings,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'request' | 'logistics' | 'history'>('logistics');

  // Request form state
  const [assemblyLine, setAssemblyLine] = useState('Bàn Lắp Ráp Bo Mạch Line 1');
  const [selectedBufferId, setSelectedBufferId] = useState('');
  const [requestedQty, setRequestedQty] = useState<number>(10);
  const [requestedBy, setRequestedBy] = useState(settings.staffList[0] || 'Nguyễn Văn A (Trưởng Dây Chuyền 1)');

  // Logistics deliver modal / confirm state
  const [delivererName, setDelivererName] = useState('Lê Hoàng Nam (Thủ Kho Logistics)');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Available buffers with stock
  const availableBuffers = buffers.filter((b) => b.status !== 'EMPTY' && b.currentStockQty > 0);

  useEffect(() => {
    if (availableBuffers.length > 0 && !selectedBufferId) {
      setSelectedBufferId(availableBuffers[0].locationId);
      setRequestedQty(Math.min(10, availableBuffers[0].currentStockQty));
    }
  }, [availableBuffers]);

  const handleBufferChange = (bufId: string) => {
    setSelectedBufferId(bufId);
    const buf = buffers.find((b) => b.locationId === bufId);
    if (buf) {
      setRequestedQty(Math.min(10, buf.currentStockQty));
    }
  };

  const handleCreateCallRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const targetBuf = buffers.find((b) => b.locationId === selectedBufferId);
    if (!targetBuf || !targetBuf.partCode) {
      setMessage({ type: 'error', text: 'Vui lòng chọn Kệ Buffer có chứa linh kiện hợp lệ!' });
      return;
    }

    if (requestedQty > targetBuf.currentStockQty) {
      setMessage({
        type: 'error',
        text: `Số lượng yêu cầu (${requestedQty}) vượt quá tồn trên Kệ ${targetBuf.locationId} (${targetBuf.currentStockQty})!`,
      });
      return;
    }

    try {
      storageService.createMaterialCallRequest({
        assemblyLine,
        partCode: targetBuf.partCode,
        partName: targetBuf.partName || targetBuf.partCode,
        unit: targetBuf.unit || 'PCS',
        requestedQty,
        bufferLocation: targetBuf.locationId,
        requestedBy,
      });

      // Play audio notification chime using Web Audio API!
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
      } catch {
        // Fallback
      }

      setMessage({
        type: 'success',
        text: `🚀 Đã phát tín hiệu ANDON gọi hàng thành công tới Bộ Phận Logistics Kho!`,
      });

      onRefresh();
      setActiveTab('logistics');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Lỗi khi tạo tín hiệu Andon' });
    }
  };

  const handleStartDelivery = (requestId: string) => {
    try {
      storageService.updateMaterialCallStatus(requestId, 'DELIVERING', delivererName);
      setMessage({ type: 'success', text: 'Đã nhận đơn và chuyển sang trạng thái Đang Vận Chuyển Delivery!' });
      onRefresh();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleCompleteDelivery = (requestId: string) => {
    try {
      storageService.updateMaterialCallStatus(requestId, 'COMPLETED', delivererName);
      setMessage({ type: 'success', text: '🎉 Xác nhận Giao Hàng Thành Công! Đã trừ tồn kệ Buffer và hoàn tất đơn.' });
      onRefresh();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  // Filter requests
  const callingReqs = materialCalls.filter((m) => m.status === 'CALLING');
  const deliveringReqs = materialCalls.filter((m) => m.status === 'DELIVERING');
  const completedReqs = materialCalls.filter((m) => m.status === 'COMPLETED');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-700 via-orange-800 to-rose-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 bg-amber-500/30 border border-amber-300/30 text-amber-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              <BellRing className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>ANDON MATERIAL CALL & DELIVERY SYSTEM</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Gọi Hàng & Giao Hàng Dây Chuyền (Andon)
            </h1>
            <p className="text-amber-100 text-xs sm:text-sm max-w-2xl">
              Hệ thống tín hiệu Andon thời gian thực truyền tin giữa Bàn Máy Lắp Ráp & Bộ phận Logistics Kho, điều phối giao nhận thùng xanh chính xác vị trí.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex items-center space-x-3">
              <div className="p-2.5 bg-amber-400 text-amber-950 rounded-xl font-black">
                <BellRing className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <span className="text-[10px] text-amber-200 font-bold uppercase block">Tín Hiệu Đang Gọi</span>
                <span className="text-2xl font-black text-white">{callingReqs.length} Yêu Cầu</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Message Feedback */}
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

      {/* Main Tabs Header */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50 p-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('logistics')}
            className={`flex-1 py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center space-x-2 cursor-pointer ${
              activeTab === 'logistics'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>LOGISTICS GIAO HÀNG (ĐIỀU PHỐI)</span>
            {callingReqs.length > 0 && (
              <span className="px-2 py-0.5 text-[10px] bg-red-500 text-white font-black rounded-full animate-pulse">
                {callingReqs.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('request')}
            className={`flex-1 py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center space-x-2 cursor-pointer ${
              activeTab === 'request'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>SẢN XUẤT GỌI HÀNG (ANDON CALL)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center space-x-2 cursor-pointer ${
              activeTab === 'history'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>LỊCH SỬ GIAO CẤP HÀNG</span>
            <span className="px-2 py-0.5 text-[10px] bg-amber-100 text-amber-900 font-bold rounded-full">
              {completedReqs.length}
            </span>
          </button>
        </div>

        {/* TAB 1: LOGISTICS DELIVERY DISPATCH */}
        {activeTab === 'logistics' && (
          <div className="p-4 sm:p-6 space-y-6">
            {/* Active Delivering Staff Picker */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs">
                <User className="w-4 h-4 text-amber-700" />
                <span>Nhân Viên Logistics Đang Trực:</span>
              </div>
              <select
                value={delivererName}
                onChange={(e) => setDelivererName(e.target.value)}
                className="px-3.5 py-1.5 bg-white border border-amber-300 rounded-xl font-bold text-slate-900 text-xs focus:ring-2 focus:ring-amber-500"
              >
                {settings.staffList.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Pending & Delivering Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Calling Requests */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h3 className="font-extrabold text-sm text-slate-900 flex items-center space-x-2">
                    <Bell className="w-4 h-4 text-red-500 animate-pulse" />
                    <span>Đơn Yêu Cầu Đang Gọi (Chờ Nhận)</span>
                  </h3>
                  <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
                    {callingReqs.length} Đơn
                  </span>
                </div>

                {callingReqs.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200 italic text-xs">
                    Hiện không có yêu cầu gọi hàng mới từ Dây Chuyền.
                  </div>
                ) : (
                  callingReqs.map((req) => (
                    <div
                      key={req.requestId}
                      className="p-5 bg-white border-2 border-red-200 rounded-2xl shadow-xs hover:shadow-md transition-all space-y-3 relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 px-3 py-1 bg-red-600 text-white text-[10px] font-black uppercase rounded-bl-xl tracking-wider">
                        ⚡ CẦN CẤP GẤP
                      </div>

                      <div className="space-y-1">
                        <span className="text-amber-800 font-bold text-[11px] block">
                          📍 Nơi Nhận: <strong className="text-slate-900 text-xs">{req.assemblyLine}</strong>
                        </span>
                        <p className="font-mono font-bold text-purple-800 text-sm">{req.partCode}</p>
                        <p className="font-semibold text-slate-800 text-xs">{req.partName}</p>
                      </div>

                      {/* Explicit Delivery Route Banner */}
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1">
                        <span className="font-extrabold text-amber-900 block uppercase text-[10px]">LỘ TRÌNH LẤY HÀNG LOGISTICS:</span>
                        <p className="font-bold text-slate-800 flex items-center space-x-2 flex-wrap">
                          <span>1. Đến Kệ <strong className="text-blue-700 font-mono">[{req.bufferLocation}]</strong></span>
                          <ArrowRight className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>2. Lấy <strong className="text-emerald-700 font-extrabold">[{req.requestedQty} {req.unit}]</strong></span>
                          <ArrowRight className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>3. Giao tới <strong className="text-slate-900">[{req.assemblyLine}]</strong></span>
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                        <span>Gọi bởi: {req.requestedBy}</span>
                        <button
                          type="button"
                          onClick={() => handleStartDelivery(req.requestId)}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center space-x-1.5"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>NHẬN ĐƠN DELIVERY</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Delivering Requests */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h3 className="font-extrabold text-sm text-slate-900 flex items-center space-x-2">
                    <Truck className="w-4 h-4 text-blue-600" />
                    <span>Đang Trên Đường Vận Chuyển (Delivering)</span>
                  </h3>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                    {deliveringReqs.length} Đơn
                  </span>
                </div>

                {deliveringReqs.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200 italic text-xs">
                    Chưa có đơn nào đang vận chuyển.
                  </div>
                ) : (
                  deliveringReqs.map((req) => (
                    <div
                      key={req.requestId}
                      className="p-5 bg-white border border-blue-200 rounded-2xl shadow-xs space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 font-bold text-[10px] rounded-md uppercase">
                          ĐANG VẬN CHUYỂN
                        </span>
                        <span className="text-slate-400 text-[11px]">
                          Thủ kho: {req.deliveredBy || delivererName}
                        </span>
                      </div>

                      <div>
                        <p className="font-mono font-bold text-purple-800 text-sm">{req.partCode}</p>
                        <p className="font-semibold text-slate-800 text-xs">{req.partName}</p>
                        <p className="text-xs text-slate-600 mt-1">
                          Số lượng: <strong className="text-emerald-700 font-black">{req.requestedQty} {req.unit}</strong> | Kệ lấy: <strong className="text-blue-700 font-mono">{req.bufferLocation}</strong>
                        </p>
                      </div>

                      <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-xs space-y-1">
                        <span className="font-bold text-blue-900">Bàn máy nhận hàng:</span>
                        <p className="font-bold text-slate-800">{req.assemblyLine}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCompleteDelivery(req.requestId)}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2 text-xs"
                      >
                        <Check className="w-4 h-4" />
                        <span>XÁC NHẬN ĐÃ GIAO HÀNG TỚI BÀN MÁY</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CREATE ANDON CALL REQUEST */}
        {activeTab === 'request' && (
          <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-5">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center space-x-3 text-amber-900">
              <Zap className="w-6 h-6 text-amber-600 shrink-0" />
              <div>
                <h3 className="font-bold text-sm">Chế Độ Sản Xuất Bấm Gọi Hàng (Andon Call)</h3>
                <p className="text-xs text-amber-800">
                  Chọn Bàn máy / Dây chuyền và chọn vị trí Kệ OUTBUFFER sẵn hàng để gửi thông điệp cấp hàng tới thủ kho Logistics.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateCallRequest} className="p-6 bg-white border border-slate-200 rounded-3xl space-y-4 text-xs text-slate-800 shadow-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  1. Dây Chuyền / Bàn Máy Yêu Cầu Cấp Hàng <span className="text-rose-500">*</span>
                </label>
                <select
                  value={assemblyLine}
                  onChange={(e) => setAssemblyLine(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 text-sm focus:ring-2 focus:ring-amber-500"
                >
                  <option value="Bàn Lắp Ráp Bo Mạch Line 1">Bàn Lắp Ráp Bo Mạch Line 1</option>
                  <option value="Dây Chuyền SMT Tự Động 2">Dây Chuyền SMT Tự Động 2</option>
                  <option value="Bàn Lắp Khung Cơ Khí 3">Bàn Lắp Khung Cơ Khí 3</option>
                  <option value="Khu Kiểm Thử Quality Check 4">Khu Kiểm Thử Quality Check 4</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  2. Chọn Kệ OUTBUFFER Khả Dụng Có Hàng <span className="text-rose-500">*</span>
                </label>
                {availableBuffers.length === 0 ? (
                  <p className="text-rose-600 font-bold p-3 bg-rose-50 rounded-xl">
                    Hiện chưa có kệ Buffer nào có hàng đóng thùng xanh sẵn sàng. Vui lòng thực hiện bóc tách Kitting trước.
                  </p>
                ) : (
                  <select
                    value={selectedBufferId}
                    onChange={(e) => handleBufferChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-blue-900 text-sm focus:ring-2 focus:ring-amber-500"
                  >
                    {availableBuffers.map((b) => (
                      <option key={b.locationId} value={b.locationId}>
                        📍 Kệ {b.locationId} - Mã: {b.partCode} ({b.partName}) - Tồn: {b.currentStockQty} {b.unit || 'PCS'}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  3. Số Lượng Cần Cấp (PCS) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  value={requestedQty}
                  onChange={(e) => setRequestedQty(Number(e.target.value))}
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-black text-amber-800 text-sm focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  4. Người Yêu Cầu (Trưởng Dây Chuyền / Kỹ Thuật)
                </label>
                <input
                  type="text"
                  value={requestedBy}
                  onChange={(e) => setRequestedBy(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-semibold text-slate-900 text-sm focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={availableBuffers.length === 0}
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-extrabold rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2 text-sm mt-4"
              >
                <BellRing className="w-5 h-5 animate-bounce" />
                <span>GỬI YÊU CẦU CẤP HÀNG (ANDON SIGNAL)</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: CALL HISTORY */}
        {activeTab === 'history' && (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="p-3 w-10 text-center">STT</th>
                    <th className="p-3">Thời Gian Gọi</th>
                    <th className="p-3">Bàn Máy Gọi</th>
                    <th className="p-3">Mã Linh Kiện</th>
                    <th className="p-3">Tên Linh Kiện</th>
                    <th className="p-3 text-right font-black text-amber-800">SL Cấp</th>
                    <th className="p-3">Kệ Buffer Lấy</th>
                    <th className="p-3">Người Gọi</th>
                    <th className="p-3">Người Giao</th>
                    <th className="p-3 text-center">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {materialCalls.map((m, idx) => (
                    <tr key={m.requestId} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="p-3 text-slate-500">{new Date(m.requestedAt).toLocaleString('vi-VN')}</td>
                      <td className="p-3 font-bold text-slate-800">{m.assemblyLine}</td>
                      <td className="p-3 font-mono font-bold text-purple-800">{m.partCode}</td>
                      <td className="p-3 font-semibold text-slate-900">{m.partName}</td>
                      <td className="p-3 text-right font-black text-emerald-800">{m.requestedQty} {m.unit}</td>
                      <td className="p-3 font-bold text-blue-700">📍 {m.bufferLocation}</td>
                      <td className="p-3 text-slate-600">{m.requestedBy}</td>
                      <td className="p-3 text-slate-600">{m.deliveredBy || '---'}</td>
                      <td className="p-3 text-center">
                        {m.status === 'COMPLETED' ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md">
                            Đã Hoàn Thành
                          </span>
                        ) : m.status === 'DELIVERING' ? (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-md">
                            Đang Giao
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-md animate-pulse">
                            Chờ Nhận Đơn
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
