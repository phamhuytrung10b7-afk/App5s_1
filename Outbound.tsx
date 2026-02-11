
import React, { useState, useRef, useEffect } from 'react';
import { inventoryService } from './inventoryService';
import { exportTransactionHistory } from './reportService';
import { Upload, CheckCircle, XCircle, Search, ArrowRightLeft, Store, Warehouse, ArrowRight, History, Plus, Calendar, ChevronDown, ChevronUp, FileSpreadsheet } from 'lucide-react';
import { playSound } from './sound';
import { Transaction } from './types';

export const Outbound: React.FC = () => {
  const products = inventoryService.getProducts();
  const warehouses = inventoryService.getWarehouses();
  const customers = inventoryService.getCustomers();
  
  const [activeTab, setActiveTab] = useState<'SCAN' | 'HISTORY'>('SCAN');
  const [historyFrom, setHistoryFrom] = useState(new Date().toISOString().split('T')[0]);
  const [historyTo, setHistoryTo] = useState(new Date().toISOString().split('T')[0]);
  const [historyData, setHistoryData] = useState<Transaction[]>([]);
  const [expandedTx, setExpandedTx] = useState<string | null>(null);

  const [outboundType, setOutboundType] = useState<'SALE' | 'TRANSFER'>('SALE');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [targetId, setTargetId] = useState<string>(''); 
  
  const [serialInput, setSerialInput] = useState('');
  const [sessionScans, setSessionScans] = useState<string[]>([]);
  const [message, setMessage] = useState<{type: 'success' | 'error' | 'warning', text: string} | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeTab === 'HISTORY') {
      const data = inventoryService.getHistoryByDateRange(['OUTBOUND', 'TRANSFER'], historyFrom, historyTo);
      setHistoryData(data);
    }
  }, [activeTab, historyFrom, historyTo]);

  useEffect(() => {
    if (activeTab === 'SCAN') inputRef.current?.focus();
  }, [sessionScans, message, selectedProductId, activeTab]);

  const handleScan = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedProductId) { playSound('error'); setMessage({ type: 'error', text: 'Chọn Model trước!' }); return; }
    const scannedCode = serialInput.trim();
    if (!scannedCode) return;
    if (sessionScans.includes(scannedCode)) { playSound('warning'); setSerialInput(''); return; }
    
    const unit = inventoryService.getUnitBySerial(scannedCode);
    if (!unit || unit.productId !== selectedProductId || unit.status !== 'NEW') {
       playSound('error');
       setMessage({ type: 'error', text: `Mã ${scannedCode} không hợp lệ hoặc đã xuất.` });
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
        setMessage({ type: 'success', text: `Xuất thành công ${sessionScans.length} máy.` });
        setSessionScans([]);
     } catch (err: any) {
        playSound('error');
        setMessage({ type: 'error', text: err.message });
     }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
         <div className="flex items-center gap-3">
             <div className="bg-blue-100 p-3 rounded-full text-blue-600"><Upload /></div>
             <div><h2 className="text-xl font-bold text-slate-800">Xuất Kho</h2><p className="text-slate-500 text-sm">Bán hàng hoặc điều chuyển kho.</p></div>
         </div>
         <div className="flex bg-slate-100 p-1 rounded-lg">
             <button onClick={() => setActiveTab('SCAN')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'SCAN' ? 'bg-white shadow text-blue-700' : 'text-slate-500'}`}>Xuất Mới</button>
             <button onClick={() => setActiveTab('HISTORY')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'HISTORY' ? 'bg-white shadow text-blue-700' : 'text-slate-500'}`}>Lịch sử</button>
         </div>
      </div>

      {activeTab === 'SCAN' && (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
          {message && (
            <div className={`p-4 mb-6 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {message.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
              <span className="font-medium">{message.text}</span>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50 p-6 rounded-xl border border-slate-200">
            <div className="space-y-4">
              <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Loại hình</label>
                  <div className="flex bg-white rounded-lg p-1 border border-slate-200">
                    <button className={`flex-1 py-2 rounded-md font-medium text-sm ${outboundType === 'SALE' ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-slate-50'}`} onClick={() => setOutboundType('SALE')}>Xuất Bán</button>
                    <button className={`flex-1 py-2 rounded-md font-medium text-sm ${outboundType === 'TRANSFER' ? 'bg-orange-100 text-orange-700 shadow-sm' : 'text-slate-50'}`} onClick={() => setOutboundType('TRANSFER')}>Điều Chuyển</button>
                  </div>
              </div>
              <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">{outboundType === 'SALE' ? 'Khách hàng' : 'Kho đến'}</label>
                  <select className="w-full p-3 border rounded-lg bg-white" value={targetId} onChange={(e) => setTargetId(e.target.value)}>
                    <option value="">-- Chọn đích đến --</option>
                    {outboundType === 'SALE' ? customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>) : warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
              </div>
              <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Model</label>
                  <select className="w-full p-3 border rounded-lg bg-white" value={selectedProductId} onChange={(e) => { setSelectedProductId(e.target.value); setSessionScans([]); }}>
                    <option value="">-- Chọn Model --</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.model}</option>)}
                  </select>
              </div>
            </div>
            <div className={`flex flex-col ${!selectedProductId ? 'opacity-50 pointer-events-none' : ''}`}>
              <label className="block text-sm font-bold text-slate-700 mb-2">Quét Serial</label>
              <div className="flex-1 bg-white rounded-lg border border-slate-200 p-4 flex flex-col">
                  <form onSubmit={handleScan} className="relative mb-4"><Search className="absolute left-3 top-3.5 text-slate-400" size={20} /><input ref={inputRef} className="w-full pl-10 p-3 border border-slate-300 rounded-lg outline-none font-mono" placeholder="Quét IMEI..." value={serialInput} onChange={(e) => setSerialInput(e.target.value)} /></form>
                  <div className="flex-1 overflow-y-auto max-h-48 bg-slate-50 p-2 rounded mb-4">
                    {sessionScans.map(sn => (<div key={sn} className="flex justify-between items-center py-2 px-3 bg-white border border-slate-100 rounded mb-1 font-mono text-sm"><span>{sn}</span><button onClick={() => setSessionScans(sessionScans.filter(s => s !== sn))} className="text-red-400 hover:text-red-600">Xóa</button></div>))}
                  </div>
                  <button onClick={handleSubmit} disabled={sessionScans.length === 0 || !targetId} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:bg-slate-300 flex items-center justify-center gap-2">Xác nhận Xuất <ArrowRight size={18} /></button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'HISTORY' && (
         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-6">
             <div className="flex justify-between items-end border-b pb-6">
                <div className="flex gap-4">
                   <input type="date" className="p-2 border rounded-lg" value={historyFrom} onChange={e => setHistoryFrom(e.target.value)} />
                   <input type="date" className="p-2 border rounded-lg" value={historyTo} onChange={e => setHistoryTo(e.target.value)} />
                </div>
                <button onClick={() => exportTransactionHistory(historyData, 'Lich_su_Xuat')} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-sm"><FileSpreadsheet size={16}/> Xuất Excel</button>
             </div>
             <div className="space-y-4">
                {historyData.map(tx => {
                   const product = inventoryService.getProductById(tx.productId);
                   const isExpanded = expandedTx === tx.id;
                   const isSale = tx.type === 'OUTBOUND';
                   return (
                      <div key={tx.id} className="border border-slate-200 rounded-lg overflow-hidden transition-all hover:border-blue-300">
                         <div className="bg-slate-50 p-4 flex justify-between items-center cursor-pointer" onClick={() => setExpandedTx(isExpanded ? null : tx.id)}>
                            <div className="flex items-center gap-4"><div className={`p-2 rounded-full ${isSale ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>{isSale ? <Store size={18} /> : <ArrowRightLeft size={18} />}</div><div><div className="font-bold text-slate-800">{new Date(tx.date).toLocaleString('vi-VN')}</div><div className="text-sm text-slate-500">{product?.model} • {isSale ? tx.customer : tx.toLocation}</div></div></div>
                            <div className="flex items-center gap-4"><div className="text-right font-bold text-blue-600 text-lg">-{tx.quantity}</div><button className="text-slate-400">{isExpanded ? <ChevronUp /> : <ChevronDown />}</button></div>
                         </div>
                         {isExpanded && (<div className="p-4 bg-white border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-2">{tx.serialNumbers.map(sn => (<div key={sn} className="font-mono text-xs bg-slate-50 p-2 rounded text-center">{sn}</div>))}</div>)}
                      </div>
                   )
                })}
             </div>
         </div>
      )}
    </div>
  );
};
