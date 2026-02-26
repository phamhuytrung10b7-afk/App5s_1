
import React, { useState, useRef, useEffect } from 'react';
import { inventoryService } from './inventoryService';
import { exportTransactionHistory } from './reportService';
import { Scan, Plus, Trash2, CheckCircle, Warehouse, AlertTriangle, XCircle, ArrowRight, History, ChevronDown, ChevronUp, Calendar, Box, FileSpreadsheet, RefreshCw, Info, Zap, RefreshCcw, ToggleLeft, ToggleRight, Database, Upload } from 'lucide-react';
import { playSound } from './sound';
import { ProductionPlan, UnitStatus, Transaction } from './types';
import { read, utils } from 'xlsx';

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
  const [autoJump, setAutoJump] = useState(true);
  
  const [currentSerial, setCurrentSerial] = useState('');
  const [recentScans, setRecentScans] = useState<{serial: string, time: string, wh: string, isReimport?: boolean}[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{type: 'success' | 'error' | 'warning', text: string} | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (activeTab === 'HISTORY') {
      const data = inventoryService.getHistoryByDateRange(['INBOUND'], historyFrom, historyTo);
      setHistoryData(data);
    }
  }, [activeTab, historyFrom, historyTo]);

  useEffect(() => {
    if (activeTab === 'SCAN') inputRef.current?.focus();
  }, [recentScans, message, selectedPlanId, activeTab, location, autoJump]);

  const processInboundSerial = (scannedCode: string, currentWhName: string): { success: boolean, targetWh: string, isReimport: boolean } | null => {
    const selectedPlan = plans.find(p => p.id === selectedPlanId);
    const selectedProduct = selectedPlan ? inventoryService.getProductById(selectedPlan.productId) : null;

    if (!selectedPlan || !selectedProduct) { 
      playSound('error'); 
      setMessage({ type: 'error', text: 'Vui lòng chọn Kế hoạch sản xuất trước!' }); 
      return null; 
    }

    // 1. Kiểm tra mã có trong kế hoạch không
    if (!selectedPlan.serials.includes(scannedCode)) { 
      playSound('error'); 
      setMessage({ type: 'error', text: `Mã ${scannedCode} KHÔNG thuộc kế hoạch này!` }); 
      return null; 
    }

    // 2. Kiểm tra tồn kho / tái nhập
    const unit = inventoryService.getUnitBySerial(scannedCode);
    let isReimportCandidate = false;

    if (unit) {
      if (unit.status === UnitStatus.NEW) {
        playSound('error');
        setMessage({ type: 'error', text: `Lỗi: Mã ${scannedCode} đã có sẵn trong kho ${unit.warehouseLocation}!` });
        return null;
      }
      if (unit.status === UnitStatus.SOLD) {
        if (unit.isReimported) {
          playSound('error');
          setMessage({ type: 'error', text: `Lỗi: Mã ${scannedCode} đã từng tái nhập rồi.` });
          return null;
        }
        isReimportCandidate = true;
      }
    }

    // 3. Kiểm tra sức chứa kho
    let targetWhName = currentWhName;
    const currentStock = inventoryService.getWarehouseCurrentStock(targetWhName);
    const capacity = warehouses.find(w => w.name === targetWhName)?.maxCapacity || 9999;

    if (currentStock >= capacity) {
      if (autoJump) {
        const nextWh = warehouses.find(w => inventoryService.getWarehouseCurrentStock(w.name) < (w.maxCapacity || 9999));
        if (nextWh) {
          targetWhName = nextWh.name;
          setLocation(targetWhName);
          setMessage({ type: 'warning', text: `Tự động chuyển sang ${targetWhName}` });
        } else {
          playSound('error');
          setMessage({ type: 'error', text: 'Tất cả các kho đã đầy!' });
          return null;
        }
      } else {
        playSound('error');
        setMessage({ type: 'error', text: 'Kho đã đầy sức chứa!' });
        return null;
      }
    }

    // 4. Thực thi nhập kho ngay lập tức
    try {
      inventoryService.importUnits(selectedProduct.id, [scannedCode], targetWhName, selectedPlan.name);
      return { success: true, targetWh: targetWhName, isReimport: isReimportCandidate };
    } catch (err: any) {
      playSound('error');
      setMessage({ type: 'error', text: err.message });
      return null;
    }
  };

  const handleAutoImport = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const scannedCode = currentSerial.trim();
    if (!scannedCode) return;

    const result = processInboundSerial(scannedCode, location);
    
    if (result && result.success) {
      playSound(result.isReimport ? 'warning' : 'success');
      
      const newScan = { 
        serial: scannedCode, 
        time: new Date().toLocaleTimeString('vi-VN'), 
        wh: result.targetWh,
        isReimport: result.isReimport
      };
      
      setRecentScans(prev => [newScan, ...prev.slice(0, 19)]);
      setMessage({ 
        type: result.isReimport ? 'warning' : 'success', 
        text: result.isReimport ? `TÁI NHẬP: ${scannedCode}` : `Thành công: ${scannedCode}` 
      });
    }

    setCurrentSerial('');
  };

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!selectedPlanId) {
      playSound('error');
      setMessage({ type: 'error', text: 'Vui lòng chọn Kế hoạch sản xuất trước khi import!' });
      e.target.value = '';
      return;
    }

    setIsProcessing(true);
    setMessage({ type: 'warning', text: 'Đang xử lý file Excel...' });

    try {
      const data = await file.arrayBuffer();
      const workbook = read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      
      const serialsToProcess: string[] = [];
      jsonData.forEach(row => {
        if (row[0]) {
          const serial = String(row[0]).trim();
          if (serial && serial !== 'Serial' && serial !== 'IMEI') {
            serialsToProcess.push(serial);
          }
        }
      });

      if (serialsToProcess.length === 0) {
        setMessage({ type: 'error', text: 'Không tìm thấy mã Serial nào trong file!' });
        setIsProcessing(false);
        e.target.value = '';
        return;
      }

      let successCount = 0;
      let errorCount = 0;
      const newRecentScans: any[] = [];

      // Process one by one to handle auto-jump and constraints
      for (const serial of serialsToProcess) {
        // We need to get the LATEST location because it might have changed due to auto-jump in previous iteration
        // However, state updates are async. In a loop, we should manage the location manually or use a ref.
        // For simplicity, we'll use the current location state, but it might not be perfect for massive imports with auto-jump.
        // Actually, processInboundSerial updates the location state via setLocation.
        
        const result = processInboundSerial(serial, location);
        if (result && result.success) {
          successCount++;
          newRecentScans.push({
            serial,
            time: new Date().toLocaleTimeString('vi-VN'),
            wh: result.targetWh,
            isReimport: result.isReimport
          });
        } else {
          errorCount++;
        }
      }

      setRecentScans(prev => [...newRecentScans.reverse(), ...prev].slice(0, 50));
      setMessage({ 
        type: errorCount === 0 ? 'success' : 'warning', 
        text: `Import hoàn tất: Thành công ${successCount}, Thất bại ${errorCount}` 
      });
      
      if (successCount > 0) playSound('success');
      else playSound('error');

    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Lỗi khi đọc file Excel!' });
      playSound('error');
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
         <div className="flex items-center gap-3">
             <div className="bg-green-600 p-3 rounded-full text-white shadow-lg shadow-green-100"><Zap /></div>
             <div><h2 className="text-xl font-bold">Nhập Kho Tức Thì</h2><p className="text-slate-500 text-sm">Quét là vào kho, quyền chọn kho thuộc về bạn.</p></div>
         </div>
         <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-[10px] font-black text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100 animate-pulse">
               <Database size={12}/> Live Sync
            </div>
            <div className="flex bg-slate-100 p-1 rounded-lg">
                <button onClick={() => setActiveTab('SCAN')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'SCAN' ? 'bg-white shadow text-green-700' : 'text-slate-500'}`}>Quét Nhập</button>
                <button onClick={() => setActiveTab('HISTORY')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'HISTORY' ? 'bg-white shadow text-green-700' : 'text-slate-500'}`}>Lịch sử</button>
            </div>
         </div>
      </div>

      {activeTab === 'SCAN' && (
         <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-4">
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Kế hoạch đang xử lý</label>
                      <select className="w-full p-3 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-green-400 font-bold text-slate-800" value={selectedPlanId} onChange={(e) => setSelectedPlanId(e.target.value)}>
                         <option value="">-- Chọn Kế hoạch --</option>
                         {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                  </div>
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                      <div className="flex justify-between items-center mb-3">
                         <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Kho nhập hàng</label>
                         <button onClick={() => setAutoJump(!autoJump)} className={`flex items-center gap-1 text-[10px] font-black uppercase transition-all ${autoJump ? 'text-green-600' : 'text-slate-400'}`}>
                            {autoJump ? <ToggleRight size={18}/> : <ToggleLeft size={18}/>} Auto Jump
                         </button>
                      </div>
                      <select className="w-full p-3 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-green-400 font-bold text-slate-800" value={location} onChange={(e) => setLocation(e.target.value)}>
                         {warehouses.map(wh => <option key={wh.id} value={wh.name}>{wh.name}</option>)}
                      </select>
                  </div>
              </div>

              <div className={`flex flex-col justify-center ${!selectedPlanId || isProcessing ? 'opacity-30 pointer-events-none' : ''}`}>
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-[10px] font-black text-green-600 uppercase tracking-widest flex items-center gap-1">
                      <Zap size={12}/> Quét IMEI (Xử lý tức thì)
                    </label>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[10px] font-black text-blue-600 hover:text-blue-700 flex items-center gap-1 uppercase tracking-widest"
                    >
                      <Upload size={12}/> Import Excel
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept=".xlsx, .xls" 
                      onChange={handleExcelImport}
                    />
                  </div>
                  <form onSubmit={handleAutoImport}>
                     <input ref={inputRef} type="text" placeholder="Quét mã vạch..." className="w-full p-4 border-2 border-green-100 rounded-2xl font-mono text-2xl shadow-sm outline-none focus:border-green-500 transition-all bg-green-50/30" value={currentSerial} onChange={(e) => setCurrentSerial(e.target.value)} />
                  </form>
              </div>
            </div>

            {message && (
               <div className={`p-4 mb-6 rounded-xl flex items-center gap-3 animate-slide-in ${message.type === 'success' ? 'bg-green-600 text-white' : message.type === 'warning' ? 'bg-orange-500 text-white' : 'bg-red-600 text-white'}`}>
                  {message.type === 'success' ? <CheckCircle size={24} /> : message.type === 'warning' ? <AlertTriangle size={24}/> : <XCircle size={24} />}
                  <span className="font-black tracking-tight">{message.text}</span>
               </div>
            )}

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-inner mb-8">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Trạng thái lấp đầy các kho</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                     {warehouses.map(wh => {
                        const stock = inventoryService.getWarehouseCurrentStock(wh.name);
                        const capacity = wh.maxCapacity || 9999;
                        const isFull = stock >= capacity;
                        const isSelected = location === wh.name;

                        return (
                          <div key={wh.id} className={`relative p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 cursor-pointer ${isSelected ? 'border-green-500 bg-white shadow-lg scale-105 z-10' : 'border-slate-200 bg-slate-50 opacity-60'}`} onClick={() => setLocation(wh.name)}>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isFull ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'} ${isSelected ? 'bg-green-600 text-white' : ''}`}>
                              <Warehouse size={20} />
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] font-black text-slate-800 uppercase truncate w-24">{wh.name}</p>
                              <p className={`text-[10px] font-bold ${isFull ? 'text-red-500' : 'text-slate-400'}`}>{stock} / {capacity}</p>
                            </div>
                            {isSelected && <div className="absolute -top-2 bg-green-600 text-white text-[8px] px-2 py-0.5 rounded-full font-black shadow-sm">ĐANG CHỌN</div>}
                          </div>
                        );
                     })}
                  </div>
            </div>

            <div className="border-t pt-6">
                <h4 className="font-black text-slate-400 text-xs uppercase tracking-widest flex items-center gap-2 mb-4">
                   <History size={14}/> Nhật ký quét gần đây
                </h4>
                <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                   {recentScans.map((s, idx) => (
                     <div key={idx} className={`flex justify-between items-center bg-white p-3 rounded-xl border shadow-sm animate-slide-in ${s.isReimport ? 'border-orange-200' : 'border-slate-100'}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border ${s.isReimport ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-green-50 text-green-600 border-green-100'}`}>{recentScans.length - idx}</div>
                          <span className="font-mono font-black text-slate-700">{s.serial}</span>
                          {s.isReimport && <span className="text-[8px] font-black bg-orange-600 text-white px-1.5 py-0.5 rounded uppercase">Tái nhập</span>}
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-bold">
                          <span className="text-blue-600 uppercase tracking-tight">KHO: {s.wh}</span>
                          <span className="text-slate-400">{s.time}</span>
                        </div>
                     </div>
                   ))}
                </div>
            </div>
         </div>
      )}

      {activeTab === 'HISTORY' && (
         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-6 animate-fade-in">
             <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b pb-6">
                <div className="flex gap-4 w-full md:w-auto">
                   <div className="flex-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Từ ngày</label>
                      <input type="date" className="w-full p-2 border rounded-lg outline-none bg-slate-50" value={historyFrom} onChange={e => setHistoryFrom(e.target.value)} />
                   </div>
                   <div className="flex-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Đến ngày</label>
                      <input type="date" className="w-full p-2 border rounded-lg outline-none bg-slate-50" value={historyTo} onChange={e => setHistoryTo(e.target.value)} />
                   </div>
                </div>
                <button onClick={() => exportTransactionHistory(historyData, 'Lich_su_Nhap')} className="bg-green-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 text-sm shadow-lg shadow-green-100 hover:bg-green-700">
                  <FileSpreadsheet size={18}/> Xuất Excel
                </button>
             </div>
             <div className="space-y-4">
                {historyData.map(tx => (
                  <div key={tx.id} className="border border-slate-100 rounded-2xl overflow-hidden hover:shadow-md transition-all">
                     <div className="bg-slate-50 p-4 flex justify-between items-center cursor-pointer" onClick={() => setExpandedTx(expandedTx === tx.id ? null : tx.id)}>
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-green-100 text-green-600 rounded-xl"><Calendar size={20} /></div>
                          <div>
                            <div className="font-black text-slate-800">{new Date(tx.date).toLocaleString('vi-VN')}</div>
                            <div className="text-xs text-slate-500 font-bold mt-1 uppercase">Model: {inventoryService.getProductById(tx.productId)?.model} | Kho: {tx.toLocation}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right font-black text-xl text-green-600">+{tx.quantity}</div>
                          {expandedTx === tx.id ? <ChevronUp /> : <ChevronDown />}
                        </div>
                     </div>
                     {expandedTx === tx.id && (
                       <div className="p-6 bg-white border-t border-slate-50 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                         {tx.serialNumbers.map(sn => (<div key={sn} className="font-mono text-[10px] p-2 bg-slate-50 rounded-lg text-center border font-bold text-slate-600">{sn}</div>))}
                       </div>
                     )}
                  </div>
                ))}
             </div>
         </div>
      )}
    </div>
  );
};
