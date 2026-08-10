import React, { useState, useEffect } from 'react';
import { KittingQueueItem, AppSettings, BufferLocationMap } from './types';
import { storageService } from './storage';
import { MasterKittingTag } from './masterExcelParser';
import { PART_GROUP_COLORS, getPartGroupConfig } from './partGroupColors';
import { ContainerTagManagerModal } from './ContainerTagManagerModal';
import { InlineQrScanner } from './InlineQrScanner';
import {
  Scissors,
  CheckCircle2,
  Clock,
  User,
  Package,
  AlertTriangle,
  QrCode,
  Check,
  BarChart2,
  Trash2,
  Tag,
  AlertCircle,
  Sparkles,
  X,
  XCircle,
  MapPin,
  ShieldCheck,
} from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'smart_scan' | 'pending' | 'history'>('smart_scan');
  const [selectedItem, setSelectedItem] = useState<KittingQueueItem | null>(null);
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);

  // Current Logged in User name
  const currentUser = storageService.getCurrentUser();
  const currentOperatorName = currentUser
    ? `${currentUser.fullName} (${currentUser.roleTitle || currentUser.username})`
    : settings.staffList[0] || 'Lê Hoàng Nam';

  // Smart Scan States
  const [qrInputText, setQrInputText] = useState('');
  const [scannedTag, setScannedTag] = useState<MasterKittingTag | null>(null);
  const [masterTags, setMasterTags] = useState<MasterKittingTag[]>([]);

  // Smart Kitting Form Fields
  const [partCode, setPartCode] = useState('');
  const [partName, setPartName] = useState('');
  const [ccdcSpec, setCcdcSpec] = useState('');
  const [groupName, setGroupName] = useState('NHÓM ĐIỆN');
  const [groupColorHex, setGroupColorHex] = useState('#3182CE');
  const [standardQty, setStandardQty] = useState<number>(100);
  const [actualQty, setActualQty] = useState<number>(100);
  const [unit, setUnit] = useState('cái/bộ');
  const [isOverride, setIsOverride] = useState(false);
  const [exceptionReason, setExceptionReason] = useState('Thùng thô dư lẻ (Thiếu từ NCC)');
  const [scrapQty, setScrapQty] = useState<number>(0);
  const [operator, setOperator] = useState<string>(currentOperatorName);
  const [targetBuffer, setTargetBuffer] = useState<string>('BUFFER-A1-01');

  // Scanner toggles
  const [isCameraScanning, setIsCameraScanning] = useState(false);
  const [isBufferQrScanning, setIsBufferQrScanning] = useState(false);

  // Result Popup Modal State (Prominent OK or Error Notification)
  const [resultModal, setResultModal] = useState<{
    isOpen: boolean;
    isSuccess: boolean;
    title: string;
    message: string;
    details?: {
      partCode: string;
      partName: string;
      qty: number;
      unit: string;
      bufferLocation: string;
      operatorName: string;
      exceptionNote?: string;
    };
  } | null>(null);

  useEffect(() => {
    const loaded = storageService.getMasterContainerTags();
    setMasterTags(loaded);
  }, []);

  useEffect(() => {
    if (currentUser) {
      setOperator(`${currentUser.fullName} (${currentUser.roleTitle || currentUser.username})`);
    }
  }, [currentUser]);

  const isAdmin = storageService.isAdminUser(currentUser);

  // Filter items
  const rawPendingItems = queue.filter((i) => i.status === 'PENDING_KITTING');
  const pendingItems = rawPendingItems;
  const completedItems = queue.filter((i) => i.status === 'IN_BUFFER' || i.status === 'DELIVERED');

  // Group pending items by partCode (case insensitive)
  interface PendingGroup {
    partCode: string;
    partName: string;
    unit: string;
    totalRawQuantity: number;
    batches: Array<{
      id: string;
      createdAt: string;
      rawQuantity: number;
      transactionId?: string;
    }>;
  }

  const groupedPendingMap = new Map<string, PendingGroup>();

  rawPendingItems.forEach((item) => {
    const key = item.partCode.trim().toLowerCase();
    const existing = groupedPendingMap.get(key);
    if (existing) {
      existing.totalRawQuantity += item.rawQuantity;
      existing.batches.push({
        id: item.id,
        createdAt: item.createdAt,
        rawQuantity: item.rawQuantity,
        transactionId: item.transactionId,
      });
    } else {
      groupedPendingMap.set(key, {
        partCode: item.partCode,
        partName: item.partName,
        unit: item.unit || 'Cái',
        totalRawQuantity: item.rawQuantity,
        batches: [
          {
            id: item.id,
            createdAt: item.createdAt,
            rawQuantity: item.rawQuantity,
            transactionId: item.transactionId,
          },
        ],
      });
    }
  });

  // Sort batches inside each group by createdAt ASC (oldest first for FIFO)
  groupedPendingMap.forEach((group) => {
    group.batches.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  });

  const groupedPendingList = Array.from(groupedPendingMap.values());

  // Handle Scanning or Selecting a Container Tag
  const handleProcessTagSelection = (tag: MasterKittingTag) => {
    setScannedTag(tag);
    setPartCode(tag.partCode || '');
    setPartName(tag.partName || '');
    setCcdcSpec(tag.ccdcSpec || '');
    setGroupName(tag.groupName || tag.groupConfig.name);
    setGroupColorHex(tag.groupConfig.colorHex);

    const stdQty = tag.standardQty && tag.standardQty > 0 ? tag.standardQty : 0;
    setStandardQty(stdQty);
    setActualQty(stdQty);
    setUnit(tag.unit || 'cái/bộ');

    if (stdQty === 0) {
      setIsOverride(true);
      setExceptionReason('Thẻ Thùng chưa có định mức sẵn trong Excel (Cần điền khi quét)');
    } else {
      setIsOverride(false);
    }

    // Auto find buffer
    const matchingBuf = buffers.find((b) => b.partCode === tag.partCode && b.status !== 'EMPTY');
    const emptyBuf = buffers.find((b) => b.status === 'EMPTY');
    setTargetBuffer(matchingBuf ? matchingBuf.locationId : emptyBuf ? emptyBuf.locationId : 'BUFFER-A1-01');
  };

  // Parse Raw QR Code payload [Mã_Linh_Kiện]|[Số_Lượng_Định_Mức]|[Mã_Nhóm]
  const handleParseQrPayload = (payloadStr: string) => {
    if (!payloadStr) return;
    const cleanStr = payloadStr.trim();

    // Look up in Master Tags list first
    const matchedMaster = masterTags.find(
      (m) =>
        (m.qrPayload && m.qrPayload.trim().toLowerCase() === cleanStr.toLowerCase()) ||
        (m.partCode && m.partCode.trim().toLowerCase() === cleanStr.toLowerCase())
    );

    if (matchedMaster) {
      handleProcessTagSelection(matchedMaster);
      return;
    }

    // Otherwise parse pipe format e.g. "02-33-07-SHB3336-0000|100|DIEN" or "CONT_IN|LK01|100|..."
    if (cleanStr.includes('|')) {
      const parts = cleanStr.split('|');
      let pCode = parts[0] || '';
      let pQty = parts[1] && !isNaN(parseFloat(parts[1])) ? parseFloat(parts[1]) : 0;
      let pGroup = parts[2] || '';

      if (cleanStr.startsWith('CONT_IN|')) {
        pCode = parts[1] || 'LK-NEW';
        pQty = parts[2] && !isNaN(parseFloat(parts[2])) ? parseFloat(parts[2]) : 0;
        pGroup = parts[6] || 'DIEN';
      }

      const grpConfig = getPartGroupConfig(pGroup);

      const dynamicTag: MasterKittingTag = {
        id: `dyn-${Date.now()}`,
        stt: 'Số Quét',
        partCode: pCode,
        partName: `Linh kiện ${pCode}`,
        standardQty: pQty,
        unit: 'cái/bộ',
        groupName: grpConfig.name,
        ccdcSpec: '',
        groupConfig: grpConfig,
        qrPayload: cleanStr,
      };

      handleProcessTagSelection(dynamicTag);
    } else {
      // Simple code search in system parts
      const systemParts = storageService.getParts();
      const matchedPart = systemParts.find(
        (p) => p.code.trim().toLowerCase() === cleanStr.toLowerCase()
      );

      if (matchedPart) {
        const grpConfig = getPartGroupConfig(matchedPart.description || matchedPart.name);
        const dynamicTag: MasterKittingTag = {
          id: `dyn-${Date.now()}`,
          stt: 'Số Quét',
          partCode: matchedPart.code,
          partName: matchedPart.name,
          standardQty: 0,
          unit: matchedPart.unit || 'Cái',
          groupName: grpConfig.name,
          ccdcSpec: matchedPart.location || '',
          groupConfig: grpConfig,
          qrPayload: `${matchedPart.code}||${grpConfig.id}`,
        };
        handleProcessTagSelection(dynamicTag);
      } else {
        setPartCode(cleanStr);
        setPartName(`Linh kiện ${cleanStr}`);
        setStandardQty(0);
        setActualQty(0);
      }
    }
  };

  const handleOpenQueueKittingModal = (item: KittingQueueItem) => {
    setSelectedItem(item);
    setPartCode(item.partCode);
    setPartName(item.partName);
    setStandardQty(item.rawQuantity);
    setActualQty(item.rawQuantity);
    setUnit(item.unit);
    setScrapQty(0);

    const grpConfig = getPartGroupConfig(item.partName);
    setGroupName(grpConfig.name);
    setGroupColorHex(grpConfig.colorHex);

    const matchingBuf = buffers.find((b) => b.partCode === item.partCode && b.status !== 'EMPTY');
    const emptyBuf = buffers.find((b) => b.status === 'EMPTY');
    setTargetBuffer(matchingBuf ? matchingBuf.locationId : emptyBuf ? emptyBuf.locationId : 'BUFFER-A1-01');
  };

  // Execution & Strict Queue Validation for Smart Kitting
  const executeSmartKitting = (chosenBuffer?: string) => {
    const finalBuffer = chosenBuffer || targetBuffer;

    if (!partCode) {
      setResultModal({
        isOpen: true,
        isSuccess: false,
        title: 'BÓC TÁCH THẤT BẠI',
        message: 'Vui lòng quét hoặc chọn Mã Linh Kiện trước khi thực hiện bóc tách!',
      });
      return;
    }

    if (!actualQty || actualQty <= 0) {
      setResultModal({
        isOpen: true,
        isSuccess: false,
        title: 'BÓC TÁCH THẤT BẠI',
        message: '⚠️ SỐ LƯỢNG BÓC TÁCH BẮT BUỘC! Vui lòng nhập số lượng kitting thực tế lớn hơn 0.',
      });
      return;
    }

    // STRICT RULE: Only allow kitting within available quantity of the pending queue (Danh Sách Chờ Bóc Tách)
    const allQueue = storageService.getKittingQueue();
    const pendingForPart = allQueue.filter(
      (item) =>
        item.status === 'PENDING_KITTING' &&
        item.partCode.trim().toLowerCase() === partCode.trim().toLowerCase()
    );

    const totalPendingAvailable = pendingForPart.reduce(
      (sum, item) => sum + (item.rawQuantity || 0),
      0
    );

    if (pendingForPart.length === 0 || totalPendingAvailable <= 0) {
      setResultModal({
        isOpen: true,
        isSuccess: false,
        title: 'BÓC TÁCH THẤT BẠI',
        message: `Mã linh kiện [${partCode}] KHÔNG CÓ TRONG DANH SÁCH CHỜ BÓC TÁCH! Hệ thống không cho phép bóc tách tự do nếu chưa có đơn xuất thô từ Kho.`,
      });
      return;
    }

    if (actualQty > totalPendingAvailable) {
      setResultModal({
        isOpen: true,
        isSuccess: false,
        title: 'BÓC TÁCH THẤT BẠI',
        message: `SỐ LƯỢNG BÓC TÁCH KHÔNG ĐỦ! Trong Danh Sách Chờ Bóc Tách hiện chỉ có ${totalPendingAvailable} ${unit}, nhưng bạn đang yêu cầu bóc tách ${actualQty} ${unit}. Không được phép bóc tách quá số lượng cho phép!`,
      });
      return;
    }

    // Process deduction from pending queue
    try {
      let remainingToKitting = actualQty;

      // If a specific queue item was clicked
      if (selectedItem && selectedItem.partCode.toLowerCase() === partCode.toLowerCase()) {
        const currentItemInQueue = allQueue.find((q) => q.id === selectedItem.id);
        if (currentItemInQueue && currentItemInQueue.status === 'PENDING_KITTING') {
          if (remainingToKitting <= currentItemInQueue.rawQuantity) {
            if (remainingToKitting < currentItemInQueue.rawQuantity) {
              const leftover = currentItemInQueue.rawQuantity - remainingToKitting;
              storageService.completeKittingItem({
                id: currentItemInQueue.id,
                kittedQuantity: remainingToKitting,
                scrapQuantity: scrapQty,
                bufferLocation: finalBuffer,
                operatorName: operator,
                durationMinutes: 15,
              });
              const newPendingLeftover: KittingQueueItem = {
                ...currentItemInQueue,
                id: 'kit-remain-' + Date.now(),
                rawQuantity: leftover,
                kittedQuantity: 0,
                status: 'PENDING_KITTING',
                createdAt: currentItemInQueue.createdAt, // Preserve original timestamp for FIFO
              };
              const refreshedQueue = storageService.getKittingQueue();
              refreshedQueue.unshift(newPendingLeftover);
              storageService.saveKittingQueue(refreshedQueue);
            } else {
              storageService.completeKittingItem({
                id: currentItemInQueue.id,
                kittedQuantity: remainingToKitting,
                scrapQuantity: scrapQty,
                bufferLocation: finalBuffer,
                operatorName: operator,
                durationMinutes: 15,
              });
            }
            remainingToKitting = 0;
          }
        }
      }

      // If remainingToKitting > 0, consume sequentially from pending queue
      if (remainingToKitting > 0) {
        for (const pItem of pendingForPart) {
          if (remainingToKitting <= 0) break;

          const freshQueue = storageService.getKittingQueue();
          const freshItem = freshQueue.find((i) => i.id === pItem.id && i.status === 'PENDING_KITTING');
          if (!freshItem) continue;

          if (freshItem.rawQuantity <= remainingToKitting) {
            storageService.completeKittingItem({
              id: freshItem.id,
              kittedQuantity: freshItem.rawQuantity,
              scrapQuantity: scrapQty,
              bufferLocation: finalBuffer,
              operatorName: operator,
              durationMinutes: 15,
            });
            remainingToKitting -= freshItem.rawQuantity;
          } else {
            const leftover = freshItem.rawQuantity - remainingToKitting;
            storageService.completeKittingItem({
              id: freshItem.id,
              kittedQuantity: remainingToKitting,
              scrapQuantity: scrapQty,
              bufferLocation: finalBuffer,
              operatorName: operator,
              durationMinutes: 15,
            });
            const newPendingLeftover: KittingQueueItem = {
              ...freshItem,
              id: 'kit-remain-' + Date.now(),
              rawQuantity: leftover,
              kittedQuantity: 0,
              status: 'PENDING_KITTING',
              createdAt: freshItem.createdAt, // Preserve original timestamp for FIFO
            };
            const refreshedQueue = storageService.getKittingQueue();
            refreshedQueue.unshift(newPendingLeftover);
            storageService.saveKittingQueue(refreshedQueue);
            remainingToKitting = 0;
          }
        }
      }

      const overrideNote = isQtyDifference ? ` (Ghi đè: ${exceptionReason})` : '';

      // Show PROMINENT SUCCESS RESULT MODAL (OK)
      setResultModal({
        isOpen: true,
        isSuccess: true,
        title: 'BÓC TÁCH KITTING THÀNH CÔNG (OK)',
        message: `Đã hoàn tất bóc tách ${actualQty} ${unit} [${partCode}] và chuyển thành công lên Kệ OUTBUFFER!`,
        details: {
          partCode,
          partName: partName || partCode,
          qty: actualQty,
          unit,
          bufferLocation: finalBuffer,
          operatorName: operator,
          exceptionNote: overrideNote,
        },
      });

      // Reset form
      setScannedTag(null);
      setPartCode('');
      setPartName('');
      setCcdcSpec('');
      setSelectedItem(null);
      setQrInputText('');
      setActualQty(100);
      setStandardQty(100);
      onRefresh();
    } catch (err: any) {
      setResultModal({
        isOpen: true,
        isSuccess: false,
        title: 'BÓC TÁCH THẤT BẠI',
        message: err.message || 'Đã xảy ra lỗi trong quá trình bóc tách kitting!',
      });
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSmartKitting();
  };

  // Auto-confirm execution when Rack QR is scanned via Scanner/Camera
  const handleScanBufferQrSuccess = (scannedText: string) => {
    const clean = scannedText.trim();
    const matched = buffers.find((b) => b.locationId.toLowerCase() === clean.toLowerCase());
    const selectedBuf = matched ? matched.locationId : clean.toUpperCase();
    setTargetBuffer(selectedBuf);
    setIsBufferQrScanning(false);

    // AUTO-SUBMIT / AUTO-CONFIRM WHEN SCANNED VIA QR
    setTimeout(() => {
      executeSmartKitting(selectedBuf);
    }, 150);
  };

  const handleDeleteItem = (id: string) => {
    if (!isAdmin) {
      alert('Chỉ tài khoản Quản trị viên (ADMIN) mới có quyền xóa dữ liệu!');
      return;
    }
    if (window.confirm('Bạn có chắc chắn muốn xóa bản ghi bóc tách này khỏi hàng chờ?')) {
      storageService.deleteKittingItem(id);
      onRefresh();
    }
  };

  const handleDeleteBatch = (batchId: string, partCode: string) => {
    if (!isAdmin) {
      alert('Chỉ tài khoản Quản trị viên (ADMIN) mới có quyền xóa dữ liệu!');
      return;
    }
    if (window.confirm(`Bạn có chắc chắn muốn xóa mốc thời gian/lô này của linh kiện [${partCode}] khỏi hàng chờ?`)) {
      storageService.deleteKittingItem(batchId);
      onRefresh();
    }
  };

  const handleDeleteGroup = (partCode: string, batches: Array<{ id: string }>) => {
    if (!isAdmin) {
      alert('Chỉ tài khoản Quản trị viên (ADMIN) mới có quyền xóa dữ liệu!');
      return;
    }
    if (window.confirm(`Bạn có chắc chắn muốn xóa TẤT CẢ mốc/lô chờ bóc tách của linh kiện [${partCode}] không?`)) {
      batches.forEach((b) => {
        storageService.deleteKittingItem(b.id);
      });
      onRefresh();
    }
  };

  const isQtyDifference = actualQty !== standardQty;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-950 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 bg-blue-500/30 border border-blue-300/30 text-blue-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>SMART KITTING & CONTAINER TAG SYSTEM</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center space-x-2">
              <span>Bóc Tách Kitting Thông Minh & Quản Lý Thẻ Thùng</span>
            </h1>
            <p className="text-blue-200 text-xs sm:text-sm max-w-2xl">
              Quét Mã QR Thẻ Thùng ➜ Tự động điền linh kiện ➜ Kiểm tra số lượng Danh Sách Chờ ➜ Đẩy lên Kệ OUTBUFFER.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setIsTagManagerOpen(true)}
              className="px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-lg transition-all cursor-pointer flex items-center space-x-2"
            >
              <Tag className="w-4 h-4" />
              <span>Quản Lý & In Thẻ Thùng ({masterTags.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50 p-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('smart_scan')}
            className={`flex-1 py-3 px-4 rounded-2xl font-black text-xs sm:text-sm transition-all flex items-center justify-center space-x-2 cursor-pointer ${
              activeTab === 'smart_scan'
                ? 'bg-blue-800 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <QrCode className="w-4 h-4 text-amber-300" />
            <span>1. QUÉT THẺ THÙNG KITTING SMART</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`flex-1 py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center space-x-2 cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-blue-800 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>2. DANH SÁCH CHỜ BÓC TÁCH ({groupedPendingList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center space-x-2 cursor-pointer ${
              activeTab === 'history'
                ? 'bg-blue-800 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>3. LỊCH SỬ BÓC TÁCH ({completedItems.length})</span>
          </button>
        </div>

        {/* Tab 1: Smart Scan & Kitting Execution */}
        {activeTab === 'smart_scan' && (
          <div className="p-4 sm:p-6 space-y-6">
            {/* Step 1: Scan / Input Container Tag Bar */}
            <div className="p-5 bg-blue-50/70 border border-blue-200 rounded-3xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-blue-950 flex items-center space-x-2">
                    <QrCode className="w-5 h-5 text-blue-700" />
                    <span>QUÉT MÃ QR TRÊN THẺ THÙNG CONTAINER TAG</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Đưa súng quét hoặc Camera quét mã QR trên Thẻ Thùng. Chuỗi mã hóa <code className="bg-blue-200 px-1 rounded font-mono text-blue-900">[Mã_VT]|[Số_Lượng_Định_Mức]|[Mã_Nhóm]</code>.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsCameraScanning(!isCameraScanning)}
                    className="px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>{isCameraScanning ? 'Ẩn Camera' : 'Quét Camera QR'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsTagManagerOpen(true)}
                    className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-black rounded-xl shadow-xs transition-all flex items-center space-x-1 cursor-pointer"
                  >
                    <Tag className="w-4 h-4" />
                    <span>Chọn Từ Danh Sách Thẻ</span>
                  </button>
                </div>
              </div>

              {isCameraScanning && (
                <div className="p-4 bg-slate-900 text-white rounded-2xl">
                  <InlineQrScanner
                    onScanSuccess={(scannedText) => {
                      setIsCameraScanning(false);
                      handleParseQrPayload(scannedText);
                    }}
                    placeholderText="Đưa Mã QR Thẻ Thùng vào giữa khung hình Camera..."
                  />
                </div>
              )}

              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={qrInputText}
                  onChange={(e) => setQrInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleParseQrPayload(qrInputText);
                    }
                  }}
                  placeholder="Nhập hoặc quét chuỗi QR code e.g. 02-33-07-SHB3336-0000|100|DIEN..."
                  className="flex-1 px-4 py-2.5 bg-white border border-slate-300 rounded-xl font-mono text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-600 outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => handleParseQrPayload(qrInputText)}
                  className="px-5 py-2.5 bg-blue-800 hover:bg-blue-900 text-white font-extrabold text-xs rounded-xl shadow-sm cursor-pointer"
                >
                  Xác Nhận Quét
                </button>
              </div>
            </div>

            {/* Step 2: Auto-filled Kitting Form */}
            <form onSubmit={handleFormSubmit} className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 space-y-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 text-blue-800 rounded-xl">
                    <Scissors className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-base text-slate-900">
                      THÔNG TIN BÓC TÁCH KITTING TỰ ĐỘNG
                    </h4>
                    <p className="text-xs text-slate-500">
                      Tự động điền từ QR code Thẻ Thùng. Nhập số lượng thực tế cần kitting.
                    </p>
                  </div>
                </div>

                {groupName && (
                  <div
                    className="px-4 py-1.5 rounded-full font-black text-xs shadow-xs flex items-center space-x-1.5"
                    style={{
                      backgroundColor: groupColorHex,
                      color: getPartGroupConfig(groupName).textColorHex,
                    }}
                  >
                    <span>●</span>
                    <span>NHÓM: {groupName.toUpperCase()}</span>
                  </div>
                )}
              </div>

              {/* Form Input Fields Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    MÃ LINH KIỆN (AUTO-FILL)
                  </label>
                  <input
                    type="text"
                    value={partCode}
                    onChange={(e) => setPartCode(e.target.value)}
                    required
                    placeholder="Mã linh kiện..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-extrabold text-blue-800 focus:bg-white text-sm outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    TÊN LINH KIỆN
                  </label>
                  <input
                    type="text"
                    value={partName}
                    onChange={(e) => setPartName(e.target.value)}
                    required
                    placeholder="Tên linh kiện..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-extrabold text-slate-900 focus:bg-white text-sm outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    QUY CÁCH CCDC
                  </label>
                  <input
                    type="text"
                    value={ccdcSpec}
                    onChange={(e) => setCcdcSpec(e.target.value)}
                    placeholder="Quy cách CCDC..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-700 focus:bg-white text-sm outline-hidden"
                  />
                </div>

                {/* QUANTITY & OVERRIDE SECTION */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    ĐỊNH MỨC TIÊU CHUẨN (STANDARD QTY)
                  </label>
                  <input
                    type="text"
                    value={standardQty > 0 ? `${standardQty} ${unit}` : 'Đang để trống trong Excel'}
                    readOnly
                    className={`w-full px-3.5 py-2.5 border rounded-xl font-mono font-black text-sm cursor-not-allowed ${
                      standardQty > 0
                        ? 'bg-slate-100 border-slate-300 text-amber-800'
                        : 'bg-rose-50 border-rose-200 text-rose-700'
                    }`}
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Định mức mã hóa trong tem QR Thẻ Thùng.</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-extrabold text-blue-900">
                      SỐ LƯỢNG BÓC TÁCH (NHẬP SỐ LƯỢNG THỰC TẾ) <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsOverride(!isOverride)}
                      className="text-[10px] font-bold text-amber-700 hover:underline cursor-pointer"
                    >
                      {isOverride ? 'Khôi phục định mức' : 'Ghi đè ngoại lệ'}
                    </button>
                  </div>
                  <input
                    type="number"
                    min={1}
                    value={actualQty === 0 ? '' : actualQty}
                    onChange={(e) => {
                      const val = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                      setActualQty(val);
                      if (val !== standardQty) {
                        setIsOverride(true);
                      } else {
                        setIsOverride(false);
                      }
                    }}
                    placeholder="Bắt buộc nhập số lượng..."
                    required
                    className={`w-full px-3.5 py-2.5 border rounded-xl font-mono font-black text-base outline-hidden focus:ring-2 ${
                      actualQty === 0
                        ? 'bg-rose-50 border-rose-400 text-rose-900 focus:ring-rose-500'
                        : isQtyDifference
                        ? 'bg-amber-50 border-amber-400 text-amber-900 focus:ring-amber-500'
                        : 'bg-emerald-50 border-emerald-300 text-emerald-900 focus:ring-emerald-500'
                    }`}
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    {actualQty === 0 ? (
                      <span className="text-rose-600 font-extrabold">
                        ⚠️ Thẻ chưa có định mức sẵn. Hãy nhập số lượng thực tế tại đây!
                      </span>
                    ) : isQtyDifference ? (
                      <span className="text-amber-700 font-extrabold">
                        ⚠️ Đã sửa tay khác định mức ({actualQty - standardQty} {unit})
                      </span>
                    ) : (
                      'Bằng số lượng tiêu chuẩn định mức'
                    )}
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    ĐƠN VỊ TÍNH (ĐVT)
                  </label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 text-sm outline-hidden"
                  />
                </div>
              </div>

              {/* EXCEPTION REASON */}
              {isQtyDifference && (
                <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl space-y-3 animate-in fade-in">
                  <div className="flex items-center space-x-2 text-amber-900 font-extrabold text-xs">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    <span>CẢNH BÁO: SỐ LƯỢNG BÓC TÁCH LẺ SO VỚI QUY CHUẨN TIÊU CHUẨN!</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-bold text-amber-900 mb-1">
                        CHỌN NHANH LÝ DO NGOẠI LỆ (EXCEPTION REASON):
                      </label>
                      <select
                        value={exceptionReason}
                        onChange={(e) => setExceptionReason(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-hidden"
                      >
                        <option value="Thùng thô dư lẻ (Thiếu từ NCC)">Thùng thô dư lẻ (Thiếu hàng từ NCC)</option>
                        <option value="Hàng hỏng / móp vỡ trong bóc tách">Hàng hỏng / móp vỡ trong bóc tách</option>
                        <option value="Chẻ thùng cấp dở dở theo lệnh">Chẻ thùng cấp dở dở theo lệnh</option>
                        <option value="Yêu cầu bổ sung đặc biệt">Yêu cầu bổ sung đặc biệt</option>
                        <option value="Khác">Lý do khác</option>
                      </select>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-amber-200 text-amber-900 font-semibold text-[11px] flex items-center justify-between">
                      <span>Chênh lệch so với chuẩn:</span>
                      <strong className="font-mono font-black text-sm text-amber-800">
                        {actualQty - standardQty > 0 ? `+${actualQty - standardQty}` : actualQty - standardQty} {unit}
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              {/* OUTBUFFER SCANNING & LOGGED IN USER OPERATOR */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2 border-t border-slate-100">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    NHÂN VIÊN BÓC TÁCH (THEO TÀI KHOẢN ĐĂNG NHẬP)
                  </label>
                  <div className="flex items-center space-x-2 px-3.5 py-2.5 bg-slate-100 border border-slate-300 rounded-xl font-extrabold text-slate-800 text-sm">
                    <User className="w-4 h-4 text-blue-700 shrink-0" />
                    <span className="truncate">{operator}</span>
                    <span className="ml-auto text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold shrink-0">
                      Đang đăng nhập
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-blue-900">
                      📍 QUÉT MÃ KỆ OUTBUFFER
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsBufferQrScanning(!isBufferQrScanning)}
                      className="text-[10px] text-blue-700 font-bold hover:underline cursor-pointer"
                    >
                      {isBufferQrScanning ? 'Ẩn Quét' : 'Quét Camera QR Kệ'}
                    </button>
                  </div>

                  {isBufferQrScanning && (
                    <div className="p-2 bg-slate-900 rounded-xl mb-2">
                      <InlineQrScanner
                        onScanSuccess={handleScanBufferQrSuccess}
                        placeholderText="Quét QR trên Kệ OUTBUFFER (Tự động xác nhận)..."
                      />
                    </div>
                  )}

                  <select
                    value={targetBuffer}
                    onChange={(e) => setTargetBuffer(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-blue-50 border border-blue-300 rounded-xl font-extrabold text-blue-900 text-sm outline-hidden cursor-pointer"
                  >
                    {buffers.map((b) => (
                      <option key={b.locationId} value={b.locationId}>
                        📍 {b.locationId}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Quét QR Kệ sẽ tự động xác nhận bóc tách. Nếu chọn thủ công từ danh sách thì bấm nút bên dưới.
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-3 bg-blue-800 hover:bg-blue-900 text-white rounded-2xl font-black text-sm shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2"
                >
                  <Check className="w-5 h-5 text-amber-300" />
                  <span>XÁC NHẬN HOÀN TẤT BÓC TÁCH & ĐẨY LÊN KỆ OUTBUFFER</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: Pending Queue */}
        {activeTab === 'pending' && (
          <div className="p-4 sm:p-6">
            {groupedPendingList.length === 0 ? (
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
                      <th className="p-3">Mã Linh Kiện</th>
                      <th className="p-3">Tên Linh Kiện</th>
                      <th className="p-3 text-right">SL Xuất Thô (Cộng Dồn)</th>
                      <th className="p-3 text-center">ĐVT</th>
                      <th className="p-3">Các Mốc Thời Gian & SL Cụ Thể (Lô FIFO)</th>
                      {isAdmin && <th className="p-3 text-center w-16">Xóa</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {groupedPendingList.map((group, idx) => (
                      <tr key={group.partCode} className="hover:bg-blue-50/50 transition-colors">
                        <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                        <td className="p-3 font-mono font-bold text-blue-700 text-sm">
                          {group.partCode}
                        </td>
                        <td className="p-3 font-semibold text-slate-900">{group.partName}</td>
                        <td className="p-3 text-right font-black text-amber-900 bg-amber-50/80 text-sm">
                          {group.totalRawQuantity.toLocaleString('vi-VN')}
                        </td>
                        <td className="p-3 text-center text-slate-600 font-medium">{group.unit}</td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1.5 py-1">
                            {group.batches.map((batch, bIdx) => {
                              const dateObj = new Date(batch.createdAt);
                              const timeStr = dateObj.toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              });
                              const dateStr = dateObj.toLocaleDateString('vi-VN');
                              return (
                                <span
                                  key={batch.id}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700 shadow-2xs"
                                >
                                  <span className="font-extrabold text-blue-800">Lô #{bIdx + 1}:</span>
                                  <span className="text-slate-600 font-mono">{timeStr} ({dateStr})</span>
                                  <span className="font-black text-amber-800 bg-amber-100/90 px-1.5 py-0.5 rounded text-[11px]">
                                    +{batch.rawQuantity.toLocaleString('vi-VN')} {group.unit}
                                  </span>
                                  {isAdmin && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteBatch(batch.id, group.partCode)}
                                      className="ml-1 text-slate-400 hover:text-rose-600 font-bold px-1 rounded cursor-pointer"
                                      title="Xóa riêng mốc thời gian/lô này (Quản trị viên)"
                                    >
                                      ✕
                                    </button>
                                  )}
                                </span>
                              );
                            })}
                          </div>
                        </td>
                        {isAdmin && (
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteGroup(group.partCode, group.batches)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-700 rounded-lg cursor-pointer transition-colors"
                              title="Xóa toàn bộ linh kiện chờ bóc tách này (Chỉ Quản trị viên)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Completed History */}
        {activeTab === 'history' && (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="p-3 w-10 text-center">STT</th>
                    <th className="p-3">Mã Linh Kiện</th>
                    <th className="p-3">Tên Linh Kiện</th>
                    <th className="p-3 text-right text-emerald-800 bg-emerald-50">SL Thực Bóc</th>
                    <th className="p-3 text-right text-rose-800 bg-rose-50">SL Phế Phẩm</th>
                    <th className="p-3">Vị Trí Kệ Buffer</th>
                    <th className="p-3">Người Bóc Tách</th>
                    <th className="p-3 text-center">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {completedItems.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 italic">
                        Chưa có dữ liệu lịch sử bóc tách
                      </td>
                    </tr>
                  ) : (
                    completedItems.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                        <td className="p-3 font-mono font-bold text-blue-700">{item.partCode}</td>
                        <td className="p-3 font-semibold text-slate-900">{item.partName}</td>
                        <td className="p-3 text-right font-black text-emerald-700 bg-emerald-50/50">
                          {item.kittedQuantity} {item.unit}
                        </td>
                        <td className="p-3 text-right font-bold text-rose-600 bg-rose-50/50">
                          {item.scrapQuantity || 0}
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

      {/* PROMINENT RESULT NOTIFICATION MODAL (SUCCESS OK or ERROR) */}
      {resultModal && resultModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className={`bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border-4 transform transition-all animate-in zoom-in-95 ${
              resultModal.isSuccess
                ? 'border-emerald-500 shadow-emerald-500/20'
                : 'border-rose-500 shadow-rose-500/20'
            }`}
          >
            <div className="text-center space-y-4">
              {/* Big Icon */}
              <div className="flex justify-center">
                {resultModal.isSuccess ? (
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center border-4 border-emerald-300 animate-bounce">
                    <CheckCircle2 className="w-12 h-12 text-emerald-600" />
                  </div>
                ) : (
                  <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center border-4 border-rose-300">
                    <XCircle className="w-12 h-12 text-rose-600" />
                  </div>
                )}
              </div>

              {/* Title & Message */}
              <div>
                <h3
                  className={`text-xl sm:text-2xl font-black uppercase tracking-tight ${
                    resultModal.isSuccess ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {resultModal.title}
                </h3>
                <p className="text-slate-600 font-medium text-sm mt-2 leading-relaxed">
                  {resultModal.message}
                </p>
              </div>

              {/* Details breakdown for Success */}
              {resultModal.isSuccess && resultModal.details && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left text-xs space-y-2">
                  <div className="flex justify-between border-b border-slate-200 pb-1.5">
                    <span className="text-slate-500 font-bold">Mã linh kiện:</span>
                    <strong className="font-mono text-blue-700 text-sm font-extrabold">
                      {resultModal.details.partCode}
                    </strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-1.5">
                    <span className="text-slate-500 font-bold">Tên linh kiện:</span>
                    <strong className="text-slate-900 font-bold truncate max-w-[200px]">
                      {resultModal.details.partName}
                    </strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-1.5">
                    <span className="text-slate-500 font-bold">Số lượng thực bóc:</span>
                    <strong className="text-emerald-700 font-mono text-base font-black">
                      {resultModal.details.qty} {resultModal.details.unit}
                    </strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-1.5">
                    <span className="text-slate-500 font-bold">Vị trí Kệ Outbuffer:</span>
                    <strong className="text-blue-800 font-bold flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-blue-600" />
                      <span>{resultModal.details.bufferLocation}</span>
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">Nhân viên thực hiện:</span>
                    <strong className="text-slate-800 font-bold">{resultModal.details.operatorName}</strong>
                  </div>
                </div>
              )}

              {/* Action Close Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setResultModal(null)}
                  className={`w-full py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider text-white shadow-lg transition-all cursor-pointer ${
                    resultModal.isSuccess
                      ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-95'
                      : 'bg-rose-600 hover:bg-rose-700 active:scale-95'
                  }`}
                >
                  {resultModal.isSuccess ? '✓ OK - ĐÃ XÁC NHẬN' : 'ĐÓNG & KIỂM TRA LẠI'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Container Tag Manager Modal */}
      <ContainerTagManagerModal
        isOpen={isTagManagerOpen}
        onClose={() => setIsTagManagerOpen(false)}
        onSelectTagForKitting={(tag) => {
          handleProcessTagSelection(tag);
          setActiveTab('smart_scan');
        }}
      />
    </div>
  );
};

