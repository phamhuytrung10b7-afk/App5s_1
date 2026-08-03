import React, { useState } from 'react';
import { Part, AppSettings } from './types';
import { storageService } from './storage';
import { ArrowDownLeft, CheckCircle2, AlertCircle, Package, Clock, User, FileText, QrCode, FileSpreadsheet, Zap } from 'lucide-react';
import { SearchableSelect, SelectOption } from './SearchableSelect';
import { QrScannerModal } from './QrScannerModal';
import { ContainerImportPrintModal } from './ContainerImportPrintModal';
import { InlineQrScanner } from './InlineQrScanner';

interface StockInViewProps {
  parts: Part[];
  settings: AppSettings;
  onSuccess: () => void;
}

const getNowLocalDateTime = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 16);
};

export const StockInView: React.FC<StockInViewProps> = ({ parts, settings, onSuccess }) => {
  const [selectedPartId, setSelectedPartId] = useState(parts[0]?.id || '');
  const [quantity, setQuantity] = useState<number>(100);
  const [dateTime, setDateTime] = useState(getNowLocalDateTime());

  // Default person from settings or initial fallback
  const defaultPerson = settings.staffList?.[0] || settings.managerName || 'Trần Văn Bình (Kho)';
  const [person, setPerson] = useState(defaultPerson);

  // Default reason from settings or initial fallback
  const defaultReason = settings.stockInReasons?.[0] || 'Nhập mua hàng theo hợp đồng';
  const [reason, setReason] = useState(defaultReason);

  const [notes, setNotes] = useState('');
  const [scannedTagId, setScannedTagId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isContModalOpen, setIsContModalOpen] = useState(false);

  const [mainTab, setMainTab] = useState<'scan' | 'manual'>('scan');
  const [autoScanHistory, setAutoScanHistory] = useState<
    { id: string; partCode: string; partName: string; qty: number; unit: string; time: string; contNumber?: string; stockAfter: number }[]
  >([]);

  const selectedPart = parts.find((p) => p.id === selectedPartId);

  // Auto Stock In handler when scanning QR code
  const handleAutoStockInFromQr = ({
    part,
    qty,
    contNumber,
    tagId,
  }: {
    part: Part;
    qty?: number;
    contNumber?: string;
    tagId?: string;
  }) => {
    // ONLY automatically add stock if scanned code contains explicit Cont QR information (qty & contNumber)
    if (!qty || qty <= 0 || !contNumber) {
      setSelectedPartId(part.id);
      setMainTab('manual');
      setMessage({
        type: 'success',
        text: `ℹ️ Đã tìm thấy linh kiện [${part.code}] ${part.name}. Vui lòng nhập số lượng và bấm 'Xác Nhận Nhập Kho' (Chỉ Tem QR Cont tạo từ đợt Cont mới tự động cộng tồn kho theo tem).`,
      });
      return;
    }

    const qtyToIn = qty;
    const reasonText = `Nhập kho theo Cont ${contNumber}`;

    try {
      const tx = storageService.addStockIn({
        partId: part.id,
        quantity: qtyToIn,
        date: new Date().toISOString(),
        person: defaultPerson,
        reasonOrPurpose: reasonText,
        notes: tagId ? `Tem QR Cont ID: ${tagId}` : 'Quét mã tự động Tem Cont',
      });

      if (tagId) {
        storageService.markQrTokenAsUsed(tagId, {
          partCode: part.code,
          quantity: qtyToIn,
          contNumber: contNumber || '',
          person: defaultPerson,
        });
      }

      const nowTimeStr = new Date().toLocaleTimeString('vi-VN');
      setAutoScanHistory((prev) => [
        {
          id: `${part.id}-${Date.now()}`,
          partCode: part.code,
          partName: part.name,
          qty: qtyToIn,
          unit: part.unit,
          time: nowTimeStr,
          contNumber,
          stockAfter: tx.stockAfter,
        },
        ...prev,
      ]);

      setMessage({
        type: 'success',
        text: `🎉 ĐÃ TỰ ĐỘNG CỘNG TỒN KHO THEO TEM CONT THÀNH CÔNG! +${qtyToIn} ${part.unit} cho [${part.code}] ${part.name} (Cont: ${contNumber}). Tồn kho thực tế mới: ${tx.stockAfter} ${part.unit}.`,
      });

      onSuccess();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Lỗi khi tự động cộng tồn kho' });
    }
  };

  // Part options for SearchableSelect
  const partOptions: SelectOption[] = parts.map((p) => ({
    value: p.id,
    label: `[${p.code}] ${p.name}`,
    sublabel: `Tồn: ${p.currentStock} ${p.unit} | Vị trí: ${p.location}`,
    badge: `${p.currentStock} ${p.unit}`,
  }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartId) {
      setMessage({ type: 'error', text: 'Vui lòng chọn linh kiện cần nhập kho!' });
      return;
    }
    if (quantity <= 0) {
      setMessage({ type: 'error', text: 'Số lượng nhập phải lớn hơn 0!' });
      return;
    }
    if (!person.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng chọn hoặc nhập tên người nhập kho!' });
      return;
    }

    try {
      const tx = storageService.addStockIn({
        partId: selectedPartId,
        quantity: Number(quantity),
        date: new Date(dateTime).toISOString(),
        person: person.trim(),
        reasonOrPurpose: reason.trim(),
        notes: notes.trim(),
      });

      // If imported via Cont QR Code, mark this tag as USED so it can NEVER be scanned twice!
      if (scannedTagId) {
        storageService.markQrTokenAsUsed(scannedTagId, {
          partCode: selectedPart?.code || '',
          quantity: Number(quantity),
          contNumber: reason.replace('Nhập kho theo Cont ', ''),
          person: person.trim(),
        });
        setScannedTagId(null);
      }

      setMessage({
        type: 'success',
        text: `Đã nhập kho thành công +${quantity} ${tx.unit} cho [${tx.partCode}] ${tx.partName}. Tồn kho mới: ${tx.stockAfter} ${tx.unit}.`,
      });

      // Reset form
      setQuantity(100);
      setNotes('');
      setDateTime(getNowLocalDateTime());
      onSuccess();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Lỗi khi lưu phiếu nhập kho' });
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">PHIẾU NHẬP KHO LINH KIỆN</h2>
            <p className="text-xs text-slate-500">Tự động cộng dồn tồn kho thực tế, lưu ngày giờ chính xác và cập nhật Thẻ kho.</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsContModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4 text-amber-300" />
          <span>In Tem QR Danh Mục Cont (Excel)</span>
        </button>
      </div>

      {/* Main Mode Selection Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-100/80 p-1.5 rounded-2xl gap-2">
        <button
          type="button"
          onClick={() => setMainTab('scan')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center space-x-2 cursor-pointer ${
            mainTab === 'scan'
              ? 'bg-emerald-700 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-300 animate-pulse" />
          <span>1. QUÉT MÃ TỰ ĐỘNG (TỰ ĐỘNG CỘNG TỒN KHO)</span>
        </button>

        <button
          type="button"
          onClick={() => setMainTab('manual')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center space-x-2 cursor-pointer ${
            mainTab === 'manual'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <FileText className="w-4 h-4 text-slate-500" />
          <span>2. NHẬP KHO THỦ CÔNG (DỰ PHÒNG)</span>
        </button>
      </div>

      {message && (
        <div
          className={`p-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center shadow-xs animate-in zoom-in-95 ${
            message.type === 'success'
              ? 'bg-emerald-50 border-2 border-emerald-300 text-emerald-900'
              : 'bg-red-50 border-2 border-red-300 text-red-900'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 mr-2 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-5 h-5 mr-2 shrink-0 text-red-600" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* TAB 1: AUTO SCAN MODE */}
      {mainTab === 'scan' && (
        <div className="space-y-6">
          <InlineQrScanner
            mode="in"
            parts={parts}
            onScanSuccess={handleAutoStockInFromQr}
          />

          {/* Auto scan history in current session */}
          {autoScanHistory.length > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="font-extrabold text-xs text-slate-800 flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span>DANH SÁCH LƯỢT QUÉT TỰ ĐỘNG VỪA THỰC HIỆN ({autoScanHistory.length})</span>
                </h4>
                <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                  Đã tự động cộng vào tồn kho
                </span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {autoScanHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-slate-600">[{item.partCode}]</span>{' '}
                      <strong className="text-slate-900">{item.partName}</strong>
                      {item.contNumber && (
                        <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-bold rounded-md">
                          Cont: {item.contNumber}
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="font-black text-emerald-700 text-sm">
                        +{item.qty} {item.unit}
                      </span>
                      <p className="text-[10px] text-slate-400">Tồn mới: {item.stockAfter} • {item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MANUAL FORM MODE */}
      {mainTab === 'manual' && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center space-x-2">
                <span>Chọn Linh Kiện Nhập Kho (Nhập thủ công)</span>
              </label>
              <button
                type="button"
                onClick={() => setIsQrModalOpen(true)}
                className="flex items-center space-x-1.5 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold border border-emerald-200 transition-colors cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                <span>Quét mã camera phụ</span>
              </button>
            </div>

            <SearchableSelect
              options={partOptions}
              value={selectedPartId}
              onChange={(val) => setSelectedPartId(val)}
              placeholder="Gõ mã, tên linh kiện hoặc vị trí để tìm..."
              allowCustom={false}
              icon={<Package className="w-4 h-4 text-emerald-600" />}
            />
          </div>

        {/* Selected Part Quick Summary Card */}
        {selectedPart && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center space-x-3">
              <Package className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold text-slate-800">{selectedPart.name}</p>
                <p className="text-slate-500 font-mono">Mã: {selectedPart.code} | Vị trí: {selectedPart.location}</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-slate-500 font-medium">Tồn kho hiện tại:</span>
              <p className="text-base font-black text-emerald-700">
                {selectedPart.currentStock.toLocaleString('vi-VN')} {selectedPart.unit}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Quantity */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Số Lượng Nhập <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-base font-black text-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-hidden"
            />
          </div>

          {/* Date & Time (Giờ, phút, ngày) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ngày & Giờ Nhập Kho <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="datetime-local"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>
          </div>

          {/* Person / Staff (Searchable select from Settings staff list) */}
          <div>
            <SearchableSelect
              label="Người Thực Hiện / Người Nhập Kho"
              required
              options={settings.staffList || []}
              value={person}
              onChange={(val) => setPerson(val)}
              placeholder="Chọn nhân sự hoặc gõ tên mới..."
              allowCustom={true}
              icon={<User className="w-4 h-4 text-slate-400" />}
            />
          </div>

          {/* Reason (Searchable select from Settings stockInReasons) */}
          <div>
            <SearchableSelect
              label="Lý Do Nhập Kho"
              options={settings.stockInReasons || []}
              value={reason}
              onChange={(val) => setReason(val)}
              placeholder="Chọn lý do hoặc gõ lý do mới..."
              allowCustom={true}
              icon={<FileText className="w-4 h-4 text-slate-400" />}
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Ghi Chú Thêm (Số hóa đơn, nhà cung cấp...)</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="VD: Nhập theo HĐ102, Hàng mới 100%..."
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            className="flex items-center space-x-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>Xác Nhận Nhập Kho</span>
          </button>
        </div>
      </form>
      )}

      {/* QR Scanner Modal */}
      <QrScannerModal
        mode="in"
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        parts={parts}
        onSelectPart={(p, autoQty, autoCont, tagId) => {
          setSelectedPartId(p.id);
          if (autoQty !== undefined && autoQty > 0) {
            setQuantity(autoQty);
          }
          if (autoCont) {
            setReason(`Nhập kho theo Cont ${autoCont}`);
          }
          if (tagId) {
            setScannedTagId(tagId);
          }
          if (autoQty !== undefined || autoCont) {
            setMessage({
              type: 'success',
              text: `Đã tự động chọn [${p.code}] ${p.name}${autoQty ? ` và điền số lượng: ${autoQty.toLocaleString('vi-VN')} ${p.unit}` : ''}${autoCont ? ` từ Cont ${autoCont}` : ''}!`,
            });
          }
          setIsQrModalOpen(false);
        }}
      />

      {/* Container Import & QR Print Modal */}
      <ContainerImportPrintModal
        isOpen={isContModalOpen}
        onClose={() => setIsContModalOpen(false)}
        parts={parts}
        settings={settings}
        onRefreshParts={onSuccess}
      />
    </div>
  );
};
