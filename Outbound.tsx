import React, { useState, useRef, useEffect } from 'react';
import { inventoryService } from './inventoryService';
import { exportTransactionHistory, exportDraftScannedList } from './services/reportService';
import { Upload, CheckCircle, XCircle, Search, Settings, ArrowRightLeft, Users, Warehouse, Store, AlertTriangle, ArrowRight, History, Plus, Calendar, ChevronDown, ChevronUp, ListFilter, FileSpreadsheet } from 'lucide-react';
import { playSound } from './utils/sound';
import { Transaction } from './types';

export const Outbound: React.FC = () => {
  const products = inventoryService.getProducts();
  const warehouses = inventoryService.getWarehouses();
  const customers = inventoryService.getCustomers();
  
  // --- TAB STATE ---
  const [activeTab, setActiveTab] = useState<'SCAN' | 'HISTORY'>('SCAN');

  // --- HISTORY STATE ---
  const [historyFrom, setHistoryFrom] = useState(new Date().toISOString().split('T')[0]);
  const [historyTo, setHistoryTo] = useState(new Date().toISOString().split('T')[0]);
  const [historyData, setHistoryData] = useState<Transaction[]>([]);
  const [expandedTx, setExpandedTx] = useState<string | null>(null);

  // Selection State
  const [outboundType, setOutboundType] = useState<'SALE' | 'TRANSFER'>('SALE');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [targetId, setTargetId] = useState<string>(''); 
  
  // Scanning State
  const [serialInput, setSerialInput] = useState('');
  const [sessionScans, setSessionScans] = useState<string[]>([]);
  const [message, setMessage] = useState<{type: 'success' | 'error' | 'warning', text: string} | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Load History Effect
  useEffect(() => {
    if (activeTab === 'HISTORY') {
      const data = inventoryService.getHistoryByDateRange(['OUTBOUND', 'TRANSFER'], historyFrom, historyTo);
      setHistoryData(data);
    }
  }, [activeTab, historyFrom, historyTo]);

  // Auto-focus input
  useEffect(() => {
    if (activeTab === 'SCAN') {
       inputRef.current?.focus();
    }
  }, [sessionScans, message, selectedProductId, activeTab]);

  const handleScan = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedProductId) {
       playSound('error');
       setMessage({ type: 'error', text: 'Vui lòng chọn Model sản phẩm trước!' });
       return;
    }
    const scannedCode = serialInput.trim();
    if (!scannedCode) return;
    if (sessionScans.includes(scannedCode)) {
       playSound('warning');
       setMessage({ type: 'warning', text: 'Mã này vừa quét xong.' });
       setSerialInput('');
       return;
    }
    const unit = inventoryService.getUnitBySerial(scannedCode);
    if (!unit) {
       playSound('error');
       setMessage({ type: 'error', text: `Mã ${scannedCode} không tồn tại!` });
       setSerialInput('');
       return;
    }
    if (unit.productId !== selectedProductId) {
       playSound('error');
       setMessage({ type: 'error', text: `Mã thuộc Model khác.` });
       setSerialInput('');
       return;
    }
    if (unit.status !== 'NEW') {
       playSound('error');
       setMessage({ type: 'error', text: `Không khả dụng (Trạng thái: ${unit.status})` });
       setSerialInput('');
       return;
    }
    playSound('success');
    setSessionScans([...sessionScans, scannedCode]);
    setMessage({ type: 'success', text: `OK: ${scannedCode}` });
    setSerialInput('');
  };

  const handleSubmit = () => {
     if (!selectedProductId || !targetId || sessionScans.length === 0) return;
     try {
        if (outboundType === 'SALE') {
            const customer = customers.find(c => c.id === targetId)?.name || 'Khách lẻ';
            inventoryService.exportUnits(selectedProductId, sessionScans, customer);
        } else {
            const wh = warehouses.find(w => w.id === targetId)?.name || 'Kho khác';
            inventoryService.transferUnits(selectedProductId, sessionScans, wh);
        }
        playSound('success');
        setMessage({ type: 'success', text: `Đã xuất ${sessionScans.length} máy thành công!` });
        setSessionScans([]);
     } catch (err: any) {
        playSound('error');
        setMessage({ type: 'error', text: err.message });
     }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
         <div className="flex items-center gap-3">
             <div className="bg-blue-100 p-3 rounded-full text-blue-600"><Upload /></div>
             <div>
                <h2 className="text-xl font-bold text-slate-800">Quản lý Xuất Kho</h2>
                <p className="text-slate-500 text-sm">Xuất bán và điều chuyển kho.</p>
             </div>
         </div>
         <div className="flex bg-slate-100 p-1 rounded-lg">
             <button onClick={() => setActiveTab('SCAN')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'SCAN' ? 'bg-white shadow text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}><Plus size={16}/> Xuất Mới</button>
             <button onClick={() => setActiveTab('HISTORY')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'HISTORY' ? 'bg-white shadow text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}><History size={16}/> Lịch sử Xuất</button>
         </div>
      </div>

      {activeTab === 'SCAN' && (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
          {message && (
            <div className={`p-4 mb-6 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
              {message.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
              <span className="font-medium">{message.text}</span>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 bg-slate-50 p-6 rounded-xl border border-slate-200">
            <div className="space-y-4">
              <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Loại giao dịch</label>
                  <div className="flex bg-white rounded-lg p-1 border border-slate-200">
                    <button className={`flex-1 py-2 rounded-md font-medium text-sm transition-all ${outboundType === 'SALE' ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-slate-500'}`} onClick={() => setOutboundType('SALE')}>Xuất Bán</button>
                    <button className={`flex-1 py-2 rounded-md font-medium text-sm transition-all ${outboundType === 'TRANSFER' ? 'bg-orange-100 text-orange-700 shadow-sm' : 'text-slate-500'}`} onClick={() => setOutboundType('TRANSFER')}>Điều Chuyển</button>
                  </div>
              </div>
              <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">{outboundType === 'SALE' ? 'Khách hàng / Đại lý' : 'Kho nhận hàng'}</label>
                  <select className="w-full p-3 border border-slate-300 rounded-lg outline-none bg-white shadow-sm" value={targetId} onChange={(e) => setTargetId(e.target.value)}>
                    <option value="">{outboundType === 'SALE' ? '-- Chọn Khách hàng --' : '-- Chọn Kho đến --'}</option>
                    {outboundType === 'SALE' ? customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>) : warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
              </div>
              <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Model Sản phẩm</label>
                  <select className="w-full p-3 border border-slate-300 rounded-lg outline-none bg-white shadow-sm" value={selectedProductId} onChange={(e) => { setSelectedProductId(e.target.value); setSessionScans([]); }}>
                    <option value="">-- Chọn Model cần xuất --</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.model}</option>)}
                  </select>
              </div>
            </div>
            <div className={`flex flex-col ${!selectedProductId ? 'opacity-50 pointer-events-none' : ''}`}>
              <label className="block text-sm font-bold text-slate-700 mb-2">Quét mã Serial</label>
              <div className="flex-1 bg-white rounded-lg border border-slate-200 p-4 flex flex-col">
                  <form onSubmit={handleScan} className="relative mb-4"><Search className="absolute left-3 top-3.5 text-slate-400" size={20} /><input ref={inputRef} className="w-full pl-10 p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-400 font-mono" placeholder="Quét mã vạch..." value={serialInput} onChange={(e) => setSerialInput(e.target.value)} /></form>
                  <div className="flex justify-between items-center mb-2 px-1">
                    <span className="text-xs font-bold text-slate-500">DANH SÁCH CHỜ ({sessionScans.length})</span>
                  </div>
                  <div className="flex-1 overflow-y-auto max-h-48 bg-slate-50 p-2 rounded">
                    {sessionScans.map(sn => (<div key={sn} className="flex justify-between items-center py-2 px-3 bg-white border border-slate-100 rounded mb-1 font-mono text-sm"><span>{sn}</span><button onClick={() => setSessionScans(sessionScans.filter(s => s !== sn))} className="text-red-400 hover:text-red-600">Xóa</button></div>))}
                    {sessionScans.length === 0 && <div className="text-center text-slate-400 mt-8 text-xs italic">Chưa có mã nào.</div>}
                  </div>
                  <div className="mt-4 pt-4 border-t"><div className="flex justify-between items-center mb-4 text-sm font-bold text-slate-600"><span>Số lượng:</span><span className="text-xl text-blue-600">{sessionScans.length}</span></div><button onClick={handleSubmit} disabled={sessionScans.length === 0 || !targetId} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:bg-slate-300 flex items-center justify-center gap-2">Xác nhận Xuất <ArrowRight size={18} /></button></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'HISTORY' && (
         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-6">
             <div className="flex flex-col md:flex-row gap-4 items-end border-b border-slate-100 pb-6">
                <div>
                   <label className="block text-sm font-bold text-slate-700 mb-1">Từ ngày</label>
                   <input type="date" className="p-2 border border-slate-300 rounded-lg outline-none" value={historyFrom} onChange={e => setHistoryFrom(e.target.value)} />
                </div>
                <div>
                   <label className="block text-sm font-bold text-slate-700 mb-1">Đến ngày</label>
                   <input type="date" className="p-2 border border-slate-300 rounded-lg outline-none" value={historyTo} onChange={e => setHistoryTo(e.target.value)} />
                </div>
                <div className="flex-1 flex justify-end">
                   <button onClick={() => exportTransactionHistory(historyData, 'Lich_su_Xuat')} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2 text-sm"><FileSpreadsheet size={16}/> Xuất Excel</button>
                </div>
             </div>
             <div className="space-y-4">
                {historyData.map(tx => {
                   const product = inventoryService.getProductById(tx.productId);
                   const isExpanded = expandedTx === tx.id;
                   const isSale = tx.type === 'OUTBOUND';
                   return (
                      <div key={tx.id} className="border border-slate-200 rounded-lg overflow-hidden transition-all hover:border-blue-300">
                         <div className="bg-slate-50 p-4 flex justify-between items-center cursor-pointer" onClick={() => setExpandedTx(isExpanded ? null : tx.id)}>
                            <div className="flex items-center gap-4"><div className={`p-2 rounded-full ${isSale ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>{isSale ? <Store size={18} /> : <ArrowRightLeft size={18} />}</div><div><div className="font-bold text-slate-800">{new Date(tx.date).toLocaleString('vi-VN')}</div><div className="text-sm text-slate-500">{product?.model} <span className="mx-1">•</span> {isSale ? `Khách: ${tx.customer}` : `Đến: ${tx.toLocation}`}</div></div></div>
                            <div className="flex items-center gap-4"><div className="text-right"><div className="font-bold text-blue-600 text-lg">-{tx.quantity}</div><div className="text-xs text-slate-400">Máy</div></div><button className="text-slate-400">{isExpanded ? <ChevronUp /> : <ChevronDown />}</button></div>
                         </div>
                         {isExpanded && (<div className="p-4 bg-white border-t border-slate-100"><h5 className="font-bold text-xs text-slate-500 uppercase mb-3">Danh sách mã Serial</h5><div className="grid grid-cols-2 md:grid-cols-4 gap-2">{tx.serialNumbers.map(sn => (<div key={sn} className="font-mono text-xs bg-slate-50 p-2 rounded border border-slate-100 text-center text-slate-600">{sn}</div>))}</div></div>)}
                      </div>
                   )
                })}
             </div>
         </div>
      )}
    </div>
  );
};