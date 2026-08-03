import React, { useState } from 'react';
import { Part, AppSettings } from './types';
import { storageService } from './storage';
import { ArrowUpRight, CheckCircle2, AlertTriangle, AlertCircle, Package, Clock, User, FileCode, FileText, QrCode, Zap } from 'lucide-react';
import { SearchableSelect, SelectOption } from './SearchableSelect';
import { QrScannerModal } from './QrScannerModal';
import { InlineQrScanner } from './InlineQrScanner';

interface StockOutViewProps {
  parts: Part[];
  settings: AppSettings;
  onSuccess: () => void;
}

const getNowLocalDateTime = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 16);
};

export const StockOutView: React.FC<StockOutViewProps> = ({ parts, settings, onSuccess }) => {
  const [selectedPartId, setSelectedPartId] = useState(parts[0]?.id || '');
  const [quantity, setQuantity] = useState<number>(10);
  const [dateTime, setDateTime] = useState(getNowLocalDateTime());

  // Default person from settings
  const defaultPerson = settings.staffList?.[1] || settings.staffList?.[0] || 'Lê Hoàng Nam (Xưởng 1)';
  const [person, setPerson] = useState(defaultPerson);

  // Default production order from settings
  const defaultLSX = settings.productionOrders?.[0] || 'LSX-2026-HL288';
  const [productionOrder, setProductionOrder] = useState(defaultLSX);

  // Default purpose from settings
  const defaultPurpose = settings.stockOutPurposes?.[0] || 'Sản xuất theo đơn hàng';
  const [purpose, setPurpose] = useState(defaultPurpose);

  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const [mainTab, setMainTab] = useState<'scan' | 'model' | 'manual'>('model');

  // Model-based stock out states
  const [selectedBOMId, setSelectedBOMId] = useState<string>('');
  const [modelQty, setModelQty] = useState<number>(1);
  const [bomChecks, setBomChecks] = useState<Record<string, boolean>>({});

  const [scannedPartForQuickOut, setScannedPartForQuickOut] = useState<Part | null>(null);
  const [quickOutQty, setQuickOutQty] = useState<number>(10);
  const [autoScanHistory, setAutoScanHistory] = useState<
    { id: string; partCode: string; partName: string; qty: number; unit: string; time: string; stockAfter: number }[]
  >([]);

  const selectedPart = parts.find((p) => p.id === selectedPartId);
  const isOverStock = selectedPart ? quantity > selectedPart.currentStock : false;

  // Execute quick stock out
  const handleQuickStockOut = (partToOut: Part, qtyToOut: number) => {
    if (qtyToOut <= 0) {
      setMessage({ type: 'error', text: 'Số lượng xuất phải lớn hơn 0!' });
      return;
    }
    if (qtyToOut > partToOut.currentStock) {
      setMessage({
        type: 'error',
        text: `Số lượng xuất (${qtyToOut} ${partToOut.unit}) vượt quá tồn kho thực tế hiện tại (${partToOut.currentStock} ${partToOut.unit})!`,
      });
      return;
    }

    try {
      const tx = storageService.addStockOut({
        partId: partToOut.id,
        quantity: qtyToOut,
        date: new Date().toISOString(),
        person: person.trim() || 'Lê Hoàng Nam (Xưởng 1)',
        productionOrder: productionOrder.trim() || 'LSX-TỰ-ĐỘNG',
        reasonOrPurpose: purpose.trim() || 'Sản xuất theo đơn hàng',
        notes: 'Xuất kho qua quét mã QR tự động',
      });

      const nowTimeStr = new Date().toLocaleTimeString('vi-VN');
      setAutoScanHistory((prev) => [
        {
          id: `${partToOut.id}-${Date.now()}`,
          partCode: partToOut.code,
          partName: partToOut.name,
          qty: qtyToOut,
          unit: partToOut.unit,
          time: nowTimeStr,
          stockAfter: tx.stockAfter,
        },
        ...prev,
      ]);

      setMessage({
        type: 'success',
        text: `🎉 ĐÃ XUẤT KHO THÀNH CÔNG! -${qtyToOut} ${tx.unit} cho [${tx.partCode}] ${tx.partName}. Tồn kho còn lại: ${tx.stockAfter} ${tx.unit}.`,
      });

      setScannedPartForQuickOut(null);
      onSuccess();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Lỗi khi xuất kho' });
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
    if (!selectedPart) {
      setMessage({ type: 'error', text: 'Vui lòng chọn linh kiện cần xuất kho!' });
      return;
    }
    if (quantity <= 0) {
      setMessage({ type: 'error', text: 'Số lượng xuất phải lớn hơn 0!' });
      return;
    }
    if (quantity > selectedPart.currentStock) {
      setMessage({
        type: 'error',
        text: `Số lượng xuất (${quantity} ${selectedPart.unit}) lớn hơn số lượng tồn kho hiện tại (${selectedPart.currentStock} ${selectedPart.unit})!`,
      });
      return;
    }
    if (!person.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng chọn hoặc nhập tên người lấy linh kiện!' });
      return;
    }

    try {
      const tx = storageService.addStockOut({
        partId: selectedPartId,
        quantity: Number(quantity),
        date: new Date(dateTime).toISOString(),
        person: person.trim(),
        productionOrder: productionOrder.trim(),
        reasonOrPurpose: purpose.trim(),
        notes: notes.trim(),
      });

      setMessage({
        type: 'success',
        text: `Đã xuất kho thành công -${quantity} ${tx.unit} cho [${tx.partCode}] ${tx.partName}. Tồn kho còn lại: ${tx.stockAfter} ${tx.unit}.`,
      });

      // Reset form
      setNotes('');
      setDateTime(getNowLocalDateTime());
      onSuccess();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Lỗi khi xuất kho' });
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
        <div className="p-3 bg-blue-100 text-blue-700 rounded-xl">
          <ArrowUpRight className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">PHIẾU XUẤT KHO LINH KIỆN</h2>
          <p className="text-xs text-slate-500">Tự động trừ tồn kho, liên kết mã lệnh sản xuất, ghi thời gian chính xác và chống xuất âm kho.</p>
        </div>
      </div>

      {/* Main Mode Selection Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-100/80 p-1.5 rounded-2xl gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
        <button
          type="button"
          onClick={() => setMainTab('model')}
          className={`px-4 py-3 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center space-x-2 cursor-pointer ${
            mainTab === 'model'
              ? 'bg-pink-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>1. XUẤT THEO MODEL (BOM)</span>
        </button>

        <button
          type="button"
          onClick={() => setMainTab('scan')}
          className={`px-4 py-3 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center space-x-2 cursor-pointer ${
            mainTab === 'scan'
              ? 'bg-indigo-800 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Zap className="w-4 h-4 text-cyan-300 animate-pulse" />
          <span>2. QUÉT MÃ TỰ ĐỘNG (NHANH)</span>
        </button>

        <button
          type="button"
          onClick={() => setMainTab('manual')}
          className={`px-4 py-3 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center space-x-2 cursor-pointer ${
            mainTab === 'manual'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <FileText className="w-4 h-4 text-slate-500" />
          <span>3. XUẤT THỦ CÔNG</span>
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

      {/* TAB 1: MODEL-BASED STOCK OUT */}
      {mainTab === 'model' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Chọn Model (Lệnh Sản Xuất) <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedBOMId}
                onChange={(e) => {
                  setSelectedBOMId(e.target.value);
                  const selectedBom = storageService.getModelBOMs().find(b => b.id === e.target.value);
                  if (selectedBom) {
                    const initialChecks: Record<string, boolean> = {};
                    selectedBom.items.forEach(item => {
                      initialChecks[item.partCode] = true;
                    });
                    setBomChecks(initialChecks);
                  } else {
                    setBomChecks({});
                  }
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-pink-500 outline-hidden"
              >
                <option value="">-- Chọn Model (BOM) --</option>
                {storageService.getModelBOMs().map(bom => (
                  <option key={bom.id} value={bom.id}>{bom.name} ({bom.items.length} LK)</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Số Lượng Sản Xuất <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                value={modelQty}
                onChange={(e) => setModelQty(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-center focus:ring-2 focus:ring-pink-500 outline-hidden"
              />
            </div>
          </div>

          {selectedBOMId && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-sm flex items-center">
                  <FileCode className="w-4 h-4 text-pink-600 mr-2" />
                  Danh Sách Linh Kiện Sẽ Xuất Theo Định Mức
                </h3>
                <span className="text-xs bg-pink-100 text-pink-800 px-2 py-1 rounded-lg font-bold">
                  {Object.values(bomChecks).filter(Boolean).length} / {storageService.getModelBOMs().find(b => b.id === selectedBOMId)?.items.length} linh kiện chọn xuất
                </span>
              </div>
              
              <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-96">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-slate-50 text-slate-600 sticky top-0 shadow-sm">
                    <tr>
                      <th className="p-3 w-10">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded text-pink-600 focus:ring-pink-500 cursor-pointer"
                          checked={
                            storageService.getModelBOMs().find(b => b.id === selectedBOMId)?.items.length! > 0 &&
                            storageService.getModelBOMs().find(b => b.id === selectedBOMId)?.items.every(i => bomChecks[i.partCode])
                          }
                          onChange={(e) => {
                            const selectedBom = storageService.getModelBOMs().find(b => b.id === selectedBOMId);
                            if (selectedBom) {
                              const newChecks: Record<string, boolean> = {};
                              selectedBom.items.forEach(item => {
                                newChecks[item.partCode] = e.target.checked;
                              });
                              setBomChecks(newChecks);
                            }
                          }}
                        />
                      </th>
                      <th className="p-3 font-semibold">Mã Linh Kiện</th>
                      <th className="p-3 font-semibold">Tên Linh Kiện</th>
                      <th className="p-3 font-semibold text-right">Định Mức</th>
                      <th className="p-3 font-semibold text-right">SL Cần Xuất</th>
                      <th className="p-3 font-semibold text-right">Tồn Kho</th>
                      <th className="p-3 font-semibold text-center">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {storageService.getModelBOMs().find(b => b.id === selectedBOMId)?.items.map((item, idx) => {
                      const sysPart = parts.find(p => p.code.toLowerCase() === item.partCode.toLowerCase());
                      const neededQty = item.quantity * modelQty;
                      const hasEnough = sysPart ? sysPart.currentStock >= neededQty : false;
                      const isChecked = bomChecks[item.partCode] || false;
                      
                      return (
                        <tr key={idx} className={`hover:bg-slate-50 transition-colors ${!isChecked ? 'opacity-50 grayscale' : ''}`}>
                          <td className="p-3">
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded text-pink-600 focus:ring-pink-500 cursor-pointer"
                              checked={isChecked}
                              onChange={(e) => {
                                setBomChecks(prev => ({
                                  ...prev,
                                  [item.partCode]: e.target.checked
                                }));
                              }}
                            />
                          </td>
                          <td className="p-3 font-mono font-bold text-slate-800">{item.partCode}</td>
                          <td className="p-3 text-slate-600 max-w-[200px] truncate" title={item.partName}>{item.partName}</td>
                          <td className="p-3 text-right font-medium text-slate-500">{item.quantity}</td>
                          <td className="p-3 text-right font-black text-pink-600">{neededQty.toLocaleString('vi-VN')} {item.unit}</td>
                          <td className="p-3 text-right font-bold text-blue-700">
                            {sysPart ? `${sysPart.currentStock.toLocaleString('vi-VN')} ${sysPart.unit}` : '0 Cái'}
                          </td>
                          <td className="p-3 text-center">
                            {!sysPart ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                                Mã mới
                              </span>
                            ) : hasEnough ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-700">
                                Đủ xuất
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-700">
                                Thiếu hàng
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Action Buttons for Model */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex-1 w-full grid grid-cols-2 gap-4">
                   <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Người Lấy <span className="text-red-500">*</span>
                    </label>
                    <SearchableSelect
                      options={settings.staffList || []}
                      value={person}
                      onChange={(val) => setPerson(val)}
                      placeholder="Chọn người nhận..."
                      allowCustom={true}
                    />
                  </div>
                   <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Ngày Giờ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={dateTime}
                      onChange={(e) => setDateTime(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-hidden"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const selectedBom = storageService.getModelBOMs().find(b => b.id === selectedBOMId);
                    if (!selectedBom) return;
                    if (modelQty <= 0) {
                      setMessage({ type: 'error', text: 'Số lượng sản xuất phải lớn hơn 0!' });
                      return;
                    }

                    // Collect items to out
                    const itemsToOut = selectedBom.items.filter(i => bomChecks[i.partCode]);
                    if (itemsToOut.length === 0) {
                      setMessage({ type: 'error', text: 'Chưa có linh kiện nào được chọn để xuất!' });
                      return;
                    }

                    // Check stock
                    const insufficientParts: string[] = [];
                    for (const item of itemsToOut) {
                      const sysPart = parts.find(p => p.code.toLowerCase() === item.partCode.toLowerCase());
                      const neededQty = item.quantity * modelQty;
                      if (!sysPart || sysPart.currentStock < neededQty) {
                        insufficientParts.push(item.partCode);
                      }
                    }

                    if (insufficientParts.length > 0) {
                      setMessage({ type: 'error', text: `Có ${insufficientParts.length} linh kiện không đủ tồn kho: ${insufficientParts.join(', ')}` });
                      return;
                    }

                    // Perform stock out
                    try {
                      let totalOut = 0;
                      itemsToOut.forEach(item => {
                        const sysPart = parts.find(p => p.code.toLowerCase() === item.partCode.toLowerCase());
                        if (sysPart) {
                          const neededQty = item.quantity * modelQty;
                          storageService.addStockOut({
                            partId: sysPart.id,
                            quantity: neededQty,
                            date: new Date(dateTime).toISOString(),
                            person: person.trim() || 'Lê Hoàng Nam',
                            productionOrder: selectedBom.name,
                            reasonOrPurpose: 'Sản xuất theo Model',
                            notes: `SL SX: ${modelQty}`
                          });
                          totalOut++;
                        }
                      });
                      
                      setMessage({ type: 'success', text: `Đã xuất kho thành công ${totalOut} linh kiện cho Model ${selectedBom.name}!` });
                      // Reset modelQty
                      setModelQty(1);
                      onSuccess();
                    } catch (err: any) {
                      setMessage({ type: 'error', text: err.message || 'Lỗi khi xuất kho hàng loạt' });
                    }
                  }}
                  className="w-full sm:w-auto px-6 py-4 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-sm font-bold shadow-lg transition-all cursor-pointer flex items-center justify-center space-x-2 shrink-0"
                >
                  <ArrowUpRight className="w-5 h-5" />
                  <span>XUẤT KHO HÀNG LOẠT THEO BOM</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: AUTO SCAN & QUICK STOCK OUT MODE */}
      {mainTab === 'scan' && (
        <div className="space-y-6">
          <InlineQrScanner
            mode="out"
            parts={parts}
            onScanSuccess={({ part, qty, contNumber }) => {
              setScannedPartForQuickOut(part);
              setSelectedPartId(part.id);
              if (qty && qty > 0) {
                setQuickOutQty(qty);
                setMessage({
                  type: 'success',
                  text: `Đã nhận diện linh kiện [${part.code}] ${part.name} từ Tem Cont ${contNumber || ''} (Số lượng tem: ${qty} ${part.unit}). Vui lòng kiểm tra và bấm 'XÁC NHẬN XUẤT KHO'.`,
                });
              } else {
                setQuickOutQty(1);
                setMessage({
                  type: 'success',
                  text: `Đã nhận diện linh kiện [${part.code}] ${part.name}. Vui lòng nhập số lượng cần xuất kho và bấm 'XÁC NHẬN XUẤT KHO'.`,
                });
              }
            }}
          />

          {/* Quick Out Confirmation Card when a part is scanned */}
          {scannedPartForQuickOut && (
            <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl border-2 border-cyan-400 shadow-xl space-y-4 animate-in fade-in slide-in-from-top-3">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-indigo-800/80 pb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-cyan-400 text-slate-950 rounded-xl font-black">
                    <Package className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="px-2 py-0.5 bg-cyan-400 text-slate-950 text-[10px] font-black rounded-md uppercase">
                      Đã Nhận Mã Linh Kiện
                    </span>
                    <h3 className="text-base font-extrabold text-white mt-0.5">
                      [{scannedPartForQuickOut.code}] {scannedPartForQuickOut.name}
                    </h3>
                    <p className="text-xs text-indigo-200">Vị trí: {scannedPartForQuickOut.location} • Tồn kho hiện tại: <strong className="text-amber-300 font-bold">{scannedPartForQuickOut.currentStock} {scannedPartForQuickOut.unit}</strong></p>
                  </div>
                </div>

                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setScannedPartForQuickOut(null)}
                    className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                  >
                    Hủy chọn
                  </button>
                </div>
              </div>

              {/* FIFO Batch Recommendation for Quick Out */}
              {(() => {
                const fifoLots = storageService.getPartFifoLots(scannedPartForQuickOut.id);
                const fifoNext = fifoLots.find((l) => l.status === 'FIFO_NEXT');
                if (!fifoNext) return null;

                return (
                  <div className="p-3 bg-amber-400/20 border border-amber-400/50 rounded-xl text-xs space-y-1 text-amber-200">
                    <div className="flex items-center justify-between font-bold text-amber-300">
                      <span className="flex items-center space-x-1.5">
                        <Zap className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
                        <span>GỢI Ý FIFO (#1 NHẬP TRƯỚC XUẤT TRƯỚC):</span>
                      </span>
                      <span className="px-2 py-0.5 bg-amber-400 text-slate-950 text-[10px] font-black rounded-md">
                        {fifoNext.contNumber}
                      </span>
                    </div>
                    <p className="text-amber-100">
                      Khuyến nghị lấy hàng từ Cont <strong className="text-white font-bold">{fifoNext.contNumber}</strong> (Nhập ngày {new Date(fifoNext.importDate).toLocaleDateString('vi-VN')} • Còn tồn {fifoNext.remainingQty.toLocaleString('vi-VN')} {scannedPartForQuickOut.unit}).
                    </p>
                  </div>
                );
              })()}

              <div className="flex flex-wrap items-center justify-between gap-4 pt-1">

                <div className="flex items-center space-x-3">
                  <label className="text-xs font-bold text-slate-200 whitespace-nowrap">
                    Số lượng xuất:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={scannedPartForQuickOut.currentStock}
                    value={quickOutQty}
                    onChange={(e) => setQuickOutQty(Number(e.target.value))}
                    className="w-28 px-3 py-2 bg-slate-950 border border-cyan-400 rounded-xl text-amber-300 font-black text-center text-sm outline-hidden"
                  />
                  <span className="text-xs font-bold text-indigo-200">{scannedPartForQuickOut.unit}</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleQuickStockOut(scannedPartForQuickOut, quickOutQty)}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center space-x-2 cursor-pointer active:scale-95"
                >
                  <Zap className="w-4 h-4 fill-slate-950" />
                  <span>XÁC NHẬN XUẤT KHO NGAY (-{quickOutQty})</span>
                </button>
              </div>
            </div>
          )}

          {/* Auto scan history in current session */}
          {autoScanHistory.length > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="font-extrabold text-xs text-slate-800 flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>DANH SÁCH LƯỢT XUẤT KHO VỪA THỰC HIỆN ({autoScanHistory.length})</span>
                </h4>
                <span className="text-[11px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-md">
                  Đã trừ trực tiếp vào kho
                </span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {autoScanHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-slate-600">[{item.partCode}]</span>{' '}
                      <strong className="text-slate-900">{item.partName}</strong>
                    </div>

                    <div className="text-right">
                      <span className="font-black text-blue-700 text-sm">
                        -{item.qty} {item.unit}
                      </span>
                      <p className="text-[10px] text-slate-400">Tồn còn: {item.stockAfter} • {item.time}</p>
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
              <label className="text-xs font-semibold text-slate-700">
                Chọn Linh Kiện Xuất Kho <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setIsQrModalOpen(true)}
                className="flex items-center space-x-1.5 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold border border-blue-200 transition-colors cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5 text-blue-600" />
                <span>Quét mã camera phụ</span>
              </button>
            </div>

            <SearchableSelect
              options={partOptions}
              value={selectedPartId}
              onChange={(val) => setSelectedPartId(val)}
              placeholder="Gõ mã, tên linh kiện hoặc vị trí để tìm..."
              allowCustom={false}
              icon={<Package className="w-4 h-4 text-blue-600" />}
            />
          </div>

        {/* Selected Part Stock Status Card */}
        {selectedPart && (
          <div className="space-y-3">
            <div
              className={`p-4 border rounded-xl flex items-center justify-between text-xs transition-colors ${
                selectedPart.currentStock === 0
                  ? 'bg-red-50 border-red-200'
                  : isOverStock
                  ? 'bg-amber-50 border-amber-300'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Package className="w-5 h-5 text-blue-600 shrink-0" />
                <div>
                  <p className="font-bold text-slate-800">{selectedPart.name}</p>
                  <p className="text-slate-500 font-mono">Mã: {selectedPart.code} | Vị trí: {selectedPart.location}</p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-slate-500 font-medium">Tồn kho hiện tại:</span>
                <p
                  className={`text-base font-black ${
                    selectedPart.currentStock === 0
                      ? 'text-red-600'
                      : selectedPart.currentStock <= selectedPart.minStock
                      ? 'text-amber-600'
                      : 'text-blue-700'
                  }`}
                >
                  {selectedPart.currentStock.toLocaleString('vi-VN')} {selectedPart.unit}
                </p>
              </div>
            </div>

            {/* FIFO Batch Recommendation Box */}
            {(() => {
              const fifoLots = storageService.getPartFifoLots(selectedPart.id);
              const fifoNext = fifoLots.find((l) => l.status === 'FIFO_NEXT');
              if (!fifoNext) return null;

              return (
                <div className="p-3.5 bg-amber-50 border-2 border-amber-300 rounded-xl text-xs space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-amber-950 flex items-center space-x-1.5">
                      <Zap className="w-4 h-4 text-amber-600 animate-pulse shrink-0" />
                      <span>GỢI Ý KHUYẾN NGHỊ XUẤT KHO THEO FIFO (#1 NHẬP TRƯỚC XUẤT TRƯỚC):</span>
                    </span>
                    <span className="px-2 py-0.5 bg-amber-200 text-amber-950 font-black text-[10px] rounded-md">
                      LÔ CŨ NÊN XUẤT TRƯỚC
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-amber-900">
                    <div>
                      Mốc Cont ưu tiên: <strong className="text-amber-950 text-sm">{fifoNext.contNumber}</strong> (Nhập ngày: {new Date(fifoNext.importDate).toLocaleDateString('vi-VN')})
                      • Còn tồn trong mốc này: <strong className="text-amber-950">{fifoNext.remainingQty.toLocaleString('vi-VN')} {selectedPart.unit}</strong>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setNotes((prev) => (prev ? `${prev} | Gắn Cont FIFO: ${fifoNext.contNumber}` : `Xuất kho FIFO từ Cont ${fifoNext.contNumber}`));
                      }}
                      className="px-2.5 py-1 bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold text-[11px] rounded-lg transition-colors cursor-pointer border border-amber-400"
                    >
                      + Gắn Mã Cont {fifoNext.contNumber} Vào Ghi Chú
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}


        {/* Overstock Warning Banner */}
        {isOverStock && selectedPart && (
          <div className="p-3.5 bg-red-100 border border-red-300 text-red-800 rounded-xl text-xs font-bold flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-red-600 shrink-0" />
            <span>
              CẢNH BÁO: Số lượng muốn xuất ({quantity} {selectedPart.unit}) lớn hơn tồn kho thực tế ({selectedPart.currentStock} {selectedPart.unit}). Hệ thống không cho phép xuất âm kho!
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Quantity */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Số Lượng Xuất <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              className={`w-full px-3 py-2 border rounded-xl text-base font-black focus:ring-2 outline-hidden ${
                isOverStock
                  ? 'bg-red-50 border-red-400 text-red-700 focus:ring-red-500'
                  : 'bg-slate-50 border-slate-300 text-blue-700 focus:ring-blue-500 focus:bg-white'
              }`}
            />
          </div>

          {/* Date & Time (Giờ, phút, ngày) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ngày & Giờ Xuất Kho <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="datetime-local"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-hidden"
              />
            </div>
          </div>

          {/* Person Receiver (Searchable select from Settings staff list) */}
          <div>
            <SearchableSelect
              label="Người Lấy Linh Kiện / Nhận Hàng"
              required
              options={settings.staffList || []}
              value={person}
              onChange={(val) => setPerson(val)}
              placeholder="Chọn nhân sự hoặc gõ tên mới..."
              allowCustom={true}
              icon={<User className="w-4 h-4 text-slate-400" />}
            />
          </div>

          {/* Production Order LSX (Searchable select from Settings productionOrders) */}
          <div>
            <SearchableSelect
              label="Mã Lệnh Sản Xuất (LSX)"
              options={settings.productionOrders || []}
              value={productionOrder}
              onChange={(val) => setProductionOrder(val)}
              placeholder="Chọn LSX hoặc gõ mã LSX mới..."
              allowCustom={true}
              icon={<FileCode className="w-4 h-4 text-slate-400" />}
            />
          </div>
        </div>

        {/* Purpose (Searchable select from Settings stockOutPurposes) */}
        <div>
          <SearchableSelect
            label="Mục Đích Xuất Kho"
            options={settings.stockOutPurposes || []}
            value={purpose}
            onChange={(val) => setPurpose(val)}
            placeholder="Chọn mục đích hoặc gõ mục đích mới..."
            allowCustom={true}
            icon={<FileText className="w-4 h-4 text-slate-400" />}
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Ghi Chú Chi Tiết</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ghi chú thêm..."
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-hidden"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={isOverStock || !selectedPart || selectedPart.currentStock === 0}
            className="flex items-center space-x-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Xác Nhận Xuất Kho</span>
          </button>
        </div>
      </form>
      )}

      {/* QR Scanner Modal */}
      <QrScannerModal
        mode="out"
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        parts={parts}
        onSelectPart={(p) => {
          setSelectedPartId(p.id);
          setIsQrModalOpen(false);
        }}
      />
    </div>
  );
};
