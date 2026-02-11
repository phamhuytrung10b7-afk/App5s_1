
import React, { useState, useRef, useEffect } from 'react';
import { inventoryService } from './inventoryService';
import { exportTransactionHistory, exportDraftScannedList } from './services/reportService';
import { Scan, Plus, Trash2, CheckCircle, Warehouse, AlertTriangle, XCircle, ClipboardCheck, ArrowRight, History, ChevronDown, ChevronUp, Calendar, Search, FileSpreadsheet, Box } from 'lucide-react';
import { playSound } from './utils/sound';
import { ProductionPlan, UnitStatus, Transaction } from './types';

export const Inbound: React.FC = () => {
  const warehouses = inventoryService.getWarehouses();
  const plans = inventoryService.getProductionPlans();

  const [activeTab, setActiveTab] = useState<'SCAN' | 'HISTORY'>('SCAN');
  const [historyFrom, setHistoryFrom] = useState(new Date().toISOString().split('T')[0]);
  const [historyTo, setHistoryTo] = useState(new Date().toISOString().split('T')[0]);
  const [historyData, setHistoryData] = useState<Transaction[]>([]);
  const [expandedTx, setExpandedTx] = useState<string | null>(null);

  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [location, setLocation] = useState(warehouses.length > 0 ? warehouses[0].name : '');
  
  const selectedPlan = plans.find(p => p.id === selectedPlanId);
  const selectedProduct = selectedPlan ? inventoryService.getProductById(selectedPlan.productId) : null;
  
  const [currentSerial, setCurrentSerial] = useState('');
  const [serialList, setSerialList] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{type: 'success' | 'error' | 'warning', text: string} | null>(null);

  useEffect(() => {
    if (activeTab === 'HISTORY') {
      const data = inventoryService.getHistoryByDateRange(['INBOUND'], historyFrom, historyTo);
      setHistoryData(data);
    }
  }, [activeTab, historyFrom, historyTo]);

  useEffect(() => {
    if (activeTab === 'SCAN') inputRef.current?.focus();
  }, [serialList, message, selectedPlanId, activeTab]);

  const getPlanProgress = (plan: ProductionPlan) => {
      const total = plan.serials.length;
      const imported = plan.serials.filter(s => inventoryService.checkSerialImported(s)).length;
      const sessionCount = serialList.filter(s => plan.serials.includes(s)).length;
      return { total, imported, sessionCount, current: imported + sessionCount };
  };
  
  const progress = selectedPlan ? getPlanProgress(selectedPlan) : { total: 0, imported: 0, sessionCount: 0, current: 0 };

  const handleAddSerial = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedPlan) { playSound('error'); setMessage({ type: 'error', text: 'Vui lòng chọn Kế hoạch sản xuất!' }); return; }
    const scannedCode = currentSerial.trim();
    if (!scannedCode) return;
    if (serialList.includes(scannedCode)) { playSound('warning'); setMessage({ type: 'warning', text: `Mã ${scannedCode} đã vừa quét xong!` }); setCurrentSerial(''); return; }
    
    // Kiểm tra xem mã có thuộc kế hoạch không
    if (!selectedPlan.serials.includes(scannedCode)) { playSound('error'); setMessage({ type: 'error', text: `Mã ${scannedCode} KHÔNG thuộc kế hoạch!` }); setCurrentSerial(''); return; }
    
    const unit = inventoryService.getUnitBySerial(scannedCode);
    if (unit) {
      if (unit.status === UnitStatus.NEW) {
        playSound('error');
        setMessage({ type: 'error', text: `Lỗi: Mã ${scannedCode} đang có sẵn trong kho!` });
        setCurrentSerial('');
        return;
      }
      if (unit.isReimported) {
        playSound('error');
        setMessage({ type: 'error', text: `Lỗi: Mã ${scannedCode} đã từng tái nhập trước đó. Không thể nhập lại lần 2.` });
        setCurrentSerial('');
        return;
      }
      // Nếu máy đã SOLD và chưa từng tái nhập -> Cho phép
      playSound('success');
      setMessage({ type: 'warning', text: `Phát hiện TÁI NHẬP: Mã ${scannedCode} (Đã bán trước đó)` });
    } else {
      playSound('success');
      setMessage({ type: 'success', text: `OK: ${scannedCode}` });
    }

    setSerialList([...serialList, scannedCode]);
    setCurrentSerial('');
  };

  const handleSubmit = () => {
    try {
      if (!selectedProduct || !location || serialList.length === 0 || !selectedPlan) throw new Error("Thông tin không đầy đủ");
      inventoryService.importUnits(selectedProduct.id, serialList, location, selectedPlan.name);
      playSound('success');
      setMessage({ type: 'success', text: `Đã nhập kho ${serialList.length} máy thành công theo Lô: ${selectedPlan.name}.` });
      setSerialList([]);
    } catch (err: any) { 
      playSound('error'); 
      setMessage({ type: 'error', text: err.message }); 
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border">
         <div className="flex items-center gap-3">
             <div className="bg-green-100 p-3 rounded-full text-green-600"><Scan /></div>
             <div><h2 className="text-xl font-bold">Quản lý Nhập Kho</h2><p className="text-slate-500 text-sm">Xử lý nhập máy RO từ sản xuất hoặc Tái nhập.</p></div>
         </div>
         <div className="flex bg-slate-100 p-1 rounded-lg">
             <button onClick={() => setActiveTab('SCAN')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'SCAN' ? 'bg-white shadow text-green-700' : 'text-slate-500'}`}>Nhập Mới</button>
             <button onClick={() => setActiveTab('HISTORY')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'HISTORY' ? 'bg-white shadow text-green-700' : 'text-slate-500'}`}>Lịch sử</button>
         </div>
      </div>

      {activeTab === 'SCAN' && (
         <div className="bg-white p-8 rounded-xl shadow-sm border">
            {plans.length === 0 ? <div className="text-center p-8 text-slate-500 italic">Chưa có kế hoạch sản xuất.</div> : (
               <>
                  {message && (
                     <div className={`p-4 mb-6 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700' : message.type === 'warning' ? 'bg-orange-50 text-orange-700 border border-orange-200' : 'bg-red-50 text-red-700'}`}>
                        {message.type === 'success' ? <CheckCircle size={20} /> : message.type === 'warning' ? <AlertTriangle size={20}/> : <XCircle size={20} />}
                        <span className="font-medium">{message.text}</span>
                     </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 bg-slate-50 p-6 rounded-xl border">
                     <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Chọn Kế hoạch / Lô SX</label>
                        <select className="w-full p-3 border rounded-lg bg-white" value={selectedPlanId} onChange={(e) => { setSelectedPlanId(e.target.value); setSerialList([]); setMessage(null); }}>
                           <option value="">-- Chọn Kế hoạch --</option>
                           {plans.map(p => { const prog = getPlanProgress(p); return <option key={p.id} value={p.id}>{p.name} ({prog.imported}/{prog.total})</option>; })}
                        </select>
                     </div>
                     <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Chọn Kho Nhập</label>
                        <select className="w-full p-3 border rounded-lg bg-white" value={location} onChange={(e) => setLocation(e.target.value)}>
                           {warehouses.map(wh => <option key={wh.id} value={wh.name}>{wh.name}</option>)}
                        </select>
                     </div>
                  </div>

                  {selectedPlan && (
                     <div className="border-t pt-6">
                        <label className="block text-sm font-bold text-slate-700 mb-2">Quét mã Serial/QR</label>
                        <form onSubmit={handleAddSerial} className="flex gap-2 mb-4">
                           <input ref={inputRef} type="text" placeholder="Quét mã vạch..." className="flex-1 p-4 border rounded-lg font-mono text-lg shadow-sm" value={currentSerial} onChange={(e) => setCurrentSerial(e.target.value)} autoFocus />
                           <button type="submit" className="px-8 py-3 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-700">+ Thêm</button>
                        </form>
                        {serialList.length > 0 && (
                           <div className="bg-white rounded-lg p-4 border shadow-sm mt-6">
                              <div className="flex justify-between items-center mb-4">
                                <h4 className="font-bold flex items-center gap-2 text-green-700"><CheckCircle size={18}/> Đang chờ nhập ({serialList.length})</h4>
                                <button onClick={() => exportDraftScannedList(serialList, 'Nhap_Moi')} className="text-green-600 hover:text-green-700 font-bold flex items-center gap-1 text-xs"><FileSpreadsheet size={14} /> Xuất nháp</button>
                              </div>
                              <div className="space-y-2 max-h-60 overflow-y-auto bg-slate-50 p-2 rounded-lg">
                                 {serialList.map((sn, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-white p-3 rounded border">
                                       <span className="font-mono font-bold">{sn}</span>
                                       <button onClick={() => setSerialList(serialList.filter(s => s !== sn))} className="text-slate-400 hover:text-red-500"><Trash2 size={18} /></button>
                                    </div>
                                 ))}
                              </div>
                              <div className="mt-6 flex justify-end"><button onClick={handleSubmit} className="bg-water-600 text-white py-3 px-8 rounded-lg font-bold hover:bg-water-700 flex items-center gap-2">Xác nhận Nhập Kho <ArrowRight size={20}/></button></div>
                           </div>
                        )}
                     </div>
                  )}
               </>
            )}
         </div>
      )}

      {activeTab === 'HISTORY' && (
         <div className="bg-white p-6 rounded-xl shadow-sm border space-y-6">
             <div className="flex justify-between items-end border-b pb-6">
                <div className="flex gap-4">
                   <input type="date" className="p-2 border rounded-lg" value={historyFrom} onChange={e => setHistoryFrom(e.target.value)} />
                   <input type="date" className="p-2 border rounded-lg" value={historyTo} onChange={e => setHistoryTo(e.target.value)} />
                </div>
                <button onClick={() => exportTransactionHistory(historyData, 'Lich_su_Nhap')} className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-sm"><FileSpreadsheet size={16}/> Xuất Excel</button>
             </div>
             <div className="space-y-4">
                {historyData.map(tx => (
                  <div key={tx.id} className="border rounded-lg overflow-hidden hover:border-green-200 transition-colors">
                     <div className="bg-slate-50 p-4 flex justify-between items-center cursor-pointer" onClick={() => setExpandedTx(expandedTx === tx.id ? null : tx.id)}>
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-full ${tx.isReimportTx ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                            <Calendar size={18} />
                          </div>
                          <div>
                            <div className="font-bold">{new Date(tx.date).toLocaleString('vi-VN')}</div>
                            <div className="text-sm text-slate-500 flex items-center gap-2">
                              {inventoryService.getProductById(tx.productId)?.model} • {tx.toLocation}
                              {tx.planName && (
                                <span className="bg-water-50 text-water-700 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                                  <Box size={10}/> LÔ: {tx.planName}
                                </span>
                              )}
                              {tx.isReimportTx && <span className="text-orange-600 font-bold ml-1">(Tái nhập)</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4"><div className="text-right font-bold text-green-600 text-lg">+{tx.quantity}</div><button className="text-slate-400">{expandedTx === tx.id ? <ChevronUp /> : <ChevronDown />}</button></div>
                     </div>
                     {expandedTx === tx.id && <div className="p-4 bg-white border-t grid grid-cols-2 md:grid-cols-4 gap-2">{tx.serialNumbers.map(sn => <div key={sn} className="font-mono text-xs bg-slate-50 p-2 rounded text-center">{sn}</div>)}</div>}
                  </div>
                ))}
                {historyData.length === 0 && <div className="text-center py-12 text-slate-400 border border-dashed rounded-lg">Không tìm thấy lịch sử nhập trong khoảng thời gian này.</div>}
             </div>
         </div>
      )}
    </div>
  );
};
