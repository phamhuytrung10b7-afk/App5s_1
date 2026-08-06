import React, { useState, useEffect } from 'react';
import { MaterialCallRequest, BufferLocationMap, AppSettings, Part } from './types';
import { storageService } from './storage';
import { SearchableSelect, SelectOption } from './SearchableSelect';
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
  Search,
  Settings as SettingsIcon,
  Plus,
  Trash2,
} from 'lucide-react';

interface AndonCallViewProps {
  materialCalls: MaterialCallRequest[];
  buffers: BufferLocationMap[];
  parts?: Part[];
  settings: AppSettings;
  onRefresh: () => void;
  onNavigateToSettings?: () => void;
}

export const AndonCallView: React.FC<AndonCallViewProps> = ({
  materialCalls,
  buffers,
  parts,
  settings,
  onRefresh,
  onNavigateToSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'request' | 'logistics' | 'history'>('logistics');

  // Master parts list
  const allParts = parts && parts.length > 0 ? parts : storageService.getParts();

  // Assembly lines list from Settings
  const assemblyLinesList = (settings.assemblyLines && settings.assemblyLines.length > 0)
    ? settings.assemblyLines
    : [
        'Bàn Lắp Ráp Bo Mạch Line 1',
        'Dây Chuyền SMT Tự Động 2',
        'Bàn Lắp Khung Cơ Khí 3',
        'Khu Kiểm Thử Quality Check 4',
      ];

  // Request form state
  const [assemblyLine, setAssemblyLine] = useState(assemblyLinesList[0] || 'Bàn Lắp Ráp Bo Mạch Line 1');
  const [isManageLinesModalOpen, setIsManageLinesModalOpen] = useState(false);
  const [newLineInput, setNewLineInput] = useState('');

  const [selectedPartCode, setSelectedPartCode] = useState('');
  const [requestedQty, setRequestedQty] = useState<number>(10);
  const [requestedBy, setRequestedBy] = useState(
    (settings.staffList && settings.staffList[0]) || 'Nguyễn Văn A (Trưởng Dây Chuyền 1)'
  );

  // Logistics deliver modal / confirm state
  const [delivererName, setDelivererName] = useState(
    (settings.staffList && settings.staffList[0]) || 'Lê Hoàng Nam (Thủ Kho Logistics)'
  );
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Get Kitting Queue items waiting for kitting (đã xuất kho thô, chờ bóc tách)
  const kittingQueue = storageService.getKittingQueue();
  const pendingKittingItems = kittingQueue.filter((k) => k.status === 'PENDING_KITTING');

  // Group available stock on Outbuffer shelves by part code
  const bufferPartsMap = new Map<
    string,
    {
      partCode: string;
      partName: string;
      unit: string;
      totalBufferStock: number;
      availableBuffers: BufferLocationMap[];
    }
  >();

  buffers.forEach((b) => {
    if (b.partCode && b.currentStockQty > 0 && b.status !== 'EMPTY') {
      const code = b.partCode.trim();
      if (!bufferPartsMap.has(code)) {
        bufferPartsMap.set(code, {
          partCode: code,
          partName: b.partName || code,
          unit: b.unit || 'PCS',
          totalBufferStock: b.currentStockQty,
          availableBuffers: [b],
        });
      } else {
        const item = bufferPartsMap.get(code)!;
        item.totalBufferStock += b.currentStockQty;
        item.availableBuffers.push(b);
      }
    }
  });

  // Prepare searchable options for SearchableSelect
  // Rule: ONLY allow parts that are either on Outbuffer shelves OR in Pending Kitting list (đã xuất kho thô)
  const partSelectOptions: SelectOption[] = Array.from(bufferPartsMap.values()).map((p) => {
    const shelfListStr = p.availableBuffers.map((b) => b.locationId).join(', ');
    return {
      value: p.partCode,
      label: `[${p.partCode}] ${p.partName}`,
      sublabel: `Tồn Outbuffer: ${p.totalBufferStock} ${p.unit} | Kệ: ${shelfListStr}`,
      badge: `Sẵn sàng Kệ ${p.availableBuffers[0].locationId}`,
    };
  });

  // Add parts from "Danh sách chờ bóc tách" that are not on Outbuffer shelves yet
  const seenPendingPartCodes = new Set<string>();
  pendingKittingItems.forEach((kit) => {
    if (!bufferPartsMap.has(kit.partCode) && !seenPendingPartCodes.has(kit.partCode)) {
      seenPendingPartCodes.add(kit.partCode);
      partSelectOptions.push({
        value: kit.partCode,
        label: `[${kit.partCode}] ${kit.partName}`,
        sublabel: `Đã xuất kho thô (Chờ bóc tách Kitting): ${kit.rawQuantity} ${kit.unit}`,
        badge: `📦 Chờ Bóc Tách Kitting`,
      });
    }
  });

  // Automatically select first available part if none selected
  useEffect(() => {
    if (partSelectOptions.length > 0) {
      if (!selectedPartCode || !partSelectOptions.some((o) => o.value === selectedPartCode)) {
        setSelectedPartCode(partSelectOptions[0].value);
      }
    } else {
      setSelectedPartCode('');
    }
  }, [partSelectOptions]);

  // Keep assemblyLine in sync if settings update
  useEffect(() => {
    if (assemblyLinesList.length > 0 && !assemblyLinesList.includes(assemblyLine)) {
      setAssemblyLine(assemblyLinesList[0]);
    }
  }, [assemblyLinesList]);

  // Determine auto-selected buffer location for the chosen part code
  const chosenBufferInfo = bufferPartsMap.get(selectedPartCode);
  let targetBufferLocation = '';
  let availableQtyOnShelf = 0;
  let partName = '';
  let unit = 'PCS';
  let isDirectKitting = false;

  if (chosenBufferInfo && chosenBufferInfo.availableBuffers.length > 0) {
    // Sort by age (FIFO oldest shelf first)
    const sortedBuffers = [...chosenBufferInfo.availableBuffers].sort(
      (a, b) => new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime()
    );
    const bestBuffer = sortedBuffers[0];
    targetBufferLocation = bestBuffer.locationId;
    availableQtyOnShelf = bestBuffer.currentStockQty;
    partName = bestBuffer.partName || chosenBufferInfo.partName;
    unit = bestBuffer.unit || chosenBufferInfo.unit;
    isDirectKitting = false;
  } else {
    // Part is in Pending Kitting list
    const pendingItem = pendingKittingItems.find((k) => k.partCode === selectedPartCode);
    const masterPart = allParts.find((p) => p.code === selectedPartCode);
    partName = pendingItem?.partName || masterPart?.name || selectedPartCode;
    unit = pendingItem?.unit || masterPart?.unit || 'PCS';
    targetBufferLocation = 'KHU BÓC TÁCH KITTING';
    availableQtyOnShelf = 0;
    isDirectKitting = true;
  }

  const handleCreateCallRequest = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPartCode) {
      setMessage({ type: 'error', text: 'Vui lòng chọn mã linh kiện cần gọi!' });
      return;
    }

    if (!isDirectKitting && chosenBufferInfo && requestedQty > availableQtyOnShelf) {
      setMessage({
        type: 'error',
        text: `Số lượng yêu cầu (${requestedQty}) vượt quá tồn kho khả dụng trên Kệ ${targetBufferLocation} (${availableQtyOnShelf} ${unit})!`,
      });
      return;
    }

    try {
      storageService.createMaterialCallRequest({
        assemblyLine,
        partCode: selectedPartCode,
        partName: partName || selectedPartCode,
        unit,
        requestedQty,
        bufferLocation: targetBufferLocation,
        isDirectKitting,
        requestedBy,
      });

      // Audio notification chime
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
        text: `🚀 Đã phát tín hiệu ANDON gọi mã linh kiện [${selectedPartCode}] thành công tới bộ phận Logistics!`,
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
              Gọi Hàng & Giao Hàng Dây Chuyền (Andon Call)
            </h1>
            <p className="text-amber-100 text-xs sm:text-sm max-w-2xl">
              Hệ thống tín hiệu Andon thời gian thực: Dây chuyền tìm chọn mã linh kiện & số lượng cần gọi, bộ phận Logistics tự động định vị vị trí kệ Outbuffer cấp hàng.
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
                {settings.staffList && settings.staffList.length > 0 ? (
                  settings.staffList.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))
                ) : (
                  <option value="Lê Hoàng Nam (Thủ Kho Logistics)">Lê Hoàng Nam (Thủ Kho Logistics)</option>
                )}
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
                      {req.isDirectKitting ? (
                        <div className="absolute top-0 right-0 px-3 py-1 bg-amber-500 text-slate-950 text-[10px] font-black uppercase rounded-bl-xl tracking-wider shadow-xs flex items-center space-x-1">
                          <Zap className="w-3 h-3" />
                          <span>BÓC TÁCH & GIAO THẲNG</span>
                        </div>
                      ) : (
                        <div className="absolute top-0 right-0 px-3 py-1 bg-red-600 text-white text-[10px] font-black uppercase rounded-bl-xl tracking-wider shadow-xs">
                          ⚡ CẤP TỪ OUTBUFFER
                        </div>
                      )}

                      <div className="space-y-1">
                        <span className="text-amber-800 font-bold text-[11px] block">
                          📍 Nơi Nhận: <strong className="text-slate-900 text-xs">{req.assemblyLine}</strong>
                        </span>
                        <p className="font-mono font-bold text-purple-800 text-sm">{req.partCode}</p>
                        <p className="font-semibold text-slate-800 text-xs">{req.partName}</p>
                      </div>

                      {/* Explicit Delivery Route Banner */}
                      {req.isDirectKitting || req.bufferLocation.includes('KITTING') ? (
                        <div className="p-3.5 bg-amber-50 border-2 border-amber-300 rounded-xl text-xs space-y-1.5">
                          <span className="font-extrabold text-amber-900 flex items-center space-x-1 uppercase text-[10px]">
                            <Zap className="w-3.5 h-3.5 text-amber-600" />
                            <span>LỘ TRÌNH BÓC TÁCH & GIAO THẲNG DÂY CHUYỀN (CROSS-DOCKING):</span>
                          </span>
                          <p className="font-bold text-slate-800 flex items-center space-x-2 flex-wrap">
                            <span>1. Đến <strong className="text-amber-900 font-extrabold">Khu Bóc Tách (Kitting Area)</strong> bóc tách <strong className="text-emerald-700 font-extrabold">[{req.requestedQty} {req.unit}]</strong></span>
                            <ArrowRight className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>2. Giao TRỰC TIẾP tới <strong className="text-slate-900 font-extrabold">[{req.assemblyLine}]</strong></span>
                          </p>
                          <p className="text-[10px] text-amber-800 font-medium italic">
                            * Linh kiện bóc tách xong giao ngay cho Dây Chuyền, không cần lưu qua kệ Outbuffer.
                          </p>
                        </div>
                      ) : (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs space-y-1">
                          <span className="font-extrabold text-blue-900 block uppercase text-[10px]">LỘ TRÌNH LẤY HÀNG OUTBUFFER (FIFO):</span>
                          <p className="font-bold text-slate-800 flex items-center space-x-2 flex-wrap">
                            <span>1. Đến Kệ <strong className="text-blue-700 font-mono font-black">[{req.bufferLocation}]</strong></span>
                            <ArrowRight className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>2. Lấy <strong className="text-emerald-700 font-extrabold">[{req.requestedQty} {req.unit}]</strong></span>
                            <ArrowRight className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>3. Giao tới <strong className="text-slate-900 font-bold">[{req.assemblyLine}]</strong></span>
                          </p>
                        </div>
                      )}

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
                  Chọn mã/tên linh kiện cần gọi và nhập số lượng, hệ thống tự động xác định vị trí kệ Outbuffer khả dụng tốt nhất.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateCallRequest} className="p-6 bg-white border border-slate-200 rounded-3xl space-y-4 text-xs text-slate-800 shadow-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-800">
                    1. Dây Chuyền / Bàn Máy Yêu Cầu Cấp Hàng <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsManageLinesModalOpen(true)}
                    className="text-[11px] font-bold text-amber-700 hover:text-amber-900 underline flex items-center space-x-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm / Quản lý vị trí</span>
                  </button>
                </div>
                <select
                  value={assemblyLine}
                  onChange={(e) => setAssemblyLine(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 text-sm focus:ring-2 focus:ring-amber-500 cursor-pointer"
                >
                  {assemblyLinesList.map((line) => (
                    <option key={line} value={line}>
                      {line}
                    </option>
                  ))}
                </select>
              </div>

              {/* Searchable Select Part Code & Name */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  2. Chọn Mã & Tên Linh Kiện Cần Gọi (Chỉ gọi linh kiện trong Danh Sách Chờ Bóc Tách hoặc Kệ Outbuffer) <span className="text-rose-500">*</span>
                </label>
                {partSelectOptions.length === 0 ? (
                  <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl text-xs text-amber-900 space-y-2">
                    <p className="font-extrabold flex items-center space-x-2 text-sm text-amber-950">
                      <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                      <span>Chưa Có Linh Kiện Nào Được Xuất Kho Thô Hoặc Tồn Kệ Outbuffer</span>
                    </p>
                    <p className="text-slate-700 leading-relaxed font-medium">
                      Theo quy trình sản xuất, chỉ những linh kiện <strong>đã được xuất kho thô (nằm trong Danh Sách Chờ Bóc Tách)</strong> hoặc <strong>đã có sẵn trên kệ Outbuffer</strong> mới được phép phát tín hiệu gọi cấp hàng.
                    </p>
                    <p className="text-amber-900 font-bold italic">
                      👉 Vui lòng tạo phiếu Xuất Kho Thô từ Kho Tổng trước!
                    </p>
                  </div>
                ) : (
                  <SearchableSelect
                    options={partSelectOptions}
                    value={selectedPartCode}
                    onChange={(val) => {
                      setSelectedPartCode(val);
                      const info = bufferPartsMap.get(val);
                      if (info && info.availableBuffers.length > 0) {
                        setRequestedQty(Math.min(10, info.availableBuffers[0].currentStockQty));
                      }
                    }}
                    placeholder="Gõ mã hoặc tên linh kiện để tìm kiếm..."
                    required
                    allowCustom={false}
                    icon={<Search className="w-4 h-4" />}
                  />
                )}
              </div>

              {/* Auto-detected Buffer Shelf / Direct Kitting Information Box */}
              {selectedPartCode && (
                isDirectKitting ? (
                  <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-amber-900 flex items-center space-x-1.5">
                        <Package className="w-4 h-4 text-amber-600" />
                        <span>Trạng Thái Outbuffer:</span>
                      </span>
                      <span className="font-extrabold text-[11px] px-3 py-1 bg-amber-500 text-slate-950 rounded-xl shadow-xs uppercase">
                        📦 CHƯA CÓ TRÊN KỆ OUTBUFFER
                      </span>
                    </div>
                    <p className="text-slate-800 font-bold">
                      Tên LK: <strong className="text-slate-900">{partName || selectedPartCode}</strong>
                    </p>
                    <div className="p-3 bg-amber-100/90 border border-amber-200 rounded-xl text-amber-950 space-y-1">
                      <p className="flex items-center space-x-1.5 font-extrabold text-amber-900 text-xs">
                        <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                        <span>Quy Trình: Bóc Tách Kitting & Giao Thẳng (Cross-Docking)</span>
                      </p>
                      <p className="text-[11px] text-amber-900 leading-relaxed font-medium">
                        Linh kiện chưa sẵn sàng trên kệ Outbuffer. Tín hiệu bấm gọi này sẽ thông báo cho bộ phận Logistics <strong>thực hiện Bóc Tách tại Khu Kitting và giao TRỰC TIẾP tới {assemblyLine}</strong> mà không gợi ý vị trí kệ lấy ảo!
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-emerald-900 flex items-center space-x-1.5">
                        <MapPin className="w-4 h-4 text-emerald-600" />
                        <span>Vị Trí Kệ Outbuffer Lấy Hàng (FIFO):</span>
                      </span>
                      <span className="font-mono font-black text-xs px-3 py-1 bg-emerald-700 text-white rounded-xl shadow-xs">
                        📍 {targetBufferLocation}
                      </span>
                    </div>
                    <p className="text-slate-800 font-bold">
                      Tên LK: <strong className="text-slate-900">{partName || selectedPartCode}</strong>
                    </p>
                    <p className="text-emerald-800 font-bold flex items-center space-x-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Có sẵn trên kệ Outbuffer: {availableQtyOnShelf} {unit}</span>
                    </p>
                  </div>
                )
              )}

              {/* Requested Quantity */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  3. Số Lượng Cần Gọi ({unit}) <span className="text-rose-500">*</span>
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

              {/* Requester Select with link to Settings */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-800">
                    4. Người Yêu Cầu <span className="text-rose-500">*</span>
                  </label>
                  {onNavigateToSettings && (
                    <button
                      type="button"
                      onClick={onNavigateToSettings}
                      className="text-[11px] font-bold text-amber-700 hover:text-amber-900 underline flex items-center space-x-1 cursor-pointer"
                    >
                      <SettingsIcon className="w-3 h-3" />
                      <span>Chỉnh sửa danh sách trong Cài Đặt</span>
                    </button>
                  )}
                </div>
                <select
                  value={requestedBy}
                  onChange={(e) => setRequestedBy(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-semibold text-slate-900 text-sm focus:ring-2 focus:ring-amber-500"
                >
                  {settings.staffList && settings.staffList.length > 0 ? (
                    settings.staffList.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))
                  ) : (
                    <option value="Nguyễn Văn A (Trưởng Dây Chuyền 1)">Nguyễn Văn A (Trưởng Dây Chuyền 1)</option>
                  )}
                </select>
                <p className="text-[10px] text-slate-400 mt-1 italic">
                  * Danh sách người yêu cầu có thể chỉnh sửa/thêm bớt trong mục Cài đặt & Dữ liệu.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2 text-sm mt-4"
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

      {/* MODAL QUẢN LÝ BÀN MÁY / VỊ TRÍ NHẬN HÀNG */}
      {isManageLinesModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center space-x-2">
                <Truck className="w-5 h-5 text-amber-600" />
                <span>Quản Lý Vị Trí / Bàn Máy Nhận Hàng</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsManageLinesModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="space-y-2">
              <label className="block font-bold text-slate-800 text-xs">Thêm vị trí mới:</label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newLineInput}
                  onChange={(e) => setNewLineInput(e.target.value)}
                  placeholder="Tên bàn máy (VD: Line SMT 3)..."
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newLineInput.trim()) return;
                    if (assemblyLinesList.includes(newLineInput.trim())) return;
                    const updated = [...assemblyLinesList, newLineInput.trim()];
                    storageService.saveSettings({ ...settings, assemblyLines: updated });
                    setAssemblyLine(newLineInput.trim());
                    setNewLineInput('');
                    onRefresh();
                  }}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shrink-0"
                >
                  + Thêm
                </button>
              </div>
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pt-2">
              <label className="block font-bold text-slate-700 text-[11px] uppercase tracking-wider">Danh sách hiện tại ({assemblyLinesList.length}):</label>
              {assemblyLinesList.map((line, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                >
                  <span>{line}</span>
                  {assemblyLinesList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const updated = assemblyLinesList.filter((_, i) => i !== idx);
                        storageService.saveSettings({ ...settings, assemblyLines: updated });
                        if (assemblyLine === line) {
                          setAssemblyLine(updated[0] || '');
                        }
                        onRefresh();
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                      title="Xóa vị trí này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsManageLinesModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold cursor-pointer"
              >
                Hoàn Tất
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
